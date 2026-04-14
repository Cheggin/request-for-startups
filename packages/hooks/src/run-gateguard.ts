#!/usr/bin/env bun
/**
 * CLI wrapper for GateGuard hook.
 * Reads tool call JSON from stdin, checks config-protection rules, outputs result.
 *
 * Note: GateGuard's read-file tracking is stateful across a session, but hooks
 * are invoked as separate processes. We run the config-protection check here
 * (stateless) and use this as the Edit matcher hook. The full stateful gateguard
 * would require a persistent process or file-based state.
 */
import { createGateGuard } from "./gateguard.js";
import type { ToolCall } from "./gateguard.js";

const chunks: string[] = [];
process.stdin.on("data", (chunk) => chunks.push(chunk.toString()));
process.stdin.on("end", () => {
  try {
    const raw = chunks.join("");
    const input = JSON.parse(raw) as { tool_name: string; tool_input: Record<string, unknown> };

    const call: ToolCall = {
      tool_name: input.tool_name,
      tool_input: input.tool_input,
    };

    const guard = createGateGuard();
    const result = guard.handleToolCall(call);

    if (result.decision === "DENY") {
      console.error(`[GateGuard] ${result.message}`);
      process.exit(2);
    }

    // Pass through original input
    console.log(raw);
  } catch {
    // Never block on parse errors
    console.log(chunks.join(""));
  }
});
