/**
 * Core types for the agent loop runtime.
 */

// ─── Agent Definition (parsed from agents/*.md frontmatter) ──────────────────

export interface AgentDefinition {
  /** Agent name, e.g. "backend" */
  name: string;
  /** Model identifier, e.g. "claude-sonnet-4-6" */
  model: string;
  /** Agent level in the hierarchy (1 = commander, 2 = specialist) */
  level: number;
  /** Tools this agent must never use */
  disallowedTools: string[];
  /** Max turns before forced stop */
  maxTurns: number;
  /** Raw body content (the prompt) */
  body: string;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export interface LoadedSkill {
  /** Filename without extension */
  name: string;
  /** Full skill content */
  content: string;
  /** Source directory (category or "shared") */
  source: string;
}

// ─── Mode Cycle ──────────────────────────────────────────────────────────────

export type ModeName = "research" | "plan" | "build" | "verify";

export interface ModeResult {
  mode: ModeName;
  /** 0-100 progress percentage */
  progress: number;
  /** Human-readable summary of what happened */
  summary: string;
  /** Whether the mode completed successfully */
  completed: boolean;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export interface ToolCallContext {
  toolName: string;
  args: Record<string, unknown>;
  agentName: string;
}

export interface BeforeToolCallResult {
  /** If true, block the tool call */
  block: boolean;
  /** Reason for blocking */
  reason?: string;
}

export interface AfterToolCallResult {
  /** Output from the tool */
  output: string;
  /** Whether the tool call errored */
  isError: boolean;
}

export interface HookSet {
  beforeToolCall: Array<
    (ctx: ToolCallContext) => BeforeToolCallResult | undefined
  >;
  afterToolCall: Array<
    (ctx: ToolCallContext, result: AfterToolCallResult) => AfterToolCallResult
  >;
}

// ─── Plateau Detection ───────────────────────────────────────────────────────

export type PlateauSignal = "ok" | "stuck" | "plateau";

export interface ProgressEntry {
  iteration: number;
  progress: number;
  timestamp: number;
}

// ─── Error Classification ────────────────────────────────────────────────────

export type ErrorSeverity = "FATAL" | "TRANSIENT" | "UNKNOWN";

export interface ClassifiedError {
  severity: ErrorSeverity;
  message: string;
  /** Whether the caller should retry */
  shouldRetry: boolean;
  /** Max retries (0 for FATAL) */
  maxRetries: number;
}

// ─── Loop Configuration ──────────────────────────────────────────────────────

export interface LoopConfig {
  /** Path to agents directory */
  agentsDir: string;
  /** Path to skills directory */
  skillsDir: string;
  /** Custom mode sequence (default: research -> plan -> build -> verify) */
  modes?: ModeName[];
  /** Override max turns from agent definition */
  maxTurns?: number;
  /** Budget in dollars (optional) */
  budgetUsd?: number;
  /** Working directory for the subprocess */
  cwd?: string;
  /** Task instruction to give the agent */
  task: string;
}

// ─── Loop Events ─────────────────────────────────────────────────────────────

export type LoopEvent =
  | { type: "loop_start"; agent: string; task: string }
  | { type: "mode_start"; mode: ModeName }
  | { type: "mode_end"; result: ModeResult }
  | { type: "tool_blocked"; toolName: string; reason: string }
  | { type: "tool_executed"; toolName: string; output: string; isError: boolean }
  | { type: "plateau_detected"; signal: PlateauSignal; progress: number }
  | { type: "error_classified"; error: ClassifiedError }
  | { type: "turn"; turn: number; maxTurns: number }
  | { type: "subprocess_output"; data: string }
  | { type: "loop_end"; reason: string; totalTurns: number };
