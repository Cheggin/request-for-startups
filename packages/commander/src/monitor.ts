/**
 * Monitor — polls running agents for status, detects stuck/failed, triggers reassignment.
 *
 * Uses time-based staleness detection (heartbeat age vs threshold).
 * Agents that exceed MAX_AGENT_FAILURES retries are marked permanently failed.
 */

import type { RunningAgent, AgentStatus } from "./types.js";
import { STALE_THRESHOLD_HOURS, MAX_AGENT_FAILURES } from "./constants.js";

// ─── Agent Health Check ─────────────────────────────────────────────────────

/**
 * Check an agent's current health based on its status and heartbeat age.
 *
 * - Already completed/failed → return as-is
 * - Running but heartbeat stale → "stuck"
 * - Running and heartbeat fresh → "running"
 */
export function checkAgent(agent: RunningAgent): AgentStatus {
  // Terminal states — no change
  if (agent.status === "completed" || agent.status === "failed" || agent.status === "reassigned") {
    return agent.status;
  }

  // Check staleness by heartbeat age
  const now = Date.now();
  const elapsedMs = now - agent.lastHeartbeat;
  const thresholdMs = STALE_THRESHOLD_HOURS * 60 * 60 * 1000;

  if (elapsedMs > thresholdMs) {
    return "stuck";
  }

  return "running";
}

// ─── Stuck Detection ────────────────────────────────────────────────────────

/**
 * Scan all running agents and return task IDs of those that are stuck.
 * Only checks agents in "running" status (ignores completed/failed).
 */
export function detectStuckAgents(
  running: Map<string, RunningAgent>
): string[] {
  const stuckIds: string[] = [];

  for (const [taskId, agent] of running) {
    // Only check actively running agents
    if (agent.status !== "running") continue;

    const status = checkAgent(agent);
    if (status === "stuck") {
      stuckIds.push(taskId);
    }
  }

  return stuckIds;
}

// ─── Reassignment Decision ──────────────────────────────────────────────────

/**
 * Determine whether a stuck/failed agent should be reassigned (retried).
 * Returns true if retry count is below the maximum.
 */
export function shouldReassign(agent: RunningAgent): boolean {
  return agent.retryCount < MAX_AGENT_FAILURES;
}

// ─── Monitor Tick ───────────────────────────────────────────────────────────

export interface MonitorResult {
  /** Task IDs of agents detected as stuck. */
  stuck: string[];
  /** Task IDs of agents that were reassigned (will retry). */
  reassigned: string[];
  /** Task IDs of agents that permanently failed (max retries exceeded). */
  permanentlyFailed: string[];
}

/**
 * Run a single monitor tick: detect stuck agents, decide reassignment.
 * Updates agent statuses in place.
 */
export function monitorTick(
  running: Map<string, RunningAgent>
): MonitorResult {
  const result: MonitorResult = {
    stuck: [],
    reassigned: [],
    permanentlyFailed: [],
  };

  const stuckIds = detectStuckAgents(running);

  for (const taskId of stuckIds) {
    const agent = running.get(taskId);
    if (!agent) continue;

    result.stuck.push(taskId);

    if (shouldReassign(agent)) {
      agent.status = "reassigned";
      agent.retryCount += 1;
      result.reassigned.push(taskId);
    } else {
      agent.status = "failed";
      agent.error = `Permanently failed after ${agent.retryCount} retries`;
      result.permanentlyFailed.push(taskId);
    }
  }

  return result;
}
