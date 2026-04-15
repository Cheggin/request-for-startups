import { loadCategories, loadStacks } from "./config.js";

export const AGENT_RUNTIMES = ["claude", "codex", "gemini"] as const;
export type AgentRuntime = (typeof AGENT_RUNTIMES)[number];

interface RuntimeCategoryConfig {
  agents?: string[];
  runtime?: string;
}

interface RuntimeLaunchOptions {
  model?: string | null;
  systemPrompt?: string | null;
}

interface RuntimeResolveOptions {
  override?: string | null;
}

function shellEscape(value: string): string {
  return `'${value.replace(/'/g, "'\"'\"'")}'`;
}

function compactPrompt(value: string): string {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

function normalizeRuntime(value: string | null | undefined): AgentRuntime | null {
  if (!value) return null;
  const trimmed = value.trim();
  return isAgentRuntime(trimmed) ? trimmed : null;
}

export function isAgentRuntime(value: string | null | undefined): value is AgentRuntime {
  return AGENT_RUNTIMES.includes(value as AgentRuntime);
}

export function getSupportedRuntimes(): AgentRuntime[] {
  return [...AGENT_RUNTIMES];
}

export function resolveAgentRuntime(
  agentName: string,
  options: RuntimeResolveOptions = {}
): AgentRuntime {
  const override = normalizeRuntime(options.override);
  if (override) return override;

  const categories = loadCategories() as Record<string, RuntimeCategoryConfig | unknown>;
  for (const [categoryName, categoryValue] of Object.entries(categories)) {
    if (categoryName === "shared_skills") continue;
    if (!categoryValue || typeof categoryValue !== "object") continue;

    const category = categoryValue as RuntimeCategoryConfig;
    if (!category.agents?.includes(agentName)) continue;

    const categoryRuntime = normalizeRuntime(category.runtime);
    if (categoryRuntime) return categoryRuntime;
  }

  const stacks = loadStacks() as Record<string, unknown>;
  return normalizeRuntime(stacks.runtime as string | undefined) ?? "claude";
}

export function buildRuntimeLaunchCommand(
  runtime: AgentRuntime,
  options: RuntimeLaunchOptions = {}
): string {
  const parts: string[] = [];

  switch (runtime) {
    case "claude":
      parts.push("claude", "--dangerously-skip-permissions");
      if (options.model?.trim()) {
        parts.push("--model", options.model.trim());
      }
      if (options.systemPrompt?.trim()) {
        parts.push("--append-system-prompt", options.systemPrompt.trim());
      }
      break;
    case "codex":
      parts.push("codex", "--yolo");
      break;
    case "gemini":
      parts.push("gemini");
      break;
  }

  return parts.map(shellEscape).join(" ");
}

export function buildSessionBootstrapPrompt(
  runtime: AgentRuntime,
  options: {
    systemPrompt?: string | null;
    taskPrompt?: string | null;
  } = {}
): string | null {
  const systemPrompt = compactPrompt(options.systemPrompt ?? "");
  const taskPrompt = compactPrompt(options.taskPrompt ?? "");

  if (runtime === "claude") {
    return taskPrompt || null;
  }

  const parts: string[] = [];
  if (systemPrompt) {
    parts.push(`Follow these session instructions for the rest of this session: ${systemPrompt}`);
  }
  if (taskPrompt) {
    parts.push(taskPrompt);
  }

  return parts.length > 0 ? parts.join("\n\n") : null;
}

export function buildLoopDispatchPrompt(
  runtime: AgentRuntime,
  interval: string,
  loopPrompt: string
): string {
  if (runtime === "claude") {
    return `/loop ${interval} ${loopPrompt}`;
  }

  return [
    "You are running a persistent harness loop.",
    `Repeat this loop every ${interval} until interrupted.`,
    loopPrompt,
  ].join("\n\n");
}

export function isRuntimeProcess(command: string): boolean {
  return (
    /^\d+\.\d+\.\d+$/.test(command) ||
    command === "claude" ||
    command === "codex" ||
    command === "gemini" ||
    command === "node" ||
    command === "bun"
  );
}
