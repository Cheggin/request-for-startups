/**
 * Task router — based on classification, returns execution strategy.
 *
 * - trivial  → direct execution, no agent spawn
 * - moderate → single agent with mode switching
 * - complex  → multi-agent team
 */

import type { TaskSize } from "./classifier.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export type Strategy = "direct" | "single-agent" | "team";

export interface RouteResult {
  strategy: Strategy;
  /** Single agent name for single-agent strategy, null otherwise */
  agent: string | null;
  /** Agent list for team strategy */
  agents?: string[];
  /** Team size for team strategy */
  teamSize?: number;
}

export interface RouteOptions {
  /** Hint for which agent to assign (moderate tasks) */
  agentHint?: string;
  /** Hints for which agents to include (complex tasks) */
  agentHints?: string[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

/** Default agent for moderate tasks when no hint is given */
const DEFAULT_SINGLE_AGENT = "builder";

/** Default team for complex tasks when no hints are given */
const DEFAULT_TEAM = ["builder", "reviewer"];

// ─── Router ─────────────────────────────────────────────────────────────────

/**
 * Given a task classification, return the execution strategy.
 */
export function routeTask(size: TaskSize, options?: RouteOptions): RouteResult {
  switch (size) {
    case "trivial":
      return {
        strategy: "direct",
        agent: null,
      };

    case "moderate":
      return {
        strategy: "single-agent",
        agent: options?.agentHint ?? DEFAULT_SINGLE_AGENT,
      };

    case "complex": {
      let agents: string[];

      if (options?.agentHints && options.agentHints.length > 0) {
        agents = [...options.agentHints];
        // Ensure minimum team size of 2
        if (agents.length < 2) {
          for (const defaultAgent of DEFAULT_TEAM) {
            if (!agents.includes(defaultAgent)) {
              agents.push(defaultAgent);
            }
            if (agents.length >= 2) break;
          }
        }
      } else {
        agents = [...DEFAULT_TEAM];
      }

      return {
        strategy: "team",
        agent: null,
        agents,
        teamSize: agents.length,
      };
    }
  }
}
