#!/usr/bin/env bun
/**
 * CLI wrapper for budget-enforcer hook.
 * Reads tool call JSON from stdin, tracks turns via a temp state file.
 *
 * State is persisted to /tmp/harness-budget-state.json so the turn counter
 * survives across hook invocations within a session.
 */
import { readFileSync, writeFileSync } from "fs";
import { createBudgetEnforcer } from "./budget-enforcer.js";
import type { ToolCall } from "./budget-enforcer.js";

const STATE_FILE = "/tmp/harness-budget-state.json";

interface BudgetState {
  turnCount: number;
  startTime: number;
}

function loadState(): BudgetState {
  try {
    const raw = readFileSync(STATE_FILE, "utf-8");
    return JSON.parse(raw) as BudgetState;
  } catch {
    return { turnCount: 0, startTime: Date.now() };
  }
}

function saveState(state: BudgetState): void {
  try {
    writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch {
    // Best effort
  }
}

const chunks: string[] = [];
process.stdin.on("data", (chunk) => chunks.push(chunk.toString()));
process.stdin.on("end", () => {
  try {
    const raw = chunks.join("");
    const input = JSON.parse(raw) as { tool_name: string; tool_input: Record<string, unknown> };

    const state = loadState();
    const enforcer = createBudgetEnforcer({
      startTime: state.startTime,
    });

    // Replay turns to get to the right count
    const dummyCall: ToolCall = { tool_name: "noop", tool_input: {} };
    for (let i = 0; i < state.turnCount; i++) {
      enforcer.handleToolCall(dummyCall);
    }

    // Now check the actual call
    const call: ToolCall = {
      tool_name: input.tool_name,
      tool_input: input.tool_input,
    };

    const result = enforcer.handleToolCall(call);

    // Save updated state
    saveState({
      turnCount: enforcer.getTurnCount(),
      startTime: state.startTime,
    });

    if (result.decision === "DENY") {
      console.error(`[BudgetEnforcer] ${result.message}`);
      process.exit(2);
    }

    // Pass through original input
    console.log(raw);
  } catch {
    // Never block on parse errors
    console.log(chunks.join(""));
  }
});
