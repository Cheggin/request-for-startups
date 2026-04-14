/**
 * harness skill — manage and invoke skills.
 *
 * Subcommands:
 *   list [--category <cat>] — grouped by category
 *   run <name>             — invoke skill in current session
 *   eval <name>            — run eval for a specific skill
 *   eval-all               — run all evals
 */

import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { SKILLS_DIR, ROOT_DIR } from "../lib/constants.js";
import { loadCategories } from "../lib/config.js";
import { heading, table, success, error, muted, warn, info } from "../lib/format.js";

export function run(args: string[]): void {
  const sub = args[0];
  switch (sub) {
    case "list":
      return skillList(args.slice(1));
    case "run":
      return skillRun(args.slice(1));
    case "eval":
      return skillEval(args.slice(1));
    case "eval-all":
      return skillEvalAll();
    default:
      console.log(heading("harness skill"));
      console.log("  Usage:");
      console.log("    harness skill list [--category <cat>]  — list skills");
      console.log("    harness skill run <name>               — invoke skill");
      console.log("    harness skill eval <name>              — eval one skill");
      console.log("    harness skill eval-all                 — eval all skills");
      console.log();
  }
}

interface SkillInfo {
  name: string;
  category: string;
  path: string;
}

function discoverSkills(): SkillInfo[] {
  const skills: SkillInfo[] = [];

  if (!existsSync(SKILLS_DIR)) return skills;

  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Category directory — skills inside
      const catDir = join(SKILLS_DIR, entry.name);
      const catEntries = readdirSync(catDir).filter((f) => f.endsWith(".md"));
      for (const file of catEntries) {
        skills.push({
          name: file.replace(".md", ""),
          category: entry.name,
          path: join(catDir, file),
        });
      }
    } else if (entry.name.endsWith(".md")) {
      // Top-level skill
      skills.push({
        name: entry.name.replace(".md", ""),
        category: "shared",
        path: join(SKILLS_DIR, entry.name),
      });
    }
  }

  return skills;
}

function skillList(args: string[]): void {
  console.log(heading("harness skill list"));

  const categoryFilter = args.indexOf("--category") >= 0
    ? args[args.indexOf("--category") + 1]
    : null;

  const skills = discoverSkills();

  if (skills.length === 0) {
    console.log(muted("  No skills found in skills/ directory."));
    console.log(muted("  Skills are loaded from the skills/ directory, organized by category."));
    return;
  }

  // Group by category
  const grouped = new Map<string, SkillInfo[]>();
  for (const skill of skills) {
    if (categoryFilter && skill.category !== categoryFilter) continue;
    const list = grouped.get(skill.category) ?? [];
    list.push(skill);
    grouped.set(skill.category, list);
  }

  if (grouped.size === 0) {
    console.log(muted(`  No skills found in category '${categoryFilter}'.`));
    const categories = [...new Set(skills.map((s) => s.category))];
    console.log(muted(`  Available categories: ${categories.join(", ")}`));
    return;
  }

  for (const [category, categorySkills] of grouped) {
    console.log(`  ${info(category)} (${categorySkills.length}):`);
    for (const skill of categorySkills) {
      console.log(`    - ${skill.name}`);
    }
    console.log();
  }
}

function skillRun(args: string[]): void {
  const name = args[0];
  if (!name) {
    console.log(error("  Usage: harness skill run <name>"));
    return;
  }

  const skills = discoverSkills();
  const skill = skills.find(
    (s) => s.name === name || s.name.includes(name)
  );

  if (!skill) {
    console.log(error(`  Skill '${name}' not found.`));
    const suggestions = skills
      .filter((s) => s.name.includes(name.slice(0, 3)))
      .map((s) => s.name);
    if (suggestions.length > 0) {
      console.log(muted(`  Did you mean: ${suggestions.join(", ")}?`));
    }
    return;
  }

  console.log(info(`  Loading skill: ${skill.name} (${skill.category})`));
  console.log(muted(`  Path: ${skill.path}`));

  // Read skill content and send to claude
  const content = readFileSync(skill.path, "utf-8");
  const prompt = `Execute this skill:\n\n${content}`;

  try {
    execSync(
      `cd ${ROOT_DIR} && claude --dangerously-skip-permissions -p "${prompt.replace(/"/g, '\\"').slice(0, 500)}"`,
      { stdio: "inherit", timeout: 300000 }
    );
  } catch (err) {
    console.log(warn("  Skill execution ended."));
  }
}

function skillEval(args: string[]): void {
  const name = args[0];
  if (!name) {
    console.log(error("  Usage: harness skill eval <name>"));
    return;
  }

  console.log(heading(`harness skill eval: ${name}`));
  console.log(muted("  Running eval via packages/eval-framework..."));

  try {
    execSync(
      `cd ${ROOT_DIR} && bun run packages/eval-framework/src/index.ts --skill ${name}`,
      { stdio: "inherit", timeout: 600000 }
    );
  } catch {
    console.log(error("  Eval failed. Check output above."));
  }
}

function skillEvalAll(): void {
  console.log(heading("harness skill eval-all"));
  console.log(muted("  Running all skill evals via packages/eval-framework..."));

  try {
    execSync(
      `cd ${ROOT_DIR} && bun run packages/eval-framework/src/index.ts --all`,
      { stdio: "inherit", timeout: 600000 }
    );
  } catch {
    console.log(error("  Some evals failed. Check output above."));
  }
}
