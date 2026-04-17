#!/usr/bin/env bun
/**
 * CLI wrapper for skill-chain-enforcer.
 *
 * Reads the Claude Code hook payload from stdin, parses the session transcript
 * to reconstruct the skill invocation history, and blocks Edit/Write when a
 * skill-chain flow is active and its required phases are incomplete.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { evaluate, type SkillChains } from "./skill-chain-enforcer.js";

interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
  transcript_path?: string;
  cwd?: string;
}

const GATED_TOOLS = new Set(["Edit", "Write"]);

function normalizeSkill(name: string): string {
  const idx = name.lastIndexOf(":");
  return idx >= 0 ? name.slice(idx + 1) : name;
}

function loadChains(cwd: string): SkillChains | null {
  // Check project-local first, then plugin-shipped defaults.
  const candidates = [
    resolve(cwd, ".harness/skill-chains.json"),
    process.env.CLAUDE_PLUGIN_ROOT
      ? resolve(process.env.CLAUDE_PLUGIN_ROOT, "chains/skill-chains.json")
      : null,
  ].filter((p): p is string => !!p);

  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      const raw = readFileSync(path, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.flows) return parsed as SkillChains;
    } catch {
      continue;
    }
  }
  return null;
}

function readSkillHistory(transcriptPath: string | undefined): string[] {
  if (!transcriptPath || !existsSync(transcriptPath)) return [];
  const skills: string[] = [];
  try {
    const raw = readFileSync(transcriptPath, "utf-8");
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      let entry: { type?: string; message?: { content?: unknown } };
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }
      if (entry.type !== "assistant") continue;
      const content = entry.message?.content;
      if (!Array.isArray(content)) continue;
      for (const c of content) {
        if (
          c &&
          typeof c === "object" &&
          c.type === "tool_use" &&
          c.name === "Skill"
        ) {
          const skill = c.input?.skill;
          if (typeof skill === "string") skills.push(normalizeSkill(skill));
        }
      }
    }
  } catch {}
  return skills;
}

const chunks: string[] = [];
process.stdin.on("data", (c) => chunks.push(c.toString()));
process.stdin.on("end", () => {
  const raw = chunks.join("");
  try {
    const input = JSON.parse(raw) as HookInput;
    const cwd = input.cwd || process.cwd();

    // Record Skill invocations from the in-flight call too — the transcript
    // may not yet include the tool call being made.
    const skillHistory = readSkillHistory(input.transcript_path);
    if (input.tool_name === "Skill") {
      const s = input.tool_input?.skill;
      if (typeof s === "string") skillHistory.push(normalizeSkill(s));
    }

    if (!GATED_TOOLS.has(input.tool_name)) {
      console.log(raw);
      return;
    }

    const rawFilePath = (input.tool_input?.file_path as string) || "";
    if (!rawFilePath) {
      console.log(raw);
      return;
    }
    const filePath = rawFilePath.startsWith(cwd + "/")
      ? rawFilePath.slice(cwd.length + 1)
      : rawFilePath;

    const chains = loadChains(cwd);
    if (!chains) {
      console.log(raw);
      return;
    }

    const result = evaluate(chains, filePath, skillHistory);
    if (result.decision === "DENY") {
      console.error(result.message || "[skill-chain] blocked");
      process.exit(2);
    }

    console.log(raw);
  } catch {
    console.log(raw);
  }
});
