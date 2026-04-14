import { describe, test, expect } from "bun:test";
import * as path from "path";
import { validateSkillFile } from "../../src/static-validator";

const SKILLS_DIR = path.resolve(import.meta.dir, "../../../../skills/shared");

describe("github-state-manager skill validation", () => {
  test("static validator passes for github-state-manager", () => {
    const result = validateSkillFile(
      path.join(SKILLS_DIR, "github-state-manager.md"),
    );
    expect(result.valid).toBe(true);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.name).toBe("github-state-manager");
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });
});
