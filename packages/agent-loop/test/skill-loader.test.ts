import { describe, test, expect } from "bun:test";
import { loadSkills, concatSkills } from "../src/skill-loader.js";
import { mkdtempSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

function createSkillsFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "skill-loader-test-"));

  // shared/
  mkdirSync(join(root, "shared"));
  writeFileSync(join(root, "shared", "error-classifier.md"), "Error classification rules.");
  writeFileSync(join(root, "shared", "cost-tracker.md"), "Cost tracking rules.");

  // coding/
  mkdirSync(join(root, "coding"));
  writeFileSync(join(root, "coding", "test-generator.md"), "Test generation skill.");
  writeFileSync(join(root, "coding", "security-scanner.md"), "Security scanning skill.");

  // operations/
  mkdirSync(join(root, "operations"));
  writeFileSync(join(root, "operations", "deploy-pipeline.md"), "Deploy pipeline skill.");

  return root;
}

describe("loadSkills", () => {
  const skillsDir = createSkillsFixture();

  test("loads shared + category skills for a known agent", () => {
    const skills = loadSkills(skillsDir, "backend");
    const names = skills.map((s) => s.name);

    // Shared skills
    expect(names).toContain("error-classifier");
    expect(names).toContain("cost-tracker");

    // Category skills (backend -> coding)
    expect(names).toContain("test-generator");
    expect(names).toContain("security-scanner");
  });

  test("shared skills come before category skills", () => {
    const skills = loadSkills(skillsDir, "backend");
    const sharedIdx = skills.findIndex((s) => s.source === "shared");
    const catIdx = skills.findIndex((s) => s.source === "coding");

    expect(sharedIdx).toBeLessThan(catIdx);
  });

  test("loads only shared skills for unknown agent", () => {
    const skills = loadSkills(skillsDir, "unknown-agent");
    expect(skills.length).toBe(2);
    expect(skills.every((s) => s.source === "shared")).toBe(true);
  });

  test("ops agent gets operations category", () => {
    const skills = loadSkills(skillsDir, "ops");
    const names = skills.map((s) => s.name);
    expect(names).toContain("deploy-pipeline");
  });

  test("handles missing skills directory gracefully", () => {
    const skills = loadSkills("/nonexistent/path", "backend");
    expect(skills).toEqual([]);
  });
});

describe("concatSkills", () => {
  test("produces empty string for no skills", () => {
    expect(concatSkills([])).toBe("");
  });

  test("wraps each skill in XML tags", () => {
    const result = concatSkills([
      { name: "foo", content: "Foo content.", source: "shared" },
      { name: "bar", content: "Bar content.", source: "coding" },
    ]);

    expect(result).toContain('<Skill name="foo" source="shared">');
    expect(result).toContain("Foo content.");
    expect(result).toContain("</Skill>");
    expect(result).toContain('<Skill name="bar" source="coding">');
  });
});
