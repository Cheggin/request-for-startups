import { describe, test, expect } from "bun:test";
import * as path from "path";
import { validateSkillFile } from "../../src/static-validator";

const SKILL_PATH = path.resolve(
  import.meta.dir,
  "../../../../skills/operations/uptime-monitor.md",
);

describe("uptime-monitor skill", () => {
  test("passes static validation", () => {
    const result = validateSkillFile(SKILL_PATH);
    expect(result.valid).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
  });

  test("has correct frontmatter fields", () => {
    const result = validateSkillFile(SKILL_PATH);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.name).toBe("uptime-monitor");
    expect(result.frontmatter!.description).toBeTruthy();
  });
});
