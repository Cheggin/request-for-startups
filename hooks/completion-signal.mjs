#!/usr/bin/env node
/**
 * Stop hook — writes a completion signal file when a Claude session ends.
 *
 * The signal is a compact JSON describing who finished and where their
 * transcript lives. An external Monitor (in the orchestrator session)
 * watches .harness/signals/done-*.json and pushes each new file through
 * the reviewer pipeline (scripts/review.mjs).
 *
 * This hook does NOT run analysis itself — third-party review is done
 * elsewhere to avoid self-assessment bias.
 *
 * Ported from packages/hooks/src/run-completion-signal.ts — behaviour
 * preserved: same directory (.harness/signals/), same filename scheme
 * (done-<sessionId>.json), same payload shape, same fallback chain for
 * pane_id and agent, same "never block on failure" safety rule.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function buildSignalPayload(input, env = process.env, now = new Date()) {
  const cwd = input.cwd || process.cwd();
  const sessionId = input.session_id || 'unknown';
  const transcript = input.transcript_path || '';
  const paneId = env.TMUX_PANE || env.CLAUDE_PANE || 'no-pane';
  const agent = env.HARNESS_AGENT || 'solo';
  return {
    cwd,
    sessionId,
    payload: {
      session_id: sessionId,
      transcript_path: transcript,
      cwd,
      pane_id: paneId,
      agent,
      ended_at: now.toISOString(),
    },
  };
}

export function writeSignal(input, env = process.env) {
  const { cwd, sessionId, payload } = buildSignalPayload(input, env);
  const signalDir = resolve(cwd, '.harness/signals');
  mkdirSync(signalDir, { recursive: true });
  const path = resolve(signalDir, `done-${sessionId}.json`);
  writeFileSync(path, JSON.stringify(payload, null, 2));
  return path;
}

async function runCli() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk.toString());
  const raw = chunks.join('');
  try {
    const input = JSON.parse(raw);
    writeSignal(input);
  } catch {
    // Hooks must never block shutdown on failure.
  }
  // Pass-through — Stop hooks don't gate.
  console.log(raw);
}

const isDirectRun =
  process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  runCli();
}
