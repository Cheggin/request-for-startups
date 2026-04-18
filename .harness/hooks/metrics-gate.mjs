#!/usr/bin/env node
/**
 * Metrics Gate — PreToolUse hook on Edit/Write/Bash (shell).
 * Runtime-agnostic: works with both Claude Code and Codex CLI.
 *
 * Only fires for agents whose category is "growth". Requires a
 * measurable hypothesis before any modifying action.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeToolName, getHarnessDir } from './runtime.mjs';

const STATE_FILE = '/tmp/harness-metrics-gate.json';

const GATED_TOOLS = new Set(['Edit', 'Write', 'Bash']);

const SAFE_BASH_PATTERNS = [
  /^\s*git\s+(status|log|diff|show|branch)\b/,
  /^\s*ls\b/,
  /^\s*cat\b/,
  /^\s*head\b/,
  /^\s*tail\b/,
  /^\s*grep\b/,
  /^\s*rg\b/,
  /^\s*find\b/,
  /^\s*gh\s+(issue|pr)\s+(view|list)\b/,
  /^\s*echo\b/,
  /^\s*pwd\b/,
  /^\s*wc\b/,
];

function isSafeBashCommand(command) {
  return SAFE_BASH_PATTERNS.some((p) => p.test(command));
}

function getAgentCategory() {
  const agentName = process.env.HARNESS_AGENT;
  if (!agentName) return null;

  const configPath = join(getHarnessDir(), 'agents', `${agentName}.json`);
  if (!existsSync(configPath)) return null;

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    return config.category || null;
  } catch {
    return null;
  }
}

function hasHypothesis() {
  if (process.env.METRICS_HYPOTHESIS) return true;
  try {
    if (existsSync(STATE_FILE)) {
      const data = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
      return !!(data.hypothesis && data.metric);
    }
  } catch {
    // Corrupted state = no hypothesis
  }
  return false;
}

function checkMetricsGate(call, hypothesisRegistered) {
  const toolName = normalizeToolName(call.tool_name);
  if (!GATED_TOOLS.has(toolName)) return { decision: 'ALLOW' };

  if (toolName === 'Bash') {
    const command = call.tool_input?.command || '';
    if (isSafeBashCommand(command)) return { decision: 'ALLOW' };
  }

  if (hypothesisRegistered) return { decision: 'ALLOW' };

  return {
    decision: 'DENY',
    message:
      `BLOCKED: Growth agent action (${call.tool_name}) requires a measurable hypothesis. ` +
      'Before making changes, define your hypothesis with expected metrics. ' +
      "Set METRICS_HYPOTHESIS='your hypothesis here' or write to " +
      '/tmp/harness-metrics-gate.json with ' +
      '{ "hypothesis": "description", "metric": "what to measure", "baseline": "current value" } ' +
      'before retrying.',
  };
}

const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(chunk.toString()));
process.stdin.on('end', () => {
  const raw = chunks.join('');
  try {
    const input = JSON.parse(raw);

    const category = getAgentCategory();
    if (category !== 'growth') {
      console.log(raw);
      return;
    }

    const result = checkMetricsGate(
      { tool_name: input.tool_name, tool_input: input.tool_input },
      hasHypothesis(),
    );

    if (result.decision === 'DENY') {
      console.error(`[MetricsGate] ${result.message}`);
      process.exit(2);
    }

    console.log(raw);
  } catch {
    console.log(raw);
  }
});
