/**
 * Tests for commands/ceo-monitor.ts — CEO monitor CLI command.
 *
 * TDD red phase: tests written before implementation.
 * Tests cover pure functions exported from the command module:
 *   - parseMonitorArgs: CLI arg parsing
 *   - formatTickReport: formatting MonitorResult for terminal output
 *   - classifyFleetHealth: aggregate health from pane statuses
 */

import { describe, test, expect } from "bun:test";
import {
  parseMonitorArgs,
  formatTickReport,
  classifyFleetHealth,
  type MonitorArgs,
  type FleetHealth,
} from "../src/commands/ceo-monitor.js";
import type { MonitorResult } from "../src/lib/tmux-monitor.js";

// ─── parseMonitorArgs ─────────────────────────────────────────────────────

describe("parseMonitorArgs", () => {
  test("defaults to help when no subcommand", () => {
    const result = parseMonitorArgs([]);
    expect(result.subcommand).toBe("help");
  });

  test("parses 'once' subcommand", () => {
    const result = parseMonitorArgs(["once"]);
    expect(result.subcommand).toBe("once");
  });

  test("parses 'status' subcommand", () => {
    const result = parseMonitorArgs(["status"]);
    expect(result.subcommand).toBe("status");
  });

  test("parses --json flag", () => {
    const result = parseMonitorArgs(["once", "--json"]);
    expect(result.subcommand).toBe("once");
    expect(result.json).toBe(true);
  });

  test("parses --verbose flag", () => {
    const result = parseMonitorArgs(["status", "--verbose"]);
    expect(result.verbose).toBe(true);
  });

  test("--json defaults to false", () => {
    const result = parseMonitorArgs(["once"]);
    expect(result.json).toBe(false);
  });

  test("--verbose defaults to false", () => {
    const result = parseMonitorArgs(["once"]);
    expect(result.verbose).toBe(false);
  });

  test("unknown subcommand falls back to help", () => {
    const result = parseMonitorArgs(["unknown-thing"]);
    expect(result.subcommand).toBe("help");
  });

  test("parses 'tick' as alias for once", () => {
    const result = parseMonitorArgs(["tick"]);
    expect(result.subcommand).toBe("once");
  });
});

// ─── classifyFleetHealth ──────────────────────────────────────────────────

describe("classifyFleetHealth", () => {
  test("healthy when all panes are working", () => {
    const result = makeMonitorResult([
      { name: "a", status: "working" },
      { name: "b", status: "working" },
    ]);
    expect(classifyFleetHealth(result)).toBe("healthy");
  });

  test("healthy when mix of working and idle", () => {
    const result = makeMonitorResult([
      { name: "a", status: "working" },
      { name: "b", status: "idle" },
    ]);
    expect(classifyFleetHealth(result)).toBe("healthy");
  });

  test("degraded when any pane needs approval", () => {
    const result = makeMonitorResult([
      { name: "a", status: "working" },
      { name: "b", status: "needs-approval" },
    ]);
    expect(classifyFleetHealth(result)).toBe("degraded");
  });

  test("degraded when any pane is stuck", () => {
    const result = makeMonitorResult([
      { name: "a", status: "working" },
      { name: "b", status: "stuck" },
    ]);
    expect(classifyFleetHealth(result)).toBe("degraded");
  });

  test("critical when majority of panes are stuck", () => {
    const result = makeMonitorResult([
      { name: "a", status: "stuck" },
      { name: "b", status: "stuck" },
      { name: "c", status: "working" },
    ]);
    expect(classifyFleetHealth(result)).toBe("critical");
  });

  test("idle when all panes are idle", () => {
    const result = makeMonitorResult([
      { name: "a", status: "idle" },
      { name: "b", status: "idle" },
    ]);
    expect(classifyFleetHealth(result)).toBe("idle");
  });

  test("idle when no panes", () => {
    const result = makeMonitorResult([]);
    expect(classifyFleetHealth(result)).toBe("idle");
  });
});

// ─── formatTickReport ─────────────────────────────────────────────────────

describe("formatTickReport", () => {
  test("includes fleet health label", () => {
    const result = makeMonitorResult([
      { name: "backend", status: "working" },
    ]);
    const output = formatTickReport(result);
    expect(output).toContain("HEALTHY");
  });

  test("includes pane count", () => {
    const result = makeMonitorResult([
      { name: "a", status: "working" },
      { name: "b", status: "idle" },
      { name: "c", status: "stuck" },
    ]);
    const output = formatTickReport(result);
    expect(output).toContain("3");
  });

  test("includes agent names", () => {
    const result = makeMonitorResult([
      { name: "backend-builder", status: "working" },
      { name: "frontend-dev", status: "idle" },
    ]);
    const output = formatTickReport(result);
    expect(output).toContain("backend-builder");
    expect(output).toContain("frontend-dev");
  });

  test("includes status tags for each pane", () => {
    const result = makeMonitorResult([
      { name: "a", status: "working" },
      { name: "b", status: "stuck" },
      { name: "c", status: "needs-approval" },
    ]);
    const output = formatTickReport(result);
    expect(output).toContain("WORKING");
    expect(output).toContain("STUCK");
    expect(output).toContain("APPROVE");
  });

  test("shows auto-approved actions", () => {
    const result = makeMonitorResult(
      [{ name: "a", status: "working" }],
      ["a:Read(/path/to/file.ts)"]
    );
    const output = formatTickReport(result);
    expect(output).toContain("Auto-approved");
    expect(output).toContain("Read");
  });

  test("shows signal count when signals present", () => {
    const result: MonitorResult = {
      panes: [makePane("a", "working")],
      signals: [
        { type: "done", agent: "backend", event: "Stop", at: "2026-04-14T10:00:00Z", data: {} },
      ],
      autoApproved: [],
      report: "",
    };
    const output = formatTickReport(result);
    expect(output).toContain("signal");
  });

  test("returns concise output for empty fleet", () => {
    const result = makeMonitorResult([]);
    const output = formatTickReport(result);
    expect(output).toContain("No agents");
  });

  test("formats as JSON when json flag is true", () => {
    const result = makeMonitorResult([
      { name: "a", status: "working" },
    ]);
    const output = formatTickReport(result, { json: true });
    const parsed = JSON.parse(output);
    expect(parsed.health).toBe("healthy");
    expect(parsed.panes).toHaveLength(1);
  });

  test("includes verbose pane output when verbose flag is set", () => {
    const result = makeMonitorResult([
      { name: "builder", status: "working", lastLine: "Compiling TypeScript..." },
    ]);
    const output = formatTickReport(result, { verbose: true });
    expect(output).toContain("Compiling TypeScript...");
  });
});

// ─── Test helpers ─────────────────────────────────────────────────────────

function makePane(
  name: string,
  status: "working" | "idle" | "stuck" | "needs-approval",
  lastLine = ""
) {
  return { name, paneId: `%${Math.floor(Math.random() * 100)}`, status, lastLine };
}

function makeMonitorResult(
  paneSpecs: Array<{ name: string; status: "working" | "idle" | "stuck" | "needs-approval"; lastLine?: string }>,
  autoApproved: string[] = []
): MonitorResult {
  return {
    panes: paneSpecs.map((s) => makePane(s.name, s.status, s.lastLine)),
    signals: [],
    autoApproved,
    report: "",
  };
}
