import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { addPage } from "../src/wiki";
import { appendResult } from "../src/ledger";
import { generateBrief } from "../src/brief";

const TEST_ROOT = path.join(import.meta.dir, ".tmp-brief-test");

beforeEach(() => { fs.mkdirSync(TEST_ROOT, { recursive: true }); });
afterEach(() => { fs.rmSync(TEST_ROOT, { recursive: true, force: true }); });

describe("generateBrief", () => {
  it("generates a brief for an empty category", () => {
    const brief = generateBrief(TEST_ROOT, { category: "coding", goal: "Improve code quality" });
    expect(brief.category).toBe("coding");
    expect(brief.goal).toBe("Improve code quality");
    expect(brief.prior_findings_summary).toContain("No prior research");
    expect(brief.ideas.length).toBeGreaterThanOrEqual(1);
    expect(brief.ideas.some((i) => i.title.includes("survey"))).toBe(true);
  });

  it("includes prior research summary when pages exist", () => {
    addPage(TEST_ROOT, "coding", "TypeScript Best Practices", "Use strict mode everywhere", ["typescript"], { confidence: 0.8, source: "web" });
    const brief = generateBrief(TEST_ROOT, { category: "coding", goal: "Improve code quality" });
    expect(brief.prior_findings_summary).toContain("1 prior research page");
    expect(brief.prior_findings_summary).toContain("TypeScript Best Practices");
  });

  it("includes ledger experiment summary", () => {
    appendResult(TEST_ROOT, { category: "coding", experiment_description: "add ESLint strict rules", metric: "lint_errors", result: "0", status: "keep", confidence: 0.9 });
    appendResult(TEST_ROOT, { category: "coding", experiment_description: "switch to tabs", metric: "readability", result: "worse", status: "discard", confidence: 0.3 });
    const brief = generateBrief(TEST_ROOT, { category: "coding", goal: "Improve code quality" });
    expect(brief.prior_findings_summary).toContain("2 total experiment(s)");
    expect(brief.prior_findings_summary).toContain("1 kept");
    expect(brief.prior_findings_summary).toContain("1 discarded");
  });

  it("generates avoid-failure idea when failures exist", () => {
    appendResult(TEST_ROOT, { category: "growth", experiment_description: "aggressive popup CTA", metric: "bounce_rate", result: "0.85", status: "discard", confidence: 0.7 });
    const brief = generateBrief(TEST_ROOT, { category: "growth", goal: "Reduce bounce rate" });
    const avoidIdea = brief.ideas.find((i) => i.title.includes("avoid prior failures"));
    expect(avoidIdea).toBeDefined();
    expect(avoidIdea!.evidence).toContain("aggressive popup CTA");
  });

  it("includes cross-category findings", () => {
    addPage(TEST_ROOT, "design", "User Research Methods", "Improve user experience with usability testing and interviews", ["ux", "research"], { confidence: 0.8, source: "web" });
    const brief = generateBrief(TEST_ROOT, { category: "growth", goal: "Improve user experience" });
    const crossRef = brief.ideas.find((i) => i.source.includes("design"));
    expect(crossRef).toBeDefined();
  });

  it("sorts ideas by confidence (high first)", () => {
    addPage(TEST_ROOT, "coding", "Low Conf Page", "Needs validation", ["test"], { confidence: 0.2, source: "session" });
    appendResult(TEST_ROOT, { category: "coding", experiment_description: "failed attempt", metric: "score", result: "0", status: "discard", confidence: 0.3 });
    const brief = generateBrief(TEST_ROOT, { category: "coding", goal: "Improve everything" });
    if (brief.ideas.length >= 2) {
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < brief.ideas.length; i++) {
        expect(order[brief.ideas[i].confidence]).toBeGreaterThanOrEqual(order[brief.ideas[i - 1].confidence]);
      }
    }
  });

  it("accepts pre-provided history", () => {
    const history = [{ timestamp: "2024-01-01T00:00:00Z", category: "coding" as const, experiment_description: "external experiment", metric: "score", result: "100", status: "keep" as const, confidence: 0.9 }];
    const brief = generateBrief(TEST_ROOT, { category: "coding", goal: "Test with history", history });
    expect(brief.prior_findings_summary).toContain("1 total experiment(s)");
    expect(brief.prior_findings_summary).toContain("external experiment");
  });
});
