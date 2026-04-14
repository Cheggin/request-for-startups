/**
 * harness feature — list, create, and inspect features.
 *
 * Reads feature checklists from features/*.md.
 * Wraps the existing Taskfile feature commands with a nicer interface.
 */

import type { ParsedArgs } from "../index";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeatureInfo {
  name: string;
  status: string;
  statusEmoji: string;
  agent: string;
  category: string;
  totalItems: number;
  doneItems: number;
  file: string;
}

// ---------------------------------------------------------------------------
// Parse feature from .md file
// ---------------------------------------------------------------------------

export function parseFeature(content: string, filename: string): FeatureInfo {
  const name = filename.replace(".md", "");

  const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
  const statusRaw = statusMatch ? statusMatch[1].trim() : "unknown";

  // Extract emoji and text separately
  const emojiMatch = statusRaw.match(/^([^\w]*)\s*(.*)/);
  const statusEmoji = emojiMatch ? emojiMatch[1].trim() : "";
  const status = emojiMatch ? emojiMatch[2].trim() : statusRaw;

  const agentMatch = content.match(/\*\*Agent:\*\*\s*(.+)/);
  const agent = agentMatch ? agentMatch[1].trim() : "unassigned";

  const categoryMatch = content.match(/\*\*Category:\*\*\s*(.+)/);
  const category = categoryMatch ? categoryMatch[1].trim() : "unknown";

  // Count checklist items
  const allItems = content.match(/^- \[[ x]\]/gm) || [];
  const doneItems = content.match(/^- \[x\]/gm) || [];

  return {
    name,
    status,
    statusEmoji,
    agent,
    category,
    totalItems: allItems.length,
    doneItems: doneItems.length,
    file: filename,
  };
}

// ---------------------------------------------------------------------------
// Load all features
// ---------------------------------------------------------------------------

export async function loadFeatures(root: string): Promise<FeatureInfo[]> {
  const dir = join(root, "features");
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return [];
  }

  const features: FeatureInfo[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const content = await Bun.file(join(dir, f)).text();
    features.push(parseFeature(content, f));
  }

  return features;
}

// ---------------------------------------------------------------------------
// Filter helper
// ---------------------------------------------------------------------------

function matchesFilter(feature: FeatureInfo, filter: string): boolean {
  const s = feature.status.toLowerCase();
  switch (filter) {
    case "done":
      return s.includes("complete") || s.includes("done");
    case "todo":
      return s.includes("not started");
    case "progress":
      return s.includes("in progress");
    case "blocked":
      return s.includes("blocked");
    default:
      return true;
  }
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function featureList(root: string, flags: Record<string, string | boolean>): Promise<void> {
  const features = await loadFeatures(root);
  if (features.length === 0) {
    console.log("No features found in features/");
    return;
  }

  // Determine filter from flags
  let filter = "all";
  for (const f of ["done", "todo", "progress", "blocked"]) {
    if (flags[f]) filter = f;
  }

  const filtered = filter === "all" ? features : features.filter((f) => matchesFilter(f, filter));

  console.log(`=== Features (${filter}) ===\n`);
  console.log(
    `${"NAME".padEnd(35)} ${"STATUS".padEnd(20)} ${"PROGRESS".padEnd(10)} AGENT`
  );
  console.log("-".repeat(80));

  for (const f of filtered) {
    const pct = f.totalItems > 0 ? Math.round((f.doneItems / f.totalItems) * 100) : 0;
    const progress = `${f.doneItems}/${f.totalItems} (${pct}%)`;
    const statusDisplay = `${f.statusEmoji} ${f.status}`.trim();
    console.log(
      `${f.name.padEnd(35)} ${statusDisplay.padEnd(20)} ${progress.padEnd(10)} ${f.agent}`
    );
  }

  console.log(`\nTotal: ${filtered.length} features`);
}

async function featureNew(root: string, name: string): Promise<void> {
  const filepath = join(root, "features", `${name}.md`);
  const exists = await Bun.file(filepath).exists();
  if (exists) {
    console.error(`Feature "${name}" already exists at features/${name}.md`);
    process.exit(1);
  }

  const date = new Date().toISOString().split("T")[0];
  const template = `# ${name}

**Status:** \u{1F534} Not started
**Agent:** unassigned
**Category:** coding | content | growth | operations
**Created:** ${date}

## Description

[What this feature does and why]

## Checklist

- [ ] Research / requirements
- [ ] Write tests (TDD)
- [ ] Implementation
- [ ] Tests passing
- [ ] Code review clean
- [ ] Visual QA (if UI)
- [ ] Deployed
- [ ] Verified in production

## Notes

[Agent notes, blockers, decisions]
`;

  await Bun.write(filepath, template);
  console.log(`Created feature: features/${name}.md`);
}

async function featureStatus(root: string, name: string): Promise<void> {
  const filepath = join(root, "features", `${name}.md`);
  const file = Bun.file(filepath);
  const exists = await file.exists();
  if (!exists) {
    console.error(`Feature "${name}" not found. Run 'harness feature list' to see available features.`);
    process.exit(1);
  }

  const content = await file.text();
  const info = parseFeature(content, `${name}.md`);

  console.log(`=== ${info.name} ===\n`);
  console.log(`Status:   ${info.statusEmoji} ${info.status}`);
  console.log(`Agent:    ${info.agent}`);
  console.log(`Category: ${info.category}`);
  console.log(`Progress: ${info.doneItems}/${info.totalItems}`);

  // Print checklist items
  const lines = content.split("\n");
  const checklistLines = lines.filter((l) => l.match(/^- \[[ x]\]/));
  if (checklistLines.length > 0) {
    console.log("\nChecklist:");
    for (const line of checklistLines) {
      const done = line.includes("[x]");
      const text = line.replace(/^- \[[ x]\]\s*/, "");
      const marker = done ? "\x1b[32m[done]\x1b[0m" : "\x1b[33m[todo]\x1b[0m";
      console.log(`  ${marker} ${text}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function printFeatureUsage(): void {
  console.log(`harness feature — manage feature checklists

Commands:
  list [--done|--todo|--progress|--blocked]   List features with optional filter
  new <name>                                   Create a new feature checklist
  status <name>                                Show detailed feature status`);
}

export async function runFeature(parsed: ParsedArgs, root: string): Promise<void> {
  switch (parsed.command) {
    case "list":
      await featureList(root, parsed.flags);
      break;
    case "new": {
      const name = parsed.positional[0];
      if (!name) {
        console.error("Usage: harness feature new <name>");
        process.exit(1);
      }
      await featureNew(root, name);
      break;
    }
    case "status": {
      const name = parsed.positional[0];
      if (!name) {
        console.error("Usage: harness feature status <name>");
        process.exit(1);
      }
      await featureStatus(root, name);
      break;
    }
    default:
      printFeatureUsage();
      break;
  }
}
