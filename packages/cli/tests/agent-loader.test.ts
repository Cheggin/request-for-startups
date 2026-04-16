/**
 * Tests for lib/agent-loader.ts — skill categorization and agent prompt generation.
 *
 * Fixes #53: ensures every tracked skill has category coverage.
 */

import { describe, test, expect } from "bun:test";
import { validateSkillCoverage, generateAgentConfigs, generateAgentPrompt } from "../src/lib/agent-loader.js";

describe("validateSkillCoverage", () => {
  test("every tracked skill in skills/ has a category assignment", () => {
    const uncategorized = validateSkillCoverage();
    if (uncategorized.length > 0) {
      throw new Error(
        `Uncategorized skills found: ${uncategorized.join(", ")}. ` +
        `Add them to SKILL_CATEGORIES in packages/cli/src/lib/agent-loader.ts.`
      );
    }
    expect(uncategorized).toEqual([]);
  });
});

describe("generateAgentPrompt", () => {
  test("commander prompt includes orchestration skill routes", () => {
    const prompt = generateAgentPrompt("commander");
    expect(prompt).toContain("/startup-harness:");
    expect(prompt).toContain("startup-init");
    expect(prompt).toContain("agent-creator");
    expect(prompt).toContain("tmux-spawn");
  });

  test("alignment prompt includes orchestration skill routes", () => {
    const prompt = generateAgentPrompt("alignment");
    expect(prompt).toContain("/startup-harness:");
    expect(prompt).toContain("gap-analysis");
    expect(prompt).toContain("verify");
  });

  test("researcher prompt includes orchestration skill routes", () => {
    const prompt = generateAgentPrompt("researcher");
    expect(prompt).toContain("/startup-harness:");
    expect(prompt).toContain("research");
    expect(prompt).toContain("deep-dive");
  });

  test("returns empty string for unknown agent", () => {
    expect(generateAgentPrompt("nonexistent-agent")).toBe("");
  });
});

describe("generateAgentConfigs", () => {
  test("all defined agents get configs", () => {
    const configs = generateAgentConfigs();
    const names = configs.map((c) => c.name);
    expect(names).toContain("commander");
    expect(names).toContain("alignment");
    expect(names).toContain("researcher");
    expect(names).toContain("website");
    expect(names).toContain("backend");
  });
});
