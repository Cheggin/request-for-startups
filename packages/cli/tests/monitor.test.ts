/**
 * Tests for lib/tmux-monitor.ts — CEO monitoring loop.
 *
 * TDD red phase: all tests written before implementation.
 * Tests cover pure classification/detection functions with real string inputs.
 */

import { describe, test, expect } from "bun:test";
import {
  classifyPaneStatus,
  detectApprovalPrompt,
  shouldAutoApprove,
  buildStatusReport,
  readSignals,
  type PaneStatus,
  type MonitoredPane,
  type ApprovalPrompt,
  type Signal,
} from "../src/lib/tmux-monitor.js";
import { join } from "path";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";

// ─── classifyPaneStatus ────────────────────────────────────────────────────

describe("classifyPaneStatus", () => {
  test("detects working status from tool activity", () => {
    const output = `
  Reading file src/index.ts
  100 lines read
  `;
    expect(classifyPaneStatus(output)).toBe("working");
  });

  test("detects working from Edit tool", () => {
    const output = `  Editing src/lib/config.ts
  Applied 2 edits`;
    expect(classifyPaneStatus(output)).toBe("working");
  });

  test("detects working from Bash tool", () => {
    const output = `  Running bun test
  3 tests passed`;
    expect(classifyPaneStatus(output)).toBe("working");
  });

  test("detects working from thinking indicator", () => {
    const output = `  thinking...
  Analyzing the codebase structure`;
    expect(classifyPaneStatus(output)).toBe("working");
  });

  test("detects working from Write tool", () => {
    const output = `  Writing src/new-file.ts
  File created successfully`;
    expect(classifyPaneStatus(output)).toBe("working");
  });

  test("detects working from Searching/Grep", () => {
    const output = `  Searching for "handleRequest"
  Found 12 matches`;
    expect(classifyPaneStatus(output)).toBe("working");
  });

  test("detects idle from empty prompt", () => {
    const output = `




>  `;
    expect(classifyPaneStatus(output)).toBe("idle");
  });

  test("detects idle from shell prompt with no activity", () => {
    const output = `  reagan@mac ~ %
  `;
    expect(classifyPaneStatus(output)).toBe("idle");
  });

  test("detects idle from Tips indicator", () => {
    const output = `  Claude Code v1.2.3
  Tips: Use /help for available commands
  > `;
    expect(classifyPaneStatus(output)).toBe("idle");
  });

  test("detects needs-approval from permission prompt", () => {
    const output = `  Claude wants to run the following command:

  Allow? (y/n)`;
    expect(classifyPaneStatus(output)).toBe("needs-approval");
  });

  test("detects needs-approval from tool approval prompt", () => {
    const output = `  Allow Read /Users/reagan/Documents/file.ts? (y/n)`;
    expect(classifyPaneStatus(output)).toBe("needs-approval");
  });

  test("detects stuck from repeated error output", () => {
    const output = `  Error: ENOENT: no such file or directory
  Error: ENOENT: no such file or directory
  Error: ENOENT: no such file or directory`;
    expect(classifyPaneStatus(output)).toBe("stuck");
  });

  test("detects stuck from retry loop", () => {
    const output = `  Retrying...
  Retrying...
  Retrying...
  Retrying...`;
    expect(classifyPaneStatus(output)).toBe("stuck");
  });

  test("detects stuck from rate limit", () => {
    const output = `  Rate limited. Waiting 30 seconds...
  Overloaded`;
    expect(classifyPaneStatus(output)).toBe("stuck");
  });

  test("returns working as default for ambiguous output", () => {
    const output = `  Processing files in the background
  Step 3 of 7 complete`;
    expect(classifyPaneStatus(output)).toBe("working");
  });

  test("handles empty output as idle", () => {
    expect(classifyPaneStatus("")).toBe("idle");
    expect(classifyPaneStatus("   ")).toBe("idle");
  });

  test("detects exited from dead pane marker", () => {
    const output = `  Pane is dead
  [exited]`;
    expect(classifyPaneStatus(output)).toBe("idle");
  });
});

// ─── detectApprovalPrompt ──────────────────────────────────────────────────

