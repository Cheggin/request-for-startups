/**
 * harness status — comprehensive overview of everything.
 *
 * Shows: phase, agents, features, costs, running processes, recent updates.
 */

import { loadState } from "../lib/state.js";
import { loadAgents } from "../lib/config.js";
import { listPanes, isTmuxAvailable } from "../lib/tmux.js";
import {
  heading,
  subheading,
  phaseLabel,
  statusDot,
  table,
  count,
  formatCost,
  timeAgo,
  muted,
  success,
  warn,
} from "../lib/format.js";

export function run(_args: string[]): void {
  console.log(heading("harness status"));

  const state = loadState();
  const agents = loadAgents();

  // ─── Phase ──────────────────────────────────────────────────────────────
  console.log(`  Phase:          ${phaseLabel(state.phase)}`);
  console.log(`  Initialized:    ${timeAgo(state.initializedAt)}`);
  console.log(`  Last activity:  ${timeAgo(state.lastActivityAt)}`);
  console.log(`  Total cost:     ${formatCost(state.totalCostUsd)}`);
  console.log(`  Completed loops: ${state.completedLoops}`);
  console.log();

  // ─── Running Agents ─────────────────────────────────────────────────────
  console.log(subheading("  Running Agents"));
  if (isTmuxAvailable()) {
    const panes = listPanes();
    if (panes.length === 0) {
      console.log(muted("  No agents currently running in tmux.\n"));
    } else {
      const rows = panes.map((p) => [
        `  ${statusDot(p.active ? "running" : "idle")} ${p.name}`,
        p.active ? success("running") : muted("idle"),
        `pid:${p.pid}`,
      ]);
      console.log(table(rows));
      console.log();
    }
  } else {
    console.log(muted("  tmux not available — cannot show running agents.\n"));
  }

  // ─── Agent Definitions ──────────────────────────────────────────────────
  console.log(subheading("  Agent Catalog"));
  if (agents.length === 0) {
    console.log(muted("  No agent definitions found.\n"));
  } else {
    const agentRows = agents.map((a) => {
      const stateAgent = state.agents.find((sa) => sa.name === a.name);
      const status = stateAgent?.status ?? "idle";
      const task = stateAgent?.currentTask ?? "-";
      return [
        `  ${statusDot(status)} ${a.name}`,
        a.model,
        `L${a.level}`,
        task.length > 40 ? task.slice(0, 37) + "..." : task,
      ];
    });
    console.log(table(agentRows, ["  Agent", "Model", "Level", "Current Task"]));
    console.log();
  }

  // ─── Features ───────────────────────────────────────────────────────────
  console.log(subheading("  Features"));
  if (state.features.length === 0) {
    console.log(muted("  No features tracked yet.\n"));
  } else {
    const statusCounts: Record<string, number> = {};
    for (const f of state.features) {
      statusCounts[f.status] = (statusCounts[f.status] ?? 0) + 1;
    }
    const summary = Object.entries(statusCounts)
      .map(([s, c]) => `${c} ${s}`)
      .join(", ");
    console.log(`  ${count(state.features.length, "feature")}: ${summary}`);

    const featureRows = state.features.slice(0, 10).map((f) => [
      `  ${statusDot(f.status)} ${f.name}`,
      f.status,
      f.assignee ?? muted("unassigned"),
      timeAgo(f.updatedAt),
    ]);
    console.log(
      table(featureRows, ["  Feature", "Status", "Assignee", "Updated"])
    );
    if (state.features.length > 10) {
      console.log(muted(`  ... and ${state.features.length - 10} more`));
    }
    console.log();
  }

  // ─── Cost Breakdown ─────────────────────────────────────────────────────
  if (state.agents.some((a) => a.totalCostUsd > 0)) {
    console.log(subheading("  Cost Breakdown"));
    const costRows = state.agents
      .filter((a) => a.totalCostUsd > 0)
      .sort((a, b) => b.totalCostUsd - a.totalCostUsd)
      .map((a) => [
        `  ${a.name}`,
        formatCost(a.totalCostUsd),
        `${a.totalTurns} turns`,
      ]);
    console.log(table(costRows, ["  Agent", "Cost", "Turns"]));
    console.log();
  }
}
