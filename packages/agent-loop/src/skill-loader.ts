/**
 * Skill loader — reads skill .md files from category and shared directories,
 * then concatenates them into a single system prompt block.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import type { LoadedSkill } from "./types.js";

/**
 * Load all .md skills from a single directory.
 */
function loadSkillsFromDir(dir: string, source: string): LoadedSkill[] {
  if (!existsSync(dir)) {
    return [];
  }

  const files = readdirSync(dir).filter((f) => f.endsWith(".md"));
  return files.map((f) => ({
    name: basename(f, ".md"),
    content: readFileSync(join(dir, f), "utf-8").trim(),
    source,
  }));
}

/**
 * Determine which category directory to load skills from based on agent name.
 *
 * Maps agent names to skill categories. Falls back to checking if a directory
 * matching the agent name exists.
 */
function resolveCategory(agentName: string, skillsDir: string): string | undefined {
  // Known mappings from agent role to skill category
  const AGENT_CATEGORY_MAP: Record<string, string> = {
    backend: "coding",
    website: "coding",
    commander: "operations",
    ops: "operations",
    growth: "growth",
    writing: "content",
  };

  const mapped = AGENT_CATEGORY_MAP[agentName];
  if (mapped) {
    const dir = join(skillsDir, mapped);
    if (existsSync(dir)) return mapped;
  }

  // Fallback: check if a directory named after the agent exists
  const direct = join(skillsDir, agentName);
  if (existsSync(direct)) return agentName;

  return undefined;
}

/**
 * Load skills for a given agent: shared skills + category-specific skills.
 * Returns them in load order (shared first, then category).
 */
export function loadSkills(skillsDir: string, agentName: string): LoadedSkill[] {
  const shared = loadSkillsFromDir(join(skillsDir, "shared"), "shared");
  const category = resolveCategory(agentName, skillsDir);

  let categorySkills: LoadedSkill[] = [];
  if (category) {
    categorySkills = loadSkillsFromDir(join(skillsDir, category), category);
  }

  return [...shared, ...categorySkills];
}

/**
 * Concatenate loaded skills into a single block for injection into a system prompt.
 */
export function concatSkills(skills: LoadedSkill[]): string {
  if (skills.length === 0) return "";

  return skills
    .map((s) => `<Skill name="${s.name}" source="${s.source}">\n${s.content}\n</Skill>`)
    .join("\n\n");
}
