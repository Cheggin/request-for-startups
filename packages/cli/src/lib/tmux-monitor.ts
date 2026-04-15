/**
 * Tmux Monitor — CEO monitoring loop for agent fleet supervision.
 *
 * Polls tmux panes, classifies status, reads signals, auto-approves
 * safe permission prompts, and reports fleet health.
 *
 * Fixes #14: agents are now supervised with progress verification.
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { capturePaneOutput, listPanes, sendKeys } from "./tmux.js";
import { HARNESS_DIR } from "./constants.js";

// ─── Types ─────────────────────────────────────────────────────────────────

export type PaneStatus = "working" | "idle" | "stuck" | "needs-approval";

export interface MonitoredPane {
  name: string;
  paneId: string;
  status: PaneStatus;
  lastLine: string;
}

export interface ApprovalPrompt {
  tool: string;
  target: string;
  raw: string;
}

export interface Signal {
  type: "done" | "needs-approval" | "unknown";
  agent: string;
  event: string;
  at: string;
  data: Record<string, unknown>;
}

// ─── Status classification patterns ───────────────────────────────────────

const WORKING_PATTERNS = [
  "Reading",
  "Writing",
  "Editing",
  "Running",
  "Searching",
  "Globbing",
  "Grepping",
  "thinking",
  "Analyzing",
  "Processing",
  "Compiling",
  "Building",
  "Installing",
  "Fetching",
  "Downloading",
  "Step ",
  "bypass permissions",
  "Codex",
  "Gemini",
];

const IDLE_PATTERNS = [
  "Tips:",
  "Available commands:",
  "> \n",
  "❯ \n",
  "[exited]",
  "Pane is dead",
];

const NEEDS_APPROVAL_PATTERNS = [
  "Allow?",
  "(y/n)",
  "Allow Read",
  "Allow Edit",
  "Allow Write",
  "Allow Bash",
  "Allow Glob",
  "Allow Grep",
  "Allow WebSearch",
  "Allow WebFetch",
];

const STUCK_PATTERNS = [
  "Rate limited",
  "Overloaded",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "heap out of memory",
  "killed",
  "segfault",
];

// ─── Safe auto-approve configuration ──────────────────────────────────────

const ALWAYS_SAFE_TOOLS = new Set([
  "Read",
  "Glob",
  "Grep",
  "WebSearch",
  "WebFetch",
  "LSP",
]);

const DESTRUCTIVE_BASH_PATTERNS = [
  /\brm\s+-/,
  /\bgit\s+push\s+--force/,
  /\bgit\s+reset\s+--hard/,
  /\bgit\s+checkout\s+--/,
  /\bgit\s+clean\s+-f/,
  /\bdrop\s+table/i,
  /\bdrop\s+database/i,
  /\bDELETE\b/,
  /\bkill\s+-9/,
  /\bkill\s+-KILL/,
  /\bsudo\b/,
  /\bchmod\s+777/,
  /\bmkfs\b/,
  /\bdd\s+if=/,
];

const SAFE_BASH_PREFIXES = [
  "bun ",
  "npm ",
  "npx ",
  "node ",
  "git status",
  "git log",
  "git diff",
  "git branch",
  "git show",
  "ls",
  "cat ",
  "head ",
  "tail ",
  "wc ",
  "echo ",
  "pwd",
  "which ",
  "type ",
  "tsc ",
  "eslint ",
  "prettier ",
];

// ─── Pure functions ────────────────────────────────────────────────────────

/**
 * Classify a pane's status from its captured output.
 */
