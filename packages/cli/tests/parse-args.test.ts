import { describe, expect, test } from "bun:test";
import { parseArgs } from "../src/index";

describe("parseArgs", () => {
  test("parses group and command", () => {
    const result = parseArgs(["bun", "index.ts", "agent", "list"]);
    expect(result.group).toBe("agent");
    expect(result.command).toBe("list");
    expect(result.positional).toEqual([]);
    expect(result.flags).toEqual({});
  });

  test("parses positional arguments", () => {
    const result = parseArgs(["bun", "index.ts", "agent", "spawn", "backend", "build the API"]);
    expect(result.group).toBe("agent");
    expect(result.command).toBe("spawn");
    expect(result.positional).toEqual(["backend", "build the API"]);
  });

  test("parses boolean flags", () => {
    const result = parseArgs(["bun", "index.ts", "feature", "list", "--done"]);
    expect(result.flags).toEqual({ done: true });
  });

  test("parses value flags", () => {
    const result = parseArgs(["bun", "index.ts", "skill", "list", "--category", "coding"]);
    expect(result.flags).toEqual({ category: "coding" });
  });

  test("handles mixed positional and flags", () => {
    // --verbose consumes the next non-flag arg as its value
    const result = parseArgs(["bun", "index.ts", "agent", "spawn", "backend", "--verbose", "do stuff"]);
    expect(result.positional).toEqual(["backend"]);
    expect(result.flags).toEqual({ verbose: "do stuff" });
  });

  test("boolean flag at end of args", () => {
    const result = parseArgs(["bun", "index.ts", "feature", "list", "--done", "--blocked"]);
    expect(result.flags).toEqual({ done: true, blocked: true });
  });

  test("handles empty args", () => {
    const result = parseArgs(["bun", "index.ts"]);
    expect(result.group).toBe("");
    expect(result.command).toBe("");
  });

  test("handles group only", () => {
    const result = parseArgs(["bun", "index.ts", "status"]);
    expect(result.group).toBe("status");
    expect(result.command).toBe("");
  });
});
