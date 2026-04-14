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
  it("suggests lowering maxTurns when agent underuses turns", () => {
    const metrics = [makeMetrics({ avgTurnsPerTask: 30, avgMaxTurns: 200 })];
    const recs = generateRecommendations(metrics);

    const lowerTurns = recs.find((r) => r.type === "lower_max_turns");
    expect(lowerTurns).toBeDefined();
    expect(lowerTurns!.agent).toBe("backend");
    expect(lowerTurns!.suggestedChange.to).toBe(45); // ceil(30 * 1.5)
    expect(lowerTurns!.confidence).toBeGreaterThan(0);
    expect(lowerTurns!.evidence.length).toBeGreaterThan(0);
  });

  it("does not suggest lowering when turns are well-utilized", () => {
    const metrics = [makeMetrics({ avgTurnsPerTask: 150, avgMaxTurns: 200 })];
    const recs = generateRecommendations(metrics);

    expect(recs.find((r) => r.type === "lower_max_turns")).toBeUndefined();
  });

  it("suggests raising maxTurns when agent frequently hits budget", () => {
    const metrics = [makeMetrics({ budgetHitRate: 0.5, avgMaxTurns: 200 })];
    const recs = generateRecommendations(metrics);

    const raiseTurns = recs.find((r) => r.type === "raise_max_turns");
    expect(raiseTurns).toBeDefined();
    expect(raiseTurns!.suggestedChange.to).toBe(300); // ceil(200 * 1.5)
  });

  it("does not suggest raising when budget hits are rare", () => {
    const metrics = [makeMetrics({ budgetHitRate: 0.1 })];
    const recs = generateRecommendations(metrics);

    expect(recs.find((r) => r.type === "raise_max_turns")).toBeUndefined();
  });

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
        avgTurnsPerTask: 10,
        avgMaxTurns: 200,
        errorRate: 0.5,
      }),
    ];
    const recs = generateRecommendations(metrics);

    for (let i = 1; i < recs.length; i++) {
      expect(recs[i].confidence).toBeLessThanOrEqual(recs[i - 1].confidence);
    }
  });

  it("handles multiple agents independently", () => {
    const metrics = [
      makeMetrics({ agent: "alpha", avgTurnsPerTask: 20, avgMaxTurns: 200 }),
      makeMetrics({ agent: "beta", budgetHitRate: 0.6, avgMaxTurns: 100 }),
    ];
    const recs = generateRecommendations(metrics);

    expect(recs.find((r) => r.agent === "alpha" && r.type === "lower_max_turns")).toBeDefined();
    expect(recs.find((r) => r.agent === "beta" && r.type === "raise_max_turns")).toBeDefined();
  });

  it("returns empty array when no issues found", () => {
    const metrics = [makeMetrics({ avgTurnsPerTask: 150, avgMaxTurns: 200 })];
    const recs = generateRecommendations(metrics);
    expect(recs).toHaveLength(0);
  });
});
