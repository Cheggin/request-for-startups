#!/usr/bin/env node
/**
 * Branch Enforcer — PreToolUse hook on Bash `git push`.
 *
 * Blocks pushes to main/master from agents. CEO / commander / unset
 * HARNESS_AGENT (human session) pass through. Force-pushes to protected
 * branches are always blocked, regardless of agent.
 *
 * Ported from packages/hooks/src/branch-enforcer.ts to drop the bun
 * runtime dependency; behaviour is identical. Only code changes:
 *   - Bun.spawnSync(...) -> node's child_process.spawnSync(...)
 *   - TS annotations removed, shebang switched to node.
 */

import { spawnSync } from 'node:child_process';

const PROTECTED_BRANCHES = ['main', 'master'];

function extractPushTarget(command) {
  const normalized = command.trim().replace(/\s+/g, ' ');
  const segments = normalized.split(/&&|;/).map((s) => s.trim());

  for (const segment of segments) {
    const pushMatch = segment.match(/\bgit\s+push\b(.*)$/);
    if (!pushMatch) continue;

    const pushArgs = pushMatch[1].trim();

    const stripped = pushArgs
      .replace(/--force-with-lease(=\S+)?/g, '')
      .replace(/--(force|no-verify|set-upstream|tags|delete|dry-run|verbose|quiet)/g, '')
      .replace(/-[funtdvq]/g, '')
      .replace(/--push-option=\S+/g, '')
      .replace(/-o\s+\S+/g, '')
      .trim();

    const positional = stripped.split(/\s+/).filter(Boolean);

    if (positional.length === 0) return getCurrentBranch();
    if (positional.length === 1) return getCurrentBranch();

    if (positional.length >= 2) {
      const refspec = positional[1];
      if (refspec.includes(':')) {
        const dst = refspec.split(':')[1];
        return dst || null;
      }
      return refspec;
    }
  }

  return null;
}

function getCurrentBranch() {
  try {
    const proc = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const branch = (proc.stdout || '').trim();
    return branch || null;
  } catch {
    return null;
  }
}

const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(chunk.toString()));
process.stdin.on('end', () => {
  try {
    const raw = chunks.join('');
    const input = JSON.parse(raw);
    const command = input.tool_input?.command || '';

    // CEO / commander / human sessions are exempt
    const agent = process.env.HARNESS_AGENT || '';
    const CEO_EXEMPT = ['', 'ceo', 'commander', 'ceo-monitor'];
    if (CEO_EXEMPT.includes(agent)) {
      console.log(raw);
      return;
    }

    if (!command.includes('git push')) {
      console.log(raw);
      return;
    }

    const targetBranch = extractPushTarget(command);

    if (targetBranch && PROTECTED_BRANCHES.includes(targetBranch)) {
      const agentName = process.env.HARNESS_AGENT || 'unknown';
      console.error(
        `[BranchEnforcer] Blocked: ${agentName} attempted to push to protected branch '${targetBranch}'. Agents must push to feature branches only.`,
      );
      process.exit(2);
    }

    if (
      PROTECTED_BRANCHES.some(
        (b) =>
          command.includes(`push --force origin ${b}`) ||
          command.includes(`push -f origin ${b}`) ||
          command.includes(`push --force-with-lease origin ${b}`),
      )
    ) {
      const agentName = process.env.HARNESS_AGENT || 'unknown';
      console.error(
        `[BranchEnforcer] Blocked: ${agentName} attempted force-push to a protected branch. This is never allowed.`,
      );
      process.exit(2);
    }

    console.log(raw);
  } catch {
    console.log(chunks.join(''));
  }
});
