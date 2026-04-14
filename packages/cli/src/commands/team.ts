/**
 * harness team — coordinated multi-agent operations.
 *
 * Subcommands:
 *   start <n> <prompt> — spawn n agents coordinated on a shared task
 *   status             — show all team members, tasks, progress
 *   stop               — graceful shutdown of all team members
 */

import { loadAgents } from "../lib/config.js";
import { loadState, recordAgentActivity } from "../lib/state.js";
import {
  listPanes,
  spawnPane,
  killPane,
  ensureSession,
  killSession,
  isTmuxAvailable,
} from "../lib/tmux.js";
import {
  heading,
  table,
  statusDot,
  success,
  error,
  warn,
  muted,
  count,
} from "../lib/format.js";
import { ROOT_DIR } from "../lib/constants.js";

export function run(args: string[]): void {
  const sub = args[0];
  switch (sub) {
    case "start":
      return teamStart(args.slice(1));
    case "status":
      return teamStatus();
    case "stop":
      return teamStop();
    default:
      console.log(heading("harness team"));
      console.log("  Usage:");
      console.log("    harness team start <n> <prompt>  — spawn n coordinated agents");
      console.log("    harness team status              — show team status");
      console.log("    harness team stop                — stop all team members");
      console.log();
  }
}

function teamStart(args: string[]): void {
  const n = parseInt(args[0] ?? "0", 10);
  if (n < 1 || n > 10) {
    console.log(error("  Specify 1-10 agents: harness team start <n> <prompt>"));
    return;
  }

  if (!isTmuxAvailable()) {
    console.log(error("  tmux is not installed."));
    return;
  }

  const prompt = args.slice(1).join(" ");
  if (!prompt) {
    console.log(error("  Provide a task prompt: harness team start 3 \"build the auth flow\""));
    return;
  }

  const agents = loadAgents();
  // Pick the best n agents for this task (use level 2 specialists, skip commander)
  const specialists = agents
    .filter((a) => a.level >= 2)
    .slice(0, n);

  if (specialists.length === 0) {
    console.log(error("  No specialist agents available."));
    return;
  }

  const actualN = Math.min(n, specialists.length);
  console.log(heading(`harness team start (${actualN} agents)`));
  console.log(`  Task: ${prompt}`);
  console.log();

  ensureSession();

  let spawned = 0;
  for (let i = 0; i < actualN; i++) {
    const agent = specialists[i];
    const teamPrompt = [
      `You are agent ${i + 1}/${actualN} in a coordinated team.`,
      `Your role: ${agent.name} (${agent.description}).`,
      `Shared task: ${prompt}`,
      `Coordinate via GitHub Issues. Tag your work with [team:${agent.name}].`,
      `Other team members: ${specialists.filter((_, j) => j !== i).map((a) => a.name).join(", ")}.`,
      "Do not duplicate work. Check Issues before starting any task.",
    ].join(" ");

    const cmd = [
      "claude",
      "--model", agent.model,
      "--dangerously-skip-permissions",
      "--append-system-prompt", `"${teamPrompt.replace(/"/g, '\\"')}"`,
    ].join(" ");

    const name = `team-${agent.name}`;
    if (spawnPane(name, `cd ${ROOT_DIR} && ${cmd}`)) {
      recordAgentActivity(agent.name, {
        status: "running",
        currentTask: `[team] ${prompt.slice(0, 80)}`,
      });
      console.log(success(`  ${statusDot("running")} ${agent.name} spawned as ${name}`));
      spawned++;
    } else {
      console.log(error(`  Failed to spawn ${agent.name}`));
    }
  }

  console.log();
  console.log(`  ${count(spawned, "agent")} started. View with: harness team status`);
}

function teamStatus(): void {
  console.log(heading("harness team status"));

  if (!isTmuxAvailable()) {
    console.log(muted("  tmux not available."));
    return;
  }

  const panes = listPanes().filter((p) => p.name.startsWith("team-"));

  if (panes.length === 0) {
    console.log(muted("  No team members running."));
    return;
  }

  const rows = panes.map((p) => [
    `${statusDot(p.active ? "running" : "idle")} ${p.name}`,
    p.active ? "running" : "idle",
    `pid:${p.pid}`,
  ]);

  console.log(table(rows, ["Agent", "Status", "PID"]));
  console.log();
  console.log(muted(`  ${count(panes.length, "team member")} active.`));
}

function teamStop(): void {
  console.log(heading("harness team stop"));

  if (!isTmuxAvailable()) {
    console.log(muted("  tmux not available."));
    return;
  }

  const panes = listPanes().filter((p) => p.name.startsWith("team-"));

  if (panes.length === 0) {
    console.log(muted("  No team members to stop."));
    return;
  }

  let killed = 0;
  for (const pane of panes) {
    if (killPane(pane.name)) {
      const agentName = pane.name.replace("team-", "");
      recordAgentActivity(agentName, { status: "idle", currentTask: null });
      console.log(success(`  Stopped ${pane.name}`));
      killed++;
    } else {
      console.log(error(`  Failed to stop ${pane.name}`));
    }
  }

  console.log();
  console.log(`  ${count(killed, "agent")} stopped.`);
}
