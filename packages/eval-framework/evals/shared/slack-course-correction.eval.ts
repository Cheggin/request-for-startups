import { describe, test, expect } from "bun:test";
import * as path from "path";
import { validateSkillFile } from "../../src/static-validator";

const SKILLS_DIR = path.resolve(import.meta.dir, "../../../../skills/shared");

describe("slack-course-correction skill validation", () => {
  test("static validator passes for slack-course-correction", () => {
    const result = validateSkillFile(
      path.join(SKILLS_DIR, "slack-course-correction.md"),
    );
    expect(result.valid).toBe(true);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.name).toBe("slack-course-correction");
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });
});
