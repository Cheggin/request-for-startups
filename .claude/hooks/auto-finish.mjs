#!/usr/bin/env node
/**
 * Auto-finish Stop hook — node-native.
 *
 * Commits the current agent's session-scoped changes, pushes the branch,
 * and closes the linked GitHub issue with a commit reference comment.
 *
 * Stop hooks must never block session shutdown: every error path here
 * returns silently (non-zero exits are swallowed; we always log, never throw).
 *
 * Ported 1:1 from the TS pair:
 *   packages/hooks/src/auto-finish.ts      (pure lib)
 *   packages/hooks/src/run-auto-finish.ts  (stdin runner)
 * Behaviour preserved exactly: same scope prefix table, same ignored paths,
 * same commit-subject rules (type(scope): ..., 72-char trim), same fallback
 * chain for issue-number resolution (env → transcript → branch pattern).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WRITE_TOOL_NAMES = new Set(['Edit', 'Write', 'MultiEdit']);
const ISSUE_VIEW_PATTERN = /\bgh issue view\s+(\d+)\b/i;
const ISSUE_REF_PATTERN = /\bissue\s+#(\d+)\b/i;
const BRANCH_ISSUE_PATTERN = /(?:^|\/)(\d+)(?:-|$)/;
const COMPLETION_HINTS = [
  'implemented', 'added', 'updated', 'fixed', 'wired', 'created',
  'completed', 'finished', 'verified', 'tests', 'shipped',
];
const BLOCKER_HINTS = [
  'blocked', 'unable', 'stuck', 'need user', 'need input', 'partial',
  'remaining work', 'follow-up required', 'follow up required',
  'todo:', 'not finished', 'cannot',
];

const IGNORED_STATUS_PATHS = new Set(['.claude/command-log.txt']);
const IGNORED_STATUS_PREFIXES = [
  '.omc/',
  '.harness/handoffs/',
  '.harness/signals/',
  'packages/harness-dashboard/.omc/',
];

const SCOPE_PREFIXES = [
  { prefix: 'packages/hooks/', scope: 'hooks' },
  { prefix: 'packages/cli/', scope: 'cli' },
  { prefix: 'packages/commander/', scope: 'commander' },
  { prefix: 'packages/github-state/', scope: 'github-state' },
  { prefix: 'packages/implementation-loop/', scope: 'impl-loop' },
  { prefix: 'packages/feature-decomposer/', scope: 'features' },
  { prefix: 'packages/knowledge/', scope: 'knowledge' },
  { prefix: 'packages/repo-setup/', scope: 'repo-setup' },
  { prefix: 'packages/service-validator/', scope: 'services' },
  { prefix: 'packages/secret-manager/', scope: 'secrets' },
  { prefix: 'packages/sentry-integration/', scope: 'sentry' },
  { prefix: 'packages/config-optimizer/', scope: 'config' },
  { prefix: 'packages/task-classifier/', scope: 'classifier' },
  { prefix: 'packages/fixed-boundary/', scope: 'boundary' },
  { prefix: 'packages/cubic-channel/', scope: 'cubic' },
  { prefix: 'packages/webhook-receiver/', scope: 'webhook' },
  { prefix: 'packages/harness-dashboard/', scope: 'dashboard' },
  { prefix: '.harness/', scope: 'harness' },
  { prefix: '.claude/skills/', scope: 'skills' },
  { prefix: 'skills/', scope: 'skills' },
  { prefix: 'agents/', scope: 'agents' },
  { prefix: 'hooks/', scope: 'hooks' },
  { prefix: 'chains/', scope: 'chains' },
  { prefix: 'commands/', scope: 'commands' },
  { prefix: 'README.md', scope: 'readme' },
  { prefix: 'SOUL.md', scope: 'readme' },
];

export function detectAgentName(fallbackCwd) {
  if (process.env.HARNESS_AGENT) return process.env.HARNESS_AGENT;
  try {
    const windowName = spawnSync(
      'tmux',
      ['display-message', '-p', '#{window_name}'],
      { encoding: 'utf-8', timeout: 3000 },
    ).stdout?.trim();
    if (windowName) return windowName;
  } catch {
    // fall through
  }
  return basename(fallbackCwd || process.cwd()) || 'unknown';
}

function defaultRunner(binary, args, cwd) {
  const result = spawnSync(binary, args, { cwd, encoding: 'utf-8' });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status ?? 1,
  };
}

function normalizeRelativePath(cwd, filePath) {
  const absolute = filePath.startsWith('/') ? filePath : resolve(cwd, filePath);
  const rel = relative(cwd, absolute);
  return rel || filePath;
}

function parseTranscriptLine(line) {
  if (!line.trim()) return null;
  try { return JSON.parse(line); } catch { return null; }
}

function flattenContentToText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((block) => {
      if (!block || typeof block !== 'object') return '';
      const value = block.text ?? block.content;
      return typeof value === 'string' ? value : '';
    })
    .filter(Boolean)
    .join('\n');
}

function extractToolUses(content) {
  if (!Array.isArray(content)) return [];
  return content.filter(
    (b) => !!b && typeof b === 'object' && b.type === 'tool_use',
  );
}

function resolvePromptIssue(text) {
  const issueView = text.match(ISSUE_VIEW_PATTERN);
  if (issueView) {
    const n = Number.parseInt(issueView[1] ?? '', 10);
    const taskSummary = text.split(/\bthen\b/i)[1]?.trim();
    return {
      issueNumber: Number.isFinite(n) ? n : undefined,
      taskSummary,
    };
  }
  const issueRef = text.match(ISSUE_REF_PATTERN);
  if (issueRef) {
    const n = Number.parseInt(issueRef[1] ?? '', 10);
    return { issueNumber: Number.isFinite(n) ? n : undefined };
  }
  return {};
}

function readTranscriptEntries(transcriptPath) {
  if (!existsSync(transcriptPath)) return [];
  return readFileSync(transcriptPath, 'utf-8')
    .split('\n')
    .map(parseTranscriptLine)
    .filter((e) => e !== null);
}

export function parseTranscript(transcriptPath, cwd) {
  const entries = readTranscriptEntries(transcriptPath);
  const touchedFiles = new Set();
  let issueNumber;
  let taskSummary;
  let lastAssistantText;
  let lastAssistantStopReason;

  for (const entry of entries) {
    const role = entry.message?.role;
    const content = entry.message?.content;

    if (role === 'user' && issueNumber === undefined) {
      const text = flattenContentToText(content);
      if (text) {
        const resolved = resolvePromptIssue(text);
        if (resolved.issueNumber !== undefined) {
          issueNumber = resolved.issueNumber;
          taskSummary = resolved.taskSummary;
        }
      }
    }

    if (role === 'assistant') {
      const text = flattenContentToText(content);
      if (text) {
        lastAssistantText = text;
        lastAssistantStopReason = entry.message?.stop_reason ?? null;
      }
      for (const block of extractToolUses(content)) {
        if (!block.name || !WRITE_TOOL_NAMES.has(block.name)) continue;
        const filePath = block.input?.file_path;
        if (typeof filePath === 'string' && filePath.trim()) {
          touchedFiles.add(normalizeRelativePath(cwd, filePath));
        }
      }
    }
  }

  return {
    issueNumber,
    taskSummary,
    touchedFiles: [...touchedFiles],
    lastAssistantText,
    lastAssistantStopReason,
  };
}

function listChangedFiles(cwd, runner) {
  const result = runner('git', ['status', '--porcelain', '--untracked-files=all'], cwd);
  if (result.status !== 0) return [];
  return result.stdout
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const status = line.slice(0, 2);
      const rawPath = line.slice(3).trim();
      const normalizedPath = rawPath.includes(' -> ')
        ? (rawPath.split(' -> ').at(-1) ?? rawPath)
        : rawPath;
      return { status, path: normalizedPath };
    });
}

function isIgnoredPath(filePath) {
  if (IGNORED_STATUS_PATHS.has(filePath)) return true;
  return IGNORED_STATUS_PREFIXES.some((p) => filePath.startsWith(p));
}

function branchLooksDedicatedToIssue(branchName, issueNumber) {
  const match = branchName.match(BRANCH_ISSUE_PATTERN);
  if (!match) return false;
  return Number.parseInt(match[1] ?? '', 10) === issueNumber;
}

export function selectFilesToCommit(changedFiles, touchedFiles, branchName, issueNumber) {
  const meaningful = changedFiles
    .map((e) => e.path)
    .filter((p) => !isIgnoredPath(p));
  if (meaningful.length === 0) return [];
  const touched = new Set(touchedFiles);
  const scoped = meaningful.filter((p) => touched.has(p));
  if (scoped.length > 0) return scoped;
  if (branchLooksDedicatedToIssue(branchName, issueNumber)) return meaningful;
  return [];
}

function extractIssueType(issueTitle) {
  const match = issueTitle.match(/^\[(feat|fix|refactor|test|docs|chore|perf|ci)\]/i);
  return (match?.[1] ?? 'chore').toLowerCase();
}

function inferCommitScope(files) {
  const counts = new Map();
  for (const filePath of files) {
    const match = SCOPE_PREFIXES.find(({ prefix }) => filePath.startsWith(prefix));
    const scope = match?.scope;
    if (!scope) continue;
    counts.set(scope, (counts.get(scope) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0];
}

function normalizeDescription(raw) {
  const fallback = 'finalize agent changes';
  if (!raw) return fallback;
  const normalized = raw
    .replace(/^[-*]\s*/, '')
    .replace(/^["'`]|["'`]$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return fallback;
  const lowerFirst = normalized.charAt(0).toLowerCase() + normalized.slice(1);
  return lowerFirst.replace(/[.?!]+$/, '');
}

function trimCommitSubject(subject) {
  if (subject.length <= 72) return subject;
  return subject.slice(0, 69).trimEnd() + '...';
}

export function buildCommitMessage({ issueTitle, taskSummary, files }) {
  const type = extractIssueType(issueTitle);
  const scope = inferCommitScope(files);
  const baseDescription = taskSummary || issueTitle.replace(/^\[[^\]]+\]\s*/, '');
  const description = normalizeDescription(baseDescription);
  const prefix = scope ? `${type}(${scope}): ` : `${type}: `;
  return trimCommitSubject(prefix + description);
}

