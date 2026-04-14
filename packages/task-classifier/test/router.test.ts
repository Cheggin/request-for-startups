import { describe, test, expect } from "bun:test";
import { routeTask } from "../src/router.js";

describe("routeTask", () => {
  // ─── Trivial → direct ───────────────────────────────────────────────────────

  test("trivial task → direct strategy with no agent", () => {
    const result = routeTask("trivial");
    expect(result.strategy).toBe("direct");
    expect(result.agent).toBeNull();
    expect(result.agents).toBeUndefined();
    expect(result.teamSize).toBeUndefined();
  });

  // ─── Moderate → single-agent ────────────────────────────────────────────────

  test("moderate task → single-agent strategy", () => {
    const result = routeTask("moderate");
    expect(result.strategy).toBe("single-agent");
    expect(result.agent).toBe("builder");
    expect(result.agents).toBeUndefined();
    expect(result.teamSize).toBeUndefined();
  });

  test("moderate task with agent hint uses that agent", () => {
    const result = routeTask("moderate", { agentHint: "backend" });
    expect(result.strategy).toBe("single-agent");
    expect(result.agent).toBe("backend");
  });

  // ─── Complex → team ─────────────────────────────────────────────────────────

  test("complex task → team strategy with multiple agents", () => {
    const result = routeTask("complex");
    expect(result.strategy).toBe("team");
    expect(result.agent).toBeNull();
    expect(result.agents).toBeDefined();
    expect(result.agents!.length).toBeGreaterThanOrEqual(2);
    expect(result.teamSize).toBe(result.agents!.length);
  });

  test("complex task with agent hints uses those agents", () => {
    const result = routeTask("complex", {
      agentHints: ["backend", "frontend", "ops"],
    });
    expect(result.strategy).toBe("team");
    expect(result.agents).toEqual(["backend", "frontend", "ops"]);
    expect(result.teamSize).toBe(3);
  });

  // ─── Edge cases ─────────────────────────────────────────────────────────────

  test("complex task with single agent hint still forms team with default additions", () => {
    const result = routeTask("complex", { agentHints: ["backend"] });
    expect(result.strategy).toBe("team");
    expect(result.agents).toBeDefined();
    expect(result.agents!).toContain("backend");
    expect(result.agents!.length).toBeGreaterThanOrEqual(2);
  });
});
