import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { detectAgentName, type HookEventInput } from "./inter-agent-signal.js";

const WRITE_TOOL_NAMES = new Set(["Edit", "Write", "MultiEdit"]);
const ISSUE_VIEW_PATTERN = /\bgh issue view\s+(\d+)\b/i;
const ISSUE_REF_PATTERN = /\bissue\s+#(\d+)\b/i;
const BRANCH_ISSUE_PATTERN = /(?:^|\/)(\d+)(?:-|$)/;
const COMPLETION_HINTS = [
  "implemented",
  "added",
  "updated",
  "fixed",
  "wired",
  "created",
  "completed",
  "finished",
  "verified",
  "tests",
  "shipped",
];
const BLOCKER_HINTS = [
  "blocked",
  "unable",
  "stuck",
  "need user",
  "need input",
  "partial",
  "remaining work",
  "follow-up required",
  "follow up required",
  "todo:",
  "not finished",
  "cannot",
];

const IGNORED_STATUS_PATHS = new Set([".claude/command-log.txt"]);
const IGNORED_STATUS_PREFIXES = [
  ".omc/",
  ".harness/handoffs/",
  ".harness/signals/",
  "packages/harness-dashboard/.omc/",
];

const SCOPE_PREFIXES: Array<{ prefix: string; scope: string }> = [
  { prefix: "packages/hooks/", scope: "hooks" },
  { prefix: "packages/cli/", scope: "cli" },
  { prefix: "packages/commander/", scope: "commander" },
  { prefix: "packages/github-state/", scope: "github-state" },
  { prefix: "packages/implementation-loop/", scope: "impl-loop" },
  { prefix: "packages/feature-decomposer/", scope: "features" },
  { prefix: "packages/knowledge/", scope: "knowledge" },
  { prefix: "packages/repo-setup/", scope: "repo-setup" },
  { prefix: "packages/service-validator/", scope: "services" },
  { prefix: "packages/secret-manager/", scope: "secrets" },
  { prefix: "packages/sentry-integration/", scope: "sentry" },
  { prefix: "packages/config-optimizer/", scope: "config" },
  { prefix: "packages/task-classifier/", scope: "classifier" },
  { prefix: "packages/fixed-boundary/", scope: "boundary" },
  { prefix: "packages/cubic-channel/", scope: "cubic" },
  { prefix: "packages/harness-dashboard/", scope: "dashboard" },
  { prefix: ".harness/", scope: "harness" },
  { prefix: ".claude/skills/", scope: "skills" },
  { prefix: "skills/", scope: "skills" },
  { prefix: "agents/", scope: "agents" },
  { prefix: "README.md", scope: "readme" },
  { prefix: "SOUL.md", scope: "readme" },
];

type TranscriptEntry = {
  type?: string;
  message?: {
    role?: string;
    content?: unknown;
    stop_reason?: string | null;
  };
};

export interface ParsedTranscript {
  issueNumber?: number;
  taskSummary?: string;
  touchedFiles: string[];
  lastAssistantText?: string;
  lastAssistantStopReason?: string | null;
}

export interface IssueMetadata {
  number: number;
  title: string;
  state: string;
}

export interface ChangedFile {
  path: string;
  status: string;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  status: number;
}

export type CommandRunner = (
  binary: "git" | "gh",
  args: string[],
  cwd: string
) => CommandResult;

export interface AutoFinishResult {
  status: "skipped" | "committed";
  reason?: string;
  issueNumber?: number;
  commitSha?: string;
  files?: string[];
}

interface TranscriptPromptResolution {
  issueNumber?: number;
  taskSummary?: string;
}

interface ToolUseBlock {
  type?: string;
  name?: string;
  input?: Record<string, unknown>;
}

function defaultRunner(
  binary: "git" | "gh",
  args: string[],
  cwd: string
): CommandResult {
  const result = spawnSync(binary, args, {
    cwd,
    encoding: "utf-8",
  });

  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    status: result.status ?? 1,
  };
}

function normalizeRelativePath(cwd: string, filePath: string): string {
  const absolute = filePath.startsWith("/") ? filePath : resolve(cwd, filePath);
  const rel = relative(cwd, absolute);
  return rel || filePath;
}

