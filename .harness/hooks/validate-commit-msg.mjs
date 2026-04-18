#!/usr/bin/env node
/**
 * Conventional Commits validator — PreToolUse hook on Bash/shell git commit.
 * Runtime-agnostic: works with both Claude Code and Codex CLI.
 */

const VALID_TYPES = [
  'feat', 'fix', 'docs', 'style', 'refactor', 'perf',
  'test', 'build', 'ci', 'chore', 'revert',
];

const MAX_SUBJECT_LENGTH = 72;
const COMMIT_PATTERN =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z][a-z0-9-]*\))?(!)?: .+/;

function extractCommitMessage(command) {
  const simpleMatch = command.match(/git commit[^"']*[-]m\s+["']([^"']+)["']/);
  if (simpleMatch) return simpleMatch[1].trim();

  const heredocMatch = command.match(
    /git commit[^"]*-m\s+"\$\(cat <<['"]?EOF['"]?\n([\s\S]*?)\nEOF/,
  );
  if (heredocMatch) return heredocMatch[1].trim();

  return null;
}

function validateCommitMessage(message) {
  const errors = [];
  const lines = message.split('\n');
  const subject = lines[0];

  if (!subject) {
    errors.push('Commit message is empty');
    return errors;
  }

  if (!COMMIT_PATTERN.test(subject)) {
    errors.push(
      `Subject must match: <type>(<scope>): <description>\n` +
      `   Valid types: ${VALID_TYPES.join(', ')}\n` +
      `   Got: "${subject}"`,
    );
    return errors;
  }

  if (subject.length > MAX_SUBJECT_LENGTH) {
    errors.push(
      `Subject line is ${subject.length} chars (max ${MAX_SUBJECT_LENGTH}): "${subject}"`,
    );
  }

  const descMatch = subject.match(/^[^:]+:\s(.)/);
  if (descMatch && descMatch[1] === descMatch[1].toUpperCase() && descMatch[1] !== descMatch[1].toLowerCase()) {
    errors.push(`Description should start lowercase: "${subject}"`);
  }

  if (subject.endsWith('.')) {
    errors.push(`Subject should not end with a period: "${subject}"`);
  }

  if (lines.length > 1 && lines[1] !== '') {
    errors.push('Body must be separated from subject by a blank line');
  }

  return errors;
}

const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(chunk.toString()));
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
  if (!command.includes('git commit')) process.exit(0);
  if (command.includes('--amend')) process.exit(0);

  const message = extractCommitMessage(command);
  if (!message) process.exit(0);

  const errors = validateCommitMessage(message);
  if (errors.length > 0) {
    console.error('[CommitLint] Commit message does not follow Conventional Commits:');
    for (const error of errors) console.error(`  - ${error}`);
    console.error('\nSee .harness/commit-schema.md for the full specification.');
    process.exit(2);
  }

  process.exit(0);
});
