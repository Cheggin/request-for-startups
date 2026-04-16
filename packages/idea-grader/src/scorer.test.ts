import { describe, it, expect } from "vitest";
import { scoreIdea, totalScore, gradeFromScore } from "./scorer.js";

describe("scoreIdea", () => {
  it("returns all five dimensions", () => {
    const breakdown = scoreIdea("A tool for developers", "developers", "devtool");
    expect(breakdown).toHaveProperty("problemClarity");
    expect(breakdown).toHaveProperty("marketSize");
    expect(breakdown).toHaveProperty("differentiation");
    expect(breakdown).toHaveProperty("feasibility");
    expect(breakdown).toHaveProperty("founderMarketFit");
  });

  it("scores each dimension 0-20", () => {
    const breakdown = scoreIdea(
      "A SaaS dashboard that helps small business owners automate their invoicing workflow, replacing manual spreadsheet tracking that wastes hours per week",
      "small business owners who invoice clients monthly",
      "b2b-saas",
    );
    for (const value of Object.values(breakdown)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  it("scores a detailed idea higher than a vague one", () => {
    const detailed = scoreIdea(
      "Small businesses struggle with manual invoicing. We automate recurring invoices with a SaaS platform that solves the problem of late payments. Unlike FreshBooks, we're 10x faster with subscription pricing.",
      "freelancers and small business owners who invoice clients",
      "b2b-saas",
    );
    const vague = scoreIdea("An app", "people", "b2c");
    expect(totalScore(detailed)).toBeGreaterThan(totalScore(vague));
  });

  it("gives higher feasibility to simple tech vs deep tech", () => {
    const simple = scoreIdea("A web app dashboard for tracking analytics", "marketers", "b2b-saas");
    const complex = scoreIdea("A quantum computing hardware device with self-driving robotics", "engineers", "b2c");
    expect(simple.feasibility).toBeGreaterThan(complex.feasibility);
  });

  it("rewards problem + solution keywords in problemClarity", () => {
    const withProblem = scoreIdea(
      "Teams struggle with manual tedious expense tracking. We automate and simplify the entire process.",
      "finance teams",
      "b2b-saas",
    );
    const withoutProblem = scoreIdea(
      "A nice platform for things.",
      "finance teams",
      "b2b-saas",
    );
    expect(withProblem.problemClarity).toBeGreaterThan(withoutProblem.problemClarity);
  });

  it("rewards differentiation keywords", () => {
    const differentiated = scoreIdea(
      "Unlike existing tools, we're the first and only platform with a proprietary advantage and 10x faster processing. Subscription pricing model.",
      "developers",
      "devtool",
    );
    const generic = scoreIdea("A tool for things", "developers", "devtool");
    expect(differentiated.differentiation).toBeGreaterThan(generic.differentiation);
  });
});

describe("totalScore", () => {
  it("sums all dimensions", () => {
    const breakdown = { problemClarity: 10, marketSize: 12, differentiation: 8, feasibility: 15, founderMarketFit: 11 };
    expect(totalScore(breakdown)).toBe(56);
  });

  it("returns 0 for all-zero breakdown", () => {
    const breakdown = { problemClarity: 0, marketSize: 0, differentiation: 0, feasibility: 0, founderMarketFit: 0 };
    expect(totalScore(breakdown)).toBe(0);
  });
});

describe("gradeFromScore", () => {
  it("returns A for 80+", () => expect(gradeFromScore(80)).toBe("A"));
  it("returns A for 100", () => expect(gradeFromScore(100)).toBe("A"));
  it("returns B for 60-79", () => expect(gradeFromScore(60)).toBe("B"));
  it("returns C for 40-59", () => expect(gradeFromScore(40)).toBe("C"));
  it("returns D for 20-39", () => expect(gradeFromScore(20)).toBe("D"));
  it("returns F for 0-19", () => expect(gradeFromScore(0)).toBe("F"));
  it("returns F for 19", () => expect(gradeFromScore(19)).toBe("F"));
});
