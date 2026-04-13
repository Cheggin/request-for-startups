import { describe, test, expect } from "bun:test";
import { validateSkillFile } from "../../src/static-validator";
import * as path from "path";

const SKILL_PATH = path.resolve(
  __dirname,
  "../../../../skills/growth/user-feedback-collector.md",
);

describe("user-feedback-collector skill", () => {
  test("passes static validation", () => {
    const result = validateSkillFile(SKILL_PATH, { skipCrossRefs: true });
    expect(result.valid).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  test("has required frontmatter fields", () => {
    const result = validateSkillFile(SKILL_PATH, { skipCrossRefs: true });
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.name).toBe("user-feedback-collector");
    expect(result.frontmatter!.description).toBeTruthy();
    expect(result.frontmatter!.category).toBe("growth");
  });

  test("has allowed-tools list with valid tools", () => {
    const result = validateSkillFile(SKILL_PATH, { skipCrossRefs: true });
    const tools = result.frontmatter!["allowed-tools"] as string[];
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
  });
});
