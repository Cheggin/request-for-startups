#!/usr/bin/env node
/**
 * Issue creation validator — PreToolUse hook on Bash `gh issue create`.
 * Rejects issues whose title or body doesn't follow the schema in
 * .harness/issue-schema.md. Exit 0 = allow, Exit 2 = block.
 *
 * Ported from packages/hooks/src/validate-issue-create.ts to drop the
 * bun runtime dependency; behaviour is identical.
 *
 * Accepts two body formats:
 *   1. Markdown template: ## Type, ## Severity, ## Description, ...
 *   2. GitHub form output: ### Severity, ### What happened / Description, ...
 */

const VALID_TYPES = ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'perf', 'ci'];
const VALID_SEVERITIES = ['P0', 'P1', 'P2', 'P3'];
const TITLE_PATTERN = /^\[(feat|fix|refactor|test|docs|chore|perf|ci)\] .+/;

function extractTitle(command) {
  const match = command.match(/--title\s+["']([^"']+)["']/);
  return match ? match[1] : null;
}

function extractBody(command) {
  const simpleMatch = command.match(/--body\s+["']([^"']+)["']/);
  if (simpleMatch) return simpleMatch[1];

  const heredocMatch = command.match(
    /--body\s+"\$\(cat <<['"]?EOF['"]?\n([\s\S]*?)\nEOF/,
  );
  if (heredocMatch) return heredocMatch[1];

  return null;
}

function hasSection(body, ...names) {
  const lower = body.toLowerCase();
  return names.some((n) =>
    lower.includes(`## ${n.toLowerCase()}`) ||
    lower.includes(`### ${n.toLowerCase()}`),
  );
}

function titleHasType(title) {
  return title !== null && TITLE_PATTERN.test(title);
}

export function validateIssue(title, body) {
  const errors = [];

  if (!title) {
    errors.push('Missing --title flag');
    return errors;
  }

  if (!TITLE_PATTERN.test(title)) {
    errors.push(
      `Title must match: [type] description\n` +
      `   Valid types: ${VALID_TYPES.join(', ')}\n` +
      `   Got: "${title}"`,
    );
  }

  if (!body) {
    errors.push('Missing --body flag. Issues require a body with severity, description, and acceptance criteria.');
    return errors;
  }

  if (!titleHasType(title)) {
    const bodyLower = body.toLowerCase();
    const hasType = VALID_TYPES.some((t) =>
      bodyLower.includes(`type: ${t}`) ||
      bodyLower.includes(`**type:** ${t}`),
    );
    if (!hasType && !hasSection(body, 'type')) {
      errors.push("Body missing '## Type' section (feat, fix, refactor, test, docs, chore, perf, ci)");
    }
  }

  const hasSeverity = VALID_SEVERITIES.some((s) => body.includes(s));
  if (!hasSeverity) errors.push('Body missing severity (P0, P1, P2, or P3)');

  if (!hasSection(body, 'description', 'what happened')) {
    errors.push("Body missing '## Description' or '### What happened' section");
  }

  if (!hasSection(body, 'acceptance criteria', 'acceptance')) {
    errors.push("Body missing '## Acceptance Criteria' section");
  }

  if (!body.includes('- [ ]') && !body.includes('- [x]')) {
    errors.push('Acceptance criteria must include at least one checklist item (- [ ])');
  }

  if (!hasSection(body, 'verification steps', 'verification')) {
    errors.push("Body missing '## Verification Steps' section");
  }

  return errors;
}

const chunks = [];
process.stdin.on('data', (c) => chunks.push(c.toString()));
process.stdin.on('end', () => {
  const input = chunks.join('');
  if (!input) process.exit(0);

  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const command = parsed.tool_input?.command || '';
  if (!command.includes('gh issue create')) process.exit(0);

  const title = extractTitle(command);
  const body = extractBody(command);
  const errors = validateIssue(title, body);

  if (errors.length > 0) {
    console.error('[IssueLint] Issue does not follow the required schema:');
    for (const error of errors) console.error(`  - ${error}`);
    console.error('\nSee .harness/issue-schema.md for the full specification.');
    process.exit(2);
  }

  process.exit(0);
});
