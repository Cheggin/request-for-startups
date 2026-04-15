/**
 * Tmux Monitor — reads real tmux pane state to detect agent health.
 * Used by the commander agent and the dashboard.
 *
 * Fixes #14: agents are now supervised with progress verification.
 */

import { execSync } from "child_process";
import { isRuntimeProcess } from "./runtime.js";
import { getTmuxSessionName } from "./tmux.js";

export interface TmuxAgent {
  name: string;
  paneId: string;
  status: "running" | "idle" | "stuck" | "exited";
  lastOutput: string;
  cwd: string;
}

/**
 * Get all agents from tmux harness session.
 */
export function getTmuxAgents(): TmuxAgent[] {
  try {
    const session = getTmuxSessionName();
    const raw = execSync(
      `tmux list-panes -t ${session} -a -F "#{window_name}|#{pane_id}|#{pane_current_command}|#{pane_current_path}|#{pane_dead}" 2>/dev/null`,
      { encoding: "utf-8", timeout: 5000 }
    ).trim();

    if (!raw) return [];

    return raw.split("\n").filter(Boolean).map((line) => {
      const [name, paneId, command, cwd, dead] = line.split("|");

      let lastOutput = "";
      try {
        lastOutput = execSync(
          `tmux capture-pane -t "${paneId}" -p -l 10 2>/dev/null`,
          { encoding: "utf-8", timeout: 3000 }
        ).trim();
      } catch {}

      // Detect status
      let status: TmuxAgent["status"];
      if (dead === "1") {
        status = "exited";
      } else if (isRuntimeProcess(command)) {
        // Check if the output indicates the agent is actively working
        const activeSignals = [
          "Reading",
          "Writing",
          "Running",
          "Embellishing",
          "Searching",
          "Editing",
          "bypass permissions",
          "Codex",
          "Gemini",
        ];
        const isActive = activeSignals.some(s => lastOutput.includes(s));

        // Check for idle signals
        const idleSignals = ["No recent activity", "❯ \n", "resets"];
        const isIdle = idleSignals.some(s => lastOutput.includes(s));

        if (isActive) {
          status = "running";
        } else if (isIdle && !isActive) {
          status = "idle";
        } else {
          status = "running"; // default to running if Claude Code process is active
        }
      } else {
        status = "idle";
      }

      return { name, paneId, status, lastOutput, cwd };
    });
  } catch {
    return [];
  }
}

/**
 * Check if a specific artifact file exists and has content.
 */
export function checkArtifact(path: string): boolean {
  try {
    const stat = execSync(`wc -c < "${path}" 2>/dev/null`, { encoding: "utf-8" }).trim();
    return parseInt(stat) > 50;
  } catch {
    return false;
  }
}

/**
 * Get a summary of agent statuses for the commander.
 */
export function getAgentSummary(): string {
  const agents = getTmuxAgents();
  if (agents.length === 0) return "No agents running in tmux.";

  const lines = agents.map(a => {
    const statusIcon = a.status === "running" ? "[RUNNING]" : a.status === "idle" ? "[IDLE]" : a.status === "stuck" ? "[STUCK]" : "[EXITED]";
    const output = a.lastOutput.split("\n").pop()?.trim() || "no output";
    return `  ${statusIcon} ${a.name}: ${output}`;
  });

  const running = agents.filter(a => a.status === "running").length;
  const idle = agents.filter(a => a.status === "idle").length;

  return [
    `Agents: ${running} running, ${idle} idle, ${agents.length} total`,
    ...lines,
  ].join("\n");
}