describe("detectApprovalPrompt", () => {
  test("detects Read permission prompt", () => {
    const output = `  Allow Read /Users/reagan/project/src/index.ts? (y/n)`;
    const result = detectApprovalPrompt(output);
    expect(result).not.toBeNull();
    expect(result!.tool).toBe("Read");
    expect(result!.target).toContain("index.ts");
  });

  test("detects Bash permission prompt", () => {
    const output = `  Allow Bash(bun test)? (y/n)`;
    const result = detectApprovalPrompt(output);
    expect(result).not.toBeNull();
    expect(result!.tool).toBe("Bash");
    expect(result!.target).toContain("bun test");
  });

  test("detects Edit permission prompt", () => {
    const output = `  Allow Edit /Users/reagan/project/src/lib/config.ts? (y/n)`;
    const result = detectApprovalPrompt(output);
    expect(result).not.toBeNull();
    expect(result!.tool).toBe("Edit");
  });

  test("detects Write permission prompt", () => {
    const output = `  Allow Write /Users/reagan/project/new-file.ts? (y/n)`;
    const result = detectApprovalPrompt(output);
    expect(result).not.toBeNull();
    expect(result!.tool).toBe("Write");
  });

  test("detects Glob permission prompt", () => {
    const output = `  Allow Glob(**/*.ts)? (y/n)`;
    const result = detectApprovalPrompt(output);
    expect(result).not.toBeNull();
    expect(result!.tool).toBe("Glob");
  });

  test("detects Grep permission prompt", () => {
    const output = `  Allow Grep(handleRequest)? (y/n)`;
    const result = detectApprovalPrompt(output);
    expect(result).not.toBeNull();
    expect(result!.tool).toBe("Grep");
  });

  test("returns null for non-approval output", () => {
    const output = `  Reading file src/index.ts
  100 lines read`;
    expect(detectApprovalPrompt(output)).toBeNull();
  });

  test("returns null for empty output", () => {
    expect(detectApprovalPrompt("")).toBeNull();
    expect(detectApprovalPrompt("   ")).toBeNull();
  });

  test("detects approval prompt with multiline context", () => {
    const output = `  Claude wants to execute:

  bun run build

  Allow? (y/n)`;
    const result = detectApprovalPrompt(output);
    expect(result).not.toBeNull();
  });

  test("detects Bash prompt with complex command", () => {
    const output = `  Allow Bash(rm -rf node_modules && npm install)? (y/n)`;
    const result = detectApprovalPrompt(output);
    expect(result).not.toBeNull();
    expect(result!.tool).toBe("Bash");
    expect(result!.target).toContain("rm -rf");
  });
});

// ─── shouldAutoApprove ─────────────────────────────────────────────────────

describe("shouldAutoApprove", () => {
  test("approves Read tool", () => {
    const prompt: ApprovalPrompt = { tool: "Read", target: "/path/to/file.ts", raw: "" };
    expect(shouldAutoApprove(prompt)).toBe(true);
  });

  test("approves Glob tool", () => {
    const prompt: ApprovalPrompt = { tool: "Glob", target: "**/*.ts", raw: "" };
    expect(shouldAutoApprove(prompt)).toBe(true);
  });

  test("approves Grep tool", () => {
    const prompt: ApprovalPrompt = { tool: "Grep", target: "functionName", raw: "" };
    expect(shouldAutoApprove(prompt)).toBe(true);
  });

  test("approves safe Bash commands", () => {
    const safeCommands = [
      "bun test",
      "bun run build",
      "npm test",
      "npx tsc --noEmit",
      "git status",
      "git log --oneline -5",
      "git diff",
      "ls -la",
      "cat package.json",
      "wc -l src/index.ts",
    ];
    for (const cmd of safeCommands) {
      const prompt: ApprovalPrompt = { tool: "Bash", target: cmd, raw: "" };
      expect(shouldAutoApprove(prompt)).toBe(true);
    }
  });

  test("rejects Edit tool", () => {
    const prompt: ApprovalPrompt = { tool: "Edit", target: "/path/to/file.ts", raw: "" };
    expect(shouldAutoApprove(prompt)).toBe(false);
  });

  test("rejects Write tool", () => {
    const prompt: ApprovalPrompt = { tool: "Write", target: "/path/to/file.ts", raw: "" };
    expect(shouldAutoApprove(prompt)).toBe(false);
  });

  test("rejects destructive Bash commands", () => {
    const destructiveCommands = [
      "rm -rf /",
      "rm -rf node_modules",
      "git push --force",
      "git reset --hard",
      "drop table users",
      "curl -X DELETE",
      "kill -9 1234",
      "sudo rm -rf /var",
    ];
    for (const cmd of destructiveCommands) {
      const prompt: ApprovalPrompt = { tool: "Bash", target: cmd, raw: "" };
      expect(shouldAutoApprove(prompt)).toBe(false);
    }
  });

  test("rejects unknown tools", () => {
    const prompt: ApprovalPrompt = { tool: "UnknownTool", target: "something", raw: "" };
    expect(shouldAutoApprove(prompt)).toBe(false);
  });

  test("approves WebSearch tool", () => {
    const prompt: ApprovalPrompt = { tool: "WebSearch", target: "query", raw: "" };
    expect(shouldAutoApprove(prompt)).toBe(true);
  });

  test("approves WebFetch tool", () => {
    const prompt: ApprovalPrompt = { tool: "WebFetch", target: "https://example.com", raw: "" };
    expect(shouldAutoApprove(prompt)).toBe(true);
  });
});

