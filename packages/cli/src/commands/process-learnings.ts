/**
 * Learnings processor — consumes review reports and applies safe changes
 * to harness config, so the next run benefits from the last run.
 *
 * Two outputs:
 *   1. Safe auto-applies  → write directly (append to knowledge, patch YAML)
 *   2. Risky proposals    → file GitHub issue for human review
 *
 * Called from review.ts after each reviewer pass. Keep this idempotent —
 * running twice on the same report should be a no-op.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import { HARNESS_DIR } from "../lib/constants.js";
import { muted, info } from "../lib/format.js";

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

const LEARNINGS_DIR = join(HARNESS_DIR, "learnings");
const PROCESSED_LOG = join(LEARNINGS_DIR, "processed-reports.log");

export function processLearnings(report: ReviewReport): void {
  mkdirSync(LEARNINGS_DIR, { recursive: true });

  // Idempotency — skip if already processed
  if (alreadyProcessed(report.session_id)) {
    return;
  }

  const autoApplied: string[] = [];
  const proposals: string[] = [];

  // Rule 1: duplicated skill invocations suggest the chain re-enters a skill
  // when it shouldn't. Append to knowledge for human review.
  const duplicates = findDuplicates(report.metrics.skill_chain);
  if (duplicates.length > 0) {
    appendKnowledge(
      `run ${report.session_id} re-invoked skills: ${duplicates.join(", ")}. ` +
        "Consider moving to oneOf in skill-chains.json or splitting the skill."
    );
    autoApplied.push(`Logged re-invocation pattern: ${duplicates.join(", ")}`);
  }

  // Rule 2: compaction-heavy runs imply chain too long for one context window.
  if (report.metrics.compactions >= 2) {
    proposals.push(
      `Session compacted ${report.metrics.compactions}x — chain too long for one window. ` +
        "Consider splitting website-end-to-end flow across two panes with a handoff."
    );
  }

  // Rule 3: skill-heavy code-light = planning loop. Hot signal.
  if (
    report.metrics.skill_invocations > 0 &&
    report.metrics.edits + report.metrics.writes === 0
  ) {
    proposals.push(
      "Agent invoked skills but produced no code. Suggest tightening skill prompts to emit" +
        " concrete file writes, not plan MDs."
    );
  }

  // File risky proposals as GitHub issues (best-effort — don't block if gh fails)
  for (const proposal of proposals) {
    fileIssue(report, proposal);
  }

  markProcessed(report.session_id);

  if (autoApplied.length || proposals.length) {
    console.log(
      info(
        `  ${autoApplied.length} auto-applied, ${proposals.length} proposals filed`
      )
    );
  } else if (report.verdict === "clean") {
    console.log(muted("  No learnings — clean run."));
  }
}

function alreadyProcessed(sessionId: string): boolean {
  if (!existsSync(PROCESSED_LOG)) return false;
  try {
    return readFileSync(PROCESSED_LOG, "utf-8").includes(sessionId);
  } catch {
    return false;
  }
}

function markProcessed(sessionId: string): void {
  const line = `${new Date().toISOString()} ${sessionId}\n`;
  try {
    const existing = existsSync(PROCESSED_LOG)
      ? readFileSync(PROCESSED_LOG, "utf-8")
      : "";
    writeFileSync(PROCESSED_LOG, existing + line);
  } catch {}
}

function appendKnowledge(note: string): void {
  const path = join(LEARNINGS_DIR, "knowledge.md");
  const stamp = new Date().toISOString();
  const line = `- [${stamp}] ${note}\n`;
  try {
    const existing = existsSync(path) ? readFileSync(path, "utf-8") : "# Harness learnings\n\n";
    writeFileSync(path, existing + line);
  } catch {}
}

function fileIssue(report: ReviewReport, proposal: string): void {
  const title = `[auto] Learnings from ${report.agent} run ${report.session_id.slice(0, 8)}`;
  const body = [
    `Detected during review of session \`${report.session_id}\``,
    "",
    `**Verdict:** ${report.verdict}`,
    `**Agent:** ${report.agent}`,
    `**Findings:** ${report.findings.length}`,
    "",
    "## Proposed change",
    proposal,
    "",
    "## Metrics",
    "```json",
    JSON.stringify(report.metrics, null, 2),
    "```",
  ].join("\n");
  try {
    execSync(
      `gh issue create --title ${JSON.stringify(title)} --body ${JSON.stringify(body)} --label auto-learning`,
      { stdio: "pipe", timeout: 30_000 }
    );
  } catch {
    // gh missing or repo not configured — log instead
    appendKnowledge(`PROPOSAL (filing failed): ${proposal}`);
  }
}

function findDuplicates(arr: string[]): string[] {
  const count = new Map<string, number>();
  for (const x of arr) count.set(x, (count.get(x) || 0) + 1);
  return [...count.entries()].filter(([, n]) => n > 1).map(([x]) => x);
}
