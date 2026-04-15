import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { AGENTS_DIR, ROOT_DIR } from "./constants.js";
interface AgentLike {
  name: string;
  model: string;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\"'\"'")}'`;
}

function loadAgentSystemPrompt(name: string): string {
  const agentFile = join(AGENTS_DIR, `${name}.md`);
  if (!existsSync(agentFile)) {
    return "";
  }

  const content = readFileSync(agentFile, "utf-8");
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1].trim() : content.trim();
}

/**
 * Build the base system prompt from the agent's .md file.
 * Category-specific skills/ground-truth are injected by spawnAgent
 * via generateAgentPrompt() from agent-loader.ts.
 */
export function buildAgentSystemPrompt(
  agentName: string,
  extraSystemPrompt?: string
): string {
  return [
    loadAgentSystemPrompt(agentName),
    extraSystemPrompt?.trim() || "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildClaudeCommand(options: {
  model: string;
  cwd?: string;
  systemPrompt?: string;
}): string {
  const args = [
    "claude",
    "--dangerously-skip-permissions",
    "--model",
    options.model,
  ];

  if (options.systemPrompt?.trim()) {
    args.push("--append-system-prompt", options.systemPrompt);
  }

  const command = args.map(shellQuote).join(" ");
  const cwd = shellQuote(options.cwd ?? ROOT_DIR);
  return `cd ${cwd} && ${command}`;
}

export function buildAgentClaudeCommand(
  agent: AgentLike,
  extraSystemPrompt?: string
): string {
  return buildClaudeCommand({
    model: agent.model,
    cwd: ROOT_DIR,
    systemPrompt: buildAgentSystemPrompt(agent.name, extraSystemPrompt),
  });
}
