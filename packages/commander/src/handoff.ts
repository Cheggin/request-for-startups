/**
 * Handoff — manages dependency chains between tasks.
 *
 * When one agent finishes, triggers dependent agents.
 * E.g., backend agent finishes API → website agent builds the UI that calls it.
 *
 * Dependency graph is built from task.dependsOn fields (parsed from issue body
 * "depends on #N" / "blocked by #N" references).
 */

import type { Task, DependencyEdge, HandoffTrigger, CommanderState } from "./types.js";

// ─── Dependency Graph ───────────────────────────────────────────────────────

/**
 * Build a list of dependency edges from task dependsOn fields.
 */
export function buildDependencyGraph(tasks: Task[]): DependencyEdge[] {
  const edges: DependencyEdge[] = [];

  for (const task of tasks) {
    for (const depId of task.dependsOn) {
      edges.push({
        from: depId,
        to: task.id,
        provides: `Output of task ${depId}`,
      });
    }
  }

  return edges;
}

// ─── Unblocked Task Resolution ──────────────────────────────────────────────

/**
 * Find tasks that are ready to run: all dependencies met, not completed, not running.
 */
export function getUnblockedTasks(state: CommanderState): Task[] {
  const unblocked: Task[] = [];

  for (const [taskId, task] of state.tasks) {
    // Skip already completed
    if (state.completed.has(taskId)) continue;

    // Skip already running
    if (state.running.has(taskId)) continue;

    // Check all dependencies are in the completed set
    const allDepsMet = task.dependsOn.every((depId) =>
      state.completed.has(depId)
    );

    if (allDepsMet) {
      unblocked.push(task);
    }
  }

  return unblocked;
}

// ─── Handoff Processing ─────────────────────────────────────────────────────

/**
 * Process a task completion and find newly unblocked downstream tasks.
 *
 * Returns a HandoffTrigger if any tasks were unblocked, null otherwise.
 */
export function processHandoff(
  completedTaskId: string,
  state: CommanderState
): HandoffTrigger | null {
  const completedTask = state.tasks.get(completedTaskId);
  if (!completedTask) return null;

  // Find tasks that depend on the completed task
  const downstreamEdges = state.dependencies.filter(
    (e) => e.from === completedTaskId
  );

  if (downstreamEdges.length === 0) return null;

  // Check which downstream tasks are now fully unblocked
  const newlyUnblocked: Task[] = [];

  for (const edge of downstreamEdges) {
    const downstreamTask = state.tasks.get(edge.to);
    if (!downstreamTask) continue;

    // Skip already completed or running
    if (state.completed.has(edge.to)) continue;
    if (state.running.has(edge.to)) continue;

    // Check if ALL dependencies are met (not just this one)
    const allDepsMet = downstreamTask.dependsOn.every((depId) =>
      state.completed.has(depId)
    );

    if (allDepsMet) {
      newlyUnblocked.push(downstreamTask);
    }
  }

  if (newlyUnblocked.length === 0) return null;

  return {
    completedTask,
    unblockedTasks: newlyUnblocked,
  };
}
