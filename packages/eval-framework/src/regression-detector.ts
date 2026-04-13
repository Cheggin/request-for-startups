/**
 * Regression detector for eval runs.
 *
 * Compares a current eval run against the most recent previous run
 * stored in .harness/evals/ (JSONL format). Flags:
 *   - Drop in pass@1
 *   - Increase in cost_per_task
 *   - New timeout exits
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Regression {
  metric: string;
  previous: number;
  current: number;
  delta: number;
}

export interface RegressionReport {
  regressions: Regression[];
  previous_run_file: string | null;
  has_regressions: boolean;
}

/** Shape of a single test entry in the eval JSONL files. */
export interface EvalEntry {
  name: string;
  passed: boolean;
  cost_usd: number;
  duration_ms: number;
  exit_reason?: string;
  turns_used?: number;
}

/** Shape of a full eval run file. */
export interface EvalRun {
  timestamp: string;
  tier?: string;
  total_tests: number;
  passed: number;
  failed: number;
  total_cost_usd: number;
  total_duration_ms: number;
  tests: EvalEntry[];
}

// ---------------------------------------------------------------------------
// Eval directory helpers
// ---------------------------------------------------------------------------

const DEFAULT_EVAL_DIR = path.join(process.cwd(), ".harness", "evals");

/**
 * Find the most recent eval run file in the given directory.
 * Supports both JSON (single object) and JSONL (one object per line) formats.
 * Returns null if no files are found.
 */
export function findLatestRun(
  evalDir: string = DEFAULT_EVAL_DIR,
  excludeFile?: string
): string | null {
  let files: string[];
  try {
    files = fs
      .readdirSync(evalDir)
      .filter((f) => f.endsWith(".json") || f.endsWith(".jsonl"));
  } catch {
    return null;
  }

  if (excludeFile) {
    const excludeBase = path.basename(excludeFile);
    files = files.filter((f) => f !== excludeBase);
  }

  if (files.length === 0) return null;

  // Parse timestamps and sort descending
  const entries: Array<{ file: string; timestamp: string }> = [];
  for (const file of files) {
    const fullPath = path.join(evalDir, file);
    try {
      const raw = fs.readFileSync(fullPath, "utf-8").trim();
      // Try JSON first, then first line of JSONL
      const firstLine = raw.split("\n")[0];
      const data = JSON.parse(firstLine);
      if (data.timestamp) {
        entries.push({ file: fullPath, timestamp: data.timestamp });
      }
    } catch {
      continue;
    }
  }

  if (entries.length === 0) return null;

  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return entries[0].file;
}

/**
 * Load an eval run from a JSON file.
 */
export function loadEvalRun(filePath: string): EvalRun {
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  return JSON.parse(raw) as EvalRun;
}

// ---------------------------------------------------------------------------
// Regression detection
// ---------------------------------------------------------------------------

/**
 * Compare a current eval run against the previous one and flag regressions.
 *
 * Detects:
 *   1. Drop in pass@1 (pass rate decreased)
 *   2. Increase in average cost per task
 *   3. New timeout exits (tests that didn't timeout before now do)
 */
export function detectRegressions(
  current: EvalRun,
  previous: EvalRun
): Regression[] {
  const regressions: Regression[] = [];

  // 1. Pass rate (pass@1 proxy)
  const prevPassRate =
    previous.total_tests > 0 ? previous.passed / previous.total_tests : 0;
  const currPassRate =
    current.total_tests > 0 ? current.passed / current.total_tests : 0;

  if (currPassRate < prevPassRate) {
    regressions.push({
      metric: "pass_rate",
      previous: round4(prevPassRate),
      current: round4(currPassRate),
      delta: round4(currPassRate - prevPassRate),
    });
  }

  // 2. Average cost per task
  const prevCostPerTask =
    previous.total_tests > 0
      ? previous.total_cost_usd / previous.total_tests
      : 0;
  const currCostPerTask =
    current.total_tests > 0
      ? current.total_cost_usd / current.total_tests
      : 0;

  if (currCostPerTask > prevCostPerTask * 1.1) {
    // Flag if > 10% increase
    regressions.push({
      metric: "cost_per_task",
      previous: round4(prevCostPerTask),
      current: round4(currCostPerTask),
      delta: round4(currCostPerTask - prevCostPerTask),
    });
  }

  // 3. New timeout exits
  const prevTimeouts = new Set(
    previous.tests
      .filter((t) => t.exit_reason === "timeout")
      .map((t) => t.name)
  );

  const newTimeouts = current.tests.filter(
    (t) => t.exit_reason === "timeout" && !prevTimeouts.has(t.name)
  );

  for (const t of newTimeouts) {
    regressions.push({
      metric: `new_timeout:${t.name}`,
      previous: 0,
      current: t.duration_ms,
      delta: t.duration_ms,
    });
  }

  // 4. Per-test regressions (tests that passed before and now fail)
  const prevByName = new Map(previous.tests.map((t) => [t.name, t]));
  for (const curr of current.tests) {
    const prev = prevByName.get(curr.name);
    if (prev && prev.passed && !curr.passed) {
      regressions.push({
        metric: `test_regression:${curr.name}`,
        previous: 1,
        current: 0,
        delta: -1,
      });
    }
  }

  return regressions;
}

/**
 * Run full regression detection against the latest previous eval run.
 *
 * @param currentRun The current eval run to check.
 * @param evalDir Directory containing eval result files. Default: .harness/evals/
 * @param currentRunFile Path to the current run file (to exclude from comparison).
 */
export function checkForRegressions(
  currentRun: EvalRun,
  evalDir: string = DEFAULT_EVAL_DIR,
  currentRunFile?: string
): RegressionReport {
  const previousFile = findLatestRun(evalDir, currentRunFile);

  if (!previousFile) {
    return {
      regressions: [],
      previous_run_file: null,
      has_regressions: false,
    };
  }

  const previousRun = loadEvalRun(previousFile);
  const regressions = detectRegressions(currentRun, previousRun);

  return {
    regressions,
    previous_run_file: previousFile,
    has_regressions: regressions.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
