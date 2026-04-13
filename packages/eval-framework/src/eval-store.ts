/**
 * Eval result persistence and regression comparison.
 *
 * Writes timestamped JSONL to .harness/evals/ with structured schema.
 * Auto-compares with previous run and flags regressions.
 */

import * as fs from "fs";
import * as path from "path";
import { spawnSync } from "child_process";

const SCHEMA_VERSION = 1;

// --- Interfaces ---

export interface EvalEntry {
  git_sha: string;
  branch: string;
  timestamp: string;
  skill_name: string;
  tier: "static" | "e2e" | "judge";
  result: "pass" | "fail";
  metrics: {
    cost_usd: number;
    turns: number;
    duration_ms: number;
  };
  /** Additional structured data depending on tier */
  details?: Record<string, unknown>;
  error?: string;
}

export interface EvalRun {
  schema_version: number;
  run_id: string;
  git_sha: string;
  branch: string;
  timestamp: string;
  tier: "static" | "e2e" | "judge" | "all";
  entries: EvalEntry[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    total_cost_usd: number;
    total_duration_ms: number;
  };
}

export interface RegressionDelta {
  skill_name: string;
  tier: string;
  before: "pass" | "fail";
  after: "pass" | "fail";
  status: "improved" | "regressed" | "unchanged";
  cost_delta_usd: number;
  duration_delta_ms: number;
}

export interface ComparisonResult {
  before_run_id: string;
  after_run_id: string;
  deltas: RegressionDelta[];
  regressions: number;
  improvements: number;
  unchanged: number;
}

// --- Git helpers ---

function getGitInfo(cwd?: string): { branch: string; sha: string } {
  try {
    const branch = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd,
      stdio: "pipe",
      timeout: 5000,
    });
    const sha = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd,
      stdio: "pipe",
      timeout: 5000,
    });
    return {
      branch: branch.stdout?.toString().trim() || "unknown",
      sha: sha.stdout?.toString().trim() || "unknown",
    };
  } catch {
    return { branch: "unknown", sha: "unknown" };
  }
}

// --- Eval directory ---

/**
 * Get the eval storage directory path. Creates it if needed.
 */
