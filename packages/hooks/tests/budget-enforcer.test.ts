import { describe, it, expect, beforeEach, vi } from "vitest";
import { createBudgetEnforcer } from "../src/budget-enforcer.js";

describe("budget-enforcer", () => {
  let enforcer: ReturnType<typeof createBudgetEnforcer>;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should track turn count", () => {
    enforcer = createBudgetEnforcer({ maxTurns: 100, maxMinutes: 60 });

    enforcer.handleToolCall({ tool_name: "Edit", tool_input: {} });
    enforcer.handleToolCall({ tool_name: "Bash", tool_input: {} });
    enforcer.handleToolCall({ tool_name: "Read", tool_input: {} });

    expect(enforcer.getTurnCount()).toBe(3);
  });

  it("should stop when maxTurns exceeded", () => {
    enforcer = createBudgetEnforcer({ maxTurns: 3, maxMinutes: 60 });

    enforcer.handleToolCall({ tool_name: "Edit", tool_input: {} });
    enforcer.handleToolCall({ tool_name: "Bash", tool_input: {} });
    enforcer.handleToolCall({ tool_name: "Read", tool_input: {} });

    const result = enforcer.handleToolCall({ tool_name: "Edit", tool_input: {} });
    expect(result.decision).toBe("DENY");
    expect(result.message).toContain("turn limit");
    expect(result.message).toContain("3");
  });

  it("should ALLOW when under maxTurns", () => {
    enforcer = createBudgetEnforcer({ maxTurns: 10, maxMinutes: 60 });

    const result = enforcer.handleToolCall({ tool_name: "Edit", tool_input: {} });
    expect(result).toEqual({ decision: "ALLOW" });
  });

  it("should track wall-clock time", () => {
    enforcer = createBudgetEnforcer({ maxTurns: 100, maxMinutes: 60 });

    expect(enforcer.getElapsedMinutes()).toBeGreaterThanOrEqual(0);
    expect(enforcer.getElapsedMinutes()).toBeLessThan(1);
  });

  it("should stop when time limit exceeded", () => {
    const pastStart = Date.now() - 61 * 60 * 1000;
    enforcer = createBudgetEnforcer({ maxTurns: 100, maxMinutes: 60, startTime: pastStart });

    const result = enforcer.handleToolCall({ tool_name: "Edit", tool_input: {} });
    expect(result.decision).toBe("DENY");
    expect(result.message).toContain("time limit");
    expect(result.message).toContain("60");
  });

  it("should read limits from agent config JSON", () => {
    const config = { maxTurns: 25, maxMinutes: 30 };
    enforcer = createBudgetEnforcer(config);

    expect(enforcer.getConfig().maxTurns).toBe(25);
    expect(enforcer.getConfig().maxMinutes).toBe(30);
  });

  it("should use defaults when no config found", () => {
    enforcer = createBudgetEnforcer();

    expect(enforcer.getConfig().maxTurns).toBe(200);
    expect(enforcer.getConfig().maxMinutes).toBe(120);
  });

  it("should not count past limit after first denial", () => {
    enforcer = createBudgetEnforcer({ maxTurns: 2, maxMinutes: 60 });

    enforcer.handleToolCall({ tool_name: "Edit", tool_input: {} });
    enforcer.handleToolCall({ tool_name: "Bash", tool_input: {} });
    enforcer.handleToolCall({ tool_name: "Read", tool_input: {} });
    enforcer.handleToolCall({ tool_name: "Edit", tool_input: {} });

    expect(enforcer.getTurnCount()).toBe(2);
  });
});
