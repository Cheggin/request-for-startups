#!/usr/bin/env node
/**
 * Deploy Gate — PreToolUse hook on Bash.
 *
 * Enforces the SOUL.md rule: "Rollback plan required before any production
 * deploy." Blocks deploy commands (vercel deploy, railway up, npm publish,
 * docker push, fly deploy, wrangler deploy, --prod flags, push to
 * prod/main/master) unless a rollback plan has been registered for this
 * session — either via DEPLOY_ROLLBACK_PLAN=1 or by writing
 * { "rollbackPlan": true } to /tmp/harness-deploy-gate.json.
 *
 * Ported from the two-file pair
 *   packages/hooks/src/deploy-gate.ts       (pure rule logic)
 *   packages/hooks/src/run-deploy-gate.ts   (stdin adapter + state file)
 * to a single node-native file. Behaviour identical.
 */

import { readFileSync, existsSync } from 'node:fs';

const STATE_FILE = '/tmp/harness-deploy-gate.json';

const DEPLOY_PATTERNS = [
  /\bvercel\s+(deploy|promote)\b/,
  /\brailway\s+up\b/,
  /\bnpm\s+publish\b/,
  /\byarn\s+publish\b/,
  /\bpnpm\s+publish\b/,
  /\bgit\s+push\s+.*\b(production|prod|main|master)\b/,
  /\bdocker\s+push\b/,
  /\bfly\s+deploy\b/,
  /\bwrangler\s+(deploy|publish)\b/,
  /\bnpx\s+vercel\s*--prod\b/,
  /\b--prod\b/,
];

function isDeployCommand(command) {
  return DEPLOY_PATTERNS.some((p) => p.test(command));
}

function hasRollbackPlan() {
  if (process.env.DEPLOY_ROLLBACK_PLAN === '1') return true;
  try {
    if (existsSync(STATE_FILE)) {
      const data = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
      return data.rollbackPlan === true;
    }
  } catch {
    // Corrupted state = no plan
  }
  return false;
}

function checkDeployGate(call, rollbackRegistered) {
  if (call.tool_name !== 'Bash') return { decision: 'ALLOW' };

  const command = call.tool_input?.command || '';
  if (!command) return { decision: 'ALLOW' };
  if (!isDeployCommand(command)) return { decision: 'ALLOW' };
  if (rollbackRegistered) return { decision: 'ALLOW' };

  return {
    decision: 'DENY',
    message:
      `BLOCKED: Deploy command detected ("${command.slice(0, 80)}..."). ` +
      'A rollback plan is required before any production deploy. ' +
      'Log a rollback plan as a GitHub Issue comment, then set ' +
      'DEPLOY_ROLLBACK_PLAN=1 or write to /tmp/harness-deploy-gate.json ' +
      'with { "rollbackPlan": true } before retrying.',
  };
}

const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(chunk.toString()));
process.stdin.on('end', () => {
  const raw = chunks.join('');
  try {
    const input = JSON.parse(raw);
    const result = checkDeployGate(
      { tool_name: input.tool_name, tool_input: input.tool_input },
      hasRollbackPlan(),
    );

    if (result.decision === 'DENY') {
      console.error(`[DeployGate] ${result.message}`);
      process.exit(2);
    }
    console.log(raw);
  } catch {
    // Never block on parse errors
    console.log(raw);
  }
});
