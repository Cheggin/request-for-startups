#!/usr/bin/env node

/**
 * Startup-Harness Context Guard (Stop hook).
 *
 * Estimates context-window usage from the transcript and blocks the stop with
 * a "run /compact" message when usage crosses the warning threshold — keeps
 * long autonomous runs from hitting a hard context limit mid-iteration.
 *
 * Ported from oh-my-claudecode 4.11.6 scripts/context-guard-stop.mjs with
 * only branding / env-var name adjustments.
 *
 * Safety rules:
 *   - Never block stops triggered by a context-limit error (compaction deadlock).
 *   - Never block user-requested aborts.
 *   - Cap blocks at MAX_BLOCKS per transcript so failures fail open.
 *
 * Env:
 *   HARNESS_CONTEXT_GUARD_THRESHOLD (legacy OMC_CONTEXT_GUARD_THRESHOLD) — percent
 *     at which to warn, default 75.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { join, dirname, resolve, parse } from 'node:path';
import { execSync } from 'node:child_process';
import { getClaudeConfigDir } from './lib/config-dir.mjs';
import { readStdin } from './lib/stdin.mjs';

const THRESHOLD = parseInt(
  process.env.HARNESS_CONTEXT_GUARD_THRESHOLD ||
  process.env.OMC_CONTEXT_GUARD_THRESHOLD ||
  '75',
  10,
);
const CRITICAL_THRESHOLD = 95;
const MAX_BLOCKS = 2;
const SESSION_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,255}$/;
const GIT_PROBE_TIMEOUT_MS = 1000;

function isContextLimitStop(data) {
  const reasons = [
    data.stop_reason,
    data.stopReason,
    data.end_turn_reason,
    data.endTurnReason,
    data.reason,
  ]
    .filter((v) => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.toLowerCase().replace(/[\s-]+/g, '_'));
  const contextPatterns = [
    'context_limit', 'context_window', 'context_exceeded',
    'context_full', 'max_context', 'token_limit',
    'max_tokens', 'conversation_too_long', 'input_too_long',
  ];
  return reasons.some((reason) => contextPatterns.some((p) => reason.includes(p)));
}

function isUserAbort(data) {
  if (data.user_requested || data.userRequested) return true;
  const reason = (data.stop_reason || data.stopReason || '').toLowerCase();
  const exact = ['aborted', 'abort', 'cancel', 'interrupt'];
  const substring = ['user_cancel', 'user_interrupt', 'ctrl_c', 'manual_stop'];
  return exact.some((p) => reason === p) || substring.some((p) => reason.includes(p));
}

function hasLocalGitMarker(startDir) {
  if (!startDir) return false;
  let current = resolve(startDir);
  const { root } = parse(current);
  while (true) {
    if (existsSync(join(current, '.git'))) return true;
    if (current === root) return false;
    current = dirname(current);
  }
}

function runGitRevParse(args, cwd) {
  return execSync(`git rev-parse ${args.join(' ')}`, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: GIT_PROBE_TIMEOUT_MS,
  }).trim();
}

// Resolve transcript path when Claude Code runs in a git worktree — the encoded
// project dir on disk is the main repo, not the worktree path.
function resolveTranscriptPath(transcriptPath, cwd) {
  if (!transcriptPath) return transcriptPath;
  try { if (existsSync(transcriptPath)) return transcriptPath; } catch {}

  const worktreePattern = /--claude-worktrees-[^/\\]+/;
  if (worktreePattern.test(transcriptPath)) {
    const resolved = transcriptPath.replace(worktreePattern, '');
    try { if (existsSync(resolved)) return resolved; } catch {}
  }

  const effectiveCwd = cwd || process.cwd();
  if (!hasLocalGitMarker(effectiveCwd)) return transcriptPath;

  try {
    const gitCommonDir = runGitRevParse(['--git-common-dir'], effectiveCwd);
    const absoluteCommonDir = resolve(effectiveCwd, gitCommonDir);
    const mainRepoRoot = dirname(absoluteCommonDir);
    const worktreeTop = runGitRevParse(['--show-toplevel'], effectiveCwd);
    if (mainRepoRoot !== worktreeTop) {
      const lastSep = transcriptPath.lastIndexOf('/');
      const sessionFile = lastSep !== -1 ? transcriptPath.substring(lastSep + 1) : '';
      if (sessionFile) {
        const configDir = getClaudeConfigDir();
        const projectsDir = join(configDir, 'projects');
        if (existsSync(projectsDir)) {
          const encodedMain = mainRepoRoot.replace(/[/\\]/g, '-');
          const resolvedPath = join(projectsDir, encodedMain, sessionFile);
          try { if (existsSync(resolvedPath)) return resolvedPath; } catch {}
        }
      }
    }
  } catch {}
  return transcriptPath;
}

// Estimate context usage by scanning the transcript tail for the last
// {context_window, input_tokens} pair.
function estimateContextPercent(transcriptPath) {
  if (!transcriptPath) return 0;
  let fd = -1;
  try {
    const stat = statSync(transcriptPath);
    if (stat.size === 0) return 0;
    fd = openSync(transcriptPath, 'r');
    const readSize = Math.min(4096, stat.size);
    const buf = Buffer.alloc(readSize);
    readSync(fd, buf, 0, readSize, stat.size - readSize);
    closeSync(fd);
    fd = -1;

    const tail = buf.toString('utf-8');
    const windowMatch = tail.match(/"context_window"\s{0,5}:\s{0,5}(\d+)/g);
    const inputMatch = tail.match(/"input_tokens"\s{0,5}:\s{0,5}(\d+)/g);
    if (!windowMatch || !inputMatch) return 0;

    const lastWindow = parseInt(windowMatch[windowMatch.length - 1].match(/(\d+)/)[1], 10);
    const lastInput = parseInt(inputMatch[inputMatch.length - 1].match(/(\d+)/)[1], 10);
    if (lastWindow === 0) return 0;
    return Math.round((lastInput / lastWindow) * 100);
  } catch {
    return 0;
  } finally {
    if (fd !== -1) try { closeSync(fd); } catch {}
  }
}

function getGuardFilePath(sessionId) {
  const configDir = getClaudeConfigDir();
  const guardDir = join(configDir, 'projects', '.harness-guards');
  try {
    mkdirSync(guardDir, { recursive: true, mode: 0o700 });
  } catch (err) {
    if (err?.code !== 'EEXIST') throw err;
  }
  return join(guardDir, `context-guard-${sessionId}.json`);
}

function getBlockCount(sessionId) {
  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) return 0;
  const guardFile = getGuardFilePath(sessionId);
  try {
    if (existsSync(guardFile)) {
      const data = JSON.parse(readFileSync(guardFile, 'utf-8'));
      return data.blockCount || 0;
    }
  } catch {}
  return 0;
}

function incrementBlockCount(sessionId) {
  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) return;
  const guardFile = getGuardFilePath(sessionId);
  try {
    let count = 0;
    if (existsSync(guardFile)) {
      const data = JSON.parse(readFileSync(guardFile, 'utf-8'));
      count = data.blockCount || 0;
    }
    writeFileSync(guardFile, JSON.stringify({ blockCount: count + 1 }), { mode: 0o600 });
  } catch {}
}

function buildStopRecoveryAdvice(contextPercent, blockCount) {
  const severity = contextPercent >= 90 ? 'CRITICAL' : 'HIGH';
  return `[HARNESS ${severity}] Context at ${contextPercent}% (threshold: ${THRESHOLD}%). ` +
    `Run /compact immediately before continuing. If /compact cannot complete, ` +
    `stop spawning new agents and recover in a fresh session using existing checkpoints ` +
    `(.omc/state, .omc/notepad.md). (Block ${blockCount}/${MAX_BLOCKS})`;
}

async function main() {
  try {
    const input = await readStdin();
    const data = JSON.parse(input);

    if (isContextLimitStop(data)) {
      console.log(JSON.stringify({ continue: true, suppressOutput: true }));
      return;
    }
    if (isUserAbort(data)) {
      console.log(JSON.stringify({ continue: true, suppressOutput: true }));
      return;
    }

    const sessionId = data.session_id || data.sessionId || '';
    const rawTranscriptPath = data.transcript_path || data.transcriptPath || '';
    const transcriptPath = resolveTranscriptPath(rawTranscriptPath, data.cwd);
    const pct = estimateContextPercent(transcriptPath);

    if (pct >= CRITICAL_THRESHOLD) {
      console.log(JSON.stringify({ continue: true, suppressOutput: true }));
      return;
    }

    if (pct >= THRESHOLD) {
      const blockCount = getBlockCount(sessionId);
      if (blockCount >= MAX_BLOCKS) {
        console.log(JSON.stringify({ continue: true, suppressOutput: true }));
        return;
      }
      incrementBlockCount(sessionId);
      console.log(JSON.stringify({
        continue: false,
        decision: 'block',
        reason: buildStopRecoveryAdvice(pct, blockCount + 1),
      }));
      return;
    }

    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
  } catch {
    console.log(JSON.stringify({ continue: true, suppressOutput: true }));
  }
}

main();
