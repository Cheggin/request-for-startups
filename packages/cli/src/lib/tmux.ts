/**
 * Tmux — pane management for agent spawning.
 *
 * Each agent runs in a named tmux pane inside the harness session.
 * Pane naming: harness:<agent-name>
 *
 * Uses execSync for simplicity — tmux commands are fast and blocking is fine.
 */

import { execSync } from "child_process";
import { basename } from "path";
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
 * Wrap a command in the user's login shell so PATH, aliases, and tool
 * managers (nvm, pyenv, etc.) are available inside tmux.
 *
 * tmux new-window runs commands in a non-interactive, non-login shell,
 * so .zshrc / .bashrc are never sourced. This wrapper fixes that.
 */
function wrapWithLoginShell(command: string): string {
  const shell = process.env.SHELL || "/bin/bash";
  const shellName = basename(shell);
  const home = process.env.HOME || "";
  const rcFile = home ? `${home}/.${shellName}rc` : "";
  const sourcePrefix = rcFile
    ? `[ -f '${rcFile}' ] && . '${rcFile}'; `
    : "";
  // Single-quote the inner command to avoid double-quote escaping issues
  const escaped = command.replace(/'/g, "'\"'\"'");
  return `${shell} -lc '${sourcePrefix}${escaped}'`;
}

/**
 * Spawn a claude session in a new tmux window.
 *
 * @param name - Window name (agent name)
 * @param command - Full command to run (e.g., `cd /path && claude --model ...`)
 * @returns true if spawn succeeded
 */
export function spawnPane(name: string, command: string): boolean {
  ensureSession();
  const session = sessionName();

  // Kill existing window with same name if present
  exec(`tmux kill-window -t ${session}:${name} 2>/dev/null`);

  // Wrap in login shell so .zshrc/.bashrc are sourced (makes claude, lfg, etc. available)
  const wrapped = wrapWithLoginShell(command);

  // Create new window with the command
  const result = exec(
    `tmux new-window -t ${session} -n ${name} ${shellQuote(wrapped)} 2>&1 && echo ok`
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
 * Shell-quote a string for safe embedding in tmux commands.
 * Uses single quotes with proper escaping.
 */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\"'\"'")}'`;
}

/**
 * Send text to an agent's tmux pane, then press Enter separately.
 *
 * Critical: text and Enter MUST be separate send-keys calls.
 * Combining them causes the Enter to be appended to the text literal
 * instead of being interpreted as a keypress, which silently fails
 * to submit the prompt.
 */
export function sendKeys(name: string, keys: string): boolean {
  const session = sessionName();
  const target = `${session}:${name}`;

  // Step 1: Send the text content (no Enter)
  const textResult = exec(
    `tmux send-keys -t ${target} ${shellQuote(keys)} 2>&1 && echo ok`
  );
  if (!textResult.includes("ok")) return false;

  // Step 2: Send Enter as a separate keypress
  const enterResult = exec(
    `tmux send-keys -t ${target} Enter 2>&1 && echo ok`
  );
  return enterResult.includes("ok");
}

/**
 * Synchronous sleep. Used to wait for Claude Code to load before
 * sending prompts. setTimeout doesn't work in CLI tools because
 * the process exits before the callback fires.
 */
export function sleepSync(ms: number): void {
  execSync(`sleep ${ms / 1000}`, { stdio: "ignore" });
}

/**
 * Wait for Claude Code to finish loading in a tmux pane.
 * Polls capture-pane output looking for the ready indicator.
 *
 * @param name - Window name
 * @param timeoutMs - Max time to wait (default: 30s)
 * @param pollMs - Poll interval (default: 2s)
 * @returns true if Claude Code loaded, false if timed out
 */
export function waitForReady(
  name: string,
  timeoutMs: number = 30000,
  pollMs: number = 2000
): boolean {
  const deadline = Date.now() + timeoutMs;
  const readyIndicators = [">", "claude>", "Claude Code", "Tips:"];

  while (Date.now() < deadline) {
    const output = capturePaneOutput(name, 10);
    if (readyIndicators.some((ind) => output.includes(ind))) {
      return true;
    }
    sleepSync(pollMs);
  }
  return false;
}

/**
 * Verify an agent is running (not stuck at an idle prompt).
 * Captures pane output and checks for activity indicators.
 *
 * @param name - Window name
 * @param waitMs - Time to wait before checking (default: 3s)
 */
export function verifyRunning(name: string, waitMs: number = 3000): boolean {
  sleepSync(waitMs);
  const output = capturePaneOutput(name, 15);
  // Agent is working if we see tool calls, thinking, or output being generated
  const activityIndicators = ["Read", "Edit", "Write", "Bash", "Grep", "Glob", "thinking", "searching", "reading"];
  const idleIndicators = ["Tips:", "Available commands:"];

  // If we see idle indicators and no activity, agent didn't start
  const isIdle = idleIndicators.some((ind) => output.includes(ind));
  const hasActivity = activityIndicators.some((ind) => output.includes(ind));

  return hasActivity || !isIdle;
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
