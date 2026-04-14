/**
 * State — read/write harness state from .harness/state.json.
 *
 * State tracks: current phase, active agents, feature progress,
 * last activity timestamps, and cost tracking.
 *
 * Atomic writes via tmp+rename to prevent corruption.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "fs";
import { dirname, join } from "path";
import { STATE_FILE, HARNESS_DIR, type StartupPhase } from "./constants.js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FeatureState {
  name: string;
  status: "todo" | "in-progress" | "done" | "blocked";
  assignee: string | null;
  issueNumber: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentActivity {
  name: string;
  status: "running" | "idle" | "error";
  currentTask: string | null;
  lastActiveAt: string;
  totalTurns: number;
  totalCostUsd: number;
}

export interface HarnessState {
  /** Current startup phase. */
  phase: StartupPhase;
  /** ISO timestamp of when the harness was initialized. */
  initializedAt: string;
  /** ISO timestamp of last activity. */
  lastActivityAt: string;
  /** Feature tracking. */
  features: FeatureState[];
  /** Agent activity tracking. */
  agents: AgentActivity[];
  /** Total cost across all agents in USD. */
  totalCostUsd: number;
  /** Number of completed agent loops. */
  completedLoops: number;
  /** Arbitrary metadata for resume context. */
  meta: Record<string, unknown>;
}

// ─── Default State ──────────────────────────────────────────────────────────

function defaultState(): HarnessState {
  const now = new Date().toISOString();
  return {
    phase: "onboarding",
    initializedAt: now,
    lastActivityAt: now,
    features: [],
    agents: [],
    totalCostUsd: 0,
    completedLoops: 0,
    meta: {},
  };
}

// ─── Read/Write ─────────────────────────────────────────────────────────────

/**
 * Load harness state. Returns default state if file doesn't exist.
 */
export function loadState(path: string = STATE_FILE): HarnessState {
  if (!existsSync(path)) return defaultState();
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw);
    // Merge with defaults so new fields are always present
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

/**
 * Save harness state atomically (tmp file + rename).
 */
export function saveState(
  state: HarnessState,
  path: string = STATE_FILE
): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const tmpPath = `${path}.tmp.${Date.now()}`;
  writeFileSync(tmpPath, JSON.stringify(state, null, 2) + "\n", "utf-8");
  renameSync(tmpPath, path);
}

/**
 * Update state with a partial update. Reads current, merges, writes back.
 */
export function updateState(
  updates: Partial<HarnessState>,
  path: string = STATE_FILE
): HarnessState {
  const current = loadState(path);
  const next: HarnessState = {
    ...current,
    ...updates,
    lastActivityAt: new Date().toISOString(),
  };
  saveState(next, path);
  return next;
}

// ─── Feature Helpers ────────────────────────────────────────────────────────

/**
 * Add a feature to state.
 */
export function addFeature(
  name: string,
  path: string = STATE_FILE
): FeatureState {
  const state = loadState(path);
  const now = new Date().toISOString();
  const feature: FeatureState = {
    name,
    status: "todo",
    assignee: null,
    issueNumber: null,
    createdAt: now,
    updatedAt: now,
  };
  state.features.push(feature);
  saveState(state, path);
  return feature;
}

/**
 * Update a feature's status or assignee.
 */
export function updateFeature(
  name: string,
  updates: Partial<Pick<FeatureState, "status" | "assignee" | "issueNumber">>,
  path: string = STATE_FILE
): FeatureState | null {
  const state = loadState(path);
  const feature = state.features.find((f) => f.name === name);
  if (!feature) return null;

  if (updates.status !== undefined) feature.status = updates.status;
  if (updates.assignee !== undefined) feature.assignee = updates.assignee;
  if (updates.issueNumber !== undefined) feature.issueNumber = updates.issueNumber;
  feature.updatedAt = new Date().toISOString();

  saveState(state, path);
  return feature;
}

/**
 * Get features filtered by status.
 */
export function getFeaturesByStatus(
  status: FeatureState["status"] | null,
  path: string = STATE_FILE
): FeatureState[] {
  const state = loadState(path);
  if (!status) return state.features;
  return state.features.filter((f) => f.status === status);
}

// ─── Agent Activity Helpers ─────────────────────────────────────────────────

/**
 * Record agent activity.
 */
export function recordAgentActivity(
  name: string,
  activity: Partial<Pick<AgentActivity, "status" | "currentTask" | "totalTurns" | "totalCostUsd">>,
  path: string = STATE_FILE
): void {
  const state = loadState(path);
  let agent = state.agents.find((a) => a.name === name);

  if (!agent) {
    agent = {
      name,
      status: "idle",
      currentTask: null,
      lastActiveAt: new Date().toISOString(),
      totalTurns: 0,
      totalCostUsd: 0,
    };
    state.agents.push(agent);
  }

  if (activity.status !== undefined) agent.status = activity.status;
  if (activity.currentTask !== undefined) agent.currentTask = activity.currentTask;
  if (activity.totalTurns !== undefined) agent.totalTurns = activity.totalTurns;
  if (activity.totalCostUsd !== undefined) agent.totalCostUsd = activity.totalCostUsd;
  agent.lastActiveAt = new Date().toISOString();

  saveState(state, path);
}
