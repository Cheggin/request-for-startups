/**
 * @harness/status-dashboard — Simple terminal status display.
 *
 * Reads harness state from the filesystem and prints a formatted overview.
 * Keeps it simple: ANSI colors, formatted tables, no TUI library.
 */

import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";

// --- ANSI color constants ---

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";
const WHITE = "\x1b[37m";

// --- Types ---

export interface AgentStatus {
  name: string;
  state: "running" | "idle" | "stopped" | "error";
  currentTask: string;
  tokenSpend: number;
}

export interface FeatureProgress {
  name: string;
  category: string;
  done: number;
  total: number;
  status: string;
}

export interface InvestorUpdate {
  date: string;
  title: string;
  status: "sent" | "draft" | "pending";
}

export interface CostSummary {
  totalTokens: number;
  totalCostUsd: number;
  byAgent: Record<string, number>;
}

export interface DashboardState {
  phase: string;
  phaseProgress: number;
  agents: AgentStatus[];
  features: FeatureProgress[];
  investorUpdates: InvestorUpdate[];
  cost: CostSummary;
}

// --- State readers ---

/**
 * Parse feature progress from features/*.md files.
 * Counts checked vs unchecked checklist items.
 */
export async function readFeatureProgress(root: string): Promise<FeatureProgress[]> {
  const featuresDir = join(root, "features");
  const features: FeatureProgress[] = [];

  let files: string[];
  try {
    files = await readdir(featuresDir);
  } catch {
    return features;
  }

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const content = await readFile(join(featuresDir, file), "utf-8");
    const lines = content.split("\n");

    const name = lines[0]?.replace(/^#\s*/, "").trim() ?? file.replace(".md", "");
    const categoryMatch = content.match(/\*\*Category:\*\*\s*(\w+)/);
    const category = categoryMatch?.[1] ?? "uncategorized";
    const statusMatch = content.match(/\*\*Status:\*\*\s*(.+)/);
    const status = statusMatch?.[1]?.trim() ?? "unknown";

    const checked = (content.match(/- \[x\]/gi) ?? []).length;
    const unchecked = (content.match(/- \[ \]/g) ?? []).length;
    const total = checked + unchecked;

    features.push({ name, category, done: checked, total, status });
  }

  return features;
}

/**
 * Read agent status from .harness/agents/ directory.
 */
export async function readAgentStatuses(root: string): Promise<AgentStatus[]> {
  const agentsDir = join(root, ".harness", "agents");
  const agents: AgentStatus[] = [];

  let files: string[];
  try {
    files = await readdir(agentsDir);
  } catch {
    return agents;
  }

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    try {
      const content = await readFile(join(agentsDir, file), "utf-8");
      const data = JSON.parse(content) as Partial<AgentStatus>;
      agents.push({
        name: data.name ?? file.replace(".json", ""),
        state: data.state ?? "idle",
        currentTask: data.currentTask ?? "",
        tokenSpend: data.tokenSpend ?? 0,
      });
    } catch {
      // Skip malformed agent files
    }
  }

  return agents;
}

/**
 * Read cost summary from .harness/cost.json if it exists.
 */
export async function readCostSummary(root: string): Promise<CostSummary> {
  const costFile = join(root, ".harness", "cost.json");
  try {
    const content = await readFile(costFile, "utf-8");
    return JSON.parse(content) as CostSummary;
  } catch {
    return { totalTokens: 0, totalCostUsd: 0, byAgent: {} };
  }
}

// --- Formatters ---

function progressBar(done: number, total: number, width: number = 20): string {
  if (total === 0) return DIM + "[" + " ".repeat(width) + "]" + RESET;
  const filled = Math.round((done / total) * width);
  const empty = width - filled;
  const color = done === total ? GREEN : done > 0 ? YELLOW : RED;
  return `${color}[${"#".repeat(filled)}${DIM}${".".repeat(empty)}${RESET}${color}]${RESET}`;
}

function stateColor(state: AgentStatus["state"]): string {
  switch (state) {
    case "running":
      return GREEN;
    case "idle":
      return YELLOW;
    case "stopped":
      return DIM;
    case "error":
      return RED;
  }
}

