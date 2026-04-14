/**
 * Tmux — pane management for agent spawning.
 *
 * Each agent runs in a named tmux pane inside the harness session.
 * Pane naming: harness:<agent-name>
 *
 * Uses execSync for simplicity — tmux commands are fast and blocking is fine.
 */

import { execSync } from "child_process";
import { TMUX_SESSION_PREFIX, TMUX_CAPTURE_LINES } from "./constants.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TmuxPane {
  /** Pane name (agent name). */
  name: string;
  /** Full tmux target (session:window.pane). */
  target: string;
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

function sessionName(): string {
  return TMUX_SESSION_PREFIX;
}

// ─── Public API ─────────────────────────────────────────────────────────────

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
 * List all active agent panes in the harness session.
 */
export function listPanes(): TmuxPane[] {
  const session = sessionName();
  const raw = exec(
    `tmux list-windows -t ${session} -F "#{window_name}\t#{window_id}\t#{pane_pid}\t#{pane_current_command}" 2>/dev/null`
  );
  if (!raw) return [];

  return raw
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const [name, windowId, pid, command] = line.split("\t");
      return {
        name: name ?? "unknown",
        target: `${session}:${windowId}`,
        active: command !== "bash" && command !== "zsh",
        pid: parseInt(pid ?? "0", 10),
      };
    })
    .filter((p) => p.name !== "main"); // Exclude the default window
}

/**
 * Spawn a claude session in a new tmux window.
 *
 * @param name - Window name (agent name)
 * @param command - Full command to run (e.g., `claude --model ...`)
 * @returns true if spawn succeeded
 */
export function spawnPane(name: string, command: string): boolean {
  ensureSession();
  const session = sessionName();

  // Kill existing window with same name if present
  exec(`tmux kill-window -t ${session}:${name} 2>/dev/null`);

  // Create new window with the command
  const result = exec(
    `tmux new-window -t ${session} -n ${name} "${command.replace(/"/g, '\\"')}" 2>&1 && echo ok`
  );
  return result.includes("ok");
}

/**
 * Kill an agent's tmux window.
 */
export function killPane(name: string): boolean {
  const session = sessionName();
  const result = exec(
    `tmux kill-window -t ${session}:${name} 2>&1 && echo ok`
  );
  return result.includes("ok");
}

/**
 * Capture recent output from an agent's tmux pane.
 *
 * @param name - Window name (agent name)
 * @param lines - Number of lines to capture (default: TMUX_CAPTURE_LINES)
 */
export function capturePaneOutput(
  name: string,
  lines: number = TMUX_CAPTURE_LINES
): string {
  const session = sessionName();
  return exec(
    `tmux capture-pane -t ${session}:${name} -p -S -${lines} 2>/dev/null`
  );
}

/**
 * Send keys to an agent's tmux pane.
 */
export function sendKeys(name: string, keys: string): boolean {
  const session = sessionName();
  const result = exec(
    `tmux send-keys -t ${session}:${name} "${keys.replace(/"/g, '\\"')}" Enter 2>&1 && echo ok`
  );
  return result.includes("ok");
}

/**
 * Check if a specific agent pane exists.
 */
export function paneExists(name: string): boolean {
  const session = sessionName();
  const result = exec(
    `tmux has-session -t ${session}:${name} 2>&1 && echo ok`
  );
  // tmux has-session checks sessions, not windows. Use list-windows instead.
  const windows = exec(
    `tmux list-windows -t ${session} -F "#{window_name}" 2>/dev/null`
  );
  return windows.split("\n").includes(name);
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
