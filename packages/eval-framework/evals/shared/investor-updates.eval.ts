import { describe, test, expect } from "bun:test";
import * as path from "path";
import { validateSkillFile } from "../../src/static-validator";

const SKILLS_DIR = path.resolve(import.meta.dir, "../../../../skills/shared");

describe("investor-updates skill validation", () => {
  test("static validator passes for investor-updates", () => {
    const result = validateSkillFile(
      path.join(SKILLS_DIR, "investor-updates.md"),
    );
    expect(result.valid).toBe(true);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.name).toBe("investor-updates");
    expect(result.frontmatter!.category).toBe("shared");
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });
});
