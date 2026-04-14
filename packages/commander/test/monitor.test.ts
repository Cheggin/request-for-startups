import { describe, it, expect } from "bun:test";
import { checkAgent, detectStuckAgents, shouldReassign } from "../src/monitor.js";
import type { RunningAgent, Task } from "../src/types.js";
import { MAX_AGENT_FAILURES, STALE_THRESHOLD_HOURS } from "../src/constants.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeTask(): Task {
  return {
    id: "1",
    title: "Test task",
    body: "",
    source: "github_issue",
    labels: [],
    filePaths: [],
    dependsOn: [],
  };
}

function makeRunning(overrides: Partial<RunningAgent> = {}): RunningAgent {
  const now = Date.now();
  return {
    agentName: "backend",
    task: makeTask(),
    status: "running",
    startedAt: now,
    lastHeartbeat: now,
    retryCount: 0,
    ...overrides,
  };
}

// ─── checkAgent ─────────────────────────────────────────────────────────────

describe("checkAgent", () => {
  it("returns running for a recently active agent", () => {
    const agent = makeRunning({ lastHeartbeat: Date.now() });
    const status = checkAgent(agent);
    expect(status).toBe("running");
  });

  it("returns stuck for an agent past the stale threshold", () => {
    const staleTime = Date.now() - (STALE_THRESHOLD_HOURS + 1) * 60 * 60 * 1000;
    const agent = makeRunning({ lastHeartbeat: staleTime });
    const status = checkAgent(agent);
    expect(status).toBe("stuck");
  });

  it("returns completed for an agent that already completed", () => {
    const agent = makeRunning({ status: "completed" });
    const status = checkAgent(agent);
    expect(status).toBe("completed");
  });

  it("returns failed for an agent that already failed", () => {
    const agent = makeRunning({ status: "failed" });
    const status = checkAgent(agent);
    expect(status).toBe("failed");
  });
});

// ─── detectStuckAgents ──────────────────────────────────────────────────────

describe("detectStuckAgents", () => {
  it("returns empty for all-healthy agents", () => {
    const agents = new Map([
      ["1", makeRunning({ lastHeartbeat: Date.now() })],
      ["2", makeRunning({ lastHeartbeat: Date.now() })],
    ]);
    const stuck = detectStuckAgents(agents);
    expect(stuck).toHaveLength(0);
  });

  it("finds agents past the stale threshold", () => {
    const staleTime = Date.now() - (STALE_THRESHOLD_HOURS + 1) * 60 * 60 * 1000;
    const agents = new Map([
      ["1", makeRunning({ lastHeartbeat: Date.now() })],
      ["2", makeRunning({ lastHeartbeat: staleTime })],
    ]);
    const stuck = detectStuckAgents(agents);
    expect(stuck).toHaveLength(1);
    expect(stuck[0]).toBe("2");
  });

  it("ignores already-completed or already-failed agents", () => {
    const staleTime = Date.now() - (STALE_THRESHOLD_HOURS + 1) * 60 * 60 * 1000;
    const agents = new Map([
      ["1", makeRunning({ status: "completed", lastHeartbeat: staleTime })],
      ["2", makeRunning({ status: "failed", lastHeartbeat: staleTime })],
    ]);
    const stuck = detectStuckAgents(agents);
    expect(stuck).toHaveLength(0);
  });
});

// ─── shouldReassign ─────────────────────────────────────────────────────────

describe("shouldReassign", () => {
  it("returns true when retry count is under the max", () => {
    const agent = makeRunning({ retryCount: 0 });
    expect(shouldReassign(agent)).toBe(true);
  });

  it("returns true at max - 1 retries", () => {
    const agent = makeRunning({ retryCount: MAX_AGENT_FAILURES - 1 });
    expect(shouldReassign(agent)).toBe(true);
  });

  it("returns false when retry count equals the max", () => {
    const agent = makeRunning({ retryCount: MAX_AGENT_FAILURES });
    expect(shouldReassign(agent)).toBe(false);
  });

  it("returns false when retry count exceeds the max", () => {
    const agent = makeRunning({ retryCount: MAX_AGENT_FAILURES + 1 });
    expect(shouldReassign(agent)).toBe(false);
  });
});
