/**
 * harness stack — view and extend the tech stack.
 *
 * Reads .harness/stacks.yml.
 */

import type { ParsedArgs } from "../index";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Known tool catalog for `stack extend`
// ---------------------------------------------------------------------------

export const TOOL_CATALOG: Record<string, { category: string; key: string; description: string }> = {
  // Databases
  postgres: { category: "backend", key: "database", description: "PostgreSQL relational database" },
  supabase: { category: "backend", key: "database", description: "Supabase (Postgres + auth + realtime)" },
  redis: { category: "backend", key: "cache", description: "Redis in-memory cache" },
  // Auth
  clerk: { category: "backend", key: "authentication", description: "Clerk authentication" },
  "next-auth": { category: "backend", key: "authentication", description: "NextAuth.js authentication" },
  // Monitoring
  sentry: { category: "quality", key: "error_tracking", description: "Sentry error tracking" },
  posthog: { category: "quality", key: "analytics", description: "PostHog product analytics" },
  // Styling
  "shadcn-ui": { category: "website", key: "component_library", description: "shadcn/ui component library" },
  radix: { category: "website", key: "component_library", description: "Radix UI primitives" },
  // Communication
  resend: { category: "communication", key: "email", description: "Resend transactional email" },
  // Payments
  lemonsqueezy: { category: "backend", key: "payments", description: "LemonSqueezy payments" },
};

// ---------------------------------------------------------------------------
// Parse stacks YAML (simple line-based, no yaml lib)
// ---------------------------------------------------------------------------

export interface StackEntry {
  key: string;
  value: string;
  indent: number;
}

export function parseStacksYaml(content: string): StackEntry[] {
  const entries: StackEntry[] = [];
  for (const line of content.split("\n")) {
    if (line.startsWith("#") || !line.trim()) continue;
    const indent = line.length - line.trimStart().length;
    const match = line.trim().match(/^(\S+):\s*(.*)$/);
    if (match) {
      entries.push({ key: match[1], value: match[2].replace(/#.*$/, "").trim(), indent });
    }
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function stackShow(root: string): Promise<void> {
  const stackPath = join(root, ".harness", "stacks.yml");
  const file = Bun.file(stackPath);
  const exists = await file.exists();

  if (!exists) {
    console.error("No .harness/stacks.yml found. Run harness init first.");
    process.exit(1);
  }

  const content = await file.text();
  const entries = parseStacksYaml(content);

  console.log("=== Tech Stack ===\n");

  let currentSection = "";
  for (const entry of entries) {
    if (entry.indent === 0) {
      currentSection = entry.key;
      console.log(`\x1b[1m${entry.key}\x1b[0m`);
    } else {
      const val = entry.value || "(not set)";
      console.log(`  ${entry.key.padEnd(22)} ${val}`);
    }
  }
}

async function stackExtend(root: string, tool: string): Promise<void> {
  const info = TOOL_CATALOG[tool.toLowerCase()];
  if (!info) {
    console.error(`Unknown tool: "${tool}"`);
    console.error("\nAvailable tools:");
    for (const [name, meta] of Object.entries(TOOL_CATALOG)) {
      console.error(`  ${name.padEnd(18)} ${meta.description}`);
    }
    process.exit(1);
  }

  const stackPath = join(root, ".harness", "stacks.yml");
  const file = Bun.file(stackPath);
  const exists = await file.exists();

  if (!exists) {
    console.error("No .harness/stacks.yml found. Run harness init first.");
    process.exit(1);
  }

  const content = await file.text();

  // Check if already present
  if (content.includes(`${info.key}: ${tool}`)) {
    console.log(`"${tool}" is already in the stack under ${info.category}.${info.key}`);
    return;
  }

  // Find the section and key, replace or append
  const lines = content.split("\n");
  let inSection = false;
  let inserted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.match(new RegExp(`^${info.category}:`))) {
      inSection = true;
      continue;
    }
    if (inSection && line.match(/^\S/) && !line.startsWith("#")) {
      // Left the section without finding the key — insert before this line
      lines.splice(i, 0, `  ${info.key}: ${tool}`);
      inserted = true;
      break;
    }
    if (inSection && line.trim().startsWith(`${info.key}:`)) {
      // Replace existing value
      const indent = line.length - line.trimStart().length;
      lines[i] = `${" ".repeat(indent)}${info.key}: ${tool}`;
      inserted = true;
      break;
    }
  }

  if (!inserted) {
    // Append to end of file under the section
    lines.push(`  ${info.key}: ${tool}`);
  }

  await Bun.write(stackPath, lines.join("\n"));
  console.log(`Added "${tool}" to stack: ${info.category}.${info.key}`);
  console.log(`Description: ${info.description}`);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function printStackUsage(): void {
  console.log(`harness stack — view and extend the tech stack

Commands:
  show              Display current stacks.yml
  extend <tool>     Add a tool to the stack`);
}

export async function runStack(parsed: ParsedArgs, root: string): Promise<void> {
  switch (parsed.command) {
    case "show":
      await stackShow(root);
      break;
    case "extend": {
      const tool = parsed.positional[0];
      if (!tool) {
        console.error("Usage: harness stack extend <tool>");
        console.error("\nAvailable tools:");
        for (const [name, meta] of Object.entries(TOOL_CATALOG)) {
          console.error(`  ${name.padEnd(18)} ${meta.description}`);
        }
        process.exit(1);
      }
      await stackExtend(root, tool);
      break;
    }
    default:
      printStackUsage();
      break;
  }
}
