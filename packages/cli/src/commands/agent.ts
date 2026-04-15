/**
 * harness agent — manage and interact with agents.
 *
 * Subcommands:
 *   list              — all agents with model, level, status, current task
 *   spawn <name> [--runtime <runtime>] [prompt] — spawn interactive agent session
 *   kill <name>       — kill agent pane
 *   logs <name>       — read recent output from agent's tmux pane
 */

import { loadAgents } from "../lib/config.js";
import { loadState, recordAgentActivity } from "../lib/state.js";
import { buildAgentSystemPrompt } from "../lib/claude.js";
import {
  buildRuntimeLaunchCommand,
  buildSessionBootstrapPrompt,
  getSupportedRuntimes,
  isAgentRuntime,
  resolveAgentRuntime,
} from "../lib/runtime.js";
import {
  listPanes,
  spawnPane,
  killPane,
  capturePaneOutput,
  paneExists,
  isTmuxAvailable,
  ensureSession,
  sendKeys,
  waitForReady,
  verifyRunning,
  getTmuxSessionName,
} from "../lib/tmux.js";
import {
  heading,
  subheading,
  table,
  statusDot,
  success,
  error,
  warn,
  muted,
  info,
} from "../lib/format.js";
import { ROOT_DIR } from "../lib/constants.js";

// ─── Subcommand Routing ─────────────────────────────────────────────────────

export function run(args: string[]): void {
  const sub = args[0];
  switch (sub) {
    case "list":
      return listAgents();
    case "spawn":
      return spawnAgent(args.slice(1));
    case "kill":
      return killAgent(args.slice(1));
    case "logs":
      return agentLogs(args.slice(1));
    default:
      console.log(heading("harness agent"));
      console.log("  Usage:");
      console.log("    harness agent list                    — list all agents");
      console.log("    harness agent spawn <name> [--runtime <runtime>] [prompt] — spawn agent session");
      console.log("    harness agent kill <name>             — kill agent pane");
      console.log("    harness agent logs <name>             — read agent output");
      console.log();
  }
}

// ─── list ───────────────────────────────────────────────────────────────────

function listAgents(): void {
  console.log(heading("harness agent list"));

  const agents = loadAgents();
  const state = loadState();
  const panes = isTmuxAvailable() ? listPanes() : [];

  if (agents.length === 0) {
    console.log(muted("  No agent definitions found in agents/ directory."));
    return;
  }

  const rows = agents.map((a) => {
    const pane = panes.find((p) => p.name === a.name);
    const stateAgent = state.agents.find((sa) => sa.name === a.name);
    const status = pane ? (pane.active ? "running" : "idle") : "idle";
    const task = stateAgent?.currentTask ?? "-";

    return [
      `${statusDot(status)} ${a.name}`,
      a.model,
      `L${a.level}`,
      status,
      task.length > 50 ? task.slice(0, 47) + "..." : task,
    ];
  });

  console.log(table(rows, ["Agent", "Model", "Level", "Status", "Current Task"]));
  console.log();
}

// ─── spawn ──────────────────────────────────────────────────────────────────

function extractRuntimeFlag(args: string[]): {
  runtime: string | null;
  remainingArgs: string[];
  errorMessage: string | null;
} {
  const remainingArgs = [...args];
  const flagIndex = remainingArgs.indexOf("--runtime");
  if (flagIndex === -1) {
    return { runtime: null, remainingArgs, errorMessage: null };
  }

  const runtime = remainingArgs[flagIndex + 1];
  if (!runtime) {
    return {
      runtime: null,
      remainingArgs: [],
      errorMessage: "  Missing value for --runtime. Supported: claude, codex, gemini",
    };
  }

  remainingArgs.splice(flagIndex, 2);
  return { runtime, remainingArgs, errorMessage: null };
}