export function classifyPaneStatus(output: string): PaneStatus {
  const trimmed = output.trim();

  // Empty output = idle
  if (!trimmed) return "idle";

  // Check needs-approval first (highest priority)
  if (NEEDS_APPROVAL_PATTERNS.some((p) => trimmed.includes(p))) {
    return "needs-approval";
  }

  // Check stuck: repeated errors or known stuck patterns
  if (STUCK_PATTERNS.some((p) => trimmed.includes(p))) {
    return "stuck";
  }

  // Check for repeated lines (retry loops)
  const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 3) {
    const lastThree = lines.slice(-3);
    const allSame = lastThree.every((l) => l === lastThree[0]);
    if (allSame && lastThree[0].length > 3) {
      return "stuck";
    }
  }

  // Check for repeated Error: lines
  const errorLines = lines.filter((l) => l.startsWith("Error:"));
  if (errorLines.length >= 3) {
    return "stuck";
  }

  // Check for repeated Retrying lines
  const retryLines = lines.filter((l) => l.includes("Retrying"));
  if (retryLines.length >= 3) {
    return "stuck";
  }

  // Check working
  if (WORKING_PATTERNS.some((p) => trimmed.includes(p))) {
    return "working";
  }

  // Check idle
  if (IDLE_PATTERNS.some((p) => trimmed.includes(p))) {
    return "idle";
  }

  // Bare prompt detection: line ends with "> " or "% " or "$ "
  const lastLine = lines[lines.length - 1] || "";
  if (/^[>$%❯]\s*$/.test(lastLine) || /[%$>❯]\s*$/.test(lastLine.trim())) {
    // If there's meaningful content above the prompt, still working
    const contentLines = lines.slice(0, -1).filter((l) => l.length > 2);
    if (contentLines.length === 0) return "idle";
  }

  // Default: working (assume activity if we can't classify)
  return "working";
}

/**
 * Detect an approval/permission prompt in pane output.
 * Returns the parsed prompt or null if none found.
 */
export function detectApprovalPrompt(output: string): ApprovalPrompt | null {
  const trimmed = output.trim();
  if (!trimmed) return null;

  // Pattern: "Allow ToolName(args)? (y/n)" or "Allow ToolName /path? (y/n)"
  const toolPromptMatch = trimmed.match(
    /Allow\s+(\w+)\s*[\(/](.+?)[\)]?\?\s*\(y\/n\)/
  );
  if (toolPromptMatch) {
    return {
      tool: toolPromptMatch[1],
      target: toolPromptMatch[2].trim(),
      raw: trimmed,
    };
  }

  // Pattern: "Allow ToolName /path? (y/n)" with space separator
  const spacePromptMatch = trimmed.match(
    /Allow\s+(\w+)\s+([^?]+)\?\s*\(y\/n\)/
  );
  if (spacePromptMatch) {
    return {
      tool: spacePromptMatch[1],
      target: spacePromptMatch[2].trim(),
      raw: trimmed,
    };
  }

  // Pattern: generic "Allow? (y/n)" with context above
  if (trimmed.includes("Allow?") && trimmed.includes("(y/n)")) {
    // Try to extract the command from context lines
    const lines = trimmed.split("\n").map((l) => l.trim()).filter(Boolean);
    const commandLine = lines.find(
      (l) => !l.includes("Allow") && !l.includes("(y/n)") && !l.includes("wants to") && l.length > 2
    );
    return {
      tool: "Bash",
      target: commandLine || "unknown",
      raw: trimmed,
    };
  }

  return null;
}

/**
 * Determine if a detected approval prompt is safe to auto-approve.
 */
export function shouldAutoApprove(prompt: ApprovalPrompt): boolean {
  // Always-safe read-only tools
  if (ALWAYS_SAFE_TOOLS.has(prompt.tool)) return true;

  // Write/Edit are never auto-approved
  if (prompt.tool === "Write" || prompt.tool === "Edit") return false;

  // Bash: check command safety
  if (prompt.tool === "Bash") {
    const cmd = prompt.target.trim();

    // Check destructive patterns first
    if (DESTRUCTIVE_BASH_PATTERNS.some((p) => p.test(cmd))) return false;

    // Check safe prefixes
    if (SAFE_BASH_PREFIXES.some((prefix) => cmd.startsWith(prefix))) return true;

    // Unknown bash command — don't approve
    return false;
  }

  // Unknown tool — don't approve
  return false;
}

/**
 * Build a formatted status report from monitored panes.
 */
