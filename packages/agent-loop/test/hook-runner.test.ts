import { describe, test, expect } from "bun:test";
import {
  createGateGuard,
  configProtection,
  createLoggingHook,
  createDefaultHooks,
  runBeforeHooks,
  runAfterHooks,
} from "../src/hook-runner.js";
import type { ToolCallContext, AfterToolCallResult, HookSet } from "../src/types.js";

function makeCtx(overrides: Partial<ToolCallContext> = {}): ToolCallContext {
  return {
    toolName: "Read",
    args: {},
    agentName: "backend",
    ...overrides,
  };
}

describe("createGateGuard", () => {
  const guard = createGateGuard(["Write", "Bash"]);

  test("blocks disallowed tools", () => {
    const result = guard(makeCtx({ toolName: "Write" }));
    expect(result?.block).toBe(true);
    expect(result?.reason).toContain("Write");
    expect(result?.reason).toContain("backend");
  });

  test("allows non-disallowed tools", () => {
    const result = guard(makeCtx({ toolName: "Read" }));
    expect(result).toBeUndefined();
  });
});

describe("configProtection", () => {
  test("blocks Write to .env", () => {
    const result = configProtection(
      makeCtx({ toolName: "Write", args: { file_path: "/project/.env" } }),
    );
    expect(result?.block).toBe(true);
  });

  test("blocks Edit to tsconfig.json", () => {
    const result = configProtection(
      makeCtx({ toolName: "Edit", args: { file_path: "/project/tsconfig.json" } }),
    );
    expect(result?.block).toBe(true);
  });

  test("blocks Bash touching .github/", () => {
    const result = configProtection(
      makeCtx({ toolName: "Bash", args: { command: "rm -rf .github/workflows" } }),
    );
    expect(result?.block).toBe(true);
  });

  test("allows Write to regular source files", () => {
    const result = configProtection(
      makeCtx({ toolName: "Write", args: { file_path: "/project/src/index.ts" } }),
    );
    expect(result).toBeUndefined();
  });

  test("ignores non-write tools", () => {
    const result = configProtection(
      makeCtx({ toolName: "Read", args: { file_path: "/project/.env" } }),
    );
    expect(result).toBeUndefined();
  });
});

describe("createLoggingHook", () => {
  test("logs tool execution with status", () => {
    const logs: string[] = [];
    const hook = createLoggingHook((msg) => logs.push(msg));

    const result: AfterToolCallResult = { output: "file contents here", isError: false };
    const returned = hook(makeCtx({ toolName: "Read" }), result);

    expect(logs.length).toBe(1);
    expect(logs[0]).toContain("[OK]");
    expect(logs[0]).toContain("backend:Read");
    expect(returned).toBe(result); // passes through unchanged
  });

  test("logs errors with ERROR status", () => {
    const logs: string[] = [];
    const hook = createLoggingHook((msg) => logs.push(msg));

    hook(makeCtx(), { output: "command failed", isError: true });
    expect(logs[0]).toContain("[ERROR]");
  });
});

describe("runBeforeHooks", () => {
  test("returns first block result", () => {
    const hooks: HookSet = {
      beforeToolCall: [
        () => undefined,
        () => ({ block: true, reason: "blocked by second" }),
        () => ({ block: true, reason: "should not reach" }),
      ],
      afterToolCall: [],
    };

    const result = runBeforeHooks(hooks, makeCtx());
    expect(result?.block).toBe(true);
    expect(result?.reason).toBe("blocked by second");
  });

  test("returns undefined when all hooks pass", () => {
    const hooks: HookSet = {
      beforeToolCall: [() => undefined, () => undefined],
      afterToolCall: [],
    };

    expect(runBeforeHooks(hooks, makeCtx())).toBeUndefined();
  });
});

describe("runAfterHooks", () => {
  test("threads result through hooks", () => {
    const hooks: HookSet = {
      beforeToolCall: [],
      afterToolCall: [
        (_ctx, r) => ({ ...r, output: r.output + " | hook1" }),
        (_ctx, r) => ({ ...r, output: r.output + " | hook2" }),
      ],
    };

    const result = runAfterHooks(hooks, makeCtx(), {
      output: "original",
      isError: false,
    });

    expect(result.output).toBe("original | hook1 | hook2");
  });
});

describe("createDefaultHooks", () => {
  test("includes GateGuard and configProtection", () => {
    const hooks = createDefaultHooks(["Bash"]);
    expect(hooks.beforeToolCall.length).toBe(2);

    // GateGuard blocks Bash
    const result = runBeforeHooks(hooks, makeCtx({ toolName: "Bash" }));
    expect(result?.block).toBe(true);
  });

  test("adds logging hook when log function provided", () => {
    const hooks = createDefaultHooks([], () => {});
    expect(hooks.afterToolCall.length).toBe(1);
  });

  test("no afterToolCall hooks when no log function", () => {
    const hooks = createDefaultHooks([]);
    expect(hooks.afterToolCall.length).toBe(0);
  });
});
