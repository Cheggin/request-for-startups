import { describe, it, expect } from "bun:test";
import {
  createCommanderState,
  ingestIssues,
  runTick,
} from "../src/index.js";
import type { Task, CommanderState } from "../src/types.js";
import type { Issue } from "@startup-harness/github-state";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeIssue(number: number, overrides: Partial<Issue> = {}): Issue {
  return {
    number,
    title: `Issue ${number}`,
    body: "Test body",
    state: "open",
    labels: [],
    assignees: [],
    url: `https://github.com/test/repo/issues/${number}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── createCommanderState ───────────────────────────────────────────────────

describe("createCommanderState", () => {
  it("creates an empty state", () => {
    const state = createCommanderState();
    expect(state.tasks.size).toBe(0);
    expect(state.running.size).toBe(0);
    expect(state.completed.size).toBe(0);
    expect(state.dependencies).toEqual([]);
    expect(state.tick).toBe(0);
  });
});

// ─── ingestIssues ───────────────────────────────────────────────────────────

describe("ingestIssues", () => {
  it("adds new issues as tasks", () => {
    const state = createCommanderState();
    const issues = [makeIssue(1), makeIssue(2)];
    const events: any[] = [];
    ingestIssues(state, issues, (e) => events.push(e));
    expect(state.tasks.size).toBe(2);
    expect(events.filter((e) => e.type === "task_ingested")).toHaveLength(2);
  });

  it("skips issues already in state", () => {
    const state = createCommanderState();
    const issues = [makeIssue(1)];
    ingestIssues(state, issues);
    ingestIssues(state, issues);
    expect(state.tasks.size).toBe(1);
  });

  it("skips closed issues", () => {
    const state = createCommanderState();
    const issues = [makeIssue(1, { state: "closed" })];
    ingestIssues(state, issues);
    expect(state.tasks.size).toBe(0);
  });
});

// ─── runTick ────────────────────────────────────────────────────────────────

describe("runTick", () => {
  it("increments tick counter", () => {
    const state = createCommanderState();
    const events: any[] = [];
    runTick(state, (e) => events.push(e));
    expect(state.tick).toBe(1);
    expect(events.some((e) => e.type === "loop_tick")).toBe(true);
  });

  it("classifies and dispatches unblocked tasks", () => {
    const state = createCommanderState();
    const task: Task = {
      id: "1",
      title: "Build REST API endpoint",
      body: "Create a new API endpoint",
      source: "github_issue",
      labels: ["backend"],
      filePaths: [],
      dependsOn: [],
    };
    state.tasks.set("1", task);

    const events: any[] = [];
    runTick(state, (e) => events.push(e));

    expect(events.some((e) => e.type === "task_classified")).toBe(true);
    expect(events.some((e) => e.type === "agent_dispatched")).toBe(true);
    expect(state.running.has("1")).toBe(true);
  });

  it("does not dispatch tasks with unmet dependencies", () => {
    const state = createCommanderState();
    const task1: Task = {
      id: "1",
      title: "Backend API",
      body: "",
      source: "github_issue",
      labels: ["backend"],
      filePaths: [],
      dependsOn: [],
    };
    const task2: Task = {
      id: "2",
      title: "Frontend UI",
      body: "",
      source: "github_issue",
      labels: ["website"],
      filePaths: [],
      dependsOn: ["1"],
    };
    state.tasks.set("1", task1);
    state.tasks.set("2", task2);
    state.dependencies = [{ from: "1", to: "2", provides: "API" }];

    const events: any[] = [];
    runTick(state, (e) => events.push(e));

    // Task 1 dispatched, task 2 not
    const dispatched = events.filter((e) => e.type === "agent_dispatched");
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].taskId).toBe("1");
  });

  it("detects stuck agents and marks them", () => {
    const state = createCommanderState();
    const task: Task = {
      id: "1",
      title: "Stuck task",
      body: "",
      source: "github_issue",
      labels: ["backend"],
      filePaths: [],
      dependsOn: [],
    };
    state.tasks.set("1", task);
    state.running.set("1", {
      agentName: "backend",
      task,
      status: "running",
      startedAt: Date.now() - 48 * 60 * 60 * 1000,
      lastHeartbeat: Date.now() - 48 * 60 * 60 * 1000,
      retryCount: 0,
    });

    const events: any[] = [];
    runTick(state, (e) => events.push(e));

    expect(events.some((e) => e.type === "agent_stuck")).toBe(true);
  });
});
