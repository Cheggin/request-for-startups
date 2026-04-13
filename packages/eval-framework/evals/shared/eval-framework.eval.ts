import { describe, test, expect } from "bun:test";
import * as path from "path";
import { validateSkillFile } from "../../src/static-validator";

const SKILLS_DIR = path.resolve(import.meta.dir, "../../../../skills/shared");

describe("eval-framework skill validation", () => {
  test("static validator passes for eval-framework", () => {
    const result = validateSkillFile(
      path.join(SKILLS_DIR, "eval-framework.md"),
    );
    expect(result.valid).toBe(true);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.name).toBe("eval-framework");
    expect(result.frontmatter!.category).toBe("shared");
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });
});
