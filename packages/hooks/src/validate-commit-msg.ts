/**
 * Conventional Commits validator hook.
 * Runs as a PreToolUse hook on Bash commands containing "git commit".
 * Validates that the commit message follows the schema in .harness/commit-schema.md.
 *
 * Exit 0 = allow, Exit 2 = block with message.
 */

const VALID_TYPES = [
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
] as const;

const MAX_SUBJECT_LENGTH = 72;

// Pattern: type(optional-scope)optional-!: description
const COMMIT_PATTERN =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z][a-z0-9-]*\))?(!)?: .+/;

interface HookInput {
  tool_name: string;
  tool_input: {
    command?: string;
  };
}

function extractCommitMessage(command: string): string | null {
  // Match: git commit -m "message" or git commit -m 'message'
  // Also handles heredoc: git commit -m "$(cat <<'EOF'\nmessage\nEOF\n)"
  const simpleMatch = command.match(/git commit[^"']*[-]m\s+["']([^"']+)["']/);
  if (simpleMatch) {
    return simpleMatch[1].trim();
  }

  // Heredoc pattern
  const heredocMatch = command.match(
    /git commit[^"]*-m\s+"\$\(cat <<['"]?EOF['"]?\n([\s\S]*?)\nEOF/
  );
  if (heredocMatch) {
    return heredocMatch[1].trim();
  }

  return null;
}

function validateCommitMessage(message: string): string[] {
  const errors: string[] = [];

  // Split into subject and body
  const lines = message.split("\n");
  const subject = lines[0];

  if (!subject) {
    errors.push("Commit message is empty");
    return errors;
  }

  // Check conventional commit format
  if (!COMMIT_PATTERN.test(subject)) {
    const typeStr = VALID_TYPES.join(", ");
    errors.push(
      `Subject must match: <type>(<scope>): <description>\n` +
        `   Valid types: ${typeStr}\n` +
        `   Got: "${subject}"`
    );
    return errors;
  }

  // Check subject length
  if (subject.length > MAX_SUBJECT_LENGTH) {
    errors.push(
      `Subject line is ${subject.length} chars (max ${MAX_SUBJECT_LENGTH}): "${subject}"`
    );
  }

  // Check description starts lowercase
  const descMatch = subject.match(/^[^:]+:\s(.)/);
  if (descMatch && descMatch[1] === descMatch[1].toUpperCase() && descMatch[1] !== descMatch[1].toLowerCase()) {
    errors.push(
      `Description should start lowercase: "${subject}"`
    );
  }

  // Check no trailing period
  if (subject.endsWith(".")) {
    errors.push(`Subject should not end with a period: "${subject}"`);
  }

  // Check body separation (if body exists)
  if (lines.length > 1 && lines[1] !== "") {
    errors.push("Body must be separated from subject by a blank line");
  }

  return errors;
}

const chunks: string[] = [];
process.stdin.on("data", (chunk) => chunks.push(chunk.toString()));
process.stdin.on("end", () => {
  const input = chunks.join("");
  if (!input) {
    process.exit(0);
  }

  let parsed: HookInput;
  try {
    parsed = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  // Only validate git commit commands
  const command = parsed.tool_input?.command || "";
  if (!command.includes("git commit")) {
    process.exit(0);
  }

  // Skip amend commits (they modify existing messages)
  if (command.includes("--amend")) {
    process.exit(0);
  }

  const message = extractCommitMessage(command);
  if (!message) {
    // Can't parse message (might be interactive or --allow-empty-message)
    process.exit(0);
  }

  const errors = validateCommitMessage(message);

  if (errors.length > 0) {
    console.error("[CommitLint] Commit message does not follow Conventional Commits:");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    console.error("\nSee .harness/commit-schema.md for the full specification.");
    process.exit(2);
  }

  // Valid
  process.exit(0);
});
