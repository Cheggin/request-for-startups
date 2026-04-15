/**
 * harness team — coordinated multi-agent operations.
 *
 * Subcommands:
 *   start <n> <prompt> — spawn n agents coordinated on a shared task
 *   grid               — create the shared 2x4 agent grid
 *   status             — show all team members, tasks, progress
 *   stop               — graceful shutdown of all team members
 */

import { loadAgents } from "../lib/config.js";
import { recordAgentActivity } from "../lib/state.js";
import { buildAgentSystemPrompt } from "../lib/claude.js";
import {
  buildRuntimeLaunchCommand,
  buildSessionBootstrapPrompt,
  resolveAgentRuntime,
} from "../lib/runtime.js";
import {
  listPanes,
  spawnPane,
  killPane,
  spawnInPane,
  createGridWindow,
  ensureSession,
  isTmuxAvailable,
  waitForReady,
  sendKeys,
  verifyRunning,
  getTmuxSessionName,
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

const CORE_TEAM_AGENT_ORDER = [
  "researcher",
  "website",
  "backend",
  "writing",
  "growth",
  "ops",
  "slop-cleaner",
  "docs",
];

function pickCoreTeamAgents() {
  const agents = loadAgents();
  const byName = new Map(agents.map((agent) => [agent.name, agent]));
  const selected = CORE_TEAM_AGENT_ORDER
    .map((name) => byName.get(name))
    .filter((agent): agent is NonNullable<typeof agent> => !!agent);

  if (selected.length >= 8) {
    return selected.slice(0, 8);
  }

  const seen = new Set(selected.map((agent) => agent.name));
  for (const agent of agents) {
    if (seen.has(agent.name) || agent.name === "commander") {
      continue;
    }
    selected.push(agent);
    if (selected.length === 8) {
      break;
    }
  }

  return selected;
}

function buildGridPrompt(agentName: string, description: string): string {
  return [
    `You are ${agentName} in the shared tmux agent grid.`,
    `Role: ${description}.`,
    "Respond with READY plus a one-line summary of what you own.",
    "Then wait for explicit work assignment from the operator or commander.",
    "Do not start autonomous changes until you are dispatched.",
  ].join(" ");
}

export function run(args: string[]): void {
  const sub = args[0];
  switch (sub) {
    case "start":
      return teamStart(args.slice(1));
    case "grid":
      return teamGrid();
    case "status":
      return teamStatus();
    case "stop":
      return teamStop();
    default:
      console.log(heading("harness team"));
      console.log("  Usage:");
      console.log("    harness team start <n> <prompt>  — spawn n coordinated agents");
      console.log("    harness team grid                — create the shared 2x4 agent grid");
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

    const name = `team-${agent.name}`;
    const runtime = resolveAgentRuntime(agent.name);
    const systemPrompt = buildAgentSystemPrompt(agent.name, teamPrompt);
    const started = spawnPane(
      name,
      `cd "${ROOT_DIR}" && ${buildRuntimeLaunchCommand(runtime, {
        model: agent.model,
        systemPrompt: runtime === "claude" ? systemPrompt : null,
      })}`
    );

    if (started) {
      const bootstrapPrompt = buildSessionBootstrapPrompt(runtime, {
        systemPrompt: runtime === "claude" ? null : systemPrompt,
      });
      if (bootstrapPrompt) {
        waitForReady(name, 30000);
        sendKeys(name, bootstrapPrompt);
      }

      recordAgentActivity(agent.name, {
        status: "running",
        currentTask: `[team] ${prompt.slice(0, 80)}`,
      });
      console.log(success(`  ${statusDot("running")} ${agent.name} (${runtime}) spawned as ${name}`));
      spawned++;
    } else {
      console.log(error(`  Failed to spawn ${agent.name}`));
    }
  }

  console.log();
  console.log(`  ${count(spawned, "agent")} started. View with: harness team status`);
}

function teamGrid(): void {
  console.log(heading("harness team grid"));

  if (!isTmuxAvailable()) {
    console.log(error("  tmux is not installed."));
    return;
  }

  const agents = pickCoreTeamAgents();
  if (agents.length < 8) {
    console.log(error("  Need at least 8 agent definitions to create the 2x4 grid."));
    return;
  }

  const panes = createGridWindow(
    "agents",
    agents.map((agent) => agent.name)
  );

  if (panes.length !== 8) {
    console.log(error("  Failed to create the tmux agents grid."));
    return;
  }

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const pane = panes[i];
    const runtime = resolveAgentRuntime(agent.name);
    const systemPrompt = buildAgentSystemPrompt(agent.name);
    const started = spawnInPane(
      pane.paneId,
      `cd "${ROOT_DIR}" && ${buildRuntimeLaunchCommand(runtime, {
        model: agent.model,
        systemPrompt: runtime === "claude" ? systemPrompt : null,
      })}`
    );

    if (!started) {
      console.log(error(`  Failed to launch ${agent.name} in ${pane.paneId}.`));
      continue;
    }

    console.log(success(`  ${agent.name} (${runtime}) -> ${pane.paneId}`));
  }

  console.log(muted("  Waiting for runtimes to load in each pane..."));
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const pane = panes[i];
    const runtime = resolveAgentRuntime(agent.name);
    const systemPrompt = buildAgentSystemPrompt(agent.name);
    const ready = waitForReady(pane.paneId, 30000);
    if (!ready) {
      console.log(warn(`  ${agent.name} timed out waiting for ${runtime}. Sending prompt anyway.`));
    }

    const sent = sendKeys(
      pane.paneId,
      buildSessionBootstrapPrompt(runtime, {
        systemPrompt: runtime === "claude" ? null : systemPrompt,
        taskPrompt: buildGridPrompt(agent.name, agent.description),
      }) ?? buildGridPrompt(agent.name, agent.description)
    );
    if (!sent) {
      console.log(error(`  Failed to send the ready prompt to ${agent.name}.`));
      continue;
    }

    const running = verifyRunning(pane.paneId, 1500);
    if (!running) {
      console.log(warn(`  ${agent.name} may not have started cleanly in ${pane.paneId}.`));
    }

    recordAgentActivity(agent.name, {
      status: "running",
      currentTask: "[grid] standby in agents window",
    });
  }

  console.log();
  console.log(muted(`  Attach: tmux attach -t ${getTmuxSessionName()}:agents`));
}

function teamStatus(): void {
  console.log(heading("harness team status"));

  if (!isTmuxAvailable()) {
    console.log(muted("  tmux not available."));
    return;
  }

  const panes = listPanes().filter(
    (pane) => pane.name.startsWith("team-") || pane.windowName === "agents"
  );

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

  const panes = listPanes().filter((pane) => pane.name.startsWith("team-"));
  const gridPanes = listPanes().filter((pane) => pane.windowName === "agents");

  if (panes.length === 0 && gridPanes.length === 0) {
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

  if (gridPanes.length > 0 && killPane("agents")) {
    for (const pane of gridPanes) {
      recordAgentActivity(pane.name, { status: "idle", currentTask: null });
    }
    console.log(success("  Stopped shared agents grid."));
    killed += gridPanes.length;
  }

  console.log();
  console.log(`  ${count(killed, "agent")} stopped.`);
}