function padRight(str: string, len: number): string {
  // Strip ANSI codes for length calculation
  const stripped = str.replace(/\x1b\[[0-9;]*m/g, "");
  const pad = Math.max(0, len - stripped.length);
  return str + " ".repeat(pad);
}

function sectionHeader(title: string): string {
  return `\n${BOLD}${CYAN}--- ${title} ---${RESET}\n`;
}

// --- Main renderer ---

/**
 * Render the full dashboard status to a formatted string.
 * Designed for terminal output with ANSI colors.
 */
export function renderDashboard(state: DashboardState): string {
  const lines: string[] = [];

  // Header
  lines.push(`${BOLD}${WHITE}Startup Harness Status${RESET}`);
  lines.push(`${DIM}${"=".repeat(50)}${RESET}`);

  // Phase
  lines.push(sectionHeader("Current Phase"));
  lines.push(
    `  ${BOLD}${state.phase}${RESET}  ${progressBar(state.phaseProgress, 100, 30)} ${state.phaseProgress}%`
  );

  // Agents
  if (state.agents.length > 0) {
    lines.push(sectionHeader("Agents"));
    for (const agent of state.agents) {
      const color = stateColor(agent.state);
      const stateLabel = padRight(`${color}${agent.state}${RESET}`, 16);
      const task = agent.currentTask ? `${DIM}${agent.currentTask}${RESET}` : `${DIM}idle${RESET}`;
      lines.push(`  ${padRight(agent.name, 14)} ${stateLabel} ${task}`);
    }
  }

  // Features
  if (state.features.length > 0) {
    lines.push(sectionHeader("Feature Progress"));

    // Group by category
    const byCategory = new Map<string, FeatureProgress[]>();
    for (const f of state.features) {
      const list = byCategory.get(f.category) ?? [];
      list.push(f);
      byCategory.set(f.category, list);
    }

    for (const [category, feats] of byCategory) {
      const catDone = feats.reduce((sum, f) => sum + f.done, 0);
      const catTotal = feats.reduce((sum, f) => sum + f.total, 0);
      lines.push(`  ${BOLD}${MAGENTA}${category}${RESET} ${progressBar(catDone, catTotal, 15)} ${catDone}/${catTotal}`);

      for (const f of feats) {
        const pct = f.total > 0 ? Math.round((f.done / f.total) * 100) : 0;
        lines.push(`    ${padRight(f.name, 30)} ${progressBar(f.done, f.total, 10)} ${f.done}/${f.total} (${pct}%)`);
      }
    }
  }

  // Investor Updates
  if (state.investorUpdates.length > 0) {
    lines.push(sectionHeader("Recent Investor Updates"));
    const recent = state.investorUpdates.slice(0, 5);
    for (const update of recent) {
      const statusColor = update.status === "sent" ? GREEN : update.status === "draft" ? YELLOW : DIM;
      lines.push(`  ${DIM}${update.date}${RESET}  ${statusColor}[${update.status}]${RESET}  ${update.title}`);
    }
  }

  // Cost
  lines.push(sectionHeader("Cost Summary"));
  lines.push(`  Total tokens: ${BOLD}${state.cost.totalTokens.toLocaleString()}${RESET}`);
  lines.push(`  Total cost:   ${BOLD}$${state.cost.totalCostUsd.toFixed(2)}${RESET}`);

  if (Object.keys(state.cost.byAgent).length > 0) {
    lines.push(`  ${DIM}By agent:${RESET}`);
    for (const [agent, tokens] of Object.entries(state.cost.byAgent)) {
      lines.push(`    ${padRight(agent, 14)} ${tokens.toLocaleString()} tokens`);
    }
  }

  lines.push(`\n${DIM}${"=".repeat(50)}${RESET}`);
  return lines.join("\n");
}

/**
 * Read all state from the filesystem and render the dashboard.
 * This is the main entry point — call with the project root path.
 */
export async function renderStatus(root: string): Promise<string> {
  const [features, agents, cost] = await Promise.all([
    readFeatureProgress(root),
    readAgentStatuses(root),
    readCostSummary(root),
  ]);

  // Determine phase from feature progress
  const totalDone = features.reduce((s, f) => s + f.done, 0);
  const totalItems = features.reduce((s, f) => s + f.total, 0);
  const overallPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  let phase = "Phase 1: Foundation";
  if (overallPct > 75) phase = "Phase 4: Evolution";
  else if (overallPct > 50) phase = "Phase 3: Scale";
  else if (overallPct > 25) phase = "Phase 2: Quality";

  const state: DashboardState = {
    phase,
    phaseProgress: overallPct,
    agents,
    features,
    investorUpdates: [], // Read from .harness/updates/ if exists
    cost,
  };

  return renderDashboard(state);
}