export function getEvalDir(projectRoot: string): string {
  const dir = path.join(projectRoot, ".harness", "evals");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// --- EvalCollector ---

/**
 * Accumulates eval results during a run, then writes JSONL and summary.
 */
export class EvalCollector {
  private entries: EvalEntry[] = [];
  private tier: "static" | "e2e" | "judge" | "all";
  private projectRoot: string;
  private runId: string;
  private createdAt: number;

  constructor(
    tier: "static" | "e2e" | "judge" | "all",
    projectRoot: string,
  ) {
    this.tier = tier;
    this.projectRoot = projectRoot;
    this.runId = `${tier}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.createdAt = Date.now();
  }

  /**
   * Record a single eval result.
   */
  addEntry(entry: Omit<EvalEntry, "git_sha" | "branch" | "timestamp">): void {
    const git = getGitInfo(this.projectRoot);
    this.entries.push({
      ...entry,
      git_sha: git.sha,
      branch: git.branch,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Finalize the run: write JSONL + summary JSON, print report, compare.
   * Returns the path to the written summary file.
   */
  finalize(): string {
    const git = getGitInfo(this.projectRoot);
    const evalDir = getEvalDir(this.projectRoot);
    const timestamp = new Date().toISOString();
    const dateStr = timestamp.replace(/[:.]/g, "").replace("T", "-").slice(0, 15);
    const safeBranch = git.branch.replace(/[^a-zA-Z0-9._-]/g, "-");

    // Write JSONL (one line per entry)
    const jsonlFile = path.join(evalDir, `${safeBranch}-${this.tier}-${dateStr}.jsonl`);
    const jsonlContent = this.entries
      .map((e) => JSON.stringify(e))
      .join("\n");
    fs.writeFileSync(jsonlFile, jsonlContent + "\n");

    // Build summary
    const passed = this.entries.filter((e) => e.result === "pass").length;
    const failed = this.entries.filter((e) => e.result === "fail").length;
    const totalCost = this.entries.reduce((s, e) => s + e.metrics.cost_usd, 0);
    const totalDuration = this.entries.reduce(
      (s, e) => s + e.metrics.duration_ms,
      0,
    );

    const run: EvalRun = {
      schema_version: SCHEMA_VERSION,
      run_id: this.runId,
      git_sha: git.sha,
      branch: git.branch,
      timestamp,
      tier: this.tier,
      entries: this.entries,
      summary: {
        total: this.entries.length,
        passed,
        failed,
        total_cost_usd: Math.round(totalCost * 100) / 100,
        total_duration_ms: totalDuration,
      },
    };

    // Write summary JSON
    const summaryFile = path.join(
      evalDir,
      `${safeBranch}-${this.tier}-${dateStr}.json`,
    );
    fs.writeFileSync(summaryFile, JSON.stringify(run, null, 2) + "\n");

    // Print summary to stderr
    this.printSummary(run, summaryFile);

    // Auto-compare with previous run
    this.autoCompare(evalDir, summaryFile);

    return summaryFile;
  }

  private printSummary(run: EvalRun, filepath: string): void {
    const lines: string[] = [];
    lines.push("");
    lines.push(
      `Eval Results - ${run.branch} (${run.git_sha}) - ${run.tier}`,
    );
    lines.push("=".repeat(60));

    for (const e of this.entries) {
      const status = e.result === "pass" ? " PASS " : " FAIL ";
      const cost = `$${e.metrics.cost_usd.toFixed(2)}`;
      const dur = `${Math.round(e.metrics.duration_ms / 1000)}s`;
      const name =
        e.skill_name.length > 35
          ? e.skill_name.slice(0, 32) + "..."
          : e.skill_name.padEnd(35);
      lines.push(
        `  ${name}  ${status}  ${cost.padStart(6)}  ${dur.padStart(5)}`,
      );
      if (e.error) {
        lines.push(`       ${e.error.slice(0, 80)}`);
      }
    }

    lines.push("-".repeat(60));
    const { summary: s } = run;
    lines.push(
      `  Total: ${s.passed}/${s.total} passed  $${s.total_cost_usd.toFixed(2)}  ${Math.round(s.total_duration_ms / 1000)}s`,
    );
    lines.push(`  Saved: ${filepath}`);

    process.stderr.write(lines.join("\n") + "\n");
  }

  private autoCompare(evalDir: string, currentFile: string): void {
    try {
      const prevFile = findPreviousRun(
        evalDir,
        this.tier,
        currentFile,
      );
      if (!prevFile) {
        process.stderr.write("\nFirst run - no comparison available.\n");
        return;
      }

      const prevRun: EvalRun = JSON.parse(
        fs.readFileSync(prevFile, "utf-8"),
      );
      const currentRun: EvalRun = JSON.parse(
        fs.readFileSync(currentFile, "utf-8"),
      );
      const comparison = compareRuns(prevRun, currentRun);

      process.stderr.write(formatComparison(comparison) + "\n");
    } catch (err: any) {
      process.stderr.write(`\nCompare error: ${err.message}\n`);
    }
  }
}

// --- Comparison ---

/**
 * Find the most recent prior eval file for comparison.
 */
export function findPreviousRun(
  evalDir: string,
  tier: string,
  excludeFile: string,
): string | null {
  let files: string[];
  try {
    files = fs.readdirSync(evalDir).filter((f) => f.endsWith(".json"));
  } catch {
    return null;
  }

  const entries: Array<{ file: string; timestamp: string }> = [];
  for (const file of files) {
    if (file === path.basename(excludeFile)) continue;
    const fullPath = path.join(evalDir, file);
    try {
      const data = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
      if (data.tier !== tier) continue;
      entries.push({ file: fullPath, timestamp: data.timestamp || "" });
    } catch {
      continue;
    }
  }

  if (entries.length === 0) return null;
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return entries[0].file;
}

/**
 * Compare two eval runs. Matches entries by skill_name + tier.
 */
export function compareRuns(
  before: EvalRun,
  after: EvalRun,
): ComparisonResult {
  const deltas: RegressionDelta[] = [];
  let regressions = 0;
  let improvements = 0;
  let unchanged = 0;

  const beforeMap = new Map<string, EvalEntry>();
  for (const e of before.entries) {
    beforeMap.set(`${e.tier}:${e.skill_name}`, e);
  }

  for (const afterEntry of after.entries) {
    const key = `${afterEntry.tier}:${afterEntry.skill_name}`;
    const beforeEntry = beforeMap.get(key);

    let status: RegressionDelta["status"] = "unchanged";
    if (beforeEntry) {
      if (beforeEntry.result === "fail" && afterEntry.result === "pass") {
        status = "improved";
        improvements++;
      } else if (
        beforeEntry.result === "pass" &&
        afterEntry.result === "fail"
      ) {
        status = "regressed";
        regressions++;
      } else {
        unchanged++;
      }
    } else {
      unchanged++;
    }

    deltas.push({
      skill_name: afterEntry.skill_name,
      tier: afterEntry.tier,
      before: beforeEntry?.result ?? "fail",
      after: afterEntry.result,
      status,
      cost_delta_usd:
        afterEntry.metrics.cost_usd -
        (beforeEntry?.metrics.cost_usd ?? 0),
      duration_delta_ms:
        afterEntry.metrics.duration_ms -
        (beforeEntry?.metrics.duration_ms ?? 0),
    });
  }

  return {
    before_run_id: before.run_id,
    after_run_id: after.run_id,
    deltas,
    regressions,
    improvements,
    unchanged,
  };
}

/**
 * Format a ComparisonResult as a readable string.
 */
export function formatComparison(c: ComparisonResult): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(`vs previous run: ${c.before_run_id}`);
  lines.push("-".repeat(60));

  for (const d of c.deltas) {
    const arrow =
      d.status === "improved" ? "+" : d.status === "regressed" ? "!" : "=";
    const name =
      d.skill_name.length > 30
        ? d.skill_name.slice(0, 27) + "..."
        : d.skill_name.padEnd(30);
    lines.push(
      `  ${arrow} ${name}  ${d.before.padEnd(5)} -> ${d.after.padEnd(5)}`,
    );
  }

  lines.push("-".repeat(60));
  const parts: string[] = [];
  if (c.improvements > 0) parts.push(`${c.improvements} improved`);
  if (c.regressions > 0) parts.push(`${c.regressions} REGRESSED`);
  if (c.unchanged > 0) parts.push(`${c.unchanged} unchanged`);
  lines.push(`  ${parts.join(", ")}`);

  if (c.regressions > 0) {
    lines.push("");
    lines.push(
      "  WARNING: Regressions detected. Investigate before merging.",
    );
  }

  return lines.join("\n");
}
