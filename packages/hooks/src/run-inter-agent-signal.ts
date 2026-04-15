#!/usr/bin/env bun
/**
 * Inter-agent signal hook.
 * Writes lightweight runtime state into .harness/signals/ so other agents
 * can detect completion and approval stalls without scraping transcripts.
 */

import { writeInterAgentSignal } from "./inter-agent-signal.js";
import type { HookEventInput } from "./inter-agent-signal.js";

function handleInput(input: HookEventInput): void {
  try {
    writeInterAgentSignal(process.cwd(), input);
  } catch (error) {
    // Never block the underlying Claude hook event on signal write failures.
    console.error(`[InterAgentSignal] Failed: ${String(error)}`);
  }
}

if (process.stdin.isTTY) {
  handleInput({});
} else {
  const chunks: string[] = [];

  process.stdin.on("data", (chunk) => chunks.push(chunk.toString()));
  process.stdin.on("end", () => {
    try {
      const raw = chunks.join("").trim();
      handleInput(raw ? (JSON.parse(raw) as HookEventInput) : {});
    } catch (error) {
      console.error(`[InterAgentSignal] Failed to parse hook input: ${String(error)}`);
    }
  });
}
