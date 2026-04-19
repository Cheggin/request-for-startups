#!/usr/bin/env node
/**
 * Config Protection — PreToolUse hook on Edit / Write.
 *
 * Blocks edits to a fixed set of protected configuration paths
 * (.harness/ itself, .github/workflows/, tsconfig.json, vitest.config.ts,
 * playwright.config.ts, all flavours of eslint / prettier config, biome.json,
 * biome.jsonc). A small EXEMPT_PATHS list carves back out the data files
 * that live inside .harness/ (tool-catalog.yml, agent-categories.yml,
 * loops.yml, founder-profile.yml, commit-schema.md, issue-schema.md,
 * idea.md, state.json, alignment-report.md, knowledge/, handoffs/,
 * signals/, agents/, learnings/, metrics/).
 *
 * agents/ is exempted because per-agent fileScope.blocked in every
 * .harness/agents/*.json already blocks agents from writing their own
 * configs — scope-enforcer is the fine-grained defence, so config-protection
 * only needs to gate the rest of .harness/ and the static configs above.
 *
 * Ported from the two-file pair
 *   packages/hooks/src/config-protection.ts      (rule logic)
 *   packages/hooks/src/run-config-protection.ts  (stdin adapter)
 * to one node-native file. Behaviour identical — same PROTECTED_PATHS,
 * same EXEMPT_PATHS, same "directory prefix vs basename" match logic.
 */

const GATED_TOOLS = new Set(['Edit', 'Write']);

const EXEMPT_PATHS = [
  'tool-catalog.yml',
  'founder-profile.yml',
  'agent-categories.yml',
  'loops.yml',
  'commit-schema.md',
  'issue-schema.md',
  'idea.md',
  'state.json',
  'alignment-report.md',
  'knowledge/',
  'handoffs/',
  'signals/',
  'agents/',
  'learnings/',
  'metrics/',
    'hooks/',
  'skills.yml',
];

const PROTECTED_PATHS = [
  '.harness/',
  '.github/workflows/',
  'tsconfig.json',
  'vitest.config.ts',
  'playwright.config.ts',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.json',
  '.eslintrc.yml',
  '.eslintrc.yaml',
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'biome.json',
  'biome.jsonc',
  '.prettierrc',
  '.prettierrc.js',
  '.prettierrc.json',
  'prettier.config.js',
  'prettier.config.mjs',
];

function isProtected(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const basename = normalized.split('/').pop() || '';

  const exempt = EXEMPT_PATHS.some((e) => {
    if (e.endsWith('/')) {
      return normalized.includes('/' + e) || normalized.includes(e);
    }
    return basename === e || normalized.endsWith(e);
  });
  if (exempt) return false;

  for (const pattern of PROTECTED_PATHS) {
    if (pattern.endsWith('/')) {
      if (normalized.startsWith(pattern) || normalized.includes('/' + pattern)) return true;
    } else {
      if (basename === pattern || normalized === pattern) return true;
    }
  }

  return false;
}

function checkConfigProtection(call) {
  if (!GATED_TOOLS.has(call.tool_name)) return { decision: 'ALLOW' };

  const filePath = call.tool_input?.file_path || '';
  if (!filePath) return { decision: 'ALLOW' };

  if (isProtected(filePath)) {
    return {
      decision: 'DENY',
      message:
        `BLOCKED: ${filePath} is a protected configuration file. ` +
        'Fix the source code to satisfy linter/formatter rules instead of ' +
        'modifying protected config files.',
    };
  }
  return { decision: 'ALLOW' };
}

const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(chunk.toString()));
process.stdin.on('end', () => {
  const raw = chunks.join('');
  try {
    const input = JSON.parse(raw);
    const result = checkConfigProtection({
      tool_name: input.tool_name,
      tool_input: input.tool_input,
    });
    if (result.decision === 'DENY') {
      console.error(`[ConfigProtection] ${result.message}`);
      process.exit(2);
    }
    console.log(raw);
  } catch {
    console.log(raw);
  }
});