function parseTranscriptLine(line: string): TranscriptEntry | null {
  if (!line.trim()) {
    return null;
  }

  try {
    return JSON.parse(line) as TranscriptEntry;
  } catch {
    return null;
  }
}

function flattenContentToText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((block) => {
      if (!block || typeof block !== "object") {
        return "";
      }

      const typedBlock = block as Record<string, unknown>;
      const value = typedBlock.text ?? typedBlock.content;
      return typeof value === "string" ? value : "";
    })
    .filter(Boolean)
    .join("\n");
}

function extractToolUses(content: unknown): ToolUseBlock[] {
  if (!Array.isArray(content)) {
    return [];
  }

  return content
    .filter(
      (block): block is ToolUseBlock =>
        !!block && typeof block === "object" && "type" in block
    )
    .filter((block) => block.type === "tool_use");
}

function resolvePromptIssue(text: string): TranscriptPromptResolution {
  const issueView = text.match(ISSUE_VIEW_PATTERN);
  if (issueView) {
    const issueNumber = Number.parseInt(issueView[1] ?? "", 10);
    const taskSummary = text.split(/\bthen\b/i)[1]?.trim();
    return {
      issueNumber: Number.isFinite(issueNumber) ? issueNumber : undefined,
      taskSummary,
    };
  }

  const issueRef = text.match(ISSUE_REF_PATTERN);
  if (issueRef) {
    const issueNumber = Number.parseInt(issueRef[1] ?? "", 10);
    return {
      issueNumber: Number.isFinite(issueNumber) ? issueNumber : undefined,
    };
  }

  return {};
}

function readTranscriptEntries(transcriptPath: string): TranscriptEntry[] {
  if (!existsSync(transcriptPath)) {
    return [];
  }

  return readFileSync(transcriptPath, "utf-8")
    .split("\n")
    .map(parseTranscriptLine)
    .filter((entry): entry is TranscriptEntry => entry !== null);
}

export function parseTranscript(
  transcriptPath: string,
  cwd: string
): ParsedTranscript {
  const entries = readTranscriptEntries(transcriptPath);
  const touchedFiles = new Set<string>();
  let issueNumber: number | undefined;
  let taskSummary: string | undefined;
  let lastAssistantText: string | undefined;
  let lastAssistantStopReason: string | null | undefined;

  for (const entry of entries) {
    const role = entry.message?.role;
    const content = entry.message?.content;

    if (role === "user" && issueNumber === undefined) {
      const text = flattenContentToText(content);
      if (text) {
        const resolved = resolvePromptIssue(text);
        if (resolved.issueNumber !== undefined) {
          issueNumber = resolved.issueNumber;
          taskSummary = resolved.taskSummary;
        }
      }
    }

    if (role === "assistant") {
      const text = flattenContentToText(content);
      if (text) {
        lastAssistantText = text;
        lastAssistantStopReason = entry.message?.stop_reason ?? null;
      }

      for (const block of extractToolUses(content)) {
        if (!block.name || !WRITE_TOOL_NAMES.has(block.name)) {
          continue;
        }

        const filePath = block.input?.file_path;
        if (typeof filePath === "string" && filePath.trim()) {
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

export function listChangedFiles(
  cwd: string,
  runner: CommandRunner = defaultRunner
): ChangedFile[] {
  const result = runner("git", ["status", "--porcelain", "--untracked-files=all"], cwd);
  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const status = line.slice(0, 2);
      const rawPath = line.slice(3).trim();
      const normalizedPath = rawPath.includes(" -> ")
        ? rawPath.split(" -> ").at(-1) ?? rawPath
        : rawPath;

      return {
        status,
        path: normalizedPath,
      };
    });
}

function isIgnoredPath(filePath: string): boolean {
  if (IGNORED_STATUS_PATHS.has(filePath)) {
    return true;
  }

  return IGNORED_STATUS_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}

function branchLooksDedicatedToIssue(
  branchName: string,
  issueNumber: number
): boolean {
  const match = branchName.match(BRANCH_ISSUE_PATTERN);
  if (!match) {
    return false;
  }

  return Number.parseInt(match[1] ?? "", 10) === issueNumber;
}

export function selectFilesToCommit(
  changedFiles: ChangedFile[],
  touchedFiles: string[],
  branchName: string,
  issueNumber: number
): string[] {
  const meaningfulPaths = changedFiles
    .map((entry) => entry.path)
    .filter((filePath) => !isIgnoredPath(filePath));

  if (meaningfulPaths.length === 0) {
    return [];
  }

  const touched = new Set(touchedFiles);
  const scoped = meaningfulPaths.filter((filePath) => touched.has(filePath));
  if (scoped.length > 0) {
    return scoped;
  }

  if (branchLooksDedicatedToIssue(branchName, issueNumber)) {
    return meaningfulPaths;
  }

  return [];
}

function extractIssueType(issueTitle: string): string {
  const match = issueTitle.match(/^\[(feat|fix|refactor|test|docs|chore|perf|ci)\]/i);
  return (match?.[1] ?? "chore").toLowerCase();
}

export function inferCommitScope(files: string[]): string | undefined {
  const counts = new Map<string, number>();

  for (const filePath of files) {
    const match = SCOPE_PREFIXES.find(({ prefix }) => filePath.startsWith(prefix));
    const scope = match?.scope;
    if (!scope) {
      continue;
    }
    counts.set(scope, (counts.get(scope) ?? 0) + 1);
  }

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0];
}

function normalizeDescription(raw: string | undefined): string {
  const fallback = "finalize agent changes";
  if (!raw) {
    return fallback;
  }

  const normalized = raw
    .replace(/^[-*]\s*/, "")
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return fallback;
  }

  const lowerFirst = normalized.charAt(0).toLowerCase() + normalized.slice(1);
  return lowerFirst.replace(/[.?!]+$/, "");
}

function trimCommitSubject(subject: string): string {
  if (subject.length <= 72) {
    return subject;
  }

  return subject.slice(0, 69).trimEnd() + "...";
}

export function buildCommitMessage(input: {
  issueTitle: string;
  taskSummary?: string;
  files: string[];
}): string {
  const type = extractIssueType(input.issueTitle);
  const scope = inferCommitScope(input.files);
  const baseDescription =
    input.taskSummary ||
    input.issueTitle.replace(/^\[[^\]]+\]\s*/, "");
  const description = normalizeDescription(baseDescription);
  const prefix = scope ? `${type}(${scope}): ` : `${type}: `;
  return trimCommitSubject(prefix + description);
}

