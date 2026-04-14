/**
 * harness agent — manage and interact with agents.
 *
 * Subcommands:
 *   list              — all agents with model, level, status, current task
 *   spawn <name> <prompt> — spawn interactive claude session with full agent config
 *   kill <name>       — kill agent pane
 *   logs <name>       — read recent output from agent's tmux pane
 */

import { loadAgents } from "../lib/config.js";
import { loadState, recordAgentActivity } from "../lib/state.js";
import { generateAgentPrompt } from "../lib/agent-loader.js";
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
import { ROOT_DIR, AGENTS_DIR } from "../lib/constants.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

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
      console.log("    harness agent spawn <name> <prompt>   — spawn agent session");
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

function spawnAgent(args: string[]): void {
  const name = args[0];
  if (!name) {
    console.log(error("  Usage: harness agent spawn <name> <prompt>"));
    return;
  }

  if (!isTmuxAvailable()) {
    console.log(error("  tmux is not installed. Install it with: brew install tmux"));
    return;
  }

  const prompt = args.slice(1).join(" ");
  const agents = loadAgents();
  const agent = agents.find((a) => a.name === name);

  if (!agent) {
    console.log(error(`  Agent '${name}' not found.`));
    console.log(muted(`  Available: ${agents.map((a) => a.name).join(", ")}`));
    return;
  }

  // Build the full system prompt from the agent's .md file
  const agentFile = join(AGENTS_DIR, `${name}.md`);
  let systemPrompt = "";
  if (existsSync(agentFile)) {
    const content = readFileSync(agentFile, "utf-8");
    // Extract body after frontmatter
    const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    systemPrompt = match ? match[1].trim() : content;
  }

  // Generate agent prompt with ground truth + skills as /startup-harness: slash commands
  const agentPrompt = generateAgentPrompt(name);

  ensureSession();

  // Build claude command with full permissions bypass (lfg alias unavailable in tmux)
  const cmdParts = [
    "claude",
    "--dangerously-skip-permissions",
    "--model", agent.model,
  ];

  // Combine agent .md body + generated prompt (ground truth + skills)
  const systemParts = [systemPrompt, agentPrompt].filter(Boolean).join("\n\n");

  if (systemParts) {
    cmdParts.push("--append-system-prompt", systemParts);
  }

  // Step 1: Spawn Claude Code in a new tmux window (no prompt yet)
  const fullCmd = `cd ${ROOT_DIR} && ${cmdParts.join(" ")}`;
  const spawned = spawnPane(name, fullCmd);

  if (!spawned) {
    console.log(error(`  Failed to spawn ${name}.`));
    return;
  }

  console.log(success(`  Spawned ${name} (${agent.model}) in tmux pane.`));

  // Step 2: If there's a task prompt, wait for load then send it
  if (prompt) {
    console.log(muted(`  Waiting for Claude Code to load...`));
    const ready = waitForReady(name, 30000);

    if (!ready) {
      console.log(warn(`  Claude Code may not have fully loaded. Sending prompt anyway.`));
    }

    // Step 3: Send the task prompt (text + Enter are separate inside sendKeys)
    const sent = sendKeys(name, prompt);

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
      console.log(warn(`  ${name} may not have started. Check: tmux attach -t harness:${name}`));
    }
  }

  recordAgentActivity(name, { status: "running", currentTask: prompt || "interactive session" });
  console.log(muted(`  Attach: tmux attach -t harness:${name}`));
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
