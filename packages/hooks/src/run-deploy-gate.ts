#!/usr/bin/env bun
/**
 * CLI wrapper for deploy-gate hook.
 * Reads tool call JSON from stdin, checks for rollback plan state.
 *
 * Hook type: PreToolUse (Bash)
 * Required by: operations category
 */
import { readFileSync, existsSync } from "fs";
import { checkDeployGate } from "./deploy-gate.js";

const STATE_FILE = "/tmp/harness-deploy-gate.json";

function hasRollbackPlan(): boolean {
  // Check env var first
  if (process.env.DEPLOY_ROLLBACK_PLAN === "1") {
    return true;
  }

  // Check state file
  try {
    if (existsSync(STATE_FILE)) {
      const data = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      return data.rollbackPlan === true;
    }
  } catch {
    // Corrupted state = no plan
  }

  return false;
}

const chunks: string[] = [];
process.stdin.on("data", (chunk) => chunks.push(chunk.toString()));
process.stdin.on("end", () => {
  try {
    const raw = chunks.join("");
    const input = JSON.parse(raw) as {
      tool_name: string;
      tool_input: Record<string, unknown>;
    };

    const result = checkDeployGate(
      { tool_name: input.tool_name, tool_input: input.tool_input },
      hasRollbackPlan()
    );

    if (result.decision === "DENY") {
      console.error(`[DeployGate] ${result.message}`);
      process.exit(2);
    }

    console.log(raw);
  } catch {
    // Never block on parse errors
    console.log(chunks.join(""));
  }
});