export function looksTaskComplete(
  assistantText: string | undefined,
  stopReason: string | null | undefined
): boolean {
  if (!assistantText || stopReason !== "end_turn") {
    return false;
  }

  const lower = assistantText.toLowerCase();
  if (BLOCKER_HINTS.some((hint) => lower.includes(hint))) {
    return false;
  }

  return COMPLETION_HINTS.some((hint) => lower.includes(hint));
}

function resolveIssueNumber(
  transcript: ParsedTranscript,
  branchName: string
): number | undefined {
  const envIssue = process.env.HARNESS_ISSUE_NUMBER;
  if (envIssue) {
    const parsed = Number.parseInt(envIssue, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (transcript.issueNumber !== undefined) {
    return transcript.issueNumber;
  }

  const branchMatch = branchName.match(BRANCH_ISSUE_PATTERN);
  if (!branchMatch) {
    return undefined;
  }

  const parsed = Number.parseInt(branchMatch[1] ?? "", 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function runOrThrow(
  runner: CommandRunner,
  binary: "git" | "gh",
  args: string[],
  cwd: string
): CommandResult {
  const result = runner(binary, args, cwd);
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim();
    throw new Error(`${binary} ${args.join(" ")} failed${detail ? `: ${detail}` : ""}`);
  }
  return result;
}

function getCurrentBranch(
  cwd: string,
  runner: CommandRunner
): string {
  const result = runOrThrow(runner, "git", ["branch", "--show-current"], cwd);
  return result.stdout.trim();
}

function getHeadSha(
  cwd: string,
  runner: CommandRunner
): string {
  return runOrThrow(runner, "git", ["rev-parse", "HEAD"], cwd).stdout.trim();
}

function hasUnmergedPaths(
  cwd: string,
  runner: CommandRunner
): boolean {
  const result = runner("git", ["diff", "--name-only", "--diff-filter=U"], cwd);
  return result.status === 0 && result.stdout.trim().length > 0;
}

function getIssueMetadata(
  issueNumber: number,
  cwd: string,
  runner: CommandRunner
): IssueMetadata {
  const result = runOrThrow(
    runner,
    "gh",
    ["issue", "view", String(issueNumber), "--json", "number,title,state"],
    cwd
  );
  return JSON.parse(result.stdout) as IssueMetadata;
}

function pushCurrentBranch(
  cwd: string,
  runner: CommandRunner,
  branchName: string
): void {
  const upstream = runner(
    "git",
    ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
    cwd
  );

  if (upstream.status === 0) {
    runOrThrow(runner, "git", ["push"], cwd);
    return;
  }

  runOrThrow(runner, "git", ["push", "-u", "origin", branchName], cwd);
}

export function runAutoFinish(
  input: HookEventInput,
  options?: {
    cwd?: string;
    runner?: CommandRunner;
  }
): AutoFinishResult {
  const cwd = options?.cwd || input.cwd || process.cwd();
  const runner = options?.runner || defaultRunner;

  if (input.hook_event_name && input.hook_event_name !== "Stop") {
    return { status: "skipped", reason: "not-a-stop-event" };
  }

  if (hasUnmergedPaths(cwd, runner)) {
    return { status: "skipped", reason: "merge-conflicts-present" };
  }

  const branchName = getCurrentBranch(cwd, runner);
  const transcript: ParsedTranscript = input.transcript_path
    ? parseTranscript(input.transcript_path, cwd)
    : {
        touchedFiles: [],
      };

  const issueNumber = resolveIssueNumber(transcript, branchName);
  if (!issueNumber) {
    return { status: "skipped", reason: "no-issue-context" };
  }

  if (
    !looksTaskComplete(
      transcript.lastAssistantText,
      transcript.lastAssistantStopReason
    )
  ) {
    return { status: "skipped", reason: "session-not-finished" };
  }

  const changedFiles = listChangedFiles(cwd, runner);
  const filesToCommit = selectFilesToCommit(
    changedFiles,
    transcript.touchedFiles,
    branchName,
    issueNumber
  );

  if (filesToCommit.length === 0) {
    return { status: "skipped", reason: "no-session-scoped-changes" };
  }

  const issue = getIssueMetadata(issueNumber, cwd, runner);
  const commitMessage = buildCommitMessage({
    issueTitle: issue.title,
    taskSummary: transcript.taskSummary,
    files: filesToCommit,
  });

  runOrThrow(runner, "git", ["add", "-A", "--", ...filesToCommit], cwd);

  const staged = runner("git", ["diff", "--cached", "--name-only"], cwd);
  if (staged.status !== 0 || staged.stdout.trim().length === 0) {
    return { status: "skipped", reason: "nothing-staged" };
  }

  runOrThrow(
    runner,
    "git",
    ["commit", "-m", commitMessage, "-m", `Closes #${issueNumber}`],
    cwd
  );

  pushCurrentBranch(cwd, runner, branchName);
  const commitSha = getHeadSha(cwd, runner);
  const shortSha = commitSha.slice(0, 7);

  if (issue.state.toUpperCase() !== "CLOSED") {
    runOrThrow(
      runner,
      "gh",
      [
        "issue",
        "close",
        String(issueNumber),
        "--comment",
        `Closed by ${detectAgentName(cwd)} in commit ${shortSha}.`,
      ],
      cwd
    );
  }

  return {
    status: "committed",
    issueNumber,
    commitSha: commitSha,
    files: filesToCommit,
  };
}

export function readStopInputFromStdin(stdin: NodeJS.ReadStream): Promise<HookEventInput> {
  if (stdin.isTTY) {
    return Promise.resolve({});
  }

  return new Promise((resolveInput) => {
    const chunks: string[] = [];
    stdin.on("data", (chunk) => chunks.push(chunk.toString()));
    stdin.on("end", () => {
      try {
        const raw = chunks.join("").trim();
        resolveInput(raw ? (JSON.parse(raw) as HookEventInput) : {});
      } catch {
        resolveInput({});
      }
    });
  });
}

export function currentGitBranch(cwd: string): string {
  return execFileSync("git", ["branch", "--show-current"], {
    cwd,
    encoding: "utf-8",
  }).trim();
}
