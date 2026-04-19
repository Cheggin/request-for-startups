#!/usr/bin/env node
/**
 * GateGuard — PreToolUse hook on Read/Edit/Write.
 *
 * Maintains a set of files Read in the current session. On Edit/Write,
 * blocks the call if the file has not yet been Read. Prevents edit-without-
 * inspection patterns that tend to corrupt files.
 *
 * Two layers:
 *   createGateGuard()  — pure, in-memory factory (testable)
 *   CLI runner (below) — persists the set to /tmp per session+repo and
 *                        exits 2 on deny, so Claude Code blocks the call.
 *
 * Ported from the TS pair:
 *   packages/hooks/src/gateguard.ts       (pure factory)
 *   packages/hooks/src/run-gateguard.ts   (stdin CLI + state file)
 * Behaviour preserved: same state-file path scheme
 * (/tmp/gateguard-reads-<sessionId>-<repoHash>.json), same message wording,
 * same exit-2-on-deny contract.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const GATED_TOOLS = new Set(['Edit', 'Write']);

export function createGateGuard() {
  const readFiles = new Set();

  function handleToolCall(call) {
    const { tool_name, tool_input } = call;
    const filePath = (tool_input?.file_path) || '';

    if (tool_name === 'Read' && filePath) {
      readFiles.add(filePath);
      return { decision: 'ALLOW' };
    }
    if (GATED_TOOLS.has(tool_name) && filePath) {
      if (readFiles.has(filePath)) return { decision: 'ALLOW' };
      return {
        decision: 'DENY',
        message: `File ${filePath} must be Read before it can be edited. Use the Read tool first to inspect the file contents.`,
      };
    }
    return { decision: 'ALLOW' };
  }

  return {
    handleToolCall,
    getReadFiles: () => readFiles,
    reset: () => readFiles.clear(),
  };
}

// ── CLI runner ──────────────────────────────────────────────────────────

function sessionStateFile() {
  const repoHash = createHash('sha256').update(process.cwd()).digest('hex').slice(0, 8);
  const sessionId = process.env.CLAUDE_SESSION_ID || 'shared';
  return `/tmp/gateguard-reads-${sessionId}-${repoHash}.json`;
}

function loadReadFiles(stateFile) {
  try {
    if (existsSync(stateFile)) {
      const data = JSON.parse(readFileSync(stateFile, 'utf-8'));
      return new Set(data.files || []);
    }
  } catch {}
  return new Set();
}

function saveReadFiles(stateFile, files) {
  writeFileSync(stateFile, JSON.stringify({ files: [...files] }));
}

async function runCli() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk.toString());
  const raw = chunks.join('');
  try {
    const input = JSON.parse(raw);
    const toolName = input.tool_name;
    const filePath = input.tool_input?.file_path || '';
    const stateFile = sessionStateFile();
    const readFiles = loadReadFiles(stateFile);

    if (toolName === 'Read' && filePath) {
      readFiles.add(filePath);
      saveReadFiles(stateFile, readFiles);
      console.log(raw);
      return;
    }
    if (GATED_TOOLS.has(toolName) && filePath) {
      if (!readFiles.has(filePath)) {
        const verb = toolName === 'Write' ? 'written' : 'edited';
        console.error(
          `[GateGuard] File ${filePath} must be Read before it can be ${verb}. Use the Read tool first to inspect the file contents.`,
        );
        process.exit(2);
      }
    }
    console.log(raw);
  } catch {
    console.log(raw);
  }
}

const isDirectRun = process.argv[1] && import.meta.url === `file://${fileURLToPath(import.meta.url)}` && process.argv[1] === fileURLToPath(import.meta.url);
if (isDirectRun) {
  runCli();
}
