import { describe, expect, test } from "bun:test";
import { parseSkillFrontmatter, loadSkills, SKILL_CATEGORIES } from "../src/commands/skill";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../../..");

describe("parseSkillFrontmatter", () => {
  test("parses skill with frontmatter", () => {
    const content = `---
name: test-generator
description: Auto-generate tests from acceptance criteria
---

# Test Generator

Body content here.`;

    const result = parseSkillFrontmatter(content, "test-generator.md", "coding");
    expect(result.name).toBe("test-generator");
    expect(result.description).toBe("Auto-generate tests from acceptance criteria");
    expect(result.category).toBe("coding");
  });

  test("handles missing frontmatter", () => {
    const content = "# Just a skill\nNo frontmatter.";
    const result = parseSkillFrontmatter(content, "raw-skill.md", "shared");
    expect(result.name).toBe("raw-skill");
    expect(result.description).toBe("");
    expect(result.category).toBe("shared");
  });
});

describe("loadSkills", () => {
  test("loads skills from project root", async () => {
    const skills = await loadSkills(ROOT);
    expect(skills.length).toBeGreaterThan(0);

    const categories = new Set(skills.map((s) => s.category));
    // Should have at least a few categories
    expect(categories.size).toBeGreaterThanOrEqual(3);
  });

  test("all skills have valid categories", async () => {
    const skills = await loadSkills(ROOT);
    for (const s of skills) {
      expect(SKILL_CATEGORIES).toContain(s.category);
    }
  });

  test("handles nonexistent directory", async () => {
    const skills = await loadSkills("/tmp/nonexistent-harness-test");
    expect(skills).toEqual([]);
  });
});
