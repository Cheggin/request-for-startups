/**
 * harness analyze — audit agent tmux panes for compliance.
 *
 * Captures pane history and checks: skill invocations, GitHub issues,
 * git commits, tool calls, scope violations.
 *
 * Subcommands:
 *   <pane-name>       — analyze a single pane
 *   --all             — analyze all panes in the harness session
 */

import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import {
  listPanes,
  capturePaneOutput,
  isTmuxAvailable,
  type TmuxPane,
} from "../lib/tmux.js";
import {
  heading,
  subheading,
  table,
  success,
  error,
  warn,
  muted,
  info,
  count,
} from "../lib/format.js";
import { COLORS, HARNESS_DIR } from "../lib/constants.js";

const { reset, bold, dim, green, red, yellow, cyan, gray } = COLORS;

// ─── Constants ─────────────────────────────────────────────────────────────

const CAPTURE_LINES = 500;

const SKILL_PATTERNS = [
  /\/startup-harness:/g,
  /\/oh-my-claudecode:/g,
];

const ISSUE_PATTERNS = [
  /gh issue create/g,
  /gh issue comment/g,
  /gh issue close/g,
  /gh issue edit/g,
];

const COMMIT_PATTERNS = [
  /git commit(?! --amend)/g,
  /\b[a-f0-9]{7,40}\b.*(?:feat|fix|refactor|chore|docs|test|perf|ci)\(/g,
];

const TOOL_CALL_PATTERNS = [
  /\bEdit\b.*file/g,
  /\bWrite\b.*file/g,
  /\bRead\b.*file/g,
  /\bBash\b/g,
  /\bGrep\b/g,
  /\bGlob\b/g,
];

const SCOPE_VIOLATION_PATTERNS = [
  { pattern: /npm install(?! -D| --save-dev)/g, label: "npm install (production dep)" },
  { pattern: /bun add(?! -[dD])/g, label: "bun add (production dep)" },
  { pattern: /rm -rf/g, label: "rm -rf" },
  { pattern: /git reset --hard/g, label: "git reset --hard" },
  { pattern: /git push --force/g, label: "git push --force" },
  { pattern: /git push -f\b/g, label: "git push -f" },
];

// ─── Types ─────────────────────────────────────────────────────────────────

interface PaneReport {
  name: string;
  runtime: string;
  skills: number;
  issues: number;
  commits: number;
  toolCalls: number;
  scopeFlags: string[];
  compliance: "PASS" | "FAIL" | "N/A";
  reason: string;
}

// ─── Analysis ──────────────────────────────────────────────────────────────

function detectRuntime(output: string): string {
  if (/Claude Code|claude>|Claude>/.test(output)) return "claude";
  if (/Codex|codex>/i.test(output)) return "codex";
  if (/Gemini/i.test(output)) return "gemini";
  return "shell";
}

function countMatches(output: string, patterns: RegExp[]): number {
  let total = 0;
  for (const pattern of patterns) {
    const matches = output.match(new RegExp(pattern.source, pattern.flags));
    total += matches?.length ?? 0;
  }
  return total;
}

function findScopeViolations(output: string): string[] {
  const flags: string[] = [];
  for (const { pattern, label } of SCOPE_VIOLATION_PATTERNS) {
    const matches = output.match(new RegExp(pattern.source, pattern.flags));
    if (matches && matches.length > 0) {
      flags.push(`${label} (x${matches.length})`);
    }
  }
  return flags;
}

function analyzePane(pane: TmuxPane): PaneReport {
  const output = capturePaneOutput(pane.paneId, CAPTURE_LINES);
  const runtime = detectRuntime(output);

  const skills = countMatches(output, SKILL_PATTERNS);
  const issues = countMatches(output, ISSUE_PATTERNS);
  const commits = countMatches(output, COMMIT_PATTERNS);
  const toolCalls = countMatches(output, TOOL_CALL_PATTERNS);
  const scopeFlags = findScopeViolations(output);

  let compliance: PaneReport["compliance"];
  let reason: string;

  if (runtime === "codex") {
    compliance = "N/A";
    reason = "Codex runtime cannot invoke skills";
  } else if (runtime === "shell") {
    compliance = "N/A";
    reason = "bare shell — not an agent runtime";
  } else if (skills === 0 && toolCalls > 5) {
    compliance = "FAIL";
    reason = "no skill invocations (freestyle violation)";
  } else if (scopeFlags.length > 0) {
    compliance = "FAIL";
    reason = `scope violations: ${scopeFlags.join(", ")}`;
  } else {
    compliance = "PASS";
    reason = "";
  }

  return { name: pane.name, runtime, skills, issues, commits, toolCalls, scopeFlags, compliance, reason };
}

// ─── Display ───────────────────────────────────────────────────────────────

function complianceColor(c: PaneReport["compliance"]): string {
  switch (c) {
    case "PASS": return green;
    case "FAIL": return red;
    case "N/A": return gray;
  }
}

function printReport(report: PaneReport): void {
  const cc = complianceColor(report.compliance);

  console.log(`\n  ${bold}--- Pane: ${report.name} (${report.runtime}) ---${reset}`);
  console.log(`  Skills invoked:    ${report.skills}`);
  console.log(`  Issues created:    ${report.issues}`);
  console.log(`  Commits made:      ${report.commits}`);
  console.log(`  Tool calls:        ${report.toolCalls}`);
  console.log(`  Scope flags:       ${report.scopeFlags.length}`);

  if (report.scopeFlags.length > 0) {
    for (const flag of report.scopeFlags) {
      console.log(`    ${yellow}! ${flag}${reset}`);
    }
  }

  const suffix = report.reason ? ` — ${report.reason}` : "";
  console.log(`\n  Compliance: ${cc}${bold}${report.compliance}${reset}${suffix}`);
}

function printSummary(reports: PaneReport[]): void {
  const pass = reports.filter((r) => r.compliance === "PASS").length;
  const fail = reports.filter((r) => r.compliance === "FAIL").length;
  const na = reports.filter((r) => r.compliance === "N/A").length;

  console.log(heading("Summary"));

  const rows = reports.map((r) => {
    const cc = complianceColor(r.compliance);
    return [
      r.name,
      r.runtime,
      String(r.skills),
      String(r.issues),
      String(r.commits),
      String(r.toolCalls),
      `${cc}${r.compliance}${reset}`,
    ];
  });

  console.log(table(rows, ["Pane", "Runtime", "Skills", "Issues", "Commits", "Tools", "Status"]));
  console.log();
  console.log(`  ${green}${pass} pass${reset}  ${red}${fail} fail${reset}  ${gray}${na} n/a${reset}`);
  console.log();
}

// ─── Claude Doctor Integration ────────────────────────────────────────────

const KNOWLEDGE_DIR = join(HARNESS_DIR, "knowledge");

/**
 * Run claude-doctor session analysis.
 * Shells out to npx claude-doctor for transcript anti-pattern detection.
 */
function runDoctor(args: { session?: string; json?: boolean }): void {
  console.log(heading("harness analyze --doctor"));

  const cmd = args.session
    ? `npx claude-doctor ${args.session}${args.json ? " --json" : ""}`
    : `npx claude-doctor${args.json ? " --json" : ""}`;

  console.log(muted(`  Running: ${cmd}`));

  try {
    const output = execSync(cmd, { encoding: "utf-8", timeout: 60000 });
    console.log(output);
  } catch (err) {
    const message = err instanceof Error ? (err as any).stderr || err.message : String(err);
    console.log(error(`  claude-doctor failed: ${message}`));
    console.log(muted("  Install with: npm install -g claude-doctor"));
  }
}

/**
 * Run claude-doctor --rules and save output to .harness/knowledge/.
 * Generates CLAUDE.md rules from session history anti-patterns.
 */
export function runDoctorRules(): string | null {
  console.log(heading("harness analyze --rules"));
  console.log(muted("  Generating rules from session history..."));

  try {
    const output = execSync("npx claude-doctor --rules", {
      encoding: "utf-8",
      timeout: 60000,
    });

    if (!output.trim()) {
      console.log(muted("  No rules generated (clean session history)."));
      return null;
    }

    mkdirSync(KNOWLEDGE_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filePath = join(KNOWLEDGE_DIR, `doctor-rules-${timestamp}.md`);
    writeFileSync(filePath, `# Claude Doctor Rules\n\nGenerated: ${new Date().toISOString()}\n\n${output}`);

    console.log(success(`  Rules saved to ${filePath}`));
    console.log(output);
    return filePath;
  } catch (err) {
    const message = err instanceof Error ? (err as any).stderr || err.message : String(err);
    console.log(error(`  claude-doctor --rules failed: ${message}`));
    console.log(muted("  Install with: npm install -g claude-doctor"));
    return null;
  }
}

// ─── Entry Point ───────────────────────────────────────────────────────────

export function run(args: string[]): void {
  const target = args[0];

  // Doctor mode — does not require tmux
  if (target === "--doctor" || target === "doctor") {
    const session = args[1] && !args[1].startsWith("--") ? args[1] : undefined;
    const json = args.includes("--json");
    return runDoctor({ session, json });
  }

  if (target === "--rules" || target === "rules") {
    runDoctorRules();
    return;
  }

  if (!isTmuxAvailable()) {
    console.log(error("  tmux is not installed. Install it with: brew install tmux"));
    return;
  }

  if (!target || target === "--help" || target === "-h") {
    console.log(heading("harness analyze"));
    console.log("  Usage:");
    console.log("    harness analyze <pane-name>    — analyze a single pane");
    console.log("    harness analyze --all          — analyze all panes");
    console.log("    harness analyze --doctor [id]  — run claude-doctor session analysis");
    console.log("    harness analyze --rules        — generate CLAUDE.md rules from history");
    console.log();
    return;
  }

  const panes = listPanes();

  if (panes.length === 0) {
    console.log(warn("  No agent panes found in harness tmux session."));
    return;
  }

  if (target === "--all") {
    console.log(heading("harness analyze --all"));
    console.log(muted(`  Analyzing ${count(panes.length, "pane")}...`));

    const reports = panes.map(analyzePane);
    for (const report of reports) {
      printReport(report);
    }
    printSummary(reports);
    return;
  }

  // Single pane
  const pane = panes.find((p) => p.name === target || p.paneId === target);
  if (!pane) {
    console.log(error(`  Pane '${target}' not found.`));
    console.log(muted(`  Available: ${panes.map((p) => p.name).join(", ")}`));
    return;
  }

  console.log(heading(`harness analyze: ${pane.name}`));
  const report = analyzePane(pane);
  printReport(report);
  console.log();
}
