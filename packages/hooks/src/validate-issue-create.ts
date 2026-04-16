/**
 * Issue creation validator hook.
 * Runs as a PreToolUse hook on Bash commands containing "gh issue create".
 * Validates that the issue body follows the schema in .harness/issue-schema.md.
 *
 * Accepts two body formats:
 *  1. Markdown template: ## Type, ## Severity, ## Description, etc.
 *  2. GitHub form output: ### Severity, ### What happened / ### Description, etc.
 *
 * Exit 0 = allow, Exit 2 = block with message.
 */

const VALID_TYPES = [
  "feat",
  "fix",
  "refactor",
  "test",
  "docs",
  "chore",
  "perf",
  "ci",
] as const;

const VALID_SEVERITIES = ["P0", "P1", "P2", "P3"] as const;

const TITLE_PATTERN = /^\[(feat|fix|refactor|test|docs|chore|perf|ci)\] .+/;

interface HookInput {
  tool_name: string;
  tool_input: {
    command?: string;
  };
}

function extractTitle(command: string): string | null {
  const match = command.match(/--title\s+["']([^"']+)["']/);
  return match ? match[1] : null;
}

function extractBody(command: string): string | null {
  // Simple --body "..." or --body '...'
  const simpleMatch = command.match(/--body\s+["']([^"']+)["']/);
  if (simpleMatch) return simpleMatch[1];

  // Heredoc: --body "$(cat <<'EOF'\n...\nEOF\n)"
  const heredocMatch = command.match(
    /--body\s+"\$\(cat <<['"]?EOF['"]?\n([\s\S]*?)\nEOF/
  );
  if (heredocMatch) return heredocMatch[1];

  return null;
}

/** Check if body contains a section heading (## or ### prefix) */
function hasSection(body: string, ...names: string[]): boolean {
  const lower = body.toLowerCase();
  return names.some(
    (name) =>
      lower.includes(`## ${name.toLowerCase()}`) ||
      lower.includes(`### ${name.toLowerCase()}`)
  );
}

/** Detect if the title already encodes the type via [type] prefix */
function titleHasType(title: string | null): boolean {
  return title !== null && TITLE_PATTERN.test(title);
}

export function validateIssue(title: string | null, body: string | null): string[] {
  const errors: string[] = [];

  // Validate title format
  if (!title) {
    errors.push("Missing --title flag");
    return errors;
  }

  if (!TITLE_PATTERN.test(title)) {
    const typeStr = VALID_TYPES.join(", ");
    errors.push(
      `Title must match: [type] description\n` +
        `   Valid types: ${typeStr}\n` +
        `   Got: "${title}"`
    );
  }

  if (!body) {
    errors.push("Missing --body flag. Issues require a body with severity, description, and acceptance criteria.");
    return errors;
  }

  // Check for type — required in body only when title doesn't carry it
  if (!titleHasType(title)) {
    const bodyLower = body.toLowerCase();
    const hasType = VALID_TYPES.some(
      (t) =>
        bodyLower.includes(`type: ${t}`) ||
        bodyLower.includes(`**type:** ${t}`)
    );
    if (!hasType && !hasSection(body, "type")) {
      errors.push("Body missing '## Type' section (feat, fix, refactor, test, docs, chore, perf, ci)");
    }
  }

  // Check for severity (P0-P3 anywhere in body)
  const hasSeverity = VALID_SEVERITIES.some((s) => body.includes(s));
  if (!hasSeverity) {
    errors.push("Body missing severity (P0, P1, P2, or P3)");
  }

  // Check for description — accept "Description", "What happened" (bug form)
  if (!hasSection(body, "description", "what happened")) {
    errors.push("Body missing '## Description' or '### What happened' section");
  }

  // Check for acceptance criteria
  if (!hasSection(body, "acceptance criteria", "acceptance")) {
    errors.push("Body missing '## Acceptance Criteria' section");
  }

  // Check that acceptance criteria has at least one checkbox
  if (!body.includes("- [ ]") && !body.includes("- [x]")) {
    errors.push("Acceptance criteria must include at least one checklist item (- [ ])");
  }

  // Check for verification steps
  if (!hasSection(body, "verification steps", "verification")) {
    errors.push("Body missing '## Verification Steps' section");
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

  const command = parsed.tool_input?.command || "";

  // Only validate gh issue create commands
  if (!command.includes("gh issue create")) {
    process.exit(0);
  }

  const title = extractTitle(command);
  const body = extractBody(command);
  const errors = validateIssue(title, body);

  if (errors.length > 0) {
    console.error("[IssueLint] Issue does not follow the required schema:");
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    console.error("\nSee .harness/issue-schema.md for the full specification.");
    process.exit(2);
  }

  process.exit(0);
});
