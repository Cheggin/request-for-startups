import { describe, it, expect, beforeEach } from "vitest";
import { createGateGuard } from "../src/gateguard.js";

describe("GateGuard", () => {
  let guard: ReturnType<typeof createGateGuard>;

  beforeEach(() => {
    guard = createGateGuard();
  });

  it("should ALLOW Edit if file was previously Read", () => {
    guard.handleToolCall({ tool_name: "Read", tool_input: { file_path: "/src/app.ts" } });

    const result = guard.handleToolCall({
      tool_name: "Edit",
      tool_input: { file_path: "/src/app.ts", old_string: "foo", new_string: "bar" },
    });

    expect(result).toEqual({ decision: "ALLOW" });
  });

  it("should DENY Edit if file was NOT previously Read", () => {
    const result = guard.handleToolCall({
      tool_name: "Edit",
      tool_input: { file_path: "/src/app.ts", old_string: "foo", new_string: "bar" },
    });

    expect(result.decision).toBe("DENY");
    expect(result.message).toContain("/src/app.ts");
    expect(result.message).toContain("Read");
  });

  it("should track Read calls and add to session set", () => {
    guard.handleToolCall({ tool_name: "Read", tool_input: { file_path: "/src/a.ts" } });
    guard.handleToolCall({ tool_name: "Read", tool_input: { file_path: "/src/b.ts" } });

    expect(guard.getReadFiles()).toContain("/src/a.ts");
    expect(guard.getReadFiles()).toContain("/src/b.ts");
    expect(guard.getReadFiles().size).toBe(2);
  });

  it("should handle multiple files independently", () => {
    guard.handleToolCall({ tool_name: "Read", tool_input: { file_path: "/src/a.ts" } });

    const allowResult = guard.handleToolCall({
      tool_name: "Edit",
      tool_input: { file_path: "/src/a.ts", old_string: "x", new_string: "y" },
    });
    expect(allowResult.decision).toBe("ALLOW");

    const denyResult = guard.handleToolCall({
      tool_name: "Edit",
      tool_input: { file_path: "/src/b.ts", old_string: "x", new_string: "y" },
    });
    expect(denyResult.decision).toBe("DENY");
    expect(denyResult.message).toContain("/src/b.ts");
  });

  it("should reset tracking on new session", () => {
    guard.handleToolCall({ tool_name: "Read", tool_input: { file_path: "/src/a.ts" } });
    expect(guard.getReadFiles().size).toBe(1);

    guard.reset();

    expect(guard.getReadFiles().size).toBe(0);

    const result = guard.handleToolCall({
      tool_name: "Edit",
      tool_input: { file_path: "/src/a.ts", old_string: "x", new_string: "y" },
    });
    expect(result.decision).toBe("DENY");
  });

  it("should ALLOW non-Edit/Write tool calls without restriction", () => {
    const result = guard.handleToolCall({
      tool_name: "Bash",
      tool_input: { command: "ls" },
    });
    expect(result.decision).toBe("ALLOW");
  });

  it("should DENY Write if file was NOT previously Read", () => {
    const result = guard.handleToolCall({
      tool_name: "Write",
      tool_input: { file_path: "/src/new.ts", content: "hello" },
    });
    expect(result.decision).toBe("DENY");
    expect(result.message).toContain("/src/new.ts");
  });

  it("should ALLOW Write if file was previously Read", () => {
    guard.handleToolCall({ tool_name: "Read", tool_input: { file_path: "/src/new.ts" } });

    const result = guard.handleToolCall({
      tool_name: "Write",
      tool_input: { file_path: "/src/new.ts", content: "hello" },
    });
    expect(result).toEqual({ decision: "ALLOW" });
  });
});
