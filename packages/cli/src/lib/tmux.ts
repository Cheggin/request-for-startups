/**
 * Tmux — shared session/window/pane management for harness agents.
 *
 * Supports both the original "one window per agent" mode and shared grid
 * windows where each pane is titled after an agent or loop.
 */

import { execSync } from "child_process";
import { basename } from "path";
import { ROOT_DIR, TMUX_CAPTURE_LINES, TMUX_SESSION_PREFIX } from "./constants.js";

const SHELL_COMMANDS = new Set(["bash", "zsh", "sh", "fish"]);

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TmuxPane {
  /** Pane title when present, otherwise the window name. */
  name: string;
  /** Parent tmux window name. */
  windowName: string;
  /** Stable pane id target (e.g. %12). */
  target: string;
  /** Stable pane id target (e.g. %12). */
  paneId: string;
  /** Whether the pane is currently running a process. */
  active: boolean;
  /** PID of the process in the pane. */
  pid: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 5000 }).trim();
  } catch {
    return "";
  }
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\"'\"'")}'`;
}

export function deriveTmuxSessionName(rootDir: string): string {
  const project = basename(rootDir)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!project || project === TMUX_SESSION_PREFIX) {
    return TMUX_SESSION_PREFIX;
  }

  return `${TMUX_SESSION_PREFIX}-${project}`;
}

export function getTmuxSessionName(): string {
  return deriveTmuxSessionName(ROOT_DIR);
}

function sessionName(): string {
  return getTmuxSessionName();
}

function isActiveCommand(command: string | undefined): boolean {
  return !!command && !SHELL_COMMANDS.has(command);
}

function resolveTarget(target: string): string {
  if (target.startsWith("%") || target.includes(":")) {
    return target;
  }

  const pane = listPanes().find((entry) => entry.name === target);
  if (pane) {
    return pane.paneId;
  }

  return `${sessionName()}:${target}`;
}

function windowTarget(windowName: string): string {
  return `${sessionName()}:${windowName}`;
}

function listPaneRecords(target: string): Array<{
  windowName: string;
  paneId: string;
  pid: number;
  command: string;
  title: string;
  top: number;
  left: number;
}> {
  const raw = exec(
    `tmux list-panes -t ${target} -F "#{window_name}\t#{pane_id}\t#{pane_pid}\t#{pane_current_command}\t#{pane_title}\t#{pane_top}\t#{pane_left}" 2>/dev/null`
  );

  if (!raw) {
    return [];
  }

  return raw
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const [windowName, paneId, pid, command, title, top, left] = line.split("\t");
      return {
        windowName: windowName ?? "unknown",
        paneId: paneId ?? "",
        pid: parseInt(pid ?? "0", 10),
        command: command ?? "",
        title: title ?? "",
        top: parseInt(top ?? "0", 10),
        left: parseInt(left ?? "0", 10),
      };
    });
}

function orderedPanesForWindow(windowName: string): TmuxPane[] {
  return listPaneRecords(windowTarget(windowName))
    .sort((a, b) => a.top - b.top || a.left - b.left)
    .map((pane) => ({
      name: pane.title.trim() || pane.windowName,
      windowName: pane.windowName,
      target: pane.paneId,
      paneId: pane.paneId,
      active: isActiveCommand(pane.command),
      pid: pane.pid,
    }));
}

/**
 * Check if tmux is available on the system.
 */
export function isTmuxAvailable(): boolean {
  return exec("which tmux") !== "";
}

/**
 * Ensure the harness tmux session exists. Creates it if missing.
 */
export function ensureSession(): void {
  const existing = exec(`tmux has-session -t ${sessionName()} 2>&1 && echo ok`);
  if (!existing.includes("ok")) {
    exec(`tmux new-session -d -s ${sessionName()} -n main`);
  }
}

/**
 * List all panes in the harness session.
 */
