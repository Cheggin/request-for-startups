/** A single ledger entry representing one agent task execution */
export interface LedgerEntry {
  agent: string;
  feature: string;
  timestamp: string;
  turnsUsed: number;
  maxTurns: number;
  costUsd: number;
  durationMs: number;
  errors: number;
  retries: number;
  hitBudgetLimit: boolean;
  qualityScore?: number;
  model?: string;
}

/** Aggregated metrics for a single agent */
export interface AgentMetrics {
  agent: string;
  taskCount: number;
  avgTurnsPerTask: number;
  avgCostPerTask: number;
  avgDurationMs: number;
  errorRate: number;
  retryRate: number;
  budgetHitRate: number;
  avgMaxTurns: number;
  avgQualityScore: number | null;
  currentModel: string | null;
}

/** Types of recommendations the optimizer can make */
export type RecommendationType =
  | "add_hooks"
  | "upgrade_model"
  | "downgrade_model";

/** A single recommendation with evidence */
export interface Recommendation {
  type: RecommendationType;
  agent: string;
  description: string;
  confidence: number;
  evidence: string[];
  suggestedChange: Record<string, unknown>;
}

/** Agent config shape matching .harness/agents/*.json */
export interface AgentConfig {
  name: string;
  description?: string;
  category?: string;
  mcpServers?: Record<string, unknown>;
  allowedTools?: string[];
  fileScope?: Record<string, unknown>;
  hooks?: Record<string, unknown>;
  rules?: string[];
  [key: string]: unknown;
}
