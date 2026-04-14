import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildClaudeSettings, setupHooks } from "../src/setup-hooks.js";
import { existsSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("setup-hooks", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `hooks-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("buildClaudeSettings", () => {
    it("should create settings with default hooks", () => {
      const settings = buildClaudeSettings();
      expect(settings.hooks).toBeDefined();
      expect(settings.hooks!["PreToolUse"]).toHaveLength(2);
      expect(settings.hooks!["PostToolUse"]).toHaveLength(1);
    });

    it("should create settings with custom hooks", () => {
      const hooks = [
        { event: "PreToolUse", pattern: "Bash", command: "echo test" },
      ];
      const settings = buildClaudeSettings(hooks);
      expect(settings.hooks!["PreToolUse"]).toHaveLength(1);
      expect(settings.hooks!["PreToolUse"][0].command).toBe("echo test");
      expect(settings.hooks!["PreToolUse"][0].pattern).toBe("Bash");
    });

    it("should merge with existing settings", () => {
      const existing = {
        permissions: { allow: ["Read"] },
        hooks: {
          PreToolUse: [{ command: "existing-hook" }],
        },
      };
      const hooks = [
        { event: "PreToolUse", command: "new-hook" },
      ];
      const settings = buildClaudeSettings(hooks, existing);
      expect(settings.permissions?.allow).toEqual(["Read"]);
      expect(settings.hooks!["PreToolUse"]).toHaveLength(2);
    });

    it("should not duplicate hooks", () => {
      const hooks = [
        { event: "PreToolUse", command: "my-hook", pattern: "Edit" },
      ];
      const existing = {
        hooks: {
          PreToolUse: [{ command: "my-hook", pattern: "Edit" }],
        },
      };
      const settings = buildClaudeSettings(hooks, existing);
      expect(settings.hooks!["PreToolUse"]).toHaveLength(1);
    });
  });

  describe("setupHooks", () => {
    it("should create .claude/settings.json", () => {
      setupHooks(testDir);
      const settingsPath = join(testDir, ".claude", "settings.json");
      expect(existsSync(settingsPath)).toBe(true);
      const content = JSON.parse(readFileSync(settingsPath, "utf-8"));
      expect(content.hooks).toBeDefined();
      expect(content.hooks["PreToolUse"]).toHaveLength(2);
    });

    it("should preserve existing settings.json content", () => {
      const claudeDir = join(testDir, ".claude");
      mkdirSync(claudeDir, { recursive: true });
      const existing = { permissions: { allow: ["Bash"] } };
      const settingsPath = join(claudeDir, "settings.json");
      const { writeFileSync } = require("node:fs");
      writeFileSync(settingsPath, JSON.stringify(existing));

      setupHooks(testDir);

      const content = JSON.parse(readFileSync(settingsPath, "utf-8"));
      expect(content.permissions.allow).toEqual(["Bash"]);
      expect(content.hooks).toBeDefined();
    });
  });
});