export function listPanes(): TmuxPane[] {
  return listPaneRecords(sessionName())
    .map((pane) => ({
      name: pane.title.trim() || pane.windowName,
      windowName: pane.windowName,
      target: pane.paneId,
      paneId: pane.paneId,
      active: isActiveCommand(pane.command),
      pid: pane.pid,
    }))
    .filter((pane) => !(pane.windowName === "main" && pane.name === "main"));
}

/**
 * Wrap a command in the user's login shell so PATH, aliases, and tool
 * managers (nvm, pyenv, etc.) are available inside tmux.
 */
function wrapWithLoginShell(command: string): string {
  const shell = process.env.SHELL || "/bin/bash";
  const shellName = basename(shell);
  const home = process.env.HOME || "";
  const rcFile = home ? `${home}/.${shellName}rc` : "";
  const sourcePrefix = rcFile
    ? `[ -f '${rcFile}' ] && . '${rcFile}'; `
    : "";
  const escaped = command.replace(/'/g, "'\"'\"'");
  return `${shell} -lc '${sourcePrefix}${escaped}'`;
}

/**
 * Spawn an agent runtime session in a new tmux window.
 */
export function spawnPane(name: string, command: string): boolean {
  ensureSession();
  const session = sessionName();

  exec(`tmux kill-window -t ${session}:${name} 2>/dev/null`);

  const wrapped = wrapWithLoginShell(command);
  const result = exec(
    `tmux new-window -d -t ${session} -n ${name} ${shellQuote(wrapped)} 2>&1 && echo ok`
  );

  if (!result.includes("ok")) {
    return false;
  }

  setPaneTitle(`${session}:${name}`, name);
  return true;
}

/**
 * Start a command inside an existing tmux pane.
 */
export function spawnInPane(target: string, command: string): boolean {
  const wrapped = wrapWithLoginShell(command);
  const result = exec(
    `tmux respawn-pane -k -t ${resolveTarget(target)} ${shellQuote(wrapped)} 2>&1 && echo ok`
  );
  return result.includes("ok");
}

/**
 * Create a deterministic 2x4 grid window and return pane targets in row-major order.
 */
export function createGridWindow(windowName: string, titles: string[]): TmuxPane[] {
  ensureSession();
  const session = sessionName();

  exec(`tmux kill-window -t ${session}:${windowName} 2>/dev/null`);
  const created = exec(
    `tmux new-window -d -t ${session} -n ${windowName} 2>&1 && echo ok`
  );
  if (!created.includes("ok")) {
    return [];
  }

  const anchor = exec(`tmux display-message -p -t ${session}:${windowName} "#{pane_id}"`);
  if (!anchor) {
    return [];
  }

  const bottom = exec(
    `tmux split-window -d -v -t ${anchor} -P -F "#{pane_id}" 2>/dev/null`
  );
  if (!bottom) {
    return [];
  }

  for (const rowAnchor of [anchor, bottom]) {
    for (let i = 0; i < 3; i++) {
      exec(`tmux split-window -d -h -t ${rowAnchor} 2>/dev/null`);
    }
  }

  exec(`tmux select-layout -t ${session}:${windowName} tiled 2>/dev/null`);
  exec(`tmux set-window-option -t ${session}:${windowName} pane-border-status top 2>/dev/null`);
  exec(
    `tmux set-window-option -t ${session}:${windowName} pane-border-format ${shellQuote(" #{pane_title} ")} 2>/dev/null`
  );

  const panes = orderedPanesForWindow(windowName);
  panes.forEach((pane, index) => {
    setPaneTitle(pane.paneId, titles[index] ?? `slot-${index + 1}`);
  });

  return orderedPanesForWindow(windowName);
}

/**
 * Set a tmux pane title so shared grid panes stay identifiable.
 */
export function setPaneTitle(target: string, title: string): boolean {
  const result = exec(
    `tmux select-pane -t ${resolveTarget(target)} -T ${shellQuote(title)} 2>&1 && echo ok`
  );
  return result.includes("ok");
}

