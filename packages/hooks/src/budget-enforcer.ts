/**
 * Budget Enforcer - Tracks turns and wall-clock time
 *
 * Reads maxTurns and maxMinutes from config (or uses defaults).
 * Increments turn counter on each tool call.
 * Tracks session start time.
 * Returns DENY when limit exceeded.
 */

export interface ToolCall {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface HookResult {
  decision: "ALLOW" | "DENY";
  message?: string;
}

export interface BudgetConfig {
  maxTurns?: number;
  maxMinutes?: number;
  startTime?: number;
}

const DEFAULT_MAX_TURNS = 200;
const DEFAULT_MAX_MINUTES = 120;

export function createBudgetEnforcer(config?: BudgetConfig) {
  const maxTurns = config?.maxTurns ?? DEFAULT_MAX_TURNS;
  const maxMinutes = config?.maxMinutes ?? DEFAULT_MAX_MINUTES;
  const startTime = config?.startTime ?? Date.now();
  let turnCount = 0;
  let limitReached = false;

  function handleToolCall(_call: ToolCall): HookResult {
    if (limitReached) {
      return {
        decision: "DENY",
        message: `Session turn limit of ${maxTurns} turns has been reached. Start a new session to continue.`,
      };
    }

    // Check time limit first
    const elapsedMs = Date.now() - startTime;
    const elapsedMinutes = elapsedMs / (1000 * 60);
    if (elapsedMinutes > maxMinutes) {
      limitReached = true;
      return {
        decision: "DENY",
        message: `Session time limit of ${maxMinutes} minutes exceeded. Start a new session to continue.`,
      };
    }

    turnCount++;

    // Check turn limit after increment
    if (turnCount > maxTurns) {
      limitReached = true;
      turnCount = maxTurns; // Cap at limit
      return {
        decision: "DENY",
        message: `Session turn limit of ${maxTurns} turns has been reached. Start a new session to continue.`,
      };
    }

    return { decision: "ALLOW" };
  }

  function getTurnCount(): number {
    return turnCount;
  }

  function getElapsedMinutes(): number {
    return (Date.now() - startTime) / (1000 * 60);
  }

  function getConfig(): { maxTurns: number; maxMinutes: number } {
    return { maxTurns, maxMinutes };
  }

  return { handleToolCall, getTurnCount, getElapsedMinutes, getConfig };
}
