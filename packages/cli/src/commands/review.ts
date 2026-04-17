/**
 * harness review — run claude-doctor on a finished session's transcript,
 * then dispatch the report through the learnings processor.
 *
 * The reviewer is NEVER the same process that produced the transcript —
 * self-review is biased. This runs in the orchestrator session and reads
 * the pane's transcript as an external judge.
 *
 * Usage:
 *   harness review <signal-file>     # from .harness/signals/done-*.json
 *   harness review --session <id>    # direct session id
 *   harness review --all-pending     # process every signal not yet reviewed
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { join, resolve } from "path";
import { HARNESS_DIR } from "../lib/constants.js";
import { heading, success, error, muted, info } from "../lib/format.js";
import { processLearnings } from "./process-learnings.js";

interface SignalPayload {
  session_id: string;
  transcript_path: string;
  cwd: string;
  pane_id: string;
  agent: string;
  ended_at: string;
}

interface ReviewReport {
  session_id: string;
  agent: string;
  ended_at: string;
  reviewed_at: string;
  transcript_bytes: number;
  metrics: {
    tool_calls: number;
    skill_invocations: number;
    skill_chain: string[];
    edits: number;
    writes: number;
    reads: number;
    bash_calls: number;
    errors: number;
    compactions: number;
    total_cost_usd?: number;
  };
  findings: string[];
  verdict: "clean" | "warn" | "fail";
}

const SIGNALS_DIR = join(HARNESS_DIR, "signals");
const METRICS_DIR = join(HARNESS_DIR, "metrics");
const PROCESSED_DIR = join(SIGNALS_DIR, "processed");

export function run(args: string[]): void {
  if (args.includes("--all-pending")) {
    return reviewAllPending();
  }
  const sessionFlagIdx = args.indexOf("--session");
  if (sessionFlagIdx >= 0 && args[sessionFlagIdx + 1]) {
    return reviewSession(args[sessionFlagIdx + 1]);
  }
  if (args[0]) {
    return reviewSignalFile(args[0]);
  }
  console.log(heading("harness review"));
  console.log("  Usage:");
  console.log("    harness review <signal-file>");
  console.log("    harness review --session <id>");
  console.log("    harness review --all-pending");
}

function reviewAllPending(): void {
  if (!existsSync(SIGNALS_DIR)) {
    console.log(muted("No signals directory."));
    return;
  }
  const files = readdirSync(SIGNALS_DIR).filter(
    (f) => f.startsWith("done-") && f.endsWith(".json")
  );
  if (files.length === 0) {
    console.log(muted("No pending signals."));
    return;
  }
  console.log(heading(`Reviewing ${files.length} pending session(s)`));
  for (const f of files) {
    reviewSignalFile(join(SIGNALS_DIR, f));
  }
}

function reviewSignalFile(path: string): void {
  if (!existsSync(path)) {
    console.log(error(`Signal file not found: ${path}`));
    return;
  }
  const signal = JSON.parse(readFileSync(path, "utf-8")) as SignalPayload;
  const report = analyzeTranscript(signal);
  writeReport(report);

  // Move signal to processed/ so --all-pending doesn't re-review it
  mkdirSync(PROCESSED_DIR, { recursive: true });
  renameSync(path, join(PROCESSED_DIR, `${signal.session_id}.json`));

  console.log(
    `${verdictBadge(report.verdict)} ${signal.agent} session ${signal.session_id.slice(0, 8)} — ` +
      `${report.metrics.skill_invocations} skills, ${report.metrics.edits + report.metrics.writes} edits, ${report.findings.length} findings`
  );

  // Fan out to learnings processor
  processLearnings(report);
}

function reviewSession(sessionId: string): void {
  // Scan signals for a match
  if (!existsSync(SIGNALS_DIR)) {
    console.log(error(`No signals directory — cannot locate session ${sessionId}`));
    return;
  }
  const match = readdirSync(SIGNALS_DIR).find((f) => f.includes(sessionId));
  if (!match) {
    console.log(error(`No signal for session ${sessionId}`));
    return;
  }
  reviewSignalFile(join(SIGNALS_DIR, match));
}

/**
 * Analyze a session transcript — external, transcript-only review.
 * We compute raw metrics from the JSONL and let the learnings
 * processor decide what to act on.
 */
