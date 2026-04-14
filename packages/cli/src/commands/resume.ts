/**
 * harness resume — resume from where we left off.
 *
 * Reads .harness/state.json for current phase + GitHub Issues for task state.
 * Spawns the commander agent with context about what's been done and what's next.
 */

import { loadState } from "../lib/state.js";
import { loadAgents } from "../lib/config.js";
import { heading, phaseLabel, success, warn, error, muted, timeAgo } from "../lib/format.js";
import { ROOT_DIR } from "../lib/constants.js";
import { spawnPane, ensureSession, isTmuxAvailable } from "../lib/tmux.js";

export function run(args: string[]): void {
  console.log(heading("harness resume"));

  if (!isTmuxAvailable()) {
    console.log(error("tmux is not installed. Install it with: brew install tmux"));
    process.exit(1);
  }

  const state = loadState();
  const agents = loadAgents();

  console.log(`  Current phase: ${phaseLabel(state.phase)}`);
  console.log(`  Last activity: ${timeAgo(state.lastActivityAt)}`);
  console.log(`  Features: ${state.features.length} tracked`);
  console.log(`  Completed loops: ${state.completedLoops}`);
  console.log();

  // Build context for the commander
  const featureSummary = state.features
    .map((f) => `  - ${f.name}: ${f.status}${f.assignee ? ` (${f.assignee})` : ""}`)
    .join("\n");

  const agentSummary = state.agents
    .map((a) => `  - ${a.name}: ${a.status}${a.currentTask ? ` — ${a.currentTask}` : ""}`)
    .join("\n");

  const commander = agents.find((a) => a.name === "commander" || a.level === 1);
  const agentName = commander?.name ?? "commander";
  const model = commander?.model ?? "claude-sonnet-4-6";

  ensureSession();

  const prompt = [
    "You are the startup harness commander. Resume work from where we left off.",
    `Current phase: ${state.phase}.`,
    `Last activity: ${state.lastActivityAt}.`,
    state.features.length > 0 ? `Features:\n${featureSummary}` : "No features tracked yet.",
    state.agents.length > 0 ? `Agent history:\n${agentSummary}` : "",
    "Read GitHub Issues for current task state.",
    "Read .harness/state.json for full context.",
    "Continue from the current phase. Do not restart completed work.",
  ].filter(Boolean).join(" ");

  const cmd = [
    "claude",
    "--model", model,
    "--dangerously-skip-permissions",
    "--append-system-prompt", `"${prompt}"`,
  ].join(" ");

  const spawned = spawnPane(agentName, `cd ${ROOT_DIR} && ${cmd}`);

  if (spawned) {
    console.log(success(`  Resumed ${agentName} agent in tmux pane.`));
    console.log(muted(`  Attach with: tmux attach -t harness:${agentName}`));
  } else {
    console.log(error(`  Failed to spawn ${agentName} agent.`));
    process.exit(1);
  }
}
