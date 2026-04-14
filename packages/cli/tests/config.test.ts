/**
 * Tests for lib/config.ts — config loading functions.
 */

import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { loadAgents, loadStacks, loadCategories, loadToolCatalog, loadClaudeSettings, isHarnessConfigured } from "../src/lib/config.js";

const TEST_DIR = join(import.meta.dir, ".test-config-fixtures");
const AGENTS_DIR = join(TEST_DIR, "agents");
const HARNESS_DIR = join(TEST_DIR, ".harness");

beforeEach(() => {
  mkdirSync(AGENTS_DIR, { recursive: true });
  mkdirSync(HARNESS_DIR, { recursive: true });
});

afterEach(() => {
  if (existsSync(TEST_DIR)) {
    rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

describe("loadAgents", () => {
  test("returns empty array when directory does not exist", () => {
    const agents = loadAgents("/nonexistent/path");
    expect(agents).toEqual([]);
  });

  test("parses agent frontmatter correctly", () => {
    writeFileSync(
      join(AGENTS_DIR, "backend.md"),
      `---
name: backend
description: Backend developer
model: claude-sonnet-4-6
level: 2
maxTurns: 200
---

<Agent_Prompt>
  You are Backend.
</Agent_Prompt>`
    );

    const agents = loadAgents(AGENTS_DIR);
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe("backend");
    expect(agents[0].description).toBe("Backend developer");
    expect(agents[0].model).toBe("claude-sonnet-4-6");
    expect(agents[0].level).toBe(2);
    expect(agents[0].maxTurns).toBe(200);
  });

  test("handles multiple agents", () => {
    writeFileSync(
      join(AGENTS_DIR, "backend.md"),
      `---\nname: backend\nmodel: claude-sonnet-4-6\nlevel: 2\nmaxTurns: 200\n---\nBody`
    );
    writeFileSync(
      join(AGENTS_DIR, "ops.md"),
      `---\nname: ops\nmodel: claude-sonnet-4-6\nlevel: 2\nmaxTurns: 150\n---\nBody`
    );

    const agents = loadAgents(AGENTS_DIR);
    expect(agents).toHaveLength(2);
    expect(agents.map((a) => a.name).sort()).toEqual(["backend", "ops"]);
  });

  test("uses filename as name when frontmatter missing", () => {
    writeFileSync(join(AGENTS_DIR, "mystery.md"), "Just a plain file\n");

    const agents = loadAgents(AGENTS_DIR);
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe("mystery");
  });

  test("ignores non-md files", () => {
    writeFileSync(join(AGENTS_DIR, "notes.txt"), "Not an agent\n");
    writeFileSync(
      join(AGENTS_DIR, "real.md"),
      `---\nname: real\nmodel: claude-sonnet-4-6\nlevel: 2\nmaxTurns: 100\n---\nBody`
    );

    const agents = loadAgents(AGENTS_DIR);
    expect(agents).toHaveLength(1);
    expect(agents[0].name).toBe("real");
  });
});

describe("loadStacks", () => {
  test("returns empty object when file does not exist", () => {
    const stacks = loadStacks("/nonexistent/stacks.yml");
    expect(stacks).toEqual({});
  });

  test("parses YAML config", () => {
    writeFileSync(
      join(HARNESS_DIR, "stacks.yml"),
      `website:\n  framework: nextjs\n  language: typescript\n`
    );

    const stacks = loadStacks(join(HARNESS_DIR, "stacks.yml"));
    expect(stacks).toHaveProperty("website");
    const website = stacks.website as Record<string, string>;
    expect(website.framework).toBe("nextjs");
    expect(website.language).toBe("typescript");
  });
});

describe("loadCategories", () => {
  test("returns empty object when file does not exist", () => {
    const cats = loadCategories("/nonexistent/categories.yml");
    expect(cats).toEqual({});
  });
});

describe("loadToolCatalog", () => {
  test("returns empty object when file does not exist", () => {
    const catalog = loadToolCatalog("/nonexistent/catalog.yml");
    expect(catalog).toEqual({});
  });
});

describe("loadClaudeSettings", () => {
  test("returns empty object when file does not exist", () => {
    const settings = loadClaudeSettings("/nonexistent/settings.json");
    expect(settings).toEqual({});
  });

  test("parses valid JSON", () => {
    const settingsPath = join(HARNESS_DIR, "settings.json");
    writeFileSync(settingsPath, JSON.stringify({ hooks: { PreToolUse: [] } }));

    const settings = loadClaudeSettings(settingsPath);
    expect(settings).toHaveProperty("hooks");
  });

  test("returns empty object on invalid JSON", () => {
    const settingsPath = join(HARNESS_DIR, "settings.json");
    writeFileSync(settingsPath, "not valid json{{{");

    const settings = loadClaudeSettings(settingsPath);
    expect(settings).toEqual({});
  });
});
