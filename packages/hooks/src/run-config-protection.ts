#!/usr/bin/env bun
/**
 * CLI wrapper for config-protection hook.
 * Reads tool call JSON from stdin, checks protected paths, blocks if matched.
 */
import { checkConfigProtection } from "./config-protection.js";
import type { ToolCall } from "./config-protection.js";

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

    const result = checkConfigProtection(call);

    if (result.decision === "DENY") {
      console.error(`[ConfigProtection] ${result.message}`);
      process.exit(2);
    }

    // Pass through original input
    console.log(raw);
  } catch {
    // Never block on parse errors
    console.log(chunks.join(""));
  }
});
