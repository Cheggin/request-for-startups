import { describe, test, expect } from "bun:test";
import * as path from "path";
import * as fs from "fs";
import {
  parseFrontmatter,
  validateSkillContent,
  validateSkillFile,
  validateAllSkills,
  formatResults,
} from "../src/static-validator";

const FIXTURES_DIR = path.join(import.meta.dir, "fixtures");

function fixture(name: string): string {
  return path.join(FIXTURES_DIR, name);
}

function readFixture(name: string): string {
  return fs.readFileSync(fixture(name), "utf-8");
}

// --- parseFrontmatter ---

describe("parseFrontmatter", () => {
  test("parses valid frontmatter with simple fields", () => {
    const fm = parseFrontmatter(readFixture("valid-skill.md"));
    expect(fm).not.toBeNull();
    expect(fm!.name).toBe("test-skill");
    expect(fm!.description).toBe("A test skill for validation purposes.");
    expect(fm!.category).toBe("coding");
    expect(fm!.version).toBe("1.0.0");
  });

  test("parses allowed-tools as array", () => {
    const fm = parseFrontmatter(readFixture("valid-skill.md"));
    expect(fm).not.toBeNull();
    expect(fm!["allowed-tools"]).toEqual(["Bash", "Read", "Write"]);
  });

  test("returns null for content without frontmatter", () => {
    const fm = parseFrontmatter(readFixture("no-frontmatter.md"));
    expect(fm).toBeNull();
  });

  test("parses multiline description", () => {
    const fm = parseFrontmatter(readFixture("multiline-desc.md"));
    expect(fm).not.toBeNull();
    expect(fm!.name).toBe("multiline-skill");
    expect(fm!.description).toContain("multiline description");
    expect(fm!.category).toBe("content");
  });

  test("handles empty frontmatter fields", () => {
    const fm = parseFrontmatter("---\nname: test\ndescription:\n---\nBody");
    expect(fm).not.toBeNull();
    expect(fm!.name).toBe("test");
    expect(fm!.description).toBe("");
  });
});

// --- validateSkillContent ---

describe("validateSkillContent", () => {
  test("valid skill passes with no errors", () => {
    const result = validateSkillContent(
      readFixture("valid-skill.md"),
      "valid-skill.md",
    );
    expect(result.valid).toBe(true);
    expect(result.issues.filter((i) => i.severity === "error")).toHaveLength(0);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.name).toBe("test-skill");
  });

  test("missing frontmatter is an error", () => {
    const result = validateSkillContent(
      readFixture("no-frontmatter.md"),
      "no-frontmatter.md",
    );
    expect(result.valid).toBe(false);
    expect(result.frontmatter).toBeNull();
    const fmIssue = result.issues.find(
      (i) => i.rule === "frontmatter-missing",
    );
    expect(fmIssue).toBeDefined();
    expect(fmIssue!.severity).toBe("error");
  });

  test("missing required fields are errors", () => {
    const result = validateSkillContent(
      readFixture("missing-fields.md"),
      "missing-fields.md",
    );
    expect(result.valid).toBe(false);
    const fieldIssues = result.issues.filter(
      (i) => i.rule === "required-field",
    );
    // Missing: description
    expect(fieldIssues.length).toBeGreaterThanOrEqual(1);
    expect(fieldIssues.some((i) => i.message.includes("description"))).toBe(
      true,
    );
  });

  test("unknown tools are errors", () => {
    const result = validateSkillContent(
      readFixture("bad-tools.md"),
      "bad-tools.md",
    );
    expect(result.valid).toBe(false);
    const toolIssues = result.issues.filter(
      (i) => i.rule === "unknown-tool",
    );
    expect(toolIssues).toHaveLength(2);
    expect(toolIssues.some((i) => i.message.includes("MagicWand"))).toBe(true);
    expect(toolIssues.some((i) => i.message.includes("HoverBoard"))).toBe(
      true,
    );
  });

  test("malformed checklist items are warnings", () => {
    const result = validateSkillContent(
      readFixture("bad-checklist.md"),
      "bad-checklist.md",
    );
    // Should be valid (warnings only, no errors from checklist)
    const checklistIssues = result.issues.filter(
      (i) => i.rule === "checklist-format",
    );
    expect(checklistIssues.length).toBeGreaterThan(0);
    for (const issue of checklistIssues) {
      expect(issue.severity).toBe("warning");
    }
  });

  test("broken cross-references are warnings", () => {
    const availableSkills = new Set(["test-skill"]);
    const result = validateSkillContent(
      readFixture("cross-refs.md"),
      "cross-refs.md",
      { availableSkills },
    );
    const crossRefIssues = result.issues.filter(
      (i) => i.rule === "cross-reference",
    );
    // Should warn about /nonexistent-skill and /another-missing-skill
    expect(crossRefIssues.length).toBeGreaterThanOrEqual(2);
    expect(
      crossRefIssues.some((i) => i.message.includes("nonexistent-skill")),
    ).toBe(true);
    expect(
      crossRefIssues.some((i) => i.message.includes("another-missing-skill")),
    ).toBe(true);
  });

  test("cross-references to known skills are not flagged", () => {
    const availableSkills = new Set([
      "test-skill",
      "nonexistent-skill",
      "another-missing-skill",
    ]);
    const result = validateSkillContent(
      readFixture("cross-refs.md"),
      "cross-refs.md",
      { availableSkills },
    );
    const crossRefIssues = result.issues.filter(
      (i) => i.rule === "cross-reference",
    );
    expect(crossRefIssues).toHaveLength(0);
  });

  test("extra tools can be registered", () => {
    const result = validateSkillContent(
      readFixture("bad-tools.md"),
      "bad-tools.md",
      { extraTools: ["MagicWand", "HoverBoard"] },
    );
    const toolIssues = result.issues.filter(
      (i) => i.rule === "unknown-tool",
    );
    expect(toolIssues).toHaveLength(0);
  });

  test("empty body produces a warning", () => {
    const content = "---\nname: empty\ndescription: test\ncategory: ops\n---\n";
    const result = validateSkillContent(content, "empty.md");
    const bodyIssue = result.issues.find((i) => i.rule === "empty-body");
    expect(bodyIssue).toBeDefined();
    expect(bodyIssue!.severity).toBe("warning");
  });

  test("multiline description skill validates correctly", () => {
    const result = validateSkillContent(
      readFixture("multiline-desc.md"),
      "multiline-desc.md",
    );
    expect(result.valid).toBe(true);
    expect(result.frontmatter!.name).toBe("multiline-skill");
  });
});

