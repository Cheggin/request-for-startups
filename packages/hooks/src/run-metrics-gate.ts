#!/usr/bin/env bun
/**
 * CLI wrapper for metrics-gate hook.
 * Reads tool call JSON from stdin, checks for hypothesis state.
 *
 * Only active when HARNESS_AGENT is set and the agent's category is "growth".
 *
 * Hook type: PreToolUse (Edit, Write, Bash)
 * Required by: growth category
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { checkMetricsGate } from "./metrics-gate.js";

const STATE_FILE = "/tmp/harness-metrics-gate.json";
const HARNESS_DIR = join(process.cwd(), ".harness");

function getAgentCategory(): string | null {
  const agentName = process.env.HARNESS_AGENT;
  if (!agentName) return null;

  const configPath = join(HARNESS_DIR, "agents", `${agentName}.json`);
  if (!existsSync(configPath)) return null;

  try {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    return config.category || null;
  } catch {
    return null;
  }
}

function hasHypothesis(): boolean {
  // Check env var first
  if (process.env.METRICS_HYPOTHESIS) {
    return true;
  }

  // Check state file
  try {
    if (existsSync(STATE_FILE)) {
      const data = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      return !!(data.hypothesis && data.metric);
    }
  } catch {
    // Corrupted state = no hypothesis
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

    // Only gate growth agents — skip for all others
    const category = getAgentCategory();
    if (category !== "growth") {
      console.log(raw);
      return;
    }

    const result = checkMetricsGate(
      { tool_name: input.tool_name, tool_input: input.tool_input },
      hasHypothesis()
    );

    if (result.decision === "DENY") {
      console.error(`[MetricsGate] ${result.message}`);
      process.exit(2);
    }

    console.log(raw);
  } catch {
    // Never block on parse errors
    console.log(chunks.join(""));
  }
});
