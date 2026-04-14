/**
 * harness skill — list and run skills.
 *
 * Reads skill definitions from skills/<category>/*.md.
 */

import type { ParsedArgs } from "../index";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkillInfo {
  name: string;
  description: string;
  category: string;
  file: string;
}

// ---------------------------------------------------------------------------
// Parse skill frontmatter
// ---------------------------------------------------------------------------

export function parseSkillFrontmatter(content: string, filename: string, category: string): SkillInfo {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  const name = filename.replace(".md", "");

  if (!match) {
    return { name, description: "", category, file: filename };
  }

  const yaml = match[1];
  const descMatch = yaml.match(/^description:\s*(.+)$/m);

  return {
    name,
    description: descMatch ? descMatch[1].trim() : "",
    category,
    file: filename,
  };
}

// ---------------------------------------------------------------------------
// Load all skills
// ---------------------------------------------------------------------------

export const SKILL_CATEGORIES = ["coding", "content", "growth", "operations", "shared"];

export async function loadSkills(root: string): Promise<SkillInfo[]> {
  const skillsDir = join(root, "skills");
  const skills: SkillInfo[] = [];

  for (const category of SKILL_CATEGORIES) {
    const catDir = join(skillsDir, category);
    let files: string[];
    try {
      files = await readdir(catDir);
    } catch {
      continue;
    }

    for (const f of files) {
      if (!f.endsWith(".md")) continue;
      const content = await Bun.file(join(catDir, f)).text();
      skills.push(parseSkillFrontmatter(content, f, category));
    }
  }

  return skills;
}

// ---------------------------------------------------------------------------
// Fuzzy match helper
// ---------------------------------------------------------------------------

function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;

  // Simple subsequence match
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function skillList(root: string, flags: Record<string, string | boolean>): Promise<void> {
  const skills = await loadSkills(root);
  if (skills.length === 0) {
    console.log("No skills found in skills/");
    return;
  }

  const categoryFilter = flags["category"] as string | undefined;

  // Group by category
  const grouped = new Map<string, SkillInfo[]>();
  for (const s of skills) {
    if (categoryFilter && typeof categoryFilter === "string" && s.category !== categoryFilter) continue;
    const list = grouped.get(s.category) || [];
    list.push(s);
    grouped.set(s.category, list);
  }

  console.log("=== Skills ===\n");

  for (const [category, categorySkills] of grouped) {
    console.log(`\x1b[1m${category}\x1b[0m`);
    for (const s of categorySkills) {
      const desc = s.description ? ` — ${s.description.substring(0, 70)}` : "";
      console.log(`  ${s.name}${desc}`);
    }
    console.log();
  }

  console.log(`Total: ${skills.length} skills across ${grouped.size} categories`);
}

async function skillRun(root: string, name: string): Promise<void> {
  const skills = await loadSkills(root);

  // Fuzzy search
  let skill = skills.find((s) => s.name === name);
  if (!skill) {
    skill = skills.find((s) => fuzzyMatch(name, s.name));
  }

  if (!skill) {
    console.error(`Skill "${name}" not found.`);
    const suggestions = skills
      .filter((s) => fuzzyMatch(name.substring(0, 3), s.name))
      .slice(0, 5);
    if (suggestions.length > 0) {
      console.error(`Did you mean: ${suggestions.map((s) => s.name).join(", ")}?`);
    }
    process.exit(1);
  }

  const skillPath = join(root, "skills", skill.category, skill.file);
  const content = await Bun.file(skillPath).text();

  // Strip frontmatter for display
  const body = content.replace(/^---\n[\s\S]*?\n---\n*/, "");

  console.log(`=== Skill: ${skill.name} (${skill.category}) ===\n`);
  console.log(body);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function printSkillUsage(): void {
  console.log(`harness skill — browse and run skills

Commands:
  list [--category <name>]   List all skills, optionally filtered by category
  run <name>                 Display a skill's content`);
}

export async function runSkill(parsed: ParsedArgs, root: string): Promise<void> {
  switch (parsed.command) {
    case "list":
      await skillList(root, parsed.flags);
      break;
    case "run": {
      const name = parsed.positional[0];
      if (!name) {
        console.error("Usage: harness skill run <name>");
        process.exit(1);
      }
      await skillRun(root, name);
      break;
    }
    default:
      printSkillUsage();
      break;
  }
}