export function buildStatusReport(panes: MonitoredPane[]): string {
  if (panes.length === 0) return "No agents running.";

  const counts = { working: 0, idle: 0, stuck: 0, "needs-approval": 0 };
  for (const pane of panes) {
    counts[pane.status]++;
  }

  const MAX_LINE_LEN = 80;

  const lines = panes.map((pane) => {
    const tag =
      pane.status === "working" ? "[WORKING]" :
      pane.status === "idle" ? "[IDLE]" :
      pane.status === "stuck" ? "[STUCK]" :
      "[APPROVE]";

    let lastLine = pane.lastLine.trim();
    if (lastLine.length > MAX_LINE_LEN) {
      lastLine = lastLine.slice(0, MAX_LINE_LEN - 3) + "...";
    }
    lastLine = lastLine || "(no output)";

    return `  ${tag} ${pane.name}: ${lastLine}`;
  });

  const summary: string[] = [];
  if (counts.working > 0) summary.push(`${counts.working} working`);
  if (counts.idle > 0) summary.push(`${counts.idle} idle`);
  if (counts.stuck > 0) summary.push(`${counts.stuck} stuck`);
  if (counts["needs-approval"] > 0) summary.push(`${counts["needs-approval"]} needs-approval`);

  return [
    `Agents: ${summary.join(", ")} | ${panes.length} total`,
    ...lines,
  ].join("\n");
}

// ─── Signal reading ────────────────────────────────────────────────────────

const SIGNAL_TYPE_MAP: Record<string, Signal["type"]> = {
  done: "done",
  "needs-approval": "needs-approval",
};

/**
 * Read signal files from a directory. Each file is a JSON signal.
 */
export function readSignals(signalsDir: string): Signal[] {
  if (!existsSync(signalsDir)) return [];

  let entries: string[];
  try {
    entries = readdirSync(signalsDir).filter((f) => !f.startsWith("."));
  } catch {
    return [];
  }

  const signals: Signal[] = [];

  for (const filename of entries) {
    try {
      const raw = readFileSync(join(signalsDir, filename), "utf-8");
      const data = JSON.parse(raw);
      const type = SIGNAL_TYPE_MAP[filename] ?? "unknown";

      signals.push({
        type,
        agent: data.agent ?? "unknown",
        event: data.event ?? filename,
        at: data.at ?? "",
        data,
      });
    } catch {
      // Skip malformed signal files
      continue;
    }
  }

  return signals;
}

// ─── Monitor loop ──────────────────────────────────────────────────────────

export interface MonitorResult {
  panes: MonitoredPane[];
  signals: Signal[];
  autoApproved: string[];
  report: string;
}

/**
 * Run one monitoring cycle: poll panes, classify, read signals, auto-approve, report.
 */
export function monitorOnce(signalsDir?: string): MonitorResult {
  const dir = signalsDir ?? join(HARNESS_DIR, "signals");
  const autoApproved: string[] = [];

  // 1) Poll all tmux panes
  const rawPanes = listPanes();

  // 2) Classify each pane
  const panes: MonitoredPane[] = rawPanes.map((pane) => {
    const output = capturePaneOutput(pane.paneId, 30);
    const status = classifyPaneStatus(output);
    const lines = output.trim().split("\n").filter(Boolean);
    const lastLine = lines[lines.length - 1]?.trim() ?? "";

    return {
      name: pane.name,
      paneId: pane.paneId,
      status,
      lastLine,
    };
  });

  // 3) Read signals
  const signals = readSignals(dir);

  // 4) Auto-approve safe permission prompts
  for (const pane of panes) {
    if (pane.status !== "needs-approval") continue;

    const output = capturePaneOutput(pane.paneId, 30);
    const prompt = detectApprovalPrompt(output);
    if (!prompt) continue;

    if (shouldAutoApprove(prompt)) {
      console.log(`[monitor] Auto-approving ${prompt.tool} in ${pane.name}: ${prompt.target}`);
      sendKeys(pane.paneId, "y");
      autoApproved.push(`${pane.name}:${prompt.tool}(${prompt.target})`);
    } else {
      console.log(`[monitor] Needs manual approval in ${pane.name}: ${prompt.tool}(${prompt.target})`);
    }
  }

  // 5) Build report
  const report = buildStatusReport(panes);

  return { panes, signals, autoApproved, report };
}

