import { describe, test, expect } from "bun:test";
import { categorize, truncate, CATEGORY_META } from "./agent-classify";
import type { RealAgent } from "./data";

function makeAgent(overrides: Partial<RealAgent> = {}): RealAgent {
  return {
    name: "test-agent",
    status: "running",
    paneId: "%1",
    lastOutput: "",
    cwd: "/tmp/test",
    startup: "test-startup",
    ...overrides,
  };
}

describe("categorize", () => {
  test("detects working agent from activity patterns", () => {
    const agent = makeAgent({ lastOutput: "Reading file src/index.ts" });
    const result = categorize(agent);
    expect(result.category).toBe("working");
    expect(result.summary).toContain("Reading");
  });

  test("detects needs-permission from output", () => {
    const agent = makeAgent({ lastOutput: "needs permission to write" });
    const result = categorize(agent);
    expect(result.category).toBe("needs-permission");
  });

  test("detects error from output", () => {
    const agent = makeAgent({ lastOutput: "Error: ENOENT no such file" });
    const result = categorize(agent);
    expect(result.category).toBe("error");
  });

  test("excludes false-positive errors like 'no errors'", () => {
    const agent = makeAgent({ lastOutput: "Build complete, no errors" });
    const result = categorize(agent);
    expect(result.category).toBe("working");
  });

  test("returns idle for stopped agent with no output", () => {
    const agent = makeAgent({ status: "idle", lastOutput: "" });
    const result = categorize(agent);
    expect(result.category).toBe("idle");
  });
});

describe("truncate", () => {
  test("returns short strings unchanged", () => {
    expect(truncate("hello")).toBe("hello");
  });

  test("truncates long strings with ellipsis", () => {
    const long = "a".repeat(200);
    const result = truncate(long, 50);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result).toContain("...");
  });
});

describe("CATEGORY_META", () => {
  test("has entries for all categories", () => {
    expect(CATEGORY_META.working).toBeDefined();
    expect(CATEGORY_META.idle).toBeDefined();
    expect(CATEGORY_META.error).toBeDefined();
    expect(CATEGORY_META["needs-permission"]).toBeDefined();
  });
});
