#!/usr/bin/env node
/**
 * Scope Enforcer — PreToolUse hook on Edit / Write.
 * Runtime-agnostic: works with both Claude Code and Codex CLI.
 *
 * Prevents agents from modifying files outside their category's allowed
 * scope. Reads HARNESS_AGENT, looks up .harness/agents/<name>.json, pulls
 * the category, and unions the allow/deny rules from CATEGORY_SCOPES.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeToolName, getHarnessDir } from './runtime.mjs';

export const CATEGORY_SCOPES = {
  coding: {
    allow: ['src/', 'app/', 'components/', 'lib/', 'pages/', 'public/', 'styles/', 'tests/', 'test/', '__tests__/', 'convex/'],
    deny: ['.harness/', '.claude/', '.codex/', '.agents/', 'agents/', 'skills/', 'packages/hooks/', 'packages/cli/'],
  },
  content: {
    allow: ['content/', 'blog/', 'docs/', 'public/', '*.md'],
    deny: ['src/', 'app/', 'lib/', 'convex/', '.harness/', '.claude/', '.codex/', 'packages/'],
  },
  growth: {
    allow: ['src/', 'app/', 'content/', 'public/', 'scripts/'],
    deny: ['.harness/', '.claude/', '.codex/', 'agents/', 'skills/', 'packages/hooks/'],
  },
  operations: {
    allow: ['.github/', 'Dockerfile', 'docker-compose', 'railway.json', 'vercel.json', '.env', 'scripts/'],
    deny: ['src/', 'app/', 'components/', 'lib/', '.harness/', '.claude/', '.codex/'],
  },
  orchestration: {
    allow: ['.harness/'],
    deny: ['src/', 'app/', 'packages/'],
  },
  quality: {
    allow: ['src/', 'app/', 'components/', 'lib/', 'styles/'],
    deny: ['.harness/', '.claude/', '.codex/', 'agents/', 'skills/', 'packages/hooks/', 'packages/cli/'],
  },
};

export function getAgentCategories() {
  const agentName = process.env.HARNESS_AGENT;
  if (!agentName) return null;

  const configPath = join(getHarnessDir(), 'agents', `${agentName}.json`);
  if (!existsSync(configPath)) return null;

  try {
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    if (!config.category) return null;
    return Array.isArray(config.category) ? config.category : [config.category];
  } catch {
    return null;
  }
}

export function isPathAllowed(filePath, categories) {
  const relative = filePath.replace(process.cwd() + '/', '');

  const mergedAllow = [];
  const mergedDeny = [];
  let hasKnownCategory = false;

  for (const category of categories) {
    const scope = CATEGORY_SCOPES[category];
    if (!scope) continue;
    hasKnownCategory = true;
    mergedAllow.push(...scope.allow);
    mergedDeny.push(...scope.deny);
  }

  if (!hasKnownCategory) return true;

  const allowSet = new Set(mergedAllow);
  for (const pattern of mergedDeny) {
    if (allowSet.has(pattern)) continue;
    if (relative.startsWith(pattern) || relative.includes(`/${pattern}`)) return false;
  }

  if (mergedAllow.length > 0) {
    return mergedAllow.some((pattern) => {
      if (pattern.startsWith('*.')) return relative.endsWith(pattern.slice(1));
      return relative.startsWith(pattern) || relative.includes(`/${pattern}`);
    });
  }

  return true;
}

const isDirectRun =
  process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const chunks = [];
  process.stdin.on('data', (chunk) => chunks.push(chunk.toString()));
  process.stdin.on('end', () => {
    const raw = chunks.join('');
    try {
      const input = JSON.parse(raw);
      const toolName = normalizeToolName(input.tool_name || '');
      const filePath = input.tool_input?.file_path || '';

      if (!filePath) { console.log(raw); return; }

      const categories = getAgentCategories();
      if (!categories) { console.log(raw); return; }

      if (!isPathAllowed(filePath, categories)) {
        console.error(
          `[ScopeEnforcer] ${process.env.HARNESS_AGENT} (${categories.join(', ')}) cannot modify ${filePath} -- outside allowed scope`,
        );
        process.exit(2);
      }
      console.log(raw);
    } catch {
      console.log(raw);
    }
  });
}
