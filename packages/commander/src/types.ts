/**
 * Core types for the commander orchestrator.
 */

import type { AgentName } from "./constants.js";
import type { Issue } from "@harness/github-state";
import type { ModeResult } from "@harness/agent-loop";

// ─── Task ───────────────────────────────────────────────────────────────────

export type TaskSource = "github_issue" | "direct_prompt";

export interface Task {
  /** Unique identifier — Issue number or generated ID for direct prompts. */
  id: string;
  /** Human-readable title. */
  title: string;
  /** Full description / body text. */
  body: string;
  /** Where the task originated. */
  source: TaskSource;
  /** GitHub labels if from an issue. */
  labels: string[];
  /** File paths mentioned or inferred. */
  filePaths: string[];
  /** IDs of tasks that must complete before this one starts. */
  dependsOn: string[];
  /** The GitHub Issue if applicable. */
  issue?: Issue;
}

// ─── Classification ─────────────────────────────────────────────────────────

export interface ClassificationResult {
  /** The agent that should handle this task. */
  agent: AgentName;
  /** Confidence score 0-1. */
  confidence: number;
  /** Which signal(s) drove the classification. */
  signals: ClassificationSignal[];
}

export type ClassificationSignal =
  | { type: "label"; label: string }
  | { type: "file_path"; pattern: string; path: string }
  | { type: "keyword"; keyword: string; matchedIn: "title" | "body" };

// ─── Running Agent ──────────────────────────────────────────────────────────

export type AgentStatus = "running" | "completed" | "failed" | "stuck" | "reassigned";

export interface RunningAgent {
  /** The agent name (matches agents/*.md). */
  agentName: AgentName;
  /** The task assigned to this agent. */
  task: Task;
  /** Current status. */
  status: AgentStatus;
  /** When the agent was dispatched (epoch ms). */
  startedAt: number;
  /** When the agent last reported progress (epoch ms). */
  lastHeartbeat: number;
  /** Number of times this task has been retried. */
  retryCount: number;
  /** Results from the agent loop, populated on completion. */
  results?: ModeResult[];
  /** Error message if failed. */
  error?: string;
}

// ─── Handoff ────────────────────────────────────────────────────────────────

export interface DependencyEdge {
  /** Task ID that must complete first. */
  from: string;
  /** Task ID that depends on it. */
  to: string;
  /** Description of what the dependency provides. */
  provides: string;
}

export interface HandoffTrigger {
  /** The completed task that triggered this handoff. */
  completedTask: Task;
  /** Tasks that are now unblocked. */
  unblockedTasks: Task[];
}

// ─── Investor Update ────────────────────────────────────────────────────────

export interface AgentProgress {
  agent: AgentName;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  summary: string;
}

export interface InvestorUpdate {
  generatedAt: string;
  periodLabel: string;
  agentProgress: AgentProgress[];
  blockers: string[];
  nextPriorities: string[];
  metricsSnapshot: Record<string, number | string>;
}

// ─── Commander State ────────────────────────────────────────────────────────

export interface CommanderState {
  /** All tasks the commander knows about. */
  tasks: Map<string, Task>;
  /** Currently running agents. */
  running: Map<string, RunningAgent>;
  /** Completed task IDs. */
  completed: Set<string>;
  /** Dependency edges. */
  dependencies: DependencyEdge[];
  /** Tick count for the main loop. */
  tick: number;
}

// ─── Commander Events ───────────────────────────────────────────────────────

export type CommanderEvent =
  | { type: "task_ingested"; task: Task }
  | { type: "task_classified"; taskId: string; result: ClassificationResult }
  | { type: "agent_dispatched"; taskId: string; agent: AgentName }
  | { type: "agent_completed"; taskId: string; agent: AgentName }
  | { type: "agent_failed"; taskId: string; agent: AgentName; error: string }
  | { type: "agent_stuck"; taskId: string; agent: AgentName }
  | { type: "agent_reassigned"; taskId: string; fromAgent: AgentName; toAgent: AgentName }
  | { type: "handoff_triggered"; trigger: HandoffTrigger }
  | { type: "update_sent"; update: InvestorUpdate }
  | { type: "loop_tick"; tick: number }
  | { type: "loop_stopped"; reason: string };

export type CommanderEventSink = (event: CommanderEvent) => void;