/**
 * Kill an agent window or a titled pane inside a shared window.
 */
export function killPane(targetOrName: string): boolean {
  if (targetOrName.startsWith("%")) {
    const paneResult = exec(
      `tmux kill-pane -t ${targetOrName} 2>&1 && echo ok`
    );
    return paneResult.includes("ok");
  }

  const session = sessionName();
  const windowResult = exec(
    `tmux kill-window -t ${session}:${targetOrName} 2>&1 && echo ok`
  );
  if (windowResult.includes("ok")) {
    return true;
  }

  const pane = listPanes().find((entry) => entry.name === targetOrName);
  if (!pane) {
    return false;
  }

  const paneResult = exec(
    `tmux kill-pane -t ${pane.paneId} 2>&1 && echo ok`
  );
  return paneResult.includes("ok");
}

/**
 * Capture recent output from a tmux pane.
 */
export function capturePaneOutput(
  targetOrName: string,
  lines: number = TMUX_CAPTURE_LINES
): string {
  return exec(
    `tmux capture-pane -t ${resolveTarget(targetOrName)} -p -S -${lines} 2>/dev/null`
  );
}

/**
 * Send text to a tmux pane, then press Enter separately.
 */
export function sendKeys(targetOrName: string, keys: string): boolean {
  const target = resolveTarget(targetOrName);

  const textResult = exec(
    `tmux send-keys -t ${target} ${shellQuote(keys)} 2>&1 && echo ok`
  );
  if (!textResult.includes("ok")) return false;

  const enterResult = exec(
    `tmux send-keys -t ${target} Enter 2>&1 && echo ok`
  );
  return enterResult.includes("ok");
}

/**
 * Synchronous sleep. Used to wait for runtimes to load before sending prompts.
 */
export function sleepSync(ms: number): void {
  Bun.sleepSync(ms);
}

/**
 * Wait for a runtime to finish loading in a tmux pane.
 */
export function waitForReady(
  targetOrName: string,
  timeoutMs: number = 30000,
  pollMs: number = 2000
): boolean {
  const deadline = Date.now() + timeoutMs;
  const readyIndicators = [">", "claude>", "Claude Code", "Codex", "Gemini", "Tips:"];

  while (Date.now() < deadline) {
    const output = capturePaneOutput(targetOrName, 10);
    if (readyIndicators.some((indicator) => output.includes(indicator))) {
      return true;
    }
    sleepSync(pollMs);
  }
  return false;
}

/**
 * Verify an agent is running (not stuck at an idle prompt).
 */
export function verifyRunning(
  targetOrName: string,
  waitMs: number = 3000
): boolean {
  sleepSync(waitMs);
  const output = capturePaneOutput(targetOrName, 15);
  const activityIndicators = [
    "Read",
    "Edit",
    "Write",
    "Bash",
    "Grep",
    "Glob",
    "thinking",
    "searching",
    "reading",
  ];
  const idleIndicators = ["Tips:", "Available commands:"];

  const isIdle = idleIndicators.some((indicator) => output.includes(indicator));
  const hasActivity = activityIndicators.some((indicator) => output.includes(indicator));

  return hasActivity || !isIdle;
}

/**
 * Check if a specific agent pane exists.
 */
export function paneExists(targetOrName: string): boolean {
  if (targetOrName.startsWith("%")) {
    return listPanes().some((pane) => pane.paneId === targetOrName);
  }

  const windows = exec(
    `tmux list-windows -t ${sessionName()} -F "#{window_name}" 2>/dev/null`
  )
    .split("\n")
    .filter(Boolean);

  return windows.includes(targetOrName)
    || listPanes().some((pane) => pane.name === targetOrName);
}

/**
 * Kill the entire harness tmux session.
 */
export function killSession(): boolean {
  const result = exec(
    `tmux kill-session -t ${sessionName()} 2>&1 && echo ok`
  );
  return result.includes("ok");
}
