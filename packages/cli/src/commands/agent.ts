/**
 * harness agent — list, spawn, and kill agents.
 *
 * Reads agent definitions from agents/*.md (YAML frontmatter + XML body).
 * Spawns claude sessions in tmux panes with the agent's system prompt.
 */

import type { ParsedArgs } from "../index";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentDef {
  name: string;
  description: string;
  model: string;
  level: number;
  disallowedTools: string[];
  maxTurns: number;
  file: string;
}

// ---------------------------------------------------------------------------
// Parse agent frontmatter from .md file
// ---------------------------------------------------------------------------

export function parseAgentFrontmatter(content: string, file: string): AgentDef {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return {
      name: file.replace(".md", ""),
      description: "",
      model: "unknown",
      level: 0,
      disallowedTools: [],
      maxTurns: 0,
      file,
    };
  }

  const yaml = match[1];
  const get = (key: string): string => {
    const m = yaml.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return m ? m[1].trim() : "";
  };

  const disallowed = get("disallowedTools");

  return {
    name: get("name") || file.replace(".md", ""),
    description: get("description"),
    model: get("model") || "unknown",
    level: parseInt(get("level") || "0", 10),
    disallowedTools: disallowed ? disallowed.split(",").map((s) => s.trim()) : [],
    maxTurns: parseInt(get("maxTurns") || "0", 10),
    file,
  };
}

// ---------------------------------------------------------------------------
// Load all agents from agents/ directory
// ---------------------------------------------------------------------------

export async function loadAgents(root: string): Promise<AgentDef[]> {
  const agentsDir = join(root, "agents");
  let files: string[];
  try {
    files = await readdir(agentsDir);
  } catch {
    return [];
  }

  const agents: AgentDef[] = [];
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const content = await Bun.file(join(agentsDir, f)).text();
    agents.push(parseAgentFrontmatter(content, f));
  }

  return agents.sort((a, b) => b.level - a.level);
}

// ---------------------------------------------------------------------------
// Check tmux for running agents
// ---------------------------------------------------------------------------

export async function getRunningPanes(): Promise<Map<string, string>> {
  const panes = new Map<string, string>();
  try {
    const proc = Bun.spawn(["tmux", "list-panes", "-a", "-F", "#{pane_title}:#{pane_id}"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const text = await new Response(proc.stdout).text();
    for (const line of text.trim().split("\n")) {
      if (!line) continue;
      const [title, id] = line.split(":");
      if (title && id) panes.set(title, id);
    }
  } catch {
    // tmux not running — no panes
  }
  return panes;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function agentList(root: string): Promise<void> {
  const agents = await loadAgents(root);
  if (agents.length === 0) {
    console.log("No agents found in agents/");
    return;
  }

  const panes = await getRunningPanes();

  console.log("=== Agents ===\n");
  console.log(
    `${"NAME".padEnd(15)} ${"MODEL".padEnd(22)} ${"LVL".padEnd(5)} ${"TURNS".padEnd(7)} STATUS`
  );
  console.log("-".repeat(65));

  for (const a of agents) {
    const running = panes.has(a.name);
    const status = running ? "\x1b[32mrunning\x1b[0m" : "\x1b[90midle\x1b[0m";
    console.log(
      `${a.name.padEnd(15)} ${a.model.padEnd(22)} ${String(a.level).padEnd(5)} ${String(a.maxTurns).padEnd(7)} ${status}`
    );
  }
}

async function agentSpawn(
  root: string,
  name: string,
  prompt: string
): Promise<void> {
  const agents = await loadAgents(root);
  const agent = agents.find((a) => a.name === name);
  if (!agent) {
    console.error(`Agent "${name}" not found. Available: ${agents.map((a) => a.name).join(", ")}`);
    process.exit(1);
  }

  const systemPromptFile = join(root, "agents", agent.file);
  const systemPrompt = await Bun.file(systemPromptFile).text();

  // Build claude command args
  const claudeArgs = [
    "claude",
    "--print",
    "--system-prompt",
    systemPrompt,
    "--max-turns",
    String(agent.maxTurns),
  ];

  if (agent.disallowedTools.length > 0) {
    for (const tool of agent.disallowedTools) {
      claudeArgs.push("--disallowed-tool", tool);
    }
  }

  claudeArgs.push("--", prompt);

  // Spawn in tmux pane
  const tmuxCmd = [
    "tmux",
    "split-window",
    "-h",
    "-t",
    "harness",
    "-P",
    "-F",
    "#{pane_id}",
    ...claudeArgs,
  ];

  console.log(`Spawning agent "${name}" (${agent.model}, level ${agent.level})...`);

  try {
    const proc = Bun.spawn(tmuxCmd, { stdout: "pipe", stderr: "pipe" });
    const paneId = (await new Response(proc.stdout).text()).trim();

    // Name the pane
    if (paneId) {
      Bun.spawn(["tmux", "select-pane", "-t", paneId, "-T", name]);
    }

    console.log(`Agent "${name}" spawned in pane ${paneId}`);
  } catch (err: any) {
    console.error(`Failed to spawn: ${err.message}`);
    console.error("Make sure tmux session 'harness' exists. Run: task panes:start");
    process.exit(1);
  }
}

async function agentKill(name: string): Promise<void> {
  const panes = await getRunningPanes();
  const paneId = panes.get(name);

  if (!paneId) {
    console.error(`No running pane found for agent "${name}"`);
    const running = Array.from(panes.keys());
    if (running.length > 0) {
      console.error(`Running panes: ${running.join(", ")}`);
    }
    process.exit(1);
  }

  Bun.spawn(["tmux", "kill-pane", "-t", paneId]);
  console.log(`Killed agent "${name}" (pane ${paneId})`);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function printAgentUsage(): void {
  console.log(`harness agent — manage agent definitions and sessions

Commands:
  list                    List all agent definitions
  spawn <name> <prompt>   Spawn a claude session with agent config
  kill <name>             Kill a running agent's tmux pane`);
}

export async function runAgent(parsed: ParsedArgs, root: string): Promise<void> {
  switch (parsed.command) {
    case "list":
      await agentList(root);
      break;
    case "spawn": {
      const name = parsed.positional[0];
      const prompt = parsed.positional.slice(1).join(" ");
      if (!name || !prompt) {
        console.error("Usage: harness agent spawn <name> <prompt>");
        process.exit(1);
      }
      await agentSpawn(root, name, prompt);
      break;
    }
    case "kill": {
      const name = parsed.positional[0];
      if (!name) {
        console.error("Usage: harness agent kill <name>");
        process.exit(1);
      }
      await agentKill(name);
      break;
    }
    default:
      printAgentUsage();
      break;
  }
}
