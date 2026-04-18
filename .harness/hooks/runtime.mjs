#!/usr/bin/env node
/**
 * Runtime adapter — shared utilities for hooks that run on both
 * Claude Code and Codex CLI.
 *
 * Normalizes tool names between runtimes and provides project root
 * detection so hooks don't depend on runtime-specific env vars.
 */

import { execSync } from 'node:child_process';
import { join } from 'node:path';

const TOOL_NAME_MAP_TO_CLAUDE = {
  shell: 'Bash',
  file_edit: 'Edit',
  file_write: 'Write',
  file_read: 'Read',
  apply_diff: 'Edit',
};

export function normalizeToolName(toolName) {
  return TOOL_NAME_MAP_TO_CLAUDE[toolName] || toolName;
}

export function getProjectRoot() {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  if (process.env.CODEX_PROJECT_DIR) return process.env.CODEX_PROJECT_DIR;

  try {
    return execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return process.cwd();
  }
}

export function getHarnessDir() {
  return join(getProjectRoot(), '.harness');
}

export function normalizeHookInput(input) {
  if (!input || typeof input !== 'object') return input;
  return {
    ...input,
    tool_name: normalizeToolName(input.tool_name || ''),
  };
}

export function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve({});
      return;
    }
    const chunks = [];
    process.stdin.on('data', (chunk) => chunks.push(chunk.toString()));
    process.stdin.on('end', () => {
      const raw = chunks.join('').trim();
      try {
        resolve({ parsed: raw ? JSON.parse(raw) : {}, raw: raw || '{}' });
      } catch {
        resolve({ parsed: {}, raw: raw || '{}' });
      }
    });
  });
}
