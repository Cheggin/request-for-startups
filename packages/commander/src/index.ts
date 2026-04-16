/**
 * Commander — main orchestration loop.
 *
 * 2-level hierarchy: commander -> agents.
 * Research shows this outperforms flat by 28%; 3 levels adds only 7% with 40% more latency.
 *
 * Loop: read GitHub Issues backlog -> dispatch -> monitor -> handoff -> report
 */

import type {
  Task,
  CommanderState,
  CommanderEvent,
  CommanderEventSink,
  RunningAgent,
} from "./types.js";
import type { Issue } from "@harness/github-state";
import { classifyTask, buildTaskFromIssue } from "./dispatcher.js";
import { monitorTick } from "./monitor.js";
import { buildDependencyGraph, getUnblockedTasks, processHandoff } from "./handoff.js";
import { buildInvestorUpdate, formatSlackBlocks } from "./investor-update.js";

// ─── Re-exports ─────────────────────────────────────────────────────────────

export { classifyTask, buildTaskFromIssue, buildTaskFromPrompt } from "./dispatcher.js";
export { checkAgent, detectStuckAgents, shouldReassign, monitorTick } from "./monitor.js";
export {
  buildDependencyGraph,
  getUnblockedTasks,
  processHandoff,
} from "./handoff.js";
export {
  gatherAgentProgress,
  buildInvestorUpdate,
  formatSlackBlocks,
} from "./investor-update.js";

export type {
  Task,
  ClassificationResult,
  ClassificationSignal,
  RunningAgent,
  AgentStatus,
  DependencyEdge,
  HandoffTrigger,
  AgentProgress,
  InvestorUpdate,
  CommanderState,
  CommanderEvent,
  CommanderEventSink,
} from "./types.js";

export {
  AGENT_NAMES,
  FILE_PATH_ROUTES,
  KEYWORD_ROUTES,
  LABEL_ROUTES,
  MONITOR_POLL_INTERVAL_MS,
  MAX_AGENT_FAILURES,
  STALE_THRESHOLD_HOURS,
  LOOP_TICK_INTERVAL_MS,
} from "./constants.js";
export type { AgentName } from "./constants.js";

// ─── State Factory ──────────────────────────────────────────────────────────

/**
 * Create a fresh commander state.
 */
export function createCommanderState(): CommanderState {
  return {
    tasks: new Map(),
    running: new Map(),
    completed: new Set(),
    dependencies: [],
    tick: 0,
  };
}

// ─── Issue Ingestion ────────────────────────────────────────────────────────

/**
 * Ingest GitHub Issues into the commander state.
 * Skips issues already known and closed issues.
 */
export function ingestIssues(
  state: CommanderState,
  issues: Issue[],
  emit: CommanderEventSink = () => {}
): void {
  for (const issue of issues) {
    const id = String(issue.number);

    // Skip if already tracked
    if (state.tasks.has(id)) continue;

    // Skip closed issues
    if (issue.state === "closed") continue;

    const task = buildTaskFromIssue(issue);
    state.tasks.set(id, task);

    // Rebuild dependency graph with new task
    state.dependencies = buildDependencyGraph(Array.from(state.tasks.values()));

    emit({ type: "task_ingested", task });
  }
}

// ─── Main Tick ──────────────────────────────────────────────────────────────

/**
 * Execute a single commander tick:
 *
 * 1. Monitor running agents (detect stuck/failed)
 * 2. Process handoffs for completed agents
 * 3. Classify and dispatch unblocked tasks
 *
 * This is the core loop body — called on an interval by the runner.
 */
