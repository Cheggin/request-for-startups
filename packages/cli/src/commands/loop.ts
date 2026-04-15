/**
 * harness loop — manage persistent agent loops.
 *
 * Subcommands:
 *   list              — all defined loops with status
 *   start <name>      — spawn a loop in a tmux pane
 *   grid              — create the shared 2x4 loop grid
 *   stop <name>       — kill a loop's tmux pane
 *   start-all         — spawn all loops
 *   stop-all          — kill all loop panes
 */

import { readFileSync, existsSync } from "fs";
import { parse as parseYaml } from "yaml";
import { LOOPS_FILE, ROOT_DIR } from "../lib/constants.js";
import { generateAgentPrompt } from "../lib/agent-loader.js";
import {
  buildLoopDispatchPrompt,
  buildRuntimeLaunchCommand,
  resolveAgentRuntime,
} from "../lib/runtime.js";
import {
  listPanes,
  spawnPane,
  killPane,
  spawnInPane,
  createGridWindow,
  paneExists,
  isTmuxAvailable,
  ensureSession,
  sendKeys,
  sleepSync,
  waitForReady,
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

/** Seconds to wait for the runtime to fully load (plugins, MCP, etc.) */
const RUNTIME_LOAD_WAIT_SECONDS = 15;

/**
 * Build the /loop prompt from the loop definition.
 * This is what gets typed into the runtime session after it loads.
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
    case "grid":
      return loopGrid();
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
      console.log("    harness loop grid                — create the shared 2x4 loop grid");
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
    const pane = panes.find(
      (entry) => entry.name === `loop-${name}`
        || (entry.windowName === "loops" && entry.name === name)
    );
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
  const runtime = resolveAgentRuntime(loop.agent);

  // Step 1: Spawn the configured runtime in a new tmux window
  const spawned = spawnPane(
    paneName,
    `cd "${ROOT_DIR}" && ${buildRuntimeLaunchCommand(runtime, {
      model: "claude-opus-4-6",
    })}`
  );

  if (!spawned) {
    console.log(error(`  Failed to start loop '${name}'.`));
    return;
  }

  console.log(success(`  Started ${runtime} for '${name}' (agent: ${loop.agent})`));

  // Step 2: Wait for the runtime to fully load (plugins, MCP servers, etc.)
  console.log(muted(`  Waiting for ${runtime} to load...`));
  const ready = waitForReady(paneName, RUNTIME_LOAD_WAIT_SECONDS * 1000);

  if (!ready) {
    console.log(warn(`  ${runtime} may not have fully loaded (timed out after ${RUNTIME_LOAD_WAIT_SECONDS}s). Sending prompt anyway.`));
  }

  // Step 3: Send the loop prompt (text + Enter are separate calls inside sendKeys)
  const sent = sendKeys(
    paneName,
    buildLoopDispatchPrompt(runtime, loop.interval, loopPrompt)
  );

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
    console.log(warn(`  Loop '${name}' may not have started. Check: tmux attach -t ${getTmuxSessionName()}:${paneName}`));
  }

  console.log(muted(`  Interval: ${loop.interval} | Skill: ${loop.skill}`));
  console.log(muted(`  Attach: tmux attach -t ${getTmuxSessionName()}:${paneName}`));
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

  if (!paneExists(paneName) && !paneExists(name)) {
    console.log(warn(`  Loop '${name}' is not running.`));
    return;
  }

  const killed = killPane(paneName) || killPane(name);
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

  // Spawn all runtime sessions first
  const spawned: string[] = [];
  const runtimes = new Map<string, ReturnType<typeof resolveAgentRuntime>>();
  for (const name of names) {
    const loop = loops[name];
    const paneName = `loop-${name}`;
    const runtime = resolveAgentRuntime(loop.agent);
    const ok = spawnPane(
      paneName,
      `cd "${ROOT_DIR}" && ${buildRuntimeLaunchCommand(runtime, {
        model: "claude-opus-4-6",
      })}`
    );

    if (ok) {
      spawned.push(name);
      runtimes.set(name, runtime);
      console.log(success(`  ${name} (${loop.agent}, ${runtime}) → tmux:${paneName}`));
    } else {
      console.log(error(`  ${name} — failed to start`));
    }
  }

  if (spawned.length === 0) return;

  // Wait for all runtimes to load
  console.log(muted(`  Waiting for runtimes to load...`));
  for (const name of spawned) {
    const paneName = `loop-${name}`;
    waitForReady(paneName, RUNTIME_LOAD_WAIT_SECONDS * 1000);
  }

  // Send loop prompts to all spawned panes
  for (const name of spawned) {
    const loop = loops[name];
    const paneName = `loop-${name}`;
    const loopPrompt = buildLoopPrompt(name, loop);
    const runtime = runtimes.get(name) ?? resolveAgentRuntime(loop.agent);
    const sent = sendKeys(
      paneName,
      buildLoopDispatchPrompt(runtime, loop.interval, loopPrompt)
    );
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
      console.log(warn(`  ${name} may not have started. Check: tmux attach -t ${getTmuxSessionName()}:${paneName}`));
    }
  }

  console.log();
  console.log(muted(`  Attach to any: tmux attach -t ${getTmuxSessionName()}:loop-<name>`));
}

// ─── stop-all ──────────────────────────────────────────────────────────────

function stopAll(): void {
  if (!isTmuxAvailable()) {
    console.log(error("  tmux not available."));
    return;
  }

  const loops = loadLoops();
  const names = Object.keys(loops);
  const sharedLoops = listPanes().filter((pane) => pane.windowName === "loops");
  let stopped = 0;

  if (sharedLoops.length > 0 && killPane("loops")) {
    stopped += sharedLoops.length;
  }

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

function loopGrid(): void {
  console.log(heading("harness loop grid"));

  if (!isTmuxAvailable()) {
    console.log(error("  tmux is not installed."));
    return;
  }

  const loops = loadLoops();
  const entries = Object.entries(loops);

  if (entries.length === 0) {
    console.log(muted("  No loops defined in .harness/loops.yml"));
    return;
  }

  if (entries.length > 8) {
    console.log(error("  loop grid currently supports up to 8 loops."));
    return;
  }

  const paneTitles = [...entries.map(([name]) => name)];
  while (paneTitles.length < 8) {
    paneTitles.push(`available-${paneTitles.length + 1}`);
  }

  const panes = createGridWindow("loops", paneTitles);
  if (panes.length !== 8) {
    console.log(error("  Failed to create the tmux loops grid."));
    return;
  }

  const activeEntries = entries.slice(0, 8);
  for (let i = 0; i < activeEntries.length; i++) {
    const [name, loop] = activeEntries[i];
    const pane = panes[i];
    const runtime = resolveAgentRuntime(loop.agent);
    const ok = spawnInPane(
      pane.paneId,
      `cd "${ROOT_DIR}" && ${buildRuntimeLaunchCommand(runtime, {
        model: "claude-opus-4-6",
      })}`
    );

    if (!ok) {
      console.log(error(`  Failed to launch ${name} in ${pane.paneId}.`));
      continue;
    }

    console.log(success(`  ${name} (${loop.agent}, ${runtime}) -> ${pane.paneId}`));
  }

  console.log(muted("  Waiting for runtimes to load in each loop pane..."));
  for (let i = 0; i < activeEntries.length; i++) {
    const [name, loop] = activeEntries[i];
    const pane = panes[i];
    const runtime = resolveAgentRuntime(loop.agent);
    const ready = waitForReady(pane.paneId, RUNTIME_LOAD_WAIT_SECONDS * 1000);

    if (!ready) {
      console.log(warn(`  ${name} timed out waiting for ${runtime}. Sending loop prompt anyway.`));
    }

    const sent = sendKeys(
      pane.paneId,
      buildLoopDispatchPrompt(runtime, loop.interval, buildLoopPrompt(name, loop))
    );
    if (!sent) {
      console.log(error(`  Failed to send /loop to ${name}.`));
      continue;
    }

    const running = verifyRunning(pane.paneId, 1500);
    if (!running) {
      console.log(warn(`  ${name} may not have started cleanly in ${pane.paneId}.`));
    }
  }

  console.log();
  console.log(muted(`  Attach: tmux attach -t ${getTmuxSessionName()}:loops`));
}