function spawnAgent(args: string[]): void {
  const name = args[0];
  if (!name) {
    console.log(error("  Usage: harness agent spawn <name> [--runtime <runtime>] [prompt]"));
    return;
  }

  if (!isTmuxAvailable()) {
    console.log(error("  tmux is not installed. Install it with: brew install tmux"));
    return;
  }

  const { runtime: runtimeOverride, remainingArgs, errorMessage } = extractRuntimeFlag(args.slice(1));
  if (errorMessage) {
    console.log(error(errorMessage));
    return;
  }
  if (runtimeOverride && !isAgentRuntime(runtimeOverride)) {
    console.log(
      error(
        `  Unsupported runtime '${runtimeOverride}'. Supported: ${getSupportedRuntimes().join(", ")}`
      )
    );
    return;
  }

  const prompt = remainingArgs.join(" ");
  const agents = loadAgents();
  const agent = agents.find((a) => a.name === name);

  if (!agent) {
    console.log(error(`  Agent '${name}' not found.`));
    console.log(muted(`  Available: ${agents.map((a) => a.name).join(", ")}`));
    return;
  }

  ensureSession();
  const runtime = resolveAgentRuntime(name, { override: runtimeOverride });
  const systemPrompt = buildAgentSystemPrompt(name);
  const launchCommand = buildRuntimeLaunchCommand(runtime, {
    model: agent.model,
    systemPrompt: runtime === "claude" ? systemPrompt : null,
  });

  // Step 1: Spawn the runtime in a new tmux window
  const spawned = spawnPane(name, `cd "${ROOT_DIR}" && ${launchCommand}`);

  if (!spawned) {
    console.log(error(`  Failed to spawn ${name}.`));
    return;
  }

  console.log(success(`  Spawned ${name} (${runtime}) in tmux pane.`));

  const initialPrompt = buildSessionBootstrapPrompt(runtime, {
    systemPrompt: runtime === "claude" ? null : systemPrompt,
    taskPrompt: prompt,
  });

  // Step 2: If there's a bootstrap/task prompt, wait for load then send it
  if (initialPrompt) {
    console.log(muted(`  Waiting for ${runtime} to load...`));
    const ready = waitForReady(name, 30000);

    if (!ready) {
      console.log(warn(`  ${runtime} may not have fully loaded. Sending prompt anyway.`));
    }

    // Step 3: Send the bootstrap/task prompt (text + Enter are separate inside sendKeys)
    const sent = sendKeys(name, initialPrompt);

    if (!sent) {
      console.log(error(`  Failed to send prompt to ${name}.`));
      return;
    }

    // Step 4: Verify the agent started working
    console.log(muted(`  Verifying agent activity...`));
    const running = verifyRunning(name);

    if (running) {
      console.log(success(`  ${name} is working on task.`));
    } else {
      console.log(warn(`  ${name} may not have started. Check: tmux attach -t ${getTmuxSessionName()}:${name}`));
    }
  }

  recordAgentActivity(name, {
    status: "running",
    currentTask: prompt || `${runtime} interactive session`,
  });
  console.log(muted(`  Attach: tmux attach -t ${getTmuxSessionName()}:${name}`));
}

// ─── kill ───────────────────────────────────────────────────────────────────

function killAgent(args: string[]): void {
  const name = args[0];
  if (!name) {
    console.log(error("  Usage: harness agent kill <name>"));
    return;
  }

  if (!isTmuxAvailable()) {
    console.log(error("  tmux not available."));
    return;
  }

  if (!paneExists(name)) {
    console.log(warn(`  No running pane for '${name}'.`));
    return;
  }

  const killed = killPane(name);
  if (killed) {
    recordAgentActivity(name, { status: "idle", currentTask: null });
    console.log(success(`  Killed ${name} pane.`));
  } else {
    console.log(error(`  Failed to kill ${name} pane.`));
  }
}

// ─── logs ───────────────────────────────────────────────────────────────────

function agentLogs(args: string[]): void {
  const name = args[0];
  if (!name) {
    console.log(error("  Usage: harness agent logs <name>"));
    return;
  }

  if (!isTmuxAvailable()) {
    console.log(error("  tmux not available."));
    return;
  }

  if (!paneExists(name)) {
    console.log(warn(`  No running pane for '${name}'.`));
    return;
  }

  const lines = parseInt(args[1] ?? "100", 10);
  const output = capturePaneOutput(name, lines);

  if (!output) {
    console.log(muted("  No output captured."));
    return;
  }

  console.log(heading(`harness agent logs: ${name}`));
  console.log(output);
}