// ─── buildStatusReport ─────────────────────────────────────────────────────

describe("buildStatusReport", () => {
  test("builds report with mixed statuses", () => {
    const panes: MonitoredPane[] = [
      { name: "backend", paneId: "%1", status: "working", lastLine: "Writing schema.ts" },
      { name: "frontend", paneId: "%2", status: "idle", lastLine: "> " },
      { name: "researcher", paneId: "%3", status: "stuck", lastLine: "Rate limited" },
      { name: "docs", paneId: "%4", status: "needs-approval", lastLine: "Allow Read? (y/n)" },
    ];
    const report = buildStatusReport(panes);
    expect(report).toContain("backend");
    expect(report).toContain("frontend");
    expect(report).toContain("WORKING");
    expect(report).toContain("IDLE");
    expect(report).toContain("STUCK");
    expect(report).toContain("APPROVE");
  });

  test("shows summary counts", () => {
    const panes: MonitoredPane[] = [
      { name: "a", paneId: "%1", status: "working", lastLine: "..." },
      { name: "b", paneId: "%2", status: "working", lastLine: "..." },
      { name: "c", paneId: "%3", status: "idle", lastLine: "" },
    ];
    const report = buildStatusReport(panes);
    expect(report).toContain("2 working");
    expect(report).toContain("1 idle");
  });

  test("returns empty message for no panes", () => {
    const report = buildStatusReport([]);
    expect(report).toContain("No agents");
  });

  test("includes last line of output for each pane", () => {
    const panes: MonitoredPane[] = [
      { name: "builder", paneId: "%1", status: "working", lastLine: "Compiling TypeScript..." },
    ];
    const report = buildStatusReport(panes);
    expect(report).toContain("Compiling TypeScript...");
  });

  test("truncates long last lines", () => {
    const longLine = "A".repeat(200);
    const panes: MonitoredPane[] = [
      { name: "agent", paneId: "%1", status: "working", lastLine: longLine },
    ];
    const report = buildStatusReport(panes);
    // Should truncate, not include the full 200-char line
    expect(report.length).toBeLessThan(longLine.length + 100);
  });
});

// ─── readSignals ───────────────────────────────────────────────────────────

describe("readSignals", () => {
  let tmpDir: string;

  test("reads completion signals from directory", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "monitor-test-"));
    const signalData = {
      agent: "backend",
      event: "Stop",
      at: "2026-04-14T10:00:00Z",
    };
    writeFileSync(join(tmpDir, "done"), JSON.stringify(signalData));

    const signals = readSignals(tmpDir);
    expect(signals.length).toBeGreaterThanOrEqual(1);

    const done = signals.find((s) => s.type === "done");
    expect(done).toBeDefined();
    expect(done!.agent).toBe("backend");

    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("reads needs-approval signals", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "monitor-test-"));
    const signalData = {
      agent: "solo-fix",
      event: "PermissionRequest",
      tool_name: "Edit",
      at: "2026-04-14T10:00:00Z",
    };
    writeFileSync(join(tmpDir, "needs-approval"), JSON.stringify(signalData));

    const signals = readSignals(tmpDir);
    const approval = signals.find((s) => s.type === "needs-approval");
    expect(approval).toBeDefined();
    expect(approval!.agent).toBe("solo-fix");

    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("returns empty array for nonexistent directory", () => {
    const signals = readSignals("/tmp/nonexistent-signals-dir-xyz-12345");
    expect(signals).toEqual([]);
  });

  test("returns empty array for empty directory", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "monitor-test-"));
    const signals = readSignals(tmpDir);
    expect(signals).toEqual([]);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("handles malformed signal files gracefully", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "monitor-test-"));
    writeFileSync(join(tmpDir, "broken"), "not valid json {{{");

    const signals = readSignals(tmpDir);
    // Should not throw, should skip or return empty for that file
    expect(Array.isArray(signals)).toBe(true);

    rmSync(tmpDir, { recursive: true, force: true });
  });

  test("reads multiple signal files", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "monitor-test-"));
    writeFileSync(
      join(tmpDir, "done"),
      JSON.stringify({ agent: "a", event: "Stop", at: "2026-04-14T10:00:00Z" })
    );
    writeFileSync(
      join(tmpDir, "needs-approval"),
      JSON.stringify({ agent: "b", event: "PermissionRequest", at: "2026-04-14T10:01:00Z" })
    );

    const signals = readSignals(tmpDir);
    expect(signals.length).toBe(2);

    rmSync(tmpDir, { recursive: true, force: true });
  });
});
