/**
 * Investor Update — synthesizes progress across all agents into a structured
 * Slack update using block kit format.
 *
 * Gathers per-agent metrics from CommanderState, formats into Slack blocks
 * ready to be posted via the Slack plugin.
 */

import type {
  AgentProgress,
  InvestorUpdate,
  CommanderState,
  RunningAgent,
} from "./types.js";
import { AGENT_NAMES, type AgentName } from "./constants.js";

// ─── Progress Gathering ─────────────────────────────────────────────────────

/**
 * Aggregate task counts per agent from the running map.
 */
export function gatherAgentProgress(state: CommanderState): AgentProgress[] {
  const agentStats = new Map<
    AgentName,
    { completed: number; inProgress: number; failed: number }
  >();

  for (const [, agent] of state.running) {
    const stats = agentStats.get(agent.agentName) ?? {
      completed: 0,
      inProgress: 0,
      failed: 0,
    };

    switch (agent.status) {
      case "completed":
        stats.completed++;
        break;
      case "running":
        stats.inProgress++;
        break;
      case "failed":
        stats.failed++;
        break;
      // stuck and reassigned count as in-progress for reporting
      case "stuck":
      case "reassigned":
        stats.inProgress++;
        break;
    }

    agentStats.set(agent.agentName, stats);
  }

  const progress: AgentProgress[] = [];
  for (const [agent, stats] of agentStats) {
    progress.push({
      agent,
      tasksCompleted: stats.completed,
      tasksInProgress: stats.inProgress,
      tasksFailed: stats.failed,
      summary: buildAgentSummary(agent, stats),
    });
  }

  return progress;
}

function buildAgentSummary(
  agent: AgentName,
  stats: { completed: number; inProgress: number; failed: number }
): string {
  const parts: string[] = [];
  if (stats.completed > 0) parts.push(`${stats.completed} done`);
  if (stats.inProgress > 0) parts.push(`${stats.inProgress} active`);
  if (stats.failed > 0) parts.push(`${stats.failed} failed`);
  return parts.length > 0 ? `${agent}: ${parts.join(", ")}` : `${agent}: idle`;
}

// ─── Update Builder ─────────────────────────────────────────────────────────

export interface UpdateOptions {
  blockers?: string[];
  nextPriorities?: string[];
  metricsSnapshot?: Record<string, number | string>;
  periodLabel?: string;
}

/**
 * Build a full investor update from commander state.
 */
export function buildInvestorUpdate(
  state: CommanderState,
  options: UpdateOptions = {}
): InvestorUpdate {
  return {
    generatedAt: new Date().toISOString(),
    periodLabel: options.periodLabel ?? "Current Sprint",
    agentProgress: gatherAgentProgress(state),
    blockers: options.blockers ?? [],
    nextPriorities: options.nextPriorities ?? [],
    metricsSnapshot: options.metricsSnapshot ?? {},
  };
}

// ─── Slack Block Formatting ─────────────────────────────────────────────────

interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  fields?: { type: string; text: string }[];
  elements?: { type: string; text: string }[];
}

/**
 * Format an InvestorUpdate into Slack Block Kit blocks.
 * Ready to be passed to chat.postMessage via the Slack plugin.
 */
export function formatSlackBlocks(update: InvestorUpdate): SlackBlock[] {
  const blocks: SlackBlock[] = [];

  // Header
  blocks.push({
    type: "header",
    text: {
      type: "plain_text",
      text: `Agent Status Update - ${update.periodLabel}`,
      emoji: true,
    },
  });

  // Divider
  blocks.push({ type: "divider" });

  // Per-agent progress sections
  for (const ap of update.agentProgress) {
    const emoji = ap.tasksFailed > 0 ? "!!!" : ap.tasksInProgress > 0 ? ">>>" : "+++";
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${ap.agent.toUpperCase()}* ${emoji}\n${ap.summary}`,
      },
      fields: [
        { type: "mrkdwn", text: `*Done:* ${ap.tasksCompleted}` },
        { type: "mrkdwn", text: `*Active:* ${ap.tasksInProgress}` },
        { type: "mrkdwn", text: `*Failed:* ${ap.tasksFailed}` },
      ],
    });
  }

  // Blockers
  if (update.blockers.length > 0) {
    blocks.push({ type: "divider" });
    const blockerText = update.blockers.map((b) => `- ${b}`).join("\n");
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Blockers*\n${blockerText}`,
      },
    });
  }

  // Next priorities
  if (update.nextPriorities.length > 0) {
    blocks.push({ type: "divider" });
    const priorityText = update.nextPriorities.map((p) => `- ${p}`).join("\n");
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Next Priorities*\n${priorityText}`,
      },
    });
  }

  // Metrics snapshot
  if (Object.keys(update.metricsSnapshot).length > 0) {
    blocks.push({ type: "divider" });
    const metricsFields = Object.entries(update.metricsSnapshot).map(
      ([key, value]) => ({
        type: "mrkdwn" as const,
        text: `*${key}:* ${value}`,
      })
    );
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: "*Metrics*" },
      fields: metricsFields,
    });
  }

  // Timestamp footer
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Generated at ${update.generatedAt}`,
      },
    ],
  });

  return blocks;
}
