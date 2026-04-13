import { describe, test, expect } from "bun:test";
import * as path from "path";
import { validateSkillFile } from "../../src/static-validator";

const SKILL_PATH = path.resolve(
  import.meta.dir,
  "../../../../skills/operations/ci-cd-pipeline.md",
);

describe("ci-cd-pipeline skill", () => {
  test("passes static validation", () => {
    const result = validateSkillFile(SKILL_PATH);
    expect(result.valid).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  test("has correct frontmatter fields", () => {
    const result = validateSkillFile(SKILL_PATH);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.name).toBe("ci-cd-pipeline");
    expect(result.frontmatter!.category).toBe("operations");
    expect(result.frontmatter!.description).toBeTruthy();
    expect(result.frontmatter!["allowed-tools"]).toBeInstanceOf(Array);
  });
});
