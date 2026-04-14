import { describe, test, expect } from "bun:test";
import * as path from "path";
import { validateSkillFile } from "../../src/static-validator";

const SKILLS_DIR = path.resolve(import.meta.dir, "../../../../skills/shared");

describe("error-classifier skill validation", () => {
  test("static validator passes for error-classifier", () => {
    const result = validateSkillFile(
      path.join(SKILLS_DIR, "error-classifier.md"),
    );
    expect(result.valid).toBe(true);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.name).toBe("error-classifier");
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });
});
