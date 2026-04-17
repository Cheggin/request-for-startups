#!/usr/bin/env node
/**
 * harness review — third-party reviewer for finished Claude sessions.
 * Standalone plugin script. Call from the skill via:
 *   node ${CLAUDE_PLUGIN_ROOT}/scripts/review.mjs [signal-file|--all-pending]
 *
 * Reads completion signals that the plugin's Stop hook wrote to
 * <project>/.harness/signals/done-*.json, analyses each session's
 * transcript, writes a verdict to .harness/metrics/<id>.json, and
 * appends learnings to .harness/learnings/knowledge.md.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { join, resolve } from "node:path";

const CWD = process.cwd();
const HARNESS = join(CWD, ".harness");
const SIGNALS = join(HARNESS, "signals");
const PROCESSED = join(SIGNALS, "processed");
const METRICS = join(HARNESS, "metrics");
const LEARNINGS = join(HARNESS, "learnings");

function readSignal(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function analyzeTranscript(signal) {
  const metrics = {
    tool_calls: 0,
    skill_invocations: 0,
    skill_chain: [],
    edits: 0,
    writes: 0,
    reads: 0,
    bash_calls: 0,
    compactions: 0,
  };
  const findings = [];

  if (!signal.transcript_path || !existsSync(signal.transcript_path)) {
    findings.push(`Transcript not readable: ${signal.transcript_path}`);
    return buildReport(signal, metrics, findings, "fail");
  }

  const raw = readFileSync(signal.transcript_path, "utf-8");
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    if (entry.type === "summary" || entry.type === "compact") metrics.compactions++;
    if (entry.type !== "assistant") continue;
    const content = entry.message?.content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (!c || c.type !== "tool_use") continue;
      metrics.tool_calls++;
      switch (c.name) {
        case "Skill": {
          metrics.skill_invocations++;
          const s = c.input?.skill;
          if (typeof s === "string") metrics.skill_chain.push(s);
          break;
        }
        case "Edit": metrics.edits++; break;
        case "Write": metrics.writes++; break;
        case "Read": metrics.reads++; break;
        case "Bash": metrics.bash_calls++; break;
      }
    }
  }

  if (metrics.skill_invocations > 0 && metrics.edits + metrics.writes === 0) {
    findings.push("Skill-heavy, code-light: invoked skills but produced no edits/writes. Possible planning loop.");
  }
  if (metrics.compactions >= 1) {
    findings.push(`Context compacted ${metrics.compactions}x — run was longer than one window.`);
  }
  const dupes = findDuplicates(metrics.skill_chain);
  if (dupes.length > 0) {
    findings.push(`Re-invoked skills (possible wasted work): ${dupes.join(", ")}`);
  }
  if (metrics.bash_calls > metrics.tool_calls * 0.5 && metrics.tool_calls > 4) {
    findings.push("Bash-heavy run — check whether work could have used dedicated tools.");
  }

  const verdict = findings.length === 0
    ? "clean"
    : findings.length >= 3 || metrics.compactions >= 2 ? "fail" : "warn";

  return buildReport(signal, metrics, findings, verdict);
}

function buildReport(signal, metrics, findings, verdict) {
  return {
    session_id: signal.session_id,
    agent: signal.agent || "solo",
    ended_at: signal.ended_at,
    reviewed_at: new Date().toISOString(),
    metrics,
    findings,
    verdict,
  };
}

function findDuplicates(arr) {
  const c = new Map();
  for (const x of arr) c.set(x, (c.get(x) || 0) + 1);
  return [...c.entries()].filter(([, n]) => n > 1).map(([x]) => x);
}

function processLearnings(report) {
  mkdirSync(LEARNINGS, { recursive: true });
  const log = join(LEARNINGS, "processed-reports.log");
  const note = join(LEARNINGS, "knowledge.md");

  const existing = existsSync(log) ? readFileSync(log, "utf-8") : "";
  if (existing.includes(report.session_id)) return;

  const lines = [];
  for (const f of report.findings) lines.push(`- [${new Date().toISOString()}] [${report.verdict}] ${report.agent}/${report.session_id.slice(0,8)}: ${f}`);
  if (lines.length > 0) {
    const head = existsSync(note) ? readFileSync(note, "utf-8") : "# Harness learnings\n\n";
    writeFileSync(note, head + lines.join("\n") + "\n");
  }
  writeFileSync(log, existing + `${new Date().toISOString()} ${report.session_id}\n`);
}

function writeReport(report) {
  mkdirSync(METRICS, { recursive: true });
  writeFileSync(join(METRICS, `${report.session_id}.json`), JSON.stringify(report, null, 2));
}

function reviewOne(path) {
  if (!existsSync(path)) {
    console.error(`Signal not found: ${path}`);
    process.exit(1);
  }
  const signal = readSignal(path);
  const report = analyzeTranscript(signal);
  writeReport(report);
  mkdirSync(PROCESSED, { recursive: true });
  renameSync(path, join(PROCESSED, `${signal.session_id}.json`));
  processLearnings(report);

  const badge = report.verdict === "clean" ? "CLEAN" : report.verdict === "warn" ? "WARN" : "FAIL";
  console.log(`[${badge}] ${report.agent} session ${report.session_id.slice(0, 8)} — ${report.metrics.skill_invocations} skills, ${report.metrics.edits + report.metrics.writes} edits, ${report.findings.length} findings`);
}

function reviewAllPending() {
  if (!existsSync(SIGNALS)) {
    console.log("No signals directory.");
    return;
  }
  const files = readdirSync(SIGNALS).filter(f => f.startsWith("done-") && f.endsWith(".json"));
  if (files.length === 0) {
    console.log("No pending signals.");
    return;
  }
  console.log(`Reviewing ${files.length} pending session(s)`);
  for (const f of files) reviewOne(join(SIGNALS, f));
}

const arg = process.argv[2];
if (arg === "--all-pending" || !arg) reviewAllPending();
else reviewOne(resolve(arg));
