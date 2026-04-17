#!/usr/bin/env node
/**
 * Inter-agent signal — fires on Stop and PermissionRequest. Writes a
 * lightweight JSON state file into .harness/signals/<agent>.<event> so
 * other agents can detect completion or approval stalls without
 * scraping transcripts.
 *
 *   Stop              -> .harness/signals/<agent>.done
 *   PermissionRequest -> .harness/signals/<agent>.needs-approval
 *
 * Agent name resolves from HARNESS_AGENT, then the tmux window name
 * (`tmux display-message -p '#{window_name}'`), then the repo dir
 * basename, then 'unknown'.
 *
 * Ported from the two-file pair
 *   packages/hooks/src/inter-agent-signal.ts      (pure lib)
 *   packages/hooks/src/run-inter-agent-signal.ts  (stdin runner)
 * into one node-native file. Behaviour identical — same signal
 * filename map, same payload fields, same tmux fallback chain, same
 * "never block the Claude event on signal-write failure" safety rule.
 *
 * The TS library is not deleted: packages/hooks/src/auto-finish.ts still
 * imports detectAgentName from it, so the TS module must keep existing
 * until auto-finish is also ported.
 */

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const SIGNAL_FILE_BY_EVENT = {
  Stop: 'done',
  PermissionRequest: 'needs-approval',
};

function getSignalFileName(hookEventName) {
  if (!hookEventName) return undefined;
  return SIGNAL_FILE_BY_EVENT[hookEventName];
}

function detectAgentName(fallbackCwd) {
  if (process.env.HARNESS_AGENT) return process.env.HARNESS_AGENT;
  try {
    const windowName = execSync(
      "tmux display-message -p '#{window_name}' 2>/dev/null",
      { encoding: 'utf-8', timeout: 3000 },
    ).trim();
    if (windowName) return windowName;
  } catch {
    // Fall back to repo directory name outside tmux.
  }
  return basename(fallbackCwd) || 'unknown';
}

function buildSignalPayload(input, options = {}) {
  const cwd = input.cwd || options.cwd || process.cwd();
  const event = input.hook_event_name || 'unknown';
  return {
    agent: options.agent || detectAgentName(cwd),
    at: options.at || new Date().toISOString(),
    cwd,
    event,
    permission_mode: input.permission_mode || null,
    session_id: input.session_id || null,
    tool_input: input.tool_input || null,
    tool_name: input.tool_name || null,
    tool_use_id: input.tool_use_id || null,
    transcript_path: input.transcript_path || null,
  };
}

function writeSignal(projectRoot, input, options = {}) {
  const signalFileName = getSignalFileName(input.hook_event_name);
  if (!signalFileName) return undefined;

  const signalsDir = join(projectRoot, '.harness', 'signals');
  mkdirSync(signalsDir, { recursive: true });

  const payload = buildSignalPayload(input, {
    agent: options.agent,
    at: options.at,
    cwd: input.cwd || projectRoot,
  });

  const agentName = payload.agent;
  const signalPath = join(signalsDir, `${agentName}.${signalFileName}`);
  writeFileSync(signalPath, JSON.stringify(payload, null, 2) + '\n');
  return signalPath;
}

function handleInput(input) {
  try {
    writeSignal(process.cwd(), input);
  } catch (error) {
    // Never block the underlying Claude hook event on signal write failures.
    console.error(`[InterAgentSignal] Failed: ${String(error)}`);
  }
}

if (process.stdin.isTTY) {
  handleInput({});
} else {
  const chunks = [];
  process.stdin.on('data', (chunk) => chunks.push(chunk.toString()));
  process.stdin.on('end', () => {
    try {
      const raw = chunks.join('').trim();
      handleInput(raw ? JSON.parse(raw) : {});
    } catch (error) {
      console.error(`[InterAgentSignal] Failed to parse hook input: ${String(error)}`);
    }
  });
}
