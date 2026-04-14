import { describe, it, expect } from "bun:test";
import { getSkillsForType, getAgentNames, getFullManifest } from "./skill-manifest.js";

describe("getSkillsForType", () => {
  it("returns universal skills for any startup type", () => {
    const skills = getSkillsForType("b2c", "website");
    expect(skills).toContain("skills/website/landing-page");
    expect(skills).toContain("skills/website/seo-basics");
    expect(skills).toContain("skills/website/responsive-design");
  });

  it("returns type-specific skills for devtool website agent", () => {
    const skills = getSkillsForType("devtool", "website");
    expect(skills).toContain("skills/website/docs-site");
    expect(skills).toContain("skills/website/code-playground");
    expect(skills).toContain("skills/website/api-reference");
  });

  it("returns type-specific skills for b2c growth agent", () => {
    const skills = getSkillsForType("b2c", "growth");
    expect(skills).toContain("skills/growth/viral-loops");
    expect(skills).toContain("skills/growth/referral-program");
    expect(skills).toContain("skills/growth/social-media-strategy");
  });

  it("returns type-specific skills for b2b-saas backend agent", () => {
    const skills = getSkillsForType("b2b-saas", "backend");
    expect(skills).toContain("skills/backend/multi-tenancy");
    expect(skills).toContain("skills/backend/rbac");
    expect(skills).toContain("skills/backend/audit-log");
  });

  it("returns only universal skills when type has no specific skills for agent", () => {
    const skills = getSkillsForType("b2c", "ops");
    expect(skills).toEqual([
      "skills/ops/ci-cd-setup",
      "skills/ops/monitoring",
      "skills/ops/logging",
      "skills/ops/backup-strategy",
    ]);
  });

  it("returns empty array for unknown agent name", () => {
    const skills = getSkillsForType("b2c", "nonexistent" as any);
    expect(skills).toEqual([]);
  });

  it("includes healthcare-specific skills for healthcare type", () => {
    const skills = getSkillsForType("healthcare", "backend");
    expect(skills).toContain("skills/backend/hipaa-data-handling");
    expect(skills).toContain("skills/backend/consent-management");
  });

  it("includes fintech-specific skills for fintech type", () => {
    const skills = getSkillsForType("fintech", "backend");
    expect(skills).toContain("skills/backend/transaction-ledger");
    expect(skills).toContain("skills/backend/kyc-verification");
  });

  it("includes ecommerce-specific skills for ecommerce type", () => {
    const skills = getSkillsForType("ecommerce", "backend");
    expect(skills).toContain("skills/backend/inventory-management");
    expect(skills).toContain("skills/backend/order-processing");
  });
});

describe("getAgentNames", () => {
  it("returns all registered agent names", () => {
    const names = getAgentNames();
    expect(names).toContain("commander");
    expect(names).toContain("website");
    expect(names).toContain("backend");
    expect(names).toContain("frontend");
    expect(names).toContain("growth");
    expect(names).toContain("content");
    expect(names).toContain("ops");
    expect(names).toContain("design");
    expect(names).toContain("qa");
    expect(names).toHaveLength(9);
  });
});

describe("getFullManifest", () => {
  it("returns skills for all agents", () => {
    const manifest = getFullManifest("devtool");
    const agentNames = getAgentNames();
    for (const name of agentNames) {
      expect(manifest[name]).toBeDefined();
      expect(manifest[name].length).toBeGreaterThan(0);
    }
  });

  it("devtool manifest has docs skills for website agent", () => {
    const manifest = getFullManifest("devtool");
    expect(manifest.website).toContain("skills/website/docs-site");
  });

  it("b2c manifest has viral skills for growth agent", () => {
    const manifest = getFullManifest("b2c");
    expect(manifest.growth).toContain("skills/growth/viral-loops");
  });
});
