/**
 * Diff-based test selection for eval tiers.
 *
 * Each eval declares file-glob dependencies ("touchfiles").
 * git diff against base branch determines which evals to run.
 * EVALS_ALL=1 forces a full run regardless of diff.
 */

import { spawnSync } from "child_process";

// --- Glob matching ---

/**
 * Match a file path against a glob pattern.
 * Supports:
 *   ** - match any number of path segments
 *   *  - match within a single segment (no /)
 */
export function matchGlob(file: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, "{{GLOBSTAR}}")
    .replace(/\*/g, "[^/]*")
    .replace(/\{\{GLOBSTAR\}\}/g, ".*");
  return new RegExp(`^${regexStr}$`).test(file);
}

// --- Touchfile registry ---

export interface EvalTouchfileEntry {
  /** Eval/test name */
  name: string;
  /** File glob patterns this eval depends on */
  patterns: string[];
  /** Eval tier */
  tier: "static" | "e2e" | "judge";
  /** Gate or periodic classification */
  gate: "gate" | "periodic";
}

/**
 * Registry of eval touchfiles. Add entries for each eval.
 */
export const EVAL_TOUCHFILES: EvalTouchfileEntry[] = [
  // Tier 1: Static validation
  {
    name: "static:skill-frontmatter",
    patterns: ["skills/**/*.md", "skills/**/SKILL.md"],
    tier: "static",
    gate: "gate",
  },
  {
    name: "static:skill-tools",
    patterns: ["skills/**/*.md", "skills/**/SKILL.md"],
    tier: "static",
    gate: "gate",
  },
  {
    name: "static:skill-cross-refs",
    patterns: ["skills/**/*.md", "skills/**/SKILL.md"],
    tier: "static",
    gate: "gate",
  },

  // Tier 2: E2E (placeholders for future tests)
  {
    name: "e2e:skill-execution",
    patterns: ["skills/**", "packages/eval-framework/src/session-runner.ts"],
    tier: "e2e",
    gate: "periodic",
  },

  // Tier 3: LLM-as-judge (placeholders for future tests)
  {
    name: "judge:skill-quality",
    patterns: ["skills/**/*.md"],
    tier: "judge",
    gate: "periodic",
  },
];

/**
 * Changes to any of these files trigger ALL evals.
 */
export const GLOBAL_TOUCHFILES = [
  "packages/eval-framework/src/session-runner.ts",
  "packages/eval-framework/src/eval-store.ts",
  "packages/eval-framework/src/touchfiles.ts",
  "packages/eval-framework/src/static-validator.ts",
];

// --- Base branch detection ---

/**
 * Detect the base branch by trying refs in order.
 */
export function detectBaseBranch(cwd: string): string | null {
  for (const ref of ["origin/main", "origin/master", "main", "master"]) {
    const result = spawnSync("git", ["rev-parse", "--verify", ref], {
      cwd,
      stdio: "pipe",
      timeout: 3000,
    });
    if (result.status === 0) return ref;
  }
  return null;
}

/**
 * Get list of files changed between base branch and HEAD.
 */
export function getChangedFiles(baseBranch: string, cwd: string): string[] {
  const result = spawnSync("git", ["diff", "--name-only", `${baseBranch}...HEAD`], {
    cwd,
    stdio: "pipe",
    timeout: 5000,
  });
  if (result.status !== 0) return [];
  return result.stdout.toString().trim().split("\n").filter(Boolean);
}

// --- Test selection ---

export interface SelectionResult {
  selected: EvalTouchfileEntry[];
  skipped: EvalTouchfileEntry[];
  reason: string;
  forceAll: boolean;
}

/**
 * Select evals to run based on changed files and optional tier/gate filters.
 *
 * Algorithm:
 * 1. If EVALS_ALL=1 env var is set -> run everything
 * 2. If any changed file matches a global touchfile -> run everything
 * 3. Otherwise, only run evals whose touchfile patterns match changed files
 */
export function selectEvals(
  changedFiles: string[],
  options: {
    tier?: "static" | "e2e" | "judge";
    gate?: "gate" | "periodic";
    forceAll?: boolean;
    entries?: EvalTouchfileEntry[];
  } = {},
): SelectionResult {
  const forceAll = options.forceAll ?? process.env.EVALS_ALL === "1";
  const entries = options.entries ?? EVAL_TOUCHFILES;

  // Apply tier/gate filters
  let filtered = entries;
  if (options.tier) {
    filtered = filtered.filter((e) => e.tier === options.tier);
  }
  if (options.gate) {
    filtered = filtered.filter((e) => e.gate === options.gate);
  }

  // Force all
  if (forceAll) {
    return {
      selected: filtered,
      skipped: [],
      reason: "EVALS_ALL=1",
      forceAll: true,
    };
  }

  // Global touchfile hit -> run all
  for (const file of changedFiles) {
    if (GLOBAL_TOUCHFILES.some((g) => matchGlob(file, g))) {
      return {
        selected: filtered,
        skipped: [],
        reason: `global: ${file}`,
        forceAll: false,
      };
    }
  }

  // Per-eval matching
  const selected: EvalTouchfileEntry[] = [];
  const skipped: EvalTouchfileEntry[] = [];

  for (const entry of filtered) {
    const hit = changedFiles.some((f) =>
      entry.patterns.some((p) => matchGlob(f, p)),
    );
    (hit ? selected : skipped).push(entry);
  }

  return {
    selected,
    skipped,
    reason: selected.length > 0 ? "diff" : "no-changes",
    forceAll: false,
  };
}

/**
 * Convenience: detect base branch, get changed files, select evals.
 */
export function autoSelectEvals(
  cwd: string,
  options: {
    tier?: "static" | "e2e" | "judge";
    gate?: "gate" | "periodic";
  } = {},
): SelectionResult {
  const forceAll = process.env.EVALS_ALL === "1";
  if (forceAll) {
    return selectEvals([], { ...options, forceAll: true });
  }

  const baseBranch = detectBaseBranch(cwd);
  if (!baseBranch) {
    // Cannot detect base branch -> run everything as a safety measure
    return selectEvals([], { ...options, forceAll: true });
  }

  const changedFiles = getChangedFiles(baseBranch, cwd);
  return selectEvals(changedFiles, options);
}
