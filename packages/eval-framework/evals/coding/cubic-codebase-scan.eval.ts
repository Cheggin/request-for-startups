import { describe, test, expect } from "bun:test";
import * as path from "path";
import { validateSkillFile } from "../../src/static-validator";

const SKILL_PATH = path.resolve(
  import.meta.dir,
  "../../../../skills/coding/cubic-codebase-scan.md",
);

describe("cubic-codebase-scan skill", () => {
  test("passes static validation with no errors", () => {
    const result = validateSkillFile(SKILL_PATH);
    const errors = result.issues.filter((i) => i.severity === "error");
    expect(result.valid).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test("has correct frontmatter fields", () => {
    const result = validateSkillFile(SKILL_PATH);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.name).toBe("cubic-codebase-scan");
    expect(result.frontmatter!.category).toBe("coding");
    expect(result.frontmatter!.description).toBeTruthy();
    expect(result.frontmatter!["allowed-tools"]).toBeInstanceOf(Array);
  });
});
