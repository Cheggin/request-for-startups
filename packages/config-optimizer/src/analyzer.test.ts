import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readPerformanceData, computeAgentMetrics } from "./analyzer.js";
import type { LedgerEntry } from "./types.js";

function makeLedgerEntry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    agent: "backend",
    feature: "auth-flow",
    timestamp: "2026-04-10T12:00:00Z",
    turnsUsed: 30,
    maxTurns: 200,
    costUsd: 1.5,
    durationMs: 120000,
    errors: 0,
    retries: 0,
    hitBudgetLimit: false,
    ...overrides,
  };
}

describe("readPerformanceData", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "config-opt-test-"));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("reads valid ledger entries from JSON files", async () => {
    const entry = makeLedgerEntry();
    await writeFile(join(tmpDir, "task-001.json"), JSON.stringify(entry));
    await writeFile(join(tmpDir, "task-002.json"), JSON.stringify(makeLedgerEntry({ feature: "api-keys" })));

    const entries = await readPerformanceData(tmpDir);
    expect(entries).toHaveLength(2);
    expect(entries[0].agent).toBe("backend");
  });

  it("skips malformed JSON files", async () => {
    await writeFile(join(tmpDir, "good.json"), JSON.stringify(makeLedgerEntry()));
    await writeFile(join(tmpDir, "bad.json"), "not json {{{");

    const entries = await readPerformanceData(tmpDir);
    expect(entries).toHaveLength(1);
  });

  it("skips files missing required fields", async () => {
    await writeFile(join(tmpDir, "good.json"), JSON.stringify(makeLedgerEntry()));
    await writeFile(join(tmpDir, "incomplete.json"), JSON.stringify({ agent: "test" }));

    const entries = await readPerformanceData(tmpDir);
    expect(entries).toHaveLength(1);
  });

  it("ignores non-JSON files", async () => {
    await writeFile(join(tmpDir, "notes.txt"), "some notes");
    await writeFile(join(tmpDir, "task.json"), JSON.stringify(makeLedgerEntry()));

    const entries = await readPerformanceData(tmpDir);
    expect(entries).toHaveLength(1);
  });

  it("returns empty array for non-existent directory", async () => {
    const entries = await readPerformanceData("/nonexistent/path");
    expect(entries).toHaveLength(0);
  });
});

describe("computeAgentMetrics", () => {
  it("computes correct averages for a single agent", () => {
    const entries: LedgerEntry[] = [
      makeLedgerEntry({ turnsUsed: 20, costUsd: 1.0, durationMs: 100000, errors: 0, retries: 0 }),
      makeLedgerEntry({ turnsUsed: 40, costUsd: 2.0, durationMs: 200000, errors: 1, retries: 1 }),
      makeLedgerEntry({ turnsUsed: 30, costUsd: 1.5, durationMs: 150000, errors: 0, retries: 0 }),
      makeLedgerEntry({ turnsUsed: 50, costUsd: 2.5, durationMs: 250000, errors: 1, retries: 2 }),
      makeLedgerEntry({ turnsUsed: 10, costUsd: 0.5, durationMs: 50000, errors: 0, retries: 0 }),
    ];

    const metrics = computeAgentMetrics(entries);
    expect(metrics).toHaveLength(1);

    const m = metrics[0];
    expect(m.agent).toBe("backend");
    expect(m.taskCount).toBe(5);
    expect(m.avgTurnsPerTask).toBe(30);
    expect(m.avgCostPerTask).toBe(1.5);
    expect(m.avgDurationMs).toBe(150000);
    expect(m.errorRate).toBeCloseTo(0.4);
    expect(m.retryRate).toBeCloseTo(0.6);
  });

  it("groups metrics by agent", () => {
    const entries: LedgerEntry[] = [
      ...Array.from({ length: 5 }, () => makeLedgerEntry({ agent: "backend" })),
      ...Array.from({ length: 5 }, () => makeLedgerEntry({ agent: "deploy" })),
    ];

    const metrics = computeAgentMetrics(entries);
    expect(metrics).toHaveLength(2);
    expect(metrics.map((m) => m.agent).sort()).toEqual(["backend", "deploy"]);
  });

  it("skips agents with fewer than MIN_TASKS_FOR_RECOMMENDATION tasks", () => {
    const entries: LedgerEntry[] = [
      makeLedgerEntry({ agent: "backend" }),
      makeLedgerEntry({ agent: "backend" }),
    ];

    const metrics = computeAgentMetrics(entries);
    expect(metrics).toHaveLength(0);
  });

  it("computes budget hit rate correctly", () => {
    const entries: LedgerEntry[] = [
      makeLedgerEntry({ hitBudgetLimit: true }),
      makeLedgerEntry({ hitBudgetLimit: true }),
      makeLedgerEntry({ hitBudgetLimit: false }),
      makeLedgerEntry({ hitBudgetLimit: false }),
      makeLedgerEntry({ hitBudgetLimit: false }),
    ];

    const metrics = computeAgentMetrics(entries);
    expect(metrics[0].budgetHitRate).toBeCloseTo(0.4);
  });

  it("computes average quality score when present", () => {
    const entries: LedgerEntry[] = [
      makeLedgerEntry({ qualityScore: 0.8 }),
      makeLedgerEntry({ qualityScore: 0.9 }),
      makeLedgerEntry({ qualityScore: 0.7 }),
      makeLedgerEntry({ qualityScore: 0.6 }),
      makeLedgerEntry({ qualityScore: 1.0 }),
    ];

    const metrics = computeAgentMetrics(entries);
    expect(metrics[0].avgQualityScore).toBeCloseTo(0.8);
  });

  it("returns null quality score when no entries have it", () => {
    const entries = Array.from({ length: 5 }, () => makeLedgerEntry());
    const metrics = computeAgentMetrics(entries);
    expect(metrics[0].avgQualityScore).toBeNull();
  });

  it("identifies most frequent model", () => {
    const entries: LedgerEntry[] = [
      makeLedgerEntry({ model: "sonnet" }),
      makeLedgerEntry({ model: "sonnet" }),
      makeLedgerEntry({ model: "sonnet" }),
      makeLedgerEntry({ model: "opus" }),
      makeLedgerEntry({ model: "opus" }),
    ];

    const metrics = computeAgentMetrics(entries);
    expect(metrics[0].currentModel).toBe("sonnet");
  });
});