export function looksTaskComplete(text, stopReason) {
  if (!text || stopReason !== 'end_turn') return false;
  const lower = text.toLowerCase();
  if (BLOCKER_HINTS.some((h) => lower.includes(h))) return false;
  return COMPLETION_HINTS.some((h) => lower.includes(h));
}

function resolveIssueNumber(transcript, branchName) {
  const envIssue = process.env.HARNESS_ISSUE_NUMBER;
  if (envIssue) {
    const n = Number.parseInt(envIssue, 10);
    if (Number.isFinite(n)) return n;
  }
  if (transcript.issueNumber !== undefined) return transcript.issueNumber;
  const m = branchName.match(BRANCH_ISSUE_PATTERN);
  if (!m) return undefined;
  const n = Number.parseInt(m[1] ?? '', 10);
  return Number.isFinite(n) ? n : undefined;
}

function runOrThrow(runner, binary, args, cwd) {
  const result = runner(binary, args, cwd);
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim();
    throw new Error(`${binary} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
  return result;
}

function getCurrentBranch(cwd, runner) {
  return runOrThrow(runner, 'git', ['branch', '--show-current'], cwd).stdout.trim();
}

function getHeadSha(cwd, runner) {
  return runOrThrow(runner, 'git', ['rev-parse', 'HEAD'], cwd).stdout.trim();
}

function hasUnmergedPaths(cwd, runner) {
  const result = runner('git', ['diff', '--name-only', '--diff-filter=U'], cwd);
  return result.status === 0 && result.stdout.trim().length > 0;
}

function getIssueMetadata(issueNumber, cwd, runner) {
  const result = runOrThrow(
    runner,
    'gh',
    ['issue', 'view', String(issueNumber), '--json', 'number,title,state'],
    cwd,
  );
  return JSON.parse(result.stdout);
}

function pushCurrentBranch(cwd, runner, branchName) {
  const upstream = runner(
    'git',
    ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'],
    cwd,
  );
  if (upstream.status === 0) {
    runOrThrow(runner, 'git', ['push'], cwd);
    return;
  }
  runOrThrow(runner, 'git', ['push', '-u', 'origin', branchName], cwd);
}

export function runAutoFinish(input, options) {
  const cwd = options?.cwd || input.cwd || process.cwd();
  const runner = options?.runner || defaultRunner;

  if (input.hook_event_name && input.hook_event_name !== 'Stop') {
    return { status: 'skipped', reason: 'not-a-stop-event' };
  }
  if (hasUnmergedPaths(cwd, runner)) {
    return { status: 'skipped', reason: 'merge-conflicts-present' };
  }

  const branchName = getCurrentBranch(cwd, runner);
  const transcript = input.transcript_path
    ? parseTranscript(input.transcript_path, cwd)
    : { touchedFiles: [] };

  const issueNumber = resolveIssueNumber(transcript, branchName);
  if (!issueNumber) return { status: 'skipped', reason: 'no-issue-context' };

  if (!looksTaskComplete(transcript.lastAssistantText, transcript.lastAssistantStopReason)) {
    return { status: 'skipped', reason: 'session-not-finished' };
  }

  const changedFiles = listChangedFiles(cwd, runner);
  const filesToCommit = selectFilesToCommit(
    changedFiles,
    transcript.touchedFiles,
    branchName,
    issueNumber,
  );
  if (filesToCommit.length === 0) {
    return { status: 'skipped', reason: 'no-session-scoped-changes' };
  }

  const issue = getIssueMetadata(issueNumber, cwd, runner);
  const commitMessage = buildCommitMessage({
    issueTitle: issue.title,
    taskSummary: transcript.taskSummary,
    files: filesToCommit,
  });

  runOrThrow(runner, 'git', ['add', '-A', '--', ...filesToCommit], cwd);

  const staged = runner('git', ['diff', '--cached', '--name-only'], cwd);
  if (staged.status !== 0 || staged.stdout.trim().length === 0) {
    return { status: 'skipped', reason: 'nothing-staged' };
  }

  runOrThrow(runner, 'git', ['commit', '-m', commitMessage, '-m', `Closes #${issueNumber}`], cwd);
  pushCurrentBranch(cwd, runner, branchName);
  const commitSha = getHeadSha(cwd, runner);
  const shortSha = commitSha.slice(0, 7);

  if (issue.state.toUpperCase() !== 'CLOSED') {
    runOrThrow(
      runner,
      'gh',
      [
        'issue', 'close', String(issueNumber),
        '--comment', `Closed by ${detectAgentName(cwd)} in commit ${shortSha}.`,
      ],
      cwd,
    );
  }

  return { status: 'committed', issueNumber, commitSha, files: filesToCommit };
}

function readStopInputFromStdin(stdin) {
  if (stdin.isTTY) return Promise.resolve({});
  return new Promise((r) => {
    const chunks = [];
    stdin.on('data', (c) => chunks.push(c.toString()));
    stdin.on('end', () => {
      try {
        const raw = chunks.join('').trim();
        r(raw ? JSON.parse(raw) : {});
      } catch {
        r({});
      }
    });
  });
}

const isDirectRun =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === `file://${fileURLToPath(import.meta.url)}` && process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    const input = await readStopInputFromStdin(process.stdin);
    const result = runAutoFinish(input);
    if (result.status === 'committed') {
      console.log(
        `[AutoFinish] committed ${result.commitSha?.slice(0, 7)} and closed #${result.issueNumber}`,
      );
    }
  } catch (error) {
    // Stop hooks must never block session shutdown.
    console.error(`[AutoFinish] Failed: ${String(error)}`);
  }
}
