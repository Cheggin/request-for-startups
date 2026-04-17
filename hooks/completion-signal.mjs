#!/usr/bin/env bun
// @bun

// packages/hooks/src/run-completion-signal.ts
import { mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
var chunks = [];
process.stdin.on("data", (c) => chunks.push(c.toString()));
process.stdin.on("end", () => {
  const raw = chunks.join("");
  try {
    const input = JSON.parse(raw);
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
      ended_at: new Date().toISOString()
    };
    const filename = `done-${sessionId}.json`;
    writeFileSync(resolve(signalDir, filename), JSON.stringify(payload, null, 2));
  } catch {}
  console.log(raw);
});
