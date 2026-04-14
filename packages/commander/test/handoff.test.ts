import { describe, it, expect } from "bun:test";
import {
  buildDependencyGraph,
  getUnblockedTasks,
  processHandoff,
} from "../src/handoff.js";
import type { Task, DependencyEdge, CommanderState } from "../src/types.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeTask(id: string, dependsOn: string[] = []): Task {
  return {
    id,
    title: `Task ${id}`,
    body: "",
    source: "github_issue",
    labels: [],
    filePaths: [],
    dependsOn,
  };
}

function makeState(
  tasks: Task[],
  completedIds: string[] = []
): CommanderState {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const deps = buildDependencyGraph(tasks);
  return {
    tasks: taskMap,
    running: new Map(),
    completed: new Set(completedIds),
    dependencies: deps,
    tick: 0,
  };
}

// ─── buildDependencyGraph ───────────────────────────────────────────────────

describe("buildDependencyGraph", () => {
  it("returns empty for tasks with no dependencies", () => {
    const tasks = [makeTask("1"), makeTask("2")];
    const edges = buildDependencyGraph(tasks);
    expect(edges).toHaveLength(0);
  });

  it("creates edges from dependsOn", () => {
    const tasks = [makeTask("1"), makeTask("2", ["1"]), makeTask("3", ["1", "2"])];
    const edges = buildDependencyGraph(tasks);
    expect(edges).toHaveLength(3);
    expect(edges).toContainEqual(
      expect.objectContaining({ from: "1", to: "2" })
    );
    expect(edges).toContainEqual(
      expect.objectContaining({ from: "1", to: "3" })
    );
    expect(edges).toContainEqual(
      expect.objectContaining({ from: "2", to: "3" })
    );
  });
});

// ─── getUnblockedTasks ──────────────────────────────────────────────────────

describe("getUnblockedTasks", () => {
  it("returns tasks with no dependencies as immediately unblocked", () => {
    const tasks = [makeTask("1"), makeTask("2")];
    const state = makeState(tasks);
    const unblocked = getUnblockedTasks(state);
    expect(unblocked.map((t) => t.id).sort()).toEqual(["1", "2"]);
  });

  it("does not return tasks whose dependencies are incomplete", () => {
    const tasks = [makeTask("1"), makeTask("2", ["1"])];
    const state = makeState(tasks);
    const unblocked = getUnblockedTasks(state);
    expect(unblocked.map((t) => t.id)).toEqual(["1"]);
  });

  it("returns dependent tasks once their deps are in completed set", () => {
    const tasks = [makeTask("1"), makeTask("2", ["1"])];
    const state = makeState(tasks, ["1"]);
    const unblocked = getUnblockedTasks(state);
    expect(unblocked.map((t) => t.id)).toContain("2");
  });

  it("handles diamond dependencies", () => {
    const tasks = [
      makeTask("1"),
      makeTask("2", ["1"]),
      makeTask("3", ["1"]),
      makeTask("4", ["2", "3"]),
    ];
    // Only 1 completed
    const state1 = makeState(tasks, ["1"]);
    const unblocked1 = getUnblockedTasks(state1);
    expect(unblocked1.map((t) => t.id).sort()).toEqual(["2", "3"]);

    // 1 and 2 completed — 4 still blocked on 3
    const state2 = makeState(tasks, ["1", "2"]);
    const unblocked2 = getUnblockedTasks(state2);
    expect(unblocked2.map((t) => t.id)).toContain("3");
    expect(unblocked2.map((t) => t.id)).not.toContain("4");

    // 1, 2, 3 completed — 4 now unblocked
    const state3 = makeState(tasks, ["1", "2", "3"]);
    const unblocked3 = getUnblockedTasks(state3);
    expect(unblocked3.map((t) => t.id)).toContain("4");
  });

  it("excludes already-completed tasks from unblocked list", () => {
    const tasks = [makeTask("1"), makeTask("2", ["1"])];
    const state = makeState(tasks, ["1"]);
    const unblocked = getUnblockedTasks(state);
    expect(unblocked.map((t) => t.id)).not.toContain("1");
  });

  it("excludes already-running tasks from unblocked list", () => {
    const tasks = [makeTask("1"), makeTask("2")];
    const state = makeState(tasks);
    state.running.set("1", {
      agentName: "backend",
      task: tasks[0],
      status: "running",
      startedAt: Date.now(),
      lastHeartbeat: Date.now(),
      retryCount: 0,
    });
    const unblocked = getUnblockedTasks(state);
    expect(unblocked.map((t) => t.id)).not.toContain("1");
    expect(unblocked.map((t) => t.id)).toContain("2");
  });
});

// ─── processHandoff ─────────────────────────────────────────────────────────

describe("processHandoff", () => {
  it("returns null when no tasks are newly unblocked", () => {
    const tasks = [makeTask("1"), makeTask("2", ["1"])];
    const state = makeState(tasks);
    // Task 1 not completed yet, so completing nothing triggers nothing
    const trigger = processHandoff("999", state);
    expect(trigger).toBeNull();
  });

  it("returns unblocked tasks when a dependency completes", () => {
    const tasks = [makeTask("1"), makeTask("2", ["1"]), makeTask("3", ["1"])];
    const state = makeState(tasks, ["1"]);
    const trigger = processHandoff("1", state);
    expect(trigger).not.toBeNull();
    expect(trigger!.unblockedTasks.map((t) => t.id).sort()).toEqual(["2", "3"]);
  });
});