function analyzeTranscript(signal: SignalPayload): ReviewReport {
  const findings: string[] = [];
  const metrics = {
    tool_calls: 0,
    skill_invocations: 0,
    skill_chain: [] as string[],
    edits: 0,
    writes: 0,
    reads: 0,
    bash_calls: 0,
    errors: 0,
    compactions: 0,
    total_cost_usd: undefined as number | undefined,
  };

  if (!signal.transcript_path || !existsSync(signal.transcript_path)) {
    findings.push(`Transcript not readable: ${signal.transcript_path}`);
    return buildReport(signal, metrics, findings, "fail");
  }

  const raw = readFileSync(signal.transcript_path, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    let entry: Record<string, unknown>;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.type === "summary" || entry.type === "compact") {
      metrics.compactions += 1;
    }
    if (entry.type !== "assistant") continue;
    const message = entry.message as Record<string, unknown> | undefined;
    const content = message?.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (!c || typeof c !== "object") continue;
      const block = c as Record<string, unknown>;
      if (block.type !== "tool_use") continue;
      metrics.tool_calls += 1;
      const name = block.name as string;
      const input = (block.input as Record<string, unknown>) || {};
      switch (name) {
        case "Skill": {
          metrics.skill_invocations += 1;
          const skill = input.skill as string | undefined;
          if (typeof skill === "string") metrics.skill_chain.push(skill);
          break;
        }
        case "Edit":
          metrics.edits += 1;
          break;
        case "Write":
          metrics.writes += 1;
          break;
        case "Read":
          metrics.reads += 1;
          break;
        case "Bash":
          metrics.bash_calls += 1;
          break;
      }
    }
    // Usage on final assistant entry of a session carries cost
    const usage = message?.usage as Record<string, unknown> | undefined;
    if (usage && typeof usage.total_cost === "number") {
      metrics.total_cost_usd = usage.total_cost as number;
    }
  }

  // Heuristic findings
  if (metrics.skill_invocations > 0 && metrics.edits + metrics.writes === 0) {
    findings.push(
      "Skill-heavy, code-light: invoked skills but produced no edits/writes. Possible planning loop."
    );
  }
  if (metrics.compactions > 0) {
    findings.push(`Context compacted ${metrics.compactions}x — run was longer than one window.`);
  }
  const duplicatedSkills = findDuplicates(metrics.skill_chain);
  if (duplicatedSkills.length > 0) {
    findings.push(
      `Re-invoked skills (possible wasted work): ${duplicatedSkills.join(", ")}`
    );
  }
  if (metrics.bash_calls > metrics.tool_calls * 0.5) {
    findings.push("Bash-heavy run — check whether work could have used dedicated tools.");
  }

  const verdict: ReviewReport["verdict"] =
    findings.length === 0
      ? "clean"
      : findings.length >= 3 || metrics.compactions >= 2
        ? "fail"
        : "warn";

  return buildReport(signal, metrics, findings, verdict);
}

function buildReport(
  signal: SignalPayload,
  metrics: ReviewReport["metrics"],
  findings: string[],
  verdict: ReviewReport["verdict"]
): ReviewReport {
  const stat = (() => {
    try {
      return readFileSync(signal.transcript_path, "utf-8").length;
    } catch {
      return 0;
    }
  })();
  return {
    session_id: signal.session_id,
    agent: signal.agent,
    ended_at: signal.ended_at,
    reviewed_at: new Date().toISOString(),
    transcript_bytes: stat,
    metrics,
    findings,
    verdict,
  };
}

function writeReport(report: ReviewReport): void {
  mkdirSync(METRICS_DIR, { recursive: true });
  const path = join(METRICS_DIR, `${report.session_id}.json`);
  writeFileSync(path, JSON.stringify(report, null, 2));
}

function verdictBadge(v: ReviewReport["verdict"]): string {
  if (v === "clean") return success("[CLEAN]");
  if (v === "warn") return info("[WARN]");
  return error("[FAIL]");
}

function findDuplicates(arr: string[]): string[] {
  const count = new Map<string, number>();
  for (const x of arr) count.set(x, (count.get(x) || 0) + 1);
  return [...count.entries()].filter(([, n]) => n > 1).map(([x]) => x);
}

// Try claude-doctor if available (optional richer analysis)
export function runClaudeDoctor(sessionId: string): string | null {
  try {
    const out = execSync(`claude-doctor analyze --session ${sessionId} --json`, {
      encoding: "utf-8",
      timeout: 60_000,
    });
    return out;
  } catch {
    return null;
  }
}
