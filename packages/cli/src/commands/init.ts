/**
 * harness init — run the full startup-init flow.
 *
 * Phases: onboarding -> research -> spec -> design -> build -> deploy -> grow
 *
 * Each phase spawns the appropriate agent(s) with full config:
 * system prompt, skills, hooks, --dangerously-skip-permissions.
 */

import { loadState, updateState } from "../lib/state.js";
import { loadAgents } from "../lib/config.js";
import { heading, phaseLabel, success, warn, error, muted } from "../lib/format.js";
import { STARTUP_PHASES, ROOT_DIR } from "../lib/constants.js";
import { spawnPane, ensureSession, isTmuxAvailable } from "../lib/tmux.js";

export function run(args: string[]): void {
  console.log(heading("harness init"));

  if (!isTmuxAvailable()) {
    console.log(error("tmux is not installed. Install it with: brew install tmux"));
    process.exit(1);
  }

  const state = loadState();
  const agents = loadAgents();

  if (agents.length === 0) {
    console.log(error("No agent definitions found in agents/ directory."));
    process.exit(1);
  }

  // Check if already initialized
  if (state.phase !== "onboarding" && !args.includes("--force")) {
    console.log(
      warn(`Harness already initialized at phase: ${state.phase}`)
    );
    console.log(muted("Use --force to reinitialize, or 'harness resume' to continue."));
    return;
  }

  console.log(`  Found ${agents.length} agents: ${agents.map((a) => a.name).join(", ")}`);
  console.log();

  // Show the phase roadmap
  console.log("  Phase roadmap:");
  for (const phase of STARTUP_PHASES) {
    const isCurrent = phase === "onboarding";
    const marker = isCurrent ? " <-- starting here" : "";
    console.log(`    ${phaseLabel(phase)}${marker}`);
  }
  console.log();

  // Initialize state
  updateState({
    phase: "onboarding",
    meta: { startedBy: "harness init", startedAt: new Date().toISOString() },
  });

  // Spawn the commander agent to orchestrate the init flow
  const commander = agents.find((a) => a.name === "commander" || a.level === 1);
  if (!commander) {
    console.log(warn("No commander agent found. Spawning with default config."));
  }

  const agentName = commander?.name ?? "commander";
  const model = commander?.model ?? "claude-sonnet-4-6";

  ensureSession();

  const prompt = [
    "You are the startup harness commander. Run the full startup-init flow.",
    "Current phase: onboarding.",
    `Phases: ${STARTUP_PHASES.join(" -> ")}`,
    "Read .harness/stacks.yml for tech stack config.",
    "Read .harness/agent-categories.yml for agent roles.",
    "Coordinate agents to build this startup from scratch.",
    "Start with onboarding: validate services, set up repo, configure tools.",
  ].join(" ");

  const cmd = [
    "claude",
    "--model", model,
    "--dangerously-skip-permissions",
    "--append-system-prompt", `"${prompt}"`,
  ].join(" ");

  const spawned = spawnPane(agentName, `cd ${ROOT_DIR} && ${cmd}`);

  if (spawned) {
    console.log(success(`  Started ${agentName} agent in tmux pane.`));
    console.log(muted(`  Attach with: tmux attach -t harness:${agentName}`));
  } else {
    console.log(error(`  Failed to spawn ${agentName} agent.`));
    process.exit(1);
  }
}
