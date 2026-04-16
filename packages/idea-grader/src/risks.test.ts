import { describe, it, expect } from "vitest";
import { detectRisks } from "./risks.js";
import type { ScoreBreakdown } from "./types.js";

const baseBreakdown: ScoreBreakdown = {
  problemClarity: 15,
  marketSize: 12,
  differentiation: 10,
  feasibility: 14,
  founderMarketFit: 12,
};

describe("detectRisks", () => {
  it("flags too-broad-audience when targeting everyone", () => {
    const risks = detectRisks("An app for everyone in the world", "everyone", "b2c", baseBreakdown);
    expect(risks.some((r) => r.id === "too-broad-audience")).toBe(true);
  });

  it("flags no-revenue-model when no monetization mentioned", () => {
    const risks = detectRisks("A tool that does stuff", "developers", "devtool", baseBreakdown);
    expect(risks.some((r) => r.id === "no-revenue-model")).toBe(true);
  });

  it("does not flag no-revenue-model when subscription mentioned", () => {
    const risks = detectRisks("A SaaS tool with subscription pricing", "teams", "b2b-saas", baseBreakdown);
    expect(risks.some((r) => r.id === "no-revenue-model")).toBe(false);
  });

  it("flags hardware-dependency for hardware ideas", () => {
    const risks = detectRisks("A wearable device with sensors for health", "consumers", "b2c", baseBreakdown);
    expect(risks.some((r) => r.id === "hardware-dependency")).toBe(true);
  });

  it("flags deep-tech-risk for quantum/biotech", () => {
    const risks = detectRisks("Quantum computing platform for gene therapy", "researchers", "b2c", baseBreakdown);
    expect(risks.some((r) => r.id === "deep-tech-risk")).toBe(true);
  });

  it("flags cold-start for marketplaces", () => {
    const risks = detectRisks("Connect buyers and sellers", "both sides", "marketplace", baseBreakdown);
    expect(risks.some((r) => r.id === "cold-start-problem")).toBe(true);
  });

  it("flags low-problem-clarity when score is low", () => {
    const lowClarity: ScoreBreakdown = { ...baseBreakdown, problemClarity: 5 };
    const risks = detectRisks("Something", "someone", "b2c", lowClarity);
    expect(risks.some((r) => r.id === "low-problem-clarity")).toBe(true);
  });

  it("flags crowded-market for known crowded spaces", () => {
    const risks = detectRisks("A todo app and task manager", "users", "b2c", baseBreakdown);
    expect(risks.some((r) => r.id === "crowded-market")).toBe(true);
  });

  it("returns empty array for a clean idea", () => {
    const risks = detectRisks(
      "A subscription SaaS platform that solves invoicing pain for freelancers",
      "freelancers who bill hourly clients",
      "b2b-saas",
      { ...baseBreakdown, problemClarity: 15, differentiation: 10 },
    );
    const highSeverity = risks.filter((r) => r.severity === "high");
    expect(highSeverity.length).toBe(0);
  });
});