export function runTick(
  state: CommanderState,
  emit: CommanderEventSink = () => {}
): void {
  state.tick++;
  emit({ type: "loop_tick", tick: state.tick });

  // ── Step 1: Monitor ──
  const monitorResult = monitorTick(state.running);

  for (const taskId of monitorResult.stuck) {
    const agent = state.running.get(taskId);
    if (agent) {
      emit({ type: "agent_stuck", taskId, agent: agent.agentName });
    }
  }

  for (const taskId of monitorResult.permanentlyFailed) {
    const agent = state.running.get(taskId);
    if (agent) {
      emit({
        type: "agent_failed",
        taskId,
        agent: agent.agentName,
        error: agent.error ?? "Max retries exceeded",
      });
    }
  }

  // ── Step 2: Process completions and handoffs ──
  for (const [taskId, agent] of state.running) {
    if (agent.status === "completed" && !state.completed.has(taskId)) {
      state.completed.add(taskId);
      emit({ type: "agent_completed", taskId, agent: agent.agentName });

      const trigger = processHandoff(taskId, state);
      if (trigger) {
        emit({ type: "handoff_triggered", trigger });
      }
    }
  }

  // Clean up reassigned agents so they can be re-dispatched
  for (const [taskId, agent] of state.running) {
    if (agent.status === "reassigned") {
      // Keep the retry count but remove from running so dispatch picks it up
      const retryCount = agent.retryCount;
      state.running.delete(taskId);

      // Store retry count on the task for the next dispatch
      const task = state.tasks.get(taskId);
      if (task) {
        (task as any)._retryCount = retryCount;
      }
    }
  }

  // ── Step 3: Classify and dispatch unblocked tasks ──
  const unblocked = getUnblockedTasks(state);

  for (const task of unblocked) {
    const classification = classifyTask(task);
    emit({ type: "task_classified", taskId: task.id, result: classification });

    // Create the running agent entry
    const retryCount = (task as any)._retryCount ?? 0;
    const runningAgent: RunningAgent = {
      agentName: classification.agent,
      task,
      status: "running",
      startedAt: Date.now(),
      lastHeartbeat: Date.now(),
      retryCount,
    };

    state.running.set(task.id, runningAgent);
    emit({ type: "agent_dispatched", taskId: task.id, agent: classification.agent });
  }
}

// ─── Full Loop Runner ───────────────────────────────────────────────────────

export interface CommanderLoopConfig {
  /** How often to tick (ms). Default: 60s. */
  tickIntervalMs?: number;
  /** Maximum ticks before stopping. 0 = unlimited. */
  maxTicks?: number;
  /** Callback to fetch open issues from GitHub. */
  fetchIssues: () => Promise<Issue[]>;
  /** Callback to actually spawn an agent (via agent-loop). */
  spawnAgent?: (agent: RunningAgent) => Promise<void>;
  /** Callback to send Slack update. */
  sendUpdate?: (blocks: unknown[]) => Promise<void>;
  /** How often to send investor updates (in ticks). Default: 10. */
  updateEveryNTicks?: number;
}

/**
 * Run the commander loop.
 *
 * This is the top-level entry point for the orchestrator.
 * Continuously: fetch issues -> ingest -> tick -> (optionally report).
 */
export async function runCommanderLoop(
  config: CommanderLoopConfig,
  emit: CommanderEventSink = () => {}
): Promise<CommanderState> {
  const state = createCommanderState();
  const tickInterval = config.tickIntervalMs ?? 60_000;
  const maxTicks = config.maxTicks ?? 0;
  const updateEvery = config.updateEveryNTicks ?? 10;

  let running = true;

  const tick = async () => {
    // Fetch and ingest new issues
    try {
      const issues = await config.fetchIssues();
      ingestIssues(state, issues, emit);
    } catch (err) {
      // GitHub API failure is transient — log and continue
      emit({
        type: "loop_stopped",
        reason: `Issue fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    // Run the core tick
    runTick(state, emit);

    // Spawn agents for newly dispatched tasks
    if (config.spawnAgent) {
      for (const [, agent] of state.running) {
        if (agent.status === "running" && agent.startedAt >= Date.now() - 1000) {
          try {
            await config.spawnAgent(agent);
          } catch (err) {
            agent.status = "failed";
            agent.error = `Spawn failed: ${err instanceof Error ? err.message : String(err)}`;
          }
        }
      }
    }

    // Periodic investor update
    if (state.tick % updateEvery === 0 && config.sendUpdate) {
      const update = buildInvestorUpdate(state);
      const blocks = formatSlackBlocks(update);
      try {
        await config.sendUpdate(blocks);
        emit({ type: "update_sent", update });
      } catch {
        // Slack send failure is non-fatal
      }
    }

    // Check stop condition
    if (maxTicks > 0 && state.tick >= maxTicks) {
      running = false;
      emit({ type: "loop_stopped", reason: "max_ticks_reached" });
    }
  };

  // Run first tick immediately
  await tick();

  // If maxTicks === 1, we're done (useful for testing)
  if (!running) return state;

  // Otherwise, run on interval
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      if (!running) {
        clearInterval(interval);
        resolve(state);
        return;
      }
      await tick();
      if (!running) {
        clearInterval(interval);
        resolve(state);
      }
    }, tickInterval);
  });
}
