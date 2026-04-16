import { describe, it, expect } from "bun:test";
import { generateRecommendations } from "./recommendations.js";
import type { AgentMetrics } from "./types.js";

function makeMetrics(overrides: Partial<AgentMetrics> = {}): AgentMetrics {
  return {
    agent: "backend",
    taskCount: 20,
    avgTurnsPerTask: 100,
    avgCostPerTask: 1.0,
    avgDurationMs: 120000,
    errorRate: 0.1,
    retryRate: 0.2,
    budgetHitRate: 0.0,
    avgMaxTurns: 200,
    avgQualityScore: null,
    currentModel: null,
    ...overrides,
  };
}

describe("generateRecommendations", () => {
  it("suggests adding hooks when error rate is high", () => {
    const metrics = [makeMetrics({ errorRate: 0.35 })];
    const recs = generateRecommendations(metrics);

    const addHooks = recs.find((r) => r.type === "add_hooks");
    expect(addHooks).toBeDefined();
    expect(addHooks!.description).toContain("35%");
  });

  it("does not suggest hooks when error rate is low", () => {
    const metrics = [makeMetrics({ errorRate: 0.05 })];
    const recs = generateRecommendations(metrics);

    expect(recs.find((r) => r.type === "add_hooks")).toBeUndefined();
  });

  it("suggests downgrading model when cost is high and quality is good", () => {
    const metrics = [
      makeMetrics({
        avgCostPerTask: 3.5,
        avgQualityScore: 0.9,
        currentModel: "opus",
      }),
    ];
    const recs = generateRecommendations(metrics);

    const downgrade = recs.find((r) => r.type === "downgrade_model");
    expect(downgrade).toBeDefined();
    expect(downgrade!.suggestedChange.from).toBe("opus");
    expect(downgrade!.suggestedChange.to).toBe("sonnet");
  });

  it("does not suggest downgrading cheapest model", () => {
    const metrics = [
      makeMetrics({
        avgCostPerTask: 3.5,
        avgQualityScore: 0.9,
        currentModel: "haiku",
      }),
    ];
    const recs = generateRecommendations(metrics);

    expect(recs.find((r) => r.type === "downgrade_model")).toBeUndefined();
  });

  it("suggests upgrading model when cost is low and quality is poor", () => {
    const metrics = [
      makeMetrics({
        avgCostPerTask: 0.05,
        avgQualityScore: 0.3,
        currentModel: "haiku",
      }),
    ];
    const recs = generateRecommendations(metrics);

    const upgrade = recs.find((r) => r.type === "upgrade_model");
    expect(upgrade).toBeDefined();
    expect(upgrade!.suggestedChange.from).toBe("haiku");
    expect(upgrade!.suggestedChange.to).toBe("sonnet");
  });

  it("does not suggest upgrading most expensive model", () => {
    const metrics = [
      makeMetrics({
        avgCostPerTask: 0.05,
        avgQualityScore: 0.3,
        currentModel: "opus",
      }),
    ];
    const recs = generateRecommendations(metrics);

    expect(recs.find((r) => r.type === "upgrade_model")).toBeUndefined();
  });

  it("returns recommendations sorted by confidence (highest first)", () => {
    const metrics = [
      makeMetrics({
        agent: "agent-a",
        errorRate: 0.5,
        avgCostPerTask: 0.05,
        avgQualityScore: 0.3,
        currentModel: "haiku",
      }),
    ];
    const recs = generateRecommendations(metrics);

    for (let i = 1; i < recs.length; i++) {
      expect(recs[i].confidence).toBeLessThanOrEqual(recs[i - 1].confidence);
    }
  });

  it("handles multiple agents independently", () => {
    const metrics = [
      makeMetrics({ agent: "alpha", errorRate: 0.5 }),
      makeMetrics({
        agent: "beta",
        avgCostPerTask: 0.05,
        avgQualityScore: 0.3,
        currentModel: "haiku",
      }),
    ];
    const recs = generateRecommendations(metrics);

    expect(recs.find((r) => r.agent === "alpha" && r.type === "add_hooks")).toBeDefined();
    expect(recs.find((r) => r.agent === "beta" && r.type === "upgrade_model")).toBeDefined();
  });

  it("returns empty array when no issues found", () => {
    const metrics = [makeMetrics()];
    const recs = generateRecommendations(metrics);
    expect(recs).toHaveLength(0);
  });
});
