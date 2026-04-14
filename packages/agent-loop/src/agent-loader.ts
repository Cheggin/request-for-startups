/**
 * Agent loader — reads agent .md files and parses frontmatter into AgentDefinition.
 */

import matter from "gray-matter";
import { readFileSync, readdirSync } from "fs";
import { join, basename } from "path";
import type { AgentDefinition } from "./types.js";

/**
 * Parse a single agent .md file into an AgentDefinition.
 * Expects YAML frontmatter with: name, model, level, maxTurns.
 * Optional: disallowedTools (string[]).
 */
export function parseAgentFile(content: string, filename: string): AgentDefinition {
  const { data, content: body } = matter(content);

  const name = data.name;
  if (typeof name !== "string" || name.length === 0) {
    throw new Error(`Agent file "${filename}" missing required frontmatter field: name`);
  }

  const model = data.model;
  if (typeof model !== "string" || model.length === 0) {
    throw new Error(`Agent "${name}" missing required frontmatter field: model`);
  }

  const level = Number(data.level);
  if (!Number.isFinite(level) || level < 1) {
    throw new Error(`Agent "${name}" has invalid level: ${data.level}`);
  }

  const maxTurns = Number(data.maxTurns ?? 100);
  if (!Number.isFinite(maxTurns) || maxTurns < 1) {
    throw new Error(`Agent "${name}" has invalid maxTurns: ${data.maxTurns}`);
  }

  let disallowedTools: string[] = [];
  if (data.disallowedTools) {
    if (Array.isArray(data.disallowedTools)) {
      disallowedTools = data.disallowedTools.map(String);
    } else if (typeof data.disallowedTools === "string") {
      disallowedTools = data.disallowedTools.split(",").map((s: string) => s.trim());
    }
  }

  return {
    name,
    model,
    level,
    disallowedTools,
    maxTurns,
    body: body.trim(),
  };
}

/**
 * Load a single agent by name from the agents directory.
 */
export function loadAgent(agentsDir: string, agentName: string): AgentDefinition {
  const filePath = join(agentsDir, `${agentName}.md`);
  const content = readFileSync(filePath, "utf-8");
  return parseAgentFile(content, `${agentName}.md`);
}

/**
 * List all available agent names in the agents directory.
 */
export function listAgents(agentsDir: string): string[] {
  const files = readdirSync(agentsDir);
  return files
    .filter((f) => f.endsWith(".md"))
    .map((f) => basename(f, ".md"));
}
