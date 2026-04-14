/**
 * Tests for lib/tmux.ts — tmux pane management.
 *
 * These tests cover the pure logic. Actual tmux commands are tested
 * only when tmux is available (CI-safe).
 */

import { describe, test, expect } from "bun:test";
import { isTmuxAvailable } from "../src/lib/tmux.js";
import { TMUX_SESSION_PREFIX, TMUX_CAPTURE_LINES } from "../src/lib/constants.js";

describe("tmux constants", () => {
  test("session prefix is set", () => {
    expect(TMUX_SESSION_PREFIX).toBe("harness");
  });

  test("capture lines default is reasonable", () => {
    expect(TMUX_CAPTURE_LINES).toBe(200);
  });
});

describe("isTmuxAvailable", () => {
  test("returns a boolean", () => {
    const result = isTmuxAvailable();
    expect(typeof result).toBe("boolean");
  });
});

// Integration tests — only run when tmux is available
const hasTmux = isTmuxAvailable();

describe.skipIf(!hasTmux)("tmux integration", () => {
  // Note: We don't run destructive tmux tests in CI.
  // These tests verify the API contract without creating actual sessions.

  test("listPanes returns an array", async () => {
    const { listPanes } = await import("../src/lib/tmux.js");
    const panes = listPanes();
    expect(Array.isArray(panes)).toBe(true);
  });

  test("paneExists returns false for nonexistent pane", async () => {
    const { paneExists } = await import("../src/lib/tmux.js");
    const exists = paneExists("nonexistent-test-pane-xyz");
    expect(exists).toBe(false);
  });

  test("capturePaneOutput returns empty for nonexistent pane", async () => {
    const { capturePaneOutput } = await import("../src/lib/tmux.js");
    const output = capturePaneOutput("nonexistent-test-pane-xyz");
    expect(output).toBe("");
  });
});
