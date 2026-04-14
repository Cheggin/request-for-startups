/**
 * CLI wrapper for the fixed-boundary hook.
 *
 * Reads stdin (hook input JSON), calls checkBoundary, outputs JSON result.
 * Designed to be used as a PreToolUse hook in Claude Code settings.
 *
 * Input format: { tool_name: string, tool_input: { file_path?: string, ... } }
 * Output: { decision: "ALLOW" | "DENY", message?: string }
 */

import { checkBoundary } from "./boundary.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface HookOutput {
  decision: "ALLOW" | "DENY";
  message?: string;
}

// ─── Default agent name when running as a standalone hook ────────────────────

const DEFAULT_AGENT = "unknown";

// ─── Hook Handler ───────────────────────────────────────────────────────────

/**
 * Process raw hook input JSON string and return a decision.
 * Fail-open on parse errors (never block on broken input).
 */
export function handleHookInput(rawInput: string): HookOutput {
  try {
    const input = JSON.parse(rawInput) as Partial<HookInput>;

    if (!input.tool_name) {
      return { decision: "ALLOW" };
    }

    const filePath =
      (input.tool_input?.file_path as string) ??
      (input.tool_input?.path as string) ??
      "";

    if (!filePath) {
      return { decision: "ALLOW" };
    }

    const result = checkBoundary(DEFAULT_AGENT, filePath, input.tool_name);

    if (!result.allowed) {
      return {
        decision: "DENY",
        message: result.reason,
      };
    }

    return { decision: "ALLOW" };
  } catch {
    // Fail-open: never block on parse errors
    return { decision: "ALLOW" };
  }
}

// ─── CLI Entry Point ────────────────────────────────────────────────────────

/**
 * When run as a CLI script, reads stdin and writes result to stdout.
 */
export function runCli(): void {
  const chunks: string[] = [];
  process.stdin.on("data", (chunk) => chunks.push(chunk.toString()));
  process.stdin.on("end", () => {
    const raw = chunks.join("");
    const result = handleHookInput(raw);

    if (result.decision === "DENY") {
      console.error(`[FixedBoundary] ${result.message}`);
      process.exit(2);
    }

    // Pass through original input
    console.log(raw);
  });
}
