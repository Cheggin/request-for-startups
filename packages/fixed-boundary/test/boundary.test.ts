import { describe, test, expect } from "bun:test";
import {
  checkBoundary,
  FROZEN_PATHS,
  loadAgentScopes,
} from "../src/boundary.js";

describe("FROZEN_PATHS", () => {
  test("contains critical harness paths", () => {
    expect(FROZEN_PATHS).toContain("packages/");
    expect(FROZEN_PATHS).toContain(".harness/");
    expect(FROZEN_PATHS).toContain("agents/");
    expect(FROZEN_PATHS).toContain("skills/");
  });

  test("contains config files", () => {
    expect(FROZEN_PATHS).toContain(".claude/settings.json");
    expect(FROZEN_PATHS).toContain("Taskfile.yml");
    expect(FROZEN_PATHS).toContain("SOUL.md");
  });
});

describe("checkBoundary", () => {
  // ─── Frozen path blocking ─────────────────────────────────────────────────

  test("blocks Edit to packages/ directory", () => {
    const result = checkBoundary("builder", "packages/hooks/src/index.ts", "Edit");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("frozen");
  });

  test("blocks Write to .harness/ directory", () => {
    const result = checkBoundary("builder", ".harness/agents/planner.json", "Write");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("frozen");
  });

  test("blocks Edit to .claude/settings.json", () => {
    const result = checkBoundary("builder", ".claude/settings.json", "Edit");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("frozen");
  });

  test("blocks Write to Taskfile.yml", () => {
    const result = checkBoundary("builder", "Taskfile.yml", "Write");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("frozen");
  });

  test("blocks Edit to SOUL.md", () => {
    const result = checkBoundary("builder", "SOUL.md", "Edit");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("frozen");
  });

  test("blocks Write to agents/ directory", () => {
    const result = checkBoundary("builder", "agents/backend.md", "Write");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("frozen");
  });

  test("blocks Edit to skills/ directory", () => {
    const result = checkBoundary("builder", "skills/loop/SKILL.md", "Edit");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("frozen");
  });

  // ─── Allowed operations ───────────────────────────────────────────────────

  test("allows Edit to src/ files by default", () => {
    const result = checkBoundary("builder", "src/components/Header.tsx", "Edit");
    expect(result.allowed).toBe(true);
  });

  test("allows Write to app/ files by default", () => {
    const result = checkBoundary("builder", "app/page.tsx", "Write");
    expect(result.allowed).toBe(true);
  });

  test("allows Read to any file (Read is never blocked)", () => {
    const result = checkBoundary("builder", ".harness/agents/planner.json", "Read");
    expect(result.allowed).toBe(true);
  });

  test("allows Bash tool (only Edit/Write are gated)", () => {
    const result = checkBoundary("builder", "packages/hooks/src/index.ts", "Bash");
    expect(result.allowed).toBe(true);
  });

  // ─── Agent scope enforcement ──────────────────────────────────────────────

  test("blocks agent writing outside their fileScope", () => {
    const scopes = new Map([["frontend", ["src/components/", "src/styles/"]]]);
    const result = checkBoundary("frontend", "src/api/handler.ts", "Edit", scopes);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("scope");
  });

  test("allows agent writing within their fileScope", () => {
    const scopes = new Map([["frontend", ["src/components/", "src/styles/"]]]);
    const result = checkBoundary("frontend", "src/components/Button.tsx", "Edit", scopes);
    expect(result.allowed).toBe(true);
  });

  test("agent without scope definition is allowed everywhere (non-frozen)", () => {
    const scopes = new Map([["frontend", ["src/components/"]]]);
    const result = checkBoundary("backend", "src/api/handler.ts", "Edit", scopes);
    expect(result.allowed).toBe(true);
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────

  test("normalized paths: backslashes converted to forward slashes", () => {
    const result = checkBoundary("builder", "packages\\hooks\\src\\index.ts", "Edit");
    expect(result.allowed).toBe(false);
  });

  test("absolute paths are handled by stripping leading slash", () => {
    const result = checkBoundary("builder", "/project/packages/hooks/src/index.ts", "Edit");
    expect(result.allowed).toBe(false);
  });
});

describe("loadAgentScopes", () => {
  test("returns empty map for non-existent directory", () => {
    const scopes = loadAgentScopes("/non/existent/path");
    expect(scopes.size).toBe(0);
  });

  test("loads scopes from tracked .harness/agents/ with object fileScope", () => {
    // The tracked agent configs use { writable, readonly, blocked } shape
    const { join } = require("path");
    const agentsDir = join(process.cwd(), ".harness", "agents");
    const scopes = loadAgentScopes(agentsDir);
    // Should have loaded at least the agents with fileScope
    expect(scopes.size).toBeGreaterThan(0);
    // Each scope should be a flat string[] (writable paths extracted from the object)
    for (const [, scope] of scopes) {
      expect(Array.isArray(scope)).toBe(true);
      for (const entry of scope) {
        expect(typeof entry).toBe("string");
      }
    }
  });
});

describe("checkBoundary with object-shaped fileScope", () => {
  test("blocks agent outside writable scope when fileScope is object-shaped", () => {
    // Simulate what loadAgentScopes produces from { writable: ["src/**"], ... }
    const scopes = new Map([["writing", ["content/", "docs/", "blog/"]]]);
    const result = checkBoundary("writing", "src/app/page.tsx", "Edit", scopes);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("scope");
  });

  test("allows agent within writable scope when fileScope is object-shaped", () => {
    const scopes = new Map([["writing", ["content/", "docs/", "blog/"]]]);
    const result = checkBoundary("writing", "content/blog/post.md", "Edit", scopes);
    expect(result.allowed).toBe(true);
  });

  test("agent with empty writable scope can only read", () => {
    // alignment agent has writable: [] — should block all writes
    const scopes = new Map([["alignment", []]]);
    const result = checkBoundary("alignment", "some/random/file.ts", "Edit", scopes);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("scope");
  });
});
