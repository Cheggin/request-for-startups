import { describe, test, expect } from "bun:test";
import { handleHookInput } from "../src/hook.js";

describe("handleHookInput (CLI hook wrapper)", () => {
  test("allows Read tool on frozen path", () => {
    const input = {
      tool_name: "Read",
      tool_input: { file_path: ".harness/settings.json" },
    };
    const result = handleHookInput(JSON.stringify(input));
    expect(result.decision).toBe("ALLOW");
  });

  test("blocks Edit tool on frozen path", () => {
    const input = {
      tool_name: "Edit",
      tool_input: { file_path: "packages/hooks/src/index.ts" },
    };
    const result = handleHookInput(JSON.stringify(input));
    expect(result.decision).toBe("DENY");
    expect(result.message).toContain("frozen");
  });

  test("blocks Write tool on frozen path", () => {
    const input = {
      tool_name: "Write",
      tool_input: { file_path: ".harness/agents/planner.json" },
    };
    const result = handleHookInput(JSON.stringify(input));
    expect(result.decision).toBe("DENY");
  });

  test("allows Edit tool on non-frozen path", () => {
    const input = {
      tool_name: "Edit",
      tool_input: { file_path: "src/components/Header.tsx" },
    };
    const result = handleHookInput(JSON.stringify(input));
    expect(result.decision).toBe("ALLOW");
  });

  test("returns ALLOW on invalid JSON (fail-open)", () => {
    const result = handleHookInput("not valid json");
    expect(result.decision).toBe("ALLOW");
  });

  test("returns ALLOW on missing tool_name", () => {
    const result = handleHookInput(JSON.stringify({ tool_input: {} }));
    expect(result.decision).toBe("ALLOW");
  });
});
