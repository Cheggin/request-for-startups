import { describe, test, expect } from "bun:test";
import * as path from "path";
import { validateSkillFile } from "../../src/static-validator";

const SKILLS_DIR = path.resolve(import.meta.dir, "../../../../skills/shared");

describe("trajectory-logging skill validation", () => {
  test("static validator passes for trajectory-logging", () => {
    const result = validateSkillFile(
      path.join(SKILLS_DIR, "trajectory-logging.md"),
    );
    expect(result.valid).toBe(true);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.name).toBe("trajectory-logging");
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });
});
