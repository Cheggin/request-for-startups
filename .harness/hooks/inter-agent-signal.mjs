#!/usr/bin/env node
/**
 * Inter-agent signal — fires on Stop and PermissionRequest.
 * Runtime-agnostic: works with both Claude Code and Codex CLI.
 *
 * Writes lightweight JSON state files into .harness/signals/<agent>.<event>
 * so other agents can detect completion or approval stalls.
 */

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { getProjectRoot } from './runtime.mjs';

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
    writeSignal(getProjectRoot(), input);
  } catch (error) {
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