// --- validateSkillFile ---

describe("validateSkillFile", () => {
  test("reads and validates a file from disk", () => {
    const result = validateSkillFile(fixture("valid-skill.md"));
    expect(result.valid).toBe(true);
    expect(result.file).toBe(fixture("valid-skill.md"));
  });

  test("handles non-existent file gracefully", () => {
    const result = validateSkillFile("/nonexistent/path/SKILL.md");
    expect(result.valid).toBe(false);
    expect(result.issues[0].rule).toBe("file-read");
  });
});

// --- validateAllSkills ---

describe("validateAllSkills", () => {
  test("discovers and validates SKILL.md files in a directory tree", () => {
    // Create a temp directory structure with SKILL.md files
    const tmpDir = path.join(FIXTURES_DIR, "_tmp_tree");
    const skillDir = path.join(tmpDir, "my-skill");
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, "SKILL.md"),
      "---\nname: my-skill\ndescription: test\ncategory: coding\n---\n\n# My Skill\n\nContent here.\n",
    );

    try {
      const results = validateAllSkills(tmpDir);
      expect(results).toHaveLength(1);
      expect(results[0].valid).toBe(true);
      expect(results[0].frontmatter!.name).toBe("my-skill");
    } finally {
      // Cleanup
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test("returns empty array for directory with no SKILL.md files", () => {
    const results = validateAllSkills(FIXTURES_DIR);
    // Fixtures are .md files but not named SKILL.md
    expect(results).toHaveLength(0);
  });
});

// --- formatResults ---

describe("formatResults", () => {
  test("formats passing results", () => {
    const result = validateSkillContent(
      readFixture("valid-skill.md"),
      "valid-skill.md",
    );
    const output = formatResults([result]);
    expect(output).toContain("PASS");
    expect(output).toContain("valid-skill.md");
    expect(output).toContain("0 errors");
  });

  test("formats failing results with issues", () => {
    const result = validateSkillContent(
      readFixture("no-frontmatter.md"),
      "no-frontmatter.md",
    );
    const output = formatResults([result]);
    expect(output).toContain("FAIL");
    expect(output).toContain("1 errors");
  });
});
