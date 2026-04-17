#!/usr/bin/env bun
/**
 * Stop hook — writes a completion signal file when a Claude session ends.
 *
 * The signal is a compact JSON describing who finished and where their
 * transcript lives. An external Monitor (in the orchestrator session)
 * watches .harness/signals/done-*.json and pushes each new file through
 * the reviewer pipeline (see packages/cli/src/commands/review.ts).
 *
 * This hook does NOT run analysis itself — third-party review is done
 * elsewhere to avoid self-assessment bias.
 */
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

interface HookInput {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  stop_hook_active?: boolean;
  hook_event_name?: string;
}

const chunks: string[] = [];
process.stdin.on("data", (c) => chunks.push(c.toString()));
process.stdin.on("end", () => {
  const raw = chunks.join("");
  try {
    const input = JSON.parse(raw) as HookInput;
    const cwd = input.cwd || process.cwd();
    const sessionId = input.session_id || "unknown";
    const transcript = input.transcript_path || "";

    const paneId = process.env.TMUX_PANE || process.env.CLAUDE_PANE || "no-pane";
    const agentName = process.env.HARNESS_AGENT || "solo";

    const signalDir = resolve(cwd, ".harness/signals");
    mkdirSync(signalDir, { recursive: true });

    const payload = {
      session_id: sessionId,
      transcript_path: transcript,
      cwd,
      pane_id: paneId,
      agent: agentName,
      ended_at: new Date().toISOString(),
    };

    const filename = `done-${sessionId}.json`;
    writeFileSync(resolve(signalDir, filename), JSON.stringify(payload, null, 2));
  } catch {
    // Hooks must never block shutdown on failure
  }
  // Pass-through — Stop hooks don't gate
  console.log(raw);
});
