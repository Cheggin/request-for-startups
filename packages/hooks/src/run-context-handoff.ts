#!/usr/bin/env bun
/**
 * Context handoff hook — runs on Stop events to write handoff state.
 * Ensures agent progress is preserved when context resets or sessions end.
 *
 * Fixes #17: agents now write structured handoff documents.
 *
 * Hook type: PostStop
 * Reads: current agent name from HARNESS_AGENT env var
 * Writes: .harness/handoffs/{agent}-{timestamp}.md
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const HARNESS_DIR = join(process.cwd(), ".harness");
const HANDOFFS_DIR = join(HARNESS_DIR, "handoffs");

function getAgentName(): string {
  // Try env var first (set when spawning agents)
  if (process.env.HARNESS_AGENT) return process.env.HARNESS_AGENT;

  // Try to detect from tmux window name
  try {
    const windowName = execSync("tmux display-message -p '#{window_name}' 2>/dev/null", {
      encoding: "utf-8",
      timeout: 3000,
    }).trim();
    if (windowName) return windowName;
  } catch {}

  return "unknown";
}

function getRecentGitActivity(): string {
  try {
    return execSync("git log --oneline -5 2>/dev/null", { encoding: "utf-8", timeout: 5000 }).trim();
  } catch {
    return "no recent commits";
  }
}

function getOpenIssues(): string {
  try {
    return execSync("gh issue list --state open --limit 10 --json number,title -q '.[] | \"#\\(.number): \\(.title)\"' 2>/dev/null", {
      encoding: "utf-8",
      timeout: 10000,
    }).trim();
  } catch {
    return "could not fetch issues";
  }
}

function getModifiedFiles(): string {
  try {
    return execSync("git diff --name-only HEAD 2>/dev/null", { encoding: "utf-8", timeout: 5000 }).trim();
  } catch {
    return "no modified files";
  }
}

try {
  const agent = getAgentName();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  mkdirSync(HANDOFFS_DIR, { recursive: true });

  const handoff = `# Handoff: ${agent} @ ${new Date().toISOString()}

## Objective
Agent: ${agent}
Working directory: ${process.cwd()}

## Completed
### Recent commits
${getRecentGitActivity()}

### Modified files (uncommitted)
${getModifiedFiles() || "none"}

## In Progress
### Open issues
${getOpenIssues() || "none"}

## Next Steps
Resume by reading this handoff and the open GitHub Issues above.
Check .harness/state.json for current phase.
Check tmux panes for other running agents.
`;

  const filePath = join(HANDOFFS_DIR, `${agent}-${timestamp}.md`);
  writeFileSync(filePath, handoff);
  console.log(`[Handoff] Written to ${filePath}`);
} catch (e) {
  // Never block session exit on handoff failure
  console.error(`[Handoff] Failed: ${e}`);
}
