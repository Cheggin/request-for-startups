/**
 * Hook runner — executes beforeToolCall and afterToolCall hook chains.
 *
 * Inspired by pi-mono's beforeToolCall/afterToolCall pattern:
 * - beforeToolCall hooks run sequentially; first block wins
 * - afterToolCall hooks run sequentially; each can transform the result
 */

import type {
  HookSet,
  ToolCallContext,
  BeforeToolCallResult,
  AfterToolCallResult,
} from "./types.js";

// ─── Built-in Hooks ──────────────────────────────────────────────────────────

/**
 * GateGuard hook: blocks disallowed tools for the current agent.
 */
export function createGateGuard(disallowedTools: string[]) {
  const blocked = new Set(disallowedTools);
  return (ctx: ToolCallContext): BeforeToolCallResult | undefined => {
    if (blocked.has(ctx.toolName)) {
      return {
        block: true,
        reason: `Tool "${ctx.toolName}" is not allowed for agent "${ctx.agentName}"`,
      };
    }
    return undefined;
  };
}

/**
 * Config protection hook: prevents writing to sensitive config files.
 */
const PROTECTED_PATTERNS = [
  /\.env/,
  /tsconfig\.json$/,
  /package\.json$/,
  /\.github\//,
  /\.harness\//,
];

export function configProtection(ctx: ToolCallContext): BeforeToolCallResult | undefined {
  // Only check write-like tools
  const writeLikeTools = ["Write", "Edit", "Bash"];
  if (!writeLikeTools.includes(ctx.toolName)) {
    return undefined;
  }

  const filePath =
    (ctx.args.file_path as string) ??
    (ctx.args.path as string) ??
    (ctx.args.command as string) ??
    "";

  for (const pattern of PROTECTED_PATTERNS) {
    if (pattern.test(filePath)) {
      return {
        block: true,
        reason: `Blocked: "${ctx.toolName}" targets protected path matching ${pattern}`,
      };
    }
  }

  return undefined;
}

/**
 * Logging hook for afterToolCall — logs tool execution details.
 */
export function createLoggingHook(
  log: (message: string) => void,
) {
  return (ctx: ToolCallContext, result: AfterToolCallResult): AfterToolCallResult => {
    const status = result.isError ? "ERROR" : "OK";
    const preview = result.output.slice(0, 200);
    log(`[${status}] ${ctx.agentName}:${ctx.toolName} → ${preview}`);
    return result;
  };
}

// ─── Hook Execution ──────────────────────────────────────────────────────────

/**
 * Run all beforeToolCall hooks. Returns the first block result, or undefined if all pass.
 */
export function runBeforeHooks(
  hooks: HookSet,
  ctx: ToolCallContext,
): BeforeToolCallResult | undefined {
  for (const hook of hooks.beforeToolCall) {
    const result = hook(ctx);
    if (result?.block) {
      return result;
    }
  }
  return undefined;
}

/**
 * Run all afterToolCall hooks, threading the result through each.
 */
export function runAfterHooks(
  hooks: HookSet,
  ctx: ToolCallContext,
  result: AfterToolCallResult,
): AfterToolCallResult {
  let current = result;
  for (const hook of hooks.afterToolCall) {
    current = hook(ctx, current);
  }
  return current;
}

/**
 * Create a default HookSet for an agent with the standard built-in hooks.
 */
export function createDefaultHooks(
  disallowedTools: string[],
  log?: (message: string) => void,
): HookSet {
  const hooks: HookSet = {
    beforeToolCall: [
      createGateGuard(disallowedTools),
      configProtection,
    ],
    afterToolCall: [],
  };

  if (log) {
    hooks.afterToolCall.push(createLoggingHook(log));
  }

  return hooks;
}
