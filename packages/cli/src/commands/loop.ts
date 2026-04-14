/**
 * harness loop — manage persistent agent loops.
 *
 * Subcommands:
 *   list              — all defined loops with status
 *   start <name>      — spawn a loop in a tmux pane
 *   stop <name>       — kill a loop's tmux pane
 *   start-all         — spawn all loops
 *   stop-all          — kill all loop panes
 */

import { readFileSync, existsSync } from "fs";
import { parse as parseYaml } from "yaml";
import { LOOPS_FILE, ROOT_DIR } from "../lib/constants.js";
import { generateAgentPrompt } from "../lib/agent-loader.js";
import {
  listPanes,
  spawnPane,
  killPane,
  paneExists,
  isTmuxAvailable,
  ensureSession,
  sendKeys,
  sleepSync,
  waitForReady,
  verifyRunning,
} from "../lib/tmux.js";
import {
  heading,
  table,
  statusDot,
  success,
  error,
  warn,
  muted,
} from "../lib/format.js";

// ─── Types ─────────────────────────────────────────────────────────────────

interface LoopDef {
  agent: string;
  loop_type: string;
  description: string;
  interval: string;
  skill: string;
  creates_issues?: boolean;
  dispatches_agents?: boolean;
  scope?: string[];
  prompt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function loadLoops(): Record<string, LoopDef> {
  if (!existsSync(LOOPS_FILE)) {
    return {};
  }
  const raw = readFileSync(LOOPS_FILE, "utf-8");
  return parseYaml(raw) ?? {};
}

/** Seconds to wait for Claude Code to fully load (plugins, MCP, etc.) */
const CLAUDE_LOAD_WAIT_SECONDS = 15;

/**
 * Build the /loop prompt from the loop definition.
 * This is what gets typed into the Claude Code session after it loads.
 */
function buildLoopPrompt(name: string, loop: LoopDef): string {
  // Inject the agent's full skill manifest so the loop knows its available skills
  const agentSkills = generateAgentPrompt(loop.agent);

  const lines = [
    loop.prompt.trim(),
    "",
    `You are the ${name} loop (agent: ${loop.agent}, type: ${loop.loop_type}).`,
    `Primary skill: /startup-harness:${loop.skill.replace("startup-harness:", "")}`,
    loop.creates_issues
      ? "Create GitHub Issues following .harness/issue-schema.md for all findings."
      : "",
    loop.scope ? `Scope: ${loop.scope.join(", ")}` : "",
    "NEVER STOP. Run continuously until manually interrupted.",
    "On context reset: commit all work, write state to GitHub Issues, restart.",
    "",
    agentSkills,
  ];

  return lines.filter(Boolean).join(" ");
}

// ─── Subcommand Routing ────────────────────────────────────────────────────

export function run(args: string[]): void {
  const sub = args[0];
  switch (sub) {
    case "list":
      return listLoops();
    case "start":
      return startLoop(args[1]);
    case "stop":
      return stopLoop(args[1]);
    case "start-all":
      return startAll();
    case "stop-all":
      return stopAll();
    default:
      console.log(heading("harness loop"));
      console.log("  Usage:");
      console.log("    harness loop list                — list all loops");
      console.log("    harness loop start <name>        — start a loop");
      console.log("    harness loop stop <name>         — stop a loop");
      console.log("    harness loop start-all           — start all loops");
      console.log("    harness loop stop-all            — stop all loops");
      console.log();
  }
}

// ─── list ──────────────────────────────────────────────────────────────────

function listLoops(): void {
  console.log(heading("harness loop list"));

  const loops = loadLoops();
  const names = Object.keys(loops);

  if (names.length === 0) {
    console.log(muted("  No loops defined in .harness/loops.yml"));
    return;
  }

  const panes = isTmuxAvailable() ? listPanes() : [];

  const rows = names.map((name) => {
    const loop = loops[name];
    const pane = panes.find((p) => p.name === `loop-${name}`);
    const status = pane ? (pane.active ? "running" : "idle") : "stopped";

    return [
      `${statusDot(status)} ${name}`,
      loop.agent,
      loop.interval,
      loop.skill,
      status,
      loop.description.length > 45
        ? loop.description.slice(0, 42) + "..."
        : loop.description,
    ];
  });

  console.log(
    table(rows, ["Loop", "Agent", "Interval", "Skill", "Status", "Description"])
  );
  console.log();
}

// ─── start ─────────────────────────────────────────────────────────────────

function startLoop(name: string | undefined): void {
  if (!name) {
    console.log(error("  Usage: harness loop start <name>"));
    return;
  }

  if (!isTmuxAvailable()) {
    console.log(error("  tmux is not installed. Install with: brew install tmux"));
    return;
  }

  const loops = loadLoops();
  const loop = loops[name];

  if (!loop) {
    console.log(error(`  Loop '${name}' not found in .harness/loops.yml`));
    console.log(muted(`  Available: ${Object.keys(loops).join(", ")}`));
    return;
  }

  ensureSession();

  const paneName = `loop-${name}`;
  const loopPrompt = buildLoopPrompt(name, loop);

  // Step 1: Spawn claude in a new tmux window
  const spawned = spawnPane(paneName, `cd ${ROOT_DIR} && claude --dangerously-skip-permissions --model claude-opus-4-6`);

  if (!spawned) {
    console.log(error(`  Failed to start loop '${name}'.`));
    return;
  }

  console.log(success(`  Started claude for '${name}' (agent: ${loop.agent})`));

  // Step 2: Wait for Claude Code to fully load (plugins, MCP servers, etc.)
  console.log(muted(`  Waiting for Claude Code to load...`));
  const ready = waitForReady(paneName, CLAUDE_LOAD_WAIT_SECONDS * 1000);

  if (!ready) {
    console.log(warn(`  Claude Code may not have fully loaded (timed out after ${CLAUDE_LOAD_WAIT_SECONDS}s). Sending prompt anyway.`));
  }

  // Step 3: Send /loop command (text + Enter are separate calls inside sendKeys)
  const sent = sendKeys(paneName, `/loop ${loop.interval} ${loopPrompt}`);

  if (!sent) {
    console.log(error(`  Failed to send /loop command to '${name}'.`));
    return;
  }

  // Step 4: Verify the agent started working
  console.log(muted(`  Verifying agent activity...`));
  const running = verifyRunning(paneName);

  if (running) {
    console.log(success(`  Loop '${name}' is running.`));
  } else {
    console.log(warn(`  Loop '${name}' may not have started. Check: tmux attach -t harness:${paneName}`));
  }

  console.log(muted(`  Interval: ${loop.interval} | Skill: ${loop.skill}`));
  console.log(muted(`  Attach: tmux attach -t harness:${paneName}`));
}

// ─── stop ──────────────────────────────────────────────────────────────────

function stopLoop(name: string | undefined): void {
  if (!name) {
    console.log(error("  Usage: harness loop stop <name>"));
    return;
  }

  if (!isTmuxAvailable()) {
    console.log(error("  tmux not available."));
    return;
  }

  const paneName = `loop-${name}`;

  if (!paneExists(paneName)) {
    console.log(warn(`  Loop '${name}' is not running.`));
    return;
  }

  const killed = killPane(paneName);
  if (killed) {
    console.log(success(`  Stopped loop '${name}'.`));
  } else {
    console.log(error(`  Failed to stop loop '${name}'.`));
  }
}

// ─── start-all ─────────────────────────────────────────────────────────────

function startAll(): void {
  if (!isTmuxAvailable()) {
    console.log(error("  tmux is not installed."));
    return;
  }

  const loops = loadLoops();
  const names = Object.keys(loops);

  if (names.length === 0) {
    console.log(muted("  No loops defined."));
    return;
  }

  console.log(heading(`Starting ${names.length} loops`));
  ensureSession();

  // Spawn all claude sessions first
  const spawned: string[] = [];
  for (const name of names) {
    const loop = loops[name];
    const paneName = `loop-${name}`;
    const ok = spawnPane(paneName, `cd ${ROOT_DIR} && claude --dangerously-skip-permissions --model claude-opus-4-6`);

    if (ok) {
      spawned.push(name);
      console.log(success(`  ${name} (${loop.agent}) → tmux:${paneName}`));
    } else {
      console.log(error(`  ${name} — failed to start`));
    }
  }

  if (spawned.length === 0) return;

  // Wait for all Claude Code instances to load
  console.log(muted(`  Waiting for Claude Code to load...`));
  for (const name of spawned) {
    const paneName = `loop-${name}`;
    waitForReady(paneName, CLAUDE_LOAD_WAIT_SECONDS * 1000);
  }

  // Send /loop commands to all spawned panes
  for (const name of spawned) {
    const loop = loops[name];
    const paneName = `loop-${name}`;
    const loopPrompt = buildLoopPrompt(name, loop);
    const sent = sendKeys(paneName, `/loop ${loop.interval} ${loopPrompt}`);
    if (sent) {
      console.log(success(`  Sent /loop to ${name}`));
    } else {
      console.log(error(`  Failed to send /loop to ${name}`));
    }
  }

  // Brief pause then verify
  sleepSync(3000);
  for (const name of spawned) {
    const paneName = `loop-${name}`;
    const running = verifyRunning(paneName, 1000);
    if (!running) {
      console.log(warn(`  ${name} may not have started. Check: tmux attach -t harness:${paneName}`));
    }
  }

  console.log();
  console.log(muted("  Attach to any: tmux attach -t harness:loop-<name>"));
}

// ─── stop-all ──────────────────────────────────────────────────────────────

function stopAll(): void {
  if (!isTmuxAvailable()) {
    console.log(error("  tmux not available."));
    return;
  }

  const loops = loadLoops();
  const names = Object.keys(loops);
  let stopped = 0;

  for (const name of names) {
    const paneName = `loop-${name}`;
    if (paneExists(paneName)) {
      killPane(paneName);
      stopped++;
      console.log(success(`  Stopped ${name}`));
    }
  }

  if (stopped === 0) {
    console.log(muted("  No loops were running."));
  } else {
    console.log(success(`  Stopped ${stopped} loops.`));
  }
}
