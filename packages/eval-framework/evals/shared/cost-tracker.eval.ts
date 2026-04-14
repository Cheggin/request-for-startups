import { describe, test, expect } from "bun:test";
import * as path from "path";
import { validateSkillFile } from "../../src/static-validator";

const SKILLS_DIR = path.resolve(import.meta.dir, "../../../../skills/shared");

describe("cost-tracker skill validation", () => {
  test("static validator passes for cost-tracker", () => {
    const result = validateSkillFile(
      path.join(SKILLS_DIR, "cost-tracker.md"),
    );
    expect(result.valid).toBe(true);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.name).toBe("cost-tracker");
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });
});
