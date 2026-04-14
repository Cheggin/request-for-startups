/**
 * Metrics Gate — PreToolUse hook on Edit, Write, Bash
 *
 * Enforces SOUL.md rule: "Every action must have a measurable hypothesis."
 * Blocks growth agents from making changes unless a hypothesis has been
 * registered for the current session.
 *
 * Growth agents must set METRICS_HYPOTHESIS env var or write to
 * /tmp/harness-metrics-gate.json with their hypothesis before
 * any modifying action will be allowed.
 */

export interface ToolCall {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface HookResult {
  decision: "ALLOW" | "DENY";
  message?: string;
}

/**
 * Tools that require a hypothesis before use.
 * Read/Grep/Glob are research — they don't need a hypothesis.
 * Edit/Write/Bash are actions that change state.
 */
const GATED_TOOLS = new Set(["Edit", "Write", "Bash"]);

/**
 * Bash commands that are read-only and safe without a hypothesis.
 */
const SAFE_BASH_PATTERNS = [
  /^\s*git\s+(status|log|diff|show|branch)\b/,
  /^\s*ls\b/,
  /^\s*cat\b/,
  /^\s*head\b/,
  /^\s*tail\b/,
  /^\s*grep\b/,
  /^\s*rg\b/,
  /^\s*find\b/,
  /^\s*gh\s+(issue|pr)\s+(view|list)\b/,
  /^\s*echo\b/,
  /^\s*pwd\b/,
  /^\s*wc\b/,
];

function isSafeBashCommand(command: string): boolean {
  return SAFE_BASH_PATTERNS.some((pattern) => pattern.test(command));
}

export function checkMetricsGate(
  call: ToolCall,
  hasHypothesis: boolean
): HookResult {
  if (!GATED_TOOLS.has(call.tool_name)) {
    return { decision: "ALLOW" };
  }

  // Allow read-only bash commands without a hypothesis
  if (call.tool_name === "Bash") {
    const command = (call.tool_input.command as string) || "";
    if (isSafeBashCommand(command)) {
      return { decision: "ALLOW" };
    }
  }

  if (hasHypothesis) {
    return { decision: "ALLOW" };
  }

  return {
    decision: "DENY",
    message:
      `BLOCKED: Growth agent action (${call.tool_name}) requires a measurable hypothesis. ` +
      "Before making changes, define your hypothesis with expected metrics. " +
      "Set METRICS_HYPOTHESIS='your hypothesis here' or write to " +
      "/tmp/harness-metrics-gate.json with " +
      '{ "hypothesis": "description", "metric": "what to measure", "baseline": "current value" } ' +
      "before retrying.",
  };
}
