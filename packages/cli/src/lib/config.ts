/**
 * Config — read .harness/ YAML configs and agent definitions.
 *
 * All config loading is synchronous (startup-time only, never in hot paths).
 * Returns raw parsed objects — callers validate what they need.
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import {
  HARNESS_DIR,
  AGENTS_DIR,
  STACKS_FILE,
  CATEGORIES_FILE,
  TOOL_CATALOG_FILE,
  CLAUDE_SETTINGS_FILE,
} from "./constants.js";

// ─── YAML Parsing (lightweight, no dep for simple configs) ──────────────────

/**
 * Minimal YAML parser for our config files.
 * Handles nested maps and arrays. Not a full YAML parser — good enough
 * for stacks.yml, agent-categories.yml, tool-catalog.yml.
 */
function parseYaml(content: string): Record<string, unknown> {
  try {
    // Use Bun's built-in YAML support if available, otherwise dynamic import
    const yaml = require("yaml");
    return yaml.parse(content) ?? {};
  } catch {
    // Fallback: return empty if yaml package not available
    return {};
  }
}

// ─── Agent Definitions ──────────────────────────────────────────────────────

export interface AgentInfo {
  name: string;
  description: string;
  model: string;
  level: number;
  maxTurns: number;
  bodyPreview: string;
}

/**
 * Parse frontmatter from an agent .md file.
 * Extracts YAML between --- delimiters.
 */
function parseFrontmatter(content: string): {
  data: Record<string, string>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: content };

  const data: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      data[key] = val;
    }
  }
  return { data, body: match[2] };
}

/**
 * Load all agent definitions from agents/ directory.
 */
export function loadAgents(agentsDir: string = AGENTS_DIR): AgentInfo[] {
  if (!existsSync(agentsDir)) return [];

  const files = readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
  return files.map((file) => {
    const content = readFileSync(join(agentsDir, file), "utf-8");
    const { data, body } = parseFrontmatter(content);
    return {
      name: data.name ?? file.replace(".md", ""),
      description: data.description ?? "",
      model: data.model ?? "claude-sonnet-4-6",
      level: parseInt(data.level ?? "2", 10),
      maxTurns: parseInt(data.maxTurns ?? "200", 10),
      bodyPreview: body.slice(0, 120).replace(/\n/g, " ").trim(),
    };
  });
}

// ─── Config Files ───────────────────────────────────────────────────────────

/**
 * Load stacks.yml — the canonical tech stack config.
 */
export function loadStacks(path: string = STACKS_FILE): Record<string, unknown> {
  if (!existsSync(path)) return {};
  return parseYaml(readFileSync(path, "utf-8"));
}

/**
 * Load agent-categories.yml — category definitions with ground truth rules.
 */
export function loadCategories(
  path: string = CATEGORIES_FILE
): Record<string, unknown> {
  if (!existsSync(path)) return {};
  return parseYaml(readFileSync(path, "utf-8"));
}

/**
 * Load tool-catalog.yml — available tools for stack extension.
 */
export function loadToolCatalog(
  path: string = TOOL_CATALOG_FILE
): Record<string, unknown> {
  if (!existsSync(path)) return {};
  return parseYaml(readFileSync(path, "utf-8"));
}

/**
 * Load .claude/settings.json — Claude Code hook configuration.
 */
export function loadClaudeSettings(
  path: string = CLAUDE_SETTINGS_FILE
): Record<string, unknown> {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}

/**
 * Check if .harness directory exists and is configured.
 */
export function isHarnessConfigured(): boolean {
  return existsSync(HARNESS_DIR) && existsSync(STACKS_FILE);
}
