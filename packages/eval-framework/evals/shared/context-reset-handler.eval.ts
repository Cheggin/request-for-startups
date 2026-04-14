import { describe, test, expect } from "bun:test";
import * as path from "path";
import { validateSkillFile } from "../../src/static-validator";

const SKILLS_DIR = path.resolve(import.meta.dir, "../../../../skills/shared");

describe("context-reset-handler skill validation", () => {
  test("static validator passes for context-reset-handler", () => {
    const result = validateSkillFile(
      path.join(SKILLS_DIR, "context-reset-handler.md"),
    );
    expect(result.valid).toBe(true);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.name).toBe("context-reset-handler");
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });
});
