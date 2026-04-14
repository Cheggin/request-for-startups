/**
 * Task classifier — classifies task size to prevent over-orchestration.
 *
 * From research: trivial tasks skip orchestration entirely.
 * Uses heuristics: file count, line estimate, keyword analysis.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export type TaskSize = "trivial" | "moderate" | "complex";

/** Max file count for trivial tasks */
const TRIVIAL_MAX_FILES = 1;

/** Max line estimate for trivial tasks */
const TRIVIAL_MAX_LINES = 50;

/** Max file count for moderate tasks */
const MODERATE_MAX_FILES = 5;

/** Max line estimate for moderate tasks */
const MODERATE_MAX_LINES = 500;

/** Keywords that force a task to at least "moderate" */
const MODERATE_KEYWORDS: string[] = [
  "refactor",
  "feature",
  "implement",
  "add endpoint",
  "new component",
  "test suite",
  "integration",
];

/** Keywords that force a task to "complex" */
const COMPLEX_KEYWORDS: string[] = [
  "architecture",
  "migration",
  "redesign",
  "multi-service",
  "distributed",
  "overhaul",
  "rewrite",
  "system design",
  "cross-cutting",
  "monorepo",
];

/** Keywords that force a task to "trivial" (override moderate metrics) */
const TRIVIAL_KEYWORDS: string[] = [
  "typo",
  "fix import",
  "rename",
  "update comment",
  "remove unused",
  "bump version",
  "fix lint",
];

// ─── Classifier ─────────────────────────────────────────────────────────────

function matchesKeyword(description: string, keywords: string[]): boolean {
  const lower = description.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

/**
 * Classify a task as trivial, moderate, or complex based on description,
 * file count, and estimated line count.
 *
 * Priority order:
 * 1. Complex keywords always win (unless overridden by complex metrics too)
 * 2. Metric-based complexity (>5 files or >500 lines) = complex
 * 3. Trivial keywords can force trivial (but not override complex metrics)
 * 4. Moderate keywords force at least moderate
 * 5. Metric-based fallback
 */
export function classifyTask(
  description: string,
  fileCount: number,
  lineEstimate: number,
): TaskSize {
  // Step 1: Check complex keywords first (highest priority keyword)
  if (matchesKeyword(description, COMPLEX_KEYWORDS)) {
    // Complex keywords override everything except when metrics are also complex
    // (which just reinforces the classification)
    return "complex";
  }

  // Step 2: Metric-based complexity check (>5 files or >500 lines)
  if (fileCount > MODERATE_MAX_FILES || lineEstimate > MODERATE_MAX_LINES) {
    return "complex";
  }

  // Step 3: Trivial keywords can force trivial (metrics not complex at this point)
  if (matchesKeyword(description, TRIVIAL_KEYWORDS)) {
    return "trivial";
  }

  // Step 4: Moderate keywords force at least moderate
  if (matchesKeyword(description, MODERATE_KEYWORDS)) {
    return "moderate";
  }

  // Step 5: Metric-based fallback
  if (fileCount <= TRIVIAL_MAX_FILES && lineEstimate <= TRIVIAL_MAX_LINES) {
    return "trivial";
  }

  if (fileCount <= MODERATE_MAX_FILES && lineEstimate <= MODERATE_MAX_LINES) {
    return "moderate";
  }

  return "complex";
}
