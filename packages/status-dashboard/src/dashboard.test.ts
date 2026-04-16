import { describe, test, expect } from "bun:test";
import { renderDashboard } from "./dashboard.js";
import type { DashboardState } from "./dashboard.js";

const EMPTY_STATE: DashboardState = {
  phase: "Phase 1: Foundation",
  phaseProgress: 0,
  agents: [],
  features: [],
  investorUpdates: [],
  cost: { totalTokens: 0, totalCostUsd: 0, byAgent: {} },
};

describe("renderDashboard", () => {
  test("renders header and phase for empty state", () => {
    const output = renderDashboard(EMPTY_STATE);
    expect(output).toContain("Startup Harness Status");
    expect(output).toContain("Phase 1: Foundation");
    expect(output).toContain("0%");
  });

  test("renders agents when present", () => {
    const state: DashboardState = {
      ...EMPTY_STATE,
      agents: [
        { name: "builder", state: "running", currentTask: "Building UI", tokenSpend: 1000 },
        { name: "reviewer", state: "idle", currentTask: "", tokenSpend: 500 },
      ],
    };
    const output = renderDashboard(state);
    expect(output).toContain("builder");
    expect(output).toContain("reviewer");
    expect(output).toContain("Building UI");
  });

  test("renders feature progress grouped by category", () => {
    const state: DashboardState = {
      ...EMPTY_STATE,
      features: [
        { name: "Auth", category: "core", done: 3, total: 5, status: "in-progress" },
        { name: "Search", category: "core", done: 1, total: 4, status: "started" },
      ],
    };
    const output = renderDashboard(state);
    expect(output).toContain("core");
    expect(output).toContain("Auth");
    expect(output).toContain("Search");
  });

  test("renders cost summary", () => {
    const state: DashboardState = {
      ...EMPTY_STATE,
      cost: { totalTokens: 50000, totalCostUsd: 1.25, byAgent: { builder: 30000 } },
    };
    const output = renderDashboard(state);
    expect(output).toContain("50,000");
    expect(output).toContain("$1.25");
    expect(output).toContain("builder");
  });
});

describe("renderDashboard output format", () => {
  test("includes separator lines", () => {
    const output = renderDashboard(EMPTY_STATE);
    expect(output).toContain("=".repeat(50));
  });

  test("includes cost section even when zero", () => {
    const output = renderDashboard(EMPTY_STATE);
    expect(output).toContain("Cost Summary");
    expect(output).toContain("$0.00");
  });
});
