import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { MIN_TASKS_FOR_RECOMMENDATION } from "./constants.js";
import type { LedgerEntry, AgentMetrics } from "./types.js";

/**
 * Reads performance data from a directory of ledger JSON files.
 * Each file represents one task execution record.
 */
export async function readPerformanceData(ledgerPath: string): Promise<LedgerEntry[]> {
  const entries: LedgerEntry[] = [];

  let files: string[];
  try {
    files = await readdir(ledgerPath);
  } catch {
    return entries;
  }

  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  for (const file of jsonFiles) {
    try {
      const raw = await readFile(join(ledgerPath, file), "utf-8");
      const parsed = JSON.parse(raw);

      if (isValidLedgerEntry(parsed)) {
        entries.push(parsed);
      }
    } catch {
      // Skip malformed files
    }
  }

  return entries;
}

/**
 * Validates that a parsed object has the required ledger entry fields.
 */
function isValidLedgerEntry(obj: unknown): obj is LedgerEntry {
  if (typeof obj !== "object" || obj === null) return false;
  const record = obj as Record<string, unknown>;

  return (
    typeof record.agent === "string" &&
    typeof record.feature === "string" &&
    typeof record.timestamp === "string" &&
    typeof record.turnsUsed === "number" &&
    typeof record.maxTurns === "number" &&
    typeof record.costUsd === "number" &&
    typeof record.durationMs === "number" &&
    typeof record.errors === "number" &&
    typeof record.retries === "number" &&
    typeof record.hitBudgetLimit === "boolean"
  );
}

/**
 * Computes per-agent metrics from raw ledger entries.
 */
export function computeAgentMetrics(entries: LedgerEntry[]): AgentMetrics[] {
  const byAgent = new Map<string, LedgerEntry[]>();

  for (const entry of entries) {
    const existing = byAgent.get(entry.agent) ?? [];
    existing.push(entry);
    byAgent.set(entry.agent, existing);
  }

  const metrics: AgentMetrics[] = [];

  for (const [agent, agentEntries] of byAgent) {
    const taskCount = agentEntries.length;
    if (taskCount < MIN_TASKS_FOR_RECOMMENDATION) continue;

    const totalTurns = agentEntries.reduce((sum, e) => sum + e.turnsUsed, 0);
    const totalCost = agentEntries.reduce((sum, e) => sum + e.costUsd, 0);
    const totalDuration = agentEntries.reduce((sum, e) => sum + e.durationMs, 0);
    const totalErrors = agentEntries.reduce((sum, e) => sum + e.errors, 0);
    const totalRetries = agentEntries.reduce((sum, e) => sum + e.retries, 0);
    const budgetHits = agentEntries.filter((e) => e.hitBudgetLimit).length;
    const totalMaxTurns = agentEntries.reduce((sum, e) => sum + e.maxTurns, 0);

    const qualityEntries = agentEntries.filter((e) => e.qualityScore != null);
    const avgQuality =
      qualityEntries.length > 0
        ? qualityEntries.reduce((sum, e) => sum + e.qualityScore!, 0) / qualityEntries.length
        : null;

    const models = agentEntries.filter((e) => e.model).map((e) => e.model!);
    const currentModel = models.length > 0 ? mostFrequent(models) : null;

    metrics.push({
      agent,
      taskCount,
      avgTurnsPerTask: totalTurns / taskCount,
      avgCostPerTask: totalCost / taskCount,
      avgDurationMs: totalDuration / taskCount,
      errorRate: totalErrors / taskCount,
      retryRate: totalRetries / taskCount,
      budgetHitRate: budgetHits / taskCount,
      avgMaxTurns: totalMaxTurns / taskCount,
      avgQualityScore: avgQuality,
      currentModel,
    });
  }

  return metrics;
}

/**
 * Returns the most frequently occurring string in an array.
 */
function mostFrequent(arr: string[]): string {
  const counts = new Map<string, number>();
  for (const item of arr) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  let best = arr[0];
  let bestCount = 0;
  for (const [item, count] of counts) {
    if (count > bestCount) {
      best = item;
      bestCount = count;
    }
  }
  return best;
}
