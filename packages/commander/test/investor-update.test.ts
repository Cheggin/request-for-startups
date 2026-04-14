import { describe, it, expect } from "bun:test";
import {
  gatherAgentProgress,
  buildInvestorUpdate,
  formatSlackBlocks,
} from "../src/investor-update.js";
import type { RunningAgent, Task, CommanderState } from "../src/types.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeTask(id: string, labels: string[] = []): Task {
  return {
    id,
    title: `Task ${id}`,
    body: "",
    source: "github_issue",
    labels,
    filePaths: [],
    dependsOn: [],
  };
}

function makeRunning(
  taskId: string,
  agent: "website" | "backend" | "growth" | "writing" | "ops",
  status: "running" | "completed" | "failed" = "running"
): RunningAgent {
  return {
    agentName: agent,
    task: makeTask(taskId),
    status,
    startedAt: Date.now(),
    lastHeartbeat: Date.now(),
    retryCount: 0,
  };
}

function makeState(): CommanderState {
  return {
    tasks: new Map([
      ["1", makeTask("1")],
      ["2", makeTask("2")],
      ["3", makeTask("3")],
      ["4", makeTask("4")],
    ]),
    running: new Map([
      ["1", makeRunning("1", "backend", "completed")],
      ["2", makeRunning("2", "backend", "running")],
      ["3", makeRunning("3", "website", "completed")],
      ["4", makeRunning("4", "website", "failed")],
    ]),
    completed: new Set(["1", "3"]),
    dependencies: [],
    tick: 5,
  };
}

// ─── gatherAgentProgress ────────────────────────────────────────────────────

describe("gatherAgentProgress", () => {
  it("aggregates counts per agent", () => {
    const state = makeState();
    const progress = gatherAgentProgress(state);

    const backend = progress.find((p) => p.agent === "backend");
    expect(backend).toBeDefined();
    expect(backend!.tasksCompleted).toBe(1);
    expect(backend!.tasksInProgress).toBe(1);
    expect(backend!.tasksFailed).toBe(0);

    const website = progress.find((p) => p.agent === "website");
    expect(website).toBeDefined();
    expect(website!.tasksCompleted).toBe(1);
    expect(website!.tasksInProgress).toBe(0);
    expect(website!.tasksFailed).toBe(1);
  });

  it("returns empty array for empty state", () => {
    const state: CommanderState = {
      tasks: new Map(),
      running: new Map(),
      completed: new Set(),
      dependencies: [],
      tick: 0,
    };
    const progress = gatherAgentProgress(state);
    expect(progress).toHaveLength(0);
  });
});

// ─── buildInvestorUpdate ────────────────────────────────────────────────────

describe("buildInvestorUpdate", () => {
  it("produces a structured update with all fields", () => {
    const state = makeState();
    const update = buildInvestorUpdate(state, {
      blockers: ["Waiting on API key"],
      nextPriorities: ["Ship auth flow"],
      metricsSnapshot: { signups: 42 },
    });

    expect(update.generatedAt).toBeTruthy();
    expect(update.agentProgress.length).toBeGreaterThan(0);
    expect(update.blockers).toEqual(["Waiting on API key"]);
    expect(update.nextPriorities).toEqual(["Ship auth flow"]);
    expect(update.metricsSnapshot.signups).toBe(42);
  });

  it("defaults to empty arrays for optional fields", () => {
    const state = makeState();
    const update = buildInvestorUpdate(state);
    expect(update.blockers).toEqual([]);
    expect(update.nextPriorities).toEqual([]);
  });
});

// ─── formatSlackBlocks ──────────────────────────────────────────────────────

describe("formatSlackBlocks", () => {
  it("produces valid Slack block structure", () => {
    const state = makeState();
    const update = buildInvestorUpdate(state);
    const blocks = formatSlackBlocks(update);

    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThan(0);

    // First block should be header
    expect(blocks[0].type).toBe("header");

    // Should contain section blocks with agent progress
    const sections = blocks.filter((b: any) => b.type === "section");
    expect(sections.length).toBeGreaterThan(0);
  });

  it("includes blockers section when blockers exist", () => {
    const state = makeState();
    const update = buildInvestorUpdate(state, {
      blockers: ["Blocked on DNS"],
    });
    const blocks = formatSlackBlocks(update);
    const text = JSON.stringify(blocks);
    expect(text).toContain("Blocked on DNS");
  });

  it("includes next priorities when provided", () => {
    const state = makeState();
    const update = buildInvestorUpdate(state, {
      nextPriorities: ["Launch MVP"],
    });
    const blocks = formatSlackBlocks(update);
    const text = JSON.stringify(blocks);
    expect(text).toContain("Launch MVP");
  });
});
