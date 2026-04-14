/**
 * Tests for lib/state.ts — state management functions.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync, existsSync } from "fs";
import { join } from "path";
import {
  loadState,
  saveState,
  updateState,
  addFeature,
  updateFeature,
  getFeaturesByStatus,
  recordAgentActivity,
  type HarnessState,
} from "../src/lib/state.js";

const TEST_DIR = join(import.meta.dir, ".test-state-fixtures");
const STATE_FILE = join(TEST_DIR, "state.json");

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

describe("loadState", () => {
  test("returns default state when file does not exist", () => {
    const state = loadState("/nonexistent/state.json");
    expect(state.phase).toBe("onboarding");
    expect(state.features).toEqual([]);
    expect(state.agents).toEqual([]);
    expect(state.totalCostUsd).toBe(0);
    expect(state.completedLoops).toBe(0);
  });

  test("loads saved state", () => {
    const original: HarnessState = {
      phase: "build",
      initializedAt: "2026-01-01T00:00:00.000Z",
      lastActivityAt: "2026-01-02T00:00:00.000Z",
      features: [{ name: "auth", status: "done", assignee: "backend", issueNumber: 1, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" }],
      agents: [],
      totalCostUsd: 5.50,
      completedLoops: 3,
      meta: { note: "test" },
    };
    saveState(original, STATE_FILE);

    const loaded = loadState(STATE_FILE);
    expect(loaded.phase).toBe("build");
    expect(loaded.features).toHaveLength(1);
    expect(loaded.features[0].name).toBe("auth");
    expect(loaded.totalCostUsd).toBe(5.50);
    expect(loaded.completedLoops).toBe(3);
  });
});

describe("saveState", () => {
  test("creates parent directory if needed", () => {
    const deepPath = join(TEST_DIR, "deep", "nested", "state.json");
    const state = loadState("/nonexistent");
    saveState(state, deepPath);

    const loaded = loadState(deepPath);
    expect(loaded.phase).toBe("onboarding");
  });

  test("atomic write (no corruption on concurrent access)", () => {
    const state = loadState(STATE_FILE);
    state.phase = "build";
    saveState(state, STATE_FILE);

    // Should not leave tmp files
    const files = require("fs").readdirSync(TEST_DIR);
    const tmpFiles = files.filter((f: string) => f.includes(".tmp."));
    expect(tmpFiles).toHaveLength(0);
  });
});

describe("updateState", () => {
  test("merges partial updates", () => {
    saveState(loadState(STATE_FILE), STATE_FILE);

    const updated = updateState({ phase: "deploy" }, STATE_FILE);
    expect(updated.phase).toBe("deploy");
    // Should preserve defaults
    expect(updated.features).toEqual([]);
  });

  test("updates lastActivityAt", () => {
    const before = new Date().toISOString();
    saveState(loadState(STATE_FILE), STATE_FILE);

    const updated = updateState({ completedLoops: 5 }, STATE_FILE);
    expect(updated.completedLoops).toBe(5);
    expect(new Date(updated.lastActivityAt).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime()
    );
  });
});

describe("addFeature", () => {
  test("adds a feature with default status", () => {
    saveState(loadState(STATE_FILE), STATE_FILE);

    const feature = addFeature("auth-flow", STATE_FILE);
    expect(feature.name).toBe("auth-flow");
    expect(feature.status).toBe("todo");
    expect(feature.assignee).toBeNull();

    const state = loadState(STATE_FILE);
    expect(state.features).toHaveLength(1);
  });

  test("adds multiple features", () => {
    saveState(loadState(STATE_FILE), STATE_FILE);

    addFeature("auth", STATE_FILE);
    addFeature("payments", STATE_FILE);
    addFeature("dashboard", STATE_FILE);

    const state = loadState(STATE_FILE);
    expect(state.features).toHaveLength(3);
  });
});

describe("updateFeature", () => {
  test("updates feature status", () => {
    saveState(loadState(STATE_FILE), STATE_FILE);
    addFeature("auth", STATE_FILE);

    const updated = updateFeature("auth", { status: "in-progress" }, STATE_FILE);
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("in-progress");
  });

  test("updates feature assignee", () => {
    saveState(loadState(STATE_FILE), STATE_FILE);
    addFeature("auth", STATE_FILE);

    const updated = updateFeature("auth", { assignee: "backend" }, STATE_FILE);
    expect(updated).not.toBeNull();
    expect(updated!.assignee).toBe("backend");
  });

  test("returns null for nonexistent feature", () => {
    saveState(loadState(STATE_FILE), STATE_FILE);

    const result = updateFeature("nonexistent", { status: "done" }, STATE_FILE);
    expect(result).toBeNull();
  });
});

describe("getFeaturesByStatus", () => {
  test("returns all features when status is null", () => {
    saveState(loadState(STATE_FILE), STATE_FILE);
    addFeature("a", STATE_FILE);
    addFeature("b", STATE_FILE);

    const features = getFeaturesByStatus(null, STATE_FILE);
    expect(features).toHaveLength(2);
  });

  test("filters by status", () => {
    saveState(loadState(STATE_FILE), STATE_FILE);
    addFeature("a", STATE_FILE);
    addFeature("b", STATE_FILE);
    updateFeature("a", { status: "done" }, STATE_FILE);

    const done = getFeaturesByStatus("done", STATE_FILE);
    expect(done).toHaveLength(1);
    expect(done[0].name).toBe("a");

    const todo = getFeaturesByStatus("todo", STATE_FILE);
    expect(todo).toHaveLength(1);
    expect(todo[0].name).toBe("b");
  });
});

describe("recordAgentActivity", () => {
  test("creates new agent record", () => {
    saveState(loadState(STATE_FILE), STATE_FILE);

    recordAgentActivity("backend", { status: "running", currentTask: "build auth" }, STATE_FILE);

    const state = loadState(STATE_FILE);
    expect(state.agents).toHaveLength(1);
    expect(state.agents[0].name).toBe("backend");
    expect(state.agents[0].status).toBe("running");
    expect(state.agents[0].currentTask).toBe("build auth");
  });

  test("updates existing agent record", () => {
    saveState(loadState(STATE_FILE), STATE_FILE);

    recordAgentActivity("backend", { status: "running", currentTask: "task 1" }, STATE_FILE);
    recordAgentActivity("backend", { status: "idle", currentTask: null, totalTurns: 50 }, STATE_FILE);

    const state = loadState(STATE_FILE);
    expect(state.agents).toHaveLength(1);
    expect(state.agents[0].status).toBe("idle");
    expect(state.agents[0].currentTask).toBeNull();
    expect(state.agents[0].totalTurns).toBe(50);
  });
});
