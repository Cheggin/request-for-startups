/**
 * pass@k and pass^k calculators for skill evaluation.
 *
 * - pass@k: At least 1 success in k attempts (capability eval).
 *   Answers "can this skill do it at all?"
 *
 * - pass^k: All k trials succeed (regression eval).
 *   Answers "does this skill reliably succeed every time?"
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PassAtKResult {
  /** Probability of at least 1 success in k trials. */
  pass_at_k: number;
  /** Probability that all k trials succeed. */
  pass_pow_k: number;
  /** Number of trials. */
  k: number;
  /** Number of successes observed. */
  successes: number;
  /** Number of failures observed. */
  failures: number;
}

export interface TrialResult {
  pass: boolean;
}

// ---------------------------------------------------------------------------
// Calculators
// ---------------------------------------------------------------------------

/**
 * Calculate pass@k and pass^k from an array of trial results.
 *
 * pass@k uses the unbiased estimator:
 *   pass@k = 1 - C(n-c, k) / C(n, k)
 * where n = total trials, c = successes, k = number of attempts.
 *
 * When k >= n, pass@k = 1 if c > 0, else 0.
 *
 * pass^k is the empirical probability that all k trials succeed:
 *   pass^k = (c/n)^k
 *
 * @param results Array of trial outcomes (must have at least 1 element).
 * @param k Number of attempts to evaluate. Defaults to results.length.
 */
export function passAtK(results: TrialResult[], k?: number): PassAtKResult {
  if (results.length === 0) {
    throw new Error("passAtK requires at least one trial result");
  }

  const n = results.length;
  const c = results.filter((r) => r.pass).length;
  const f = n - c;
  const effectiveK = k ?? n;

  if (effectiveK <= 0) {
    throw new Error("k must be a positive integer");
  }

  // pass@k: unbiased estimator
  let pass_at_k: number;
  if (c === 0) {
    pass_at_k = 0;
  } else if (effectiveK >= n) {
    // If k >= n, we're asking "at least 1 success in n-or-more draws"
    // which is 1 if any success was observed
    pass_at_k = c > 0 ? 1 : 0;
  } else {
    // 1 - C(n-c, k) / C(n, k)
    // Compute in log space to avoid overflow for large n
    pass_at_k = 1 - combinatorialRatio(f, n, effectiveK);
  }

  // pass^k: (c/n)^k — empirical "all succeed" probability
  const successRate = c / n;
  const pass_pow_k = Math.pow(successRate, effectiveK);

  return {
    pass_at_k: clamp01(pass_at_k),
    pass_pow_k: clamp01(pass_pow_k),
    k: effectiveK,
    successes: c,
    failures: f,
  };
}

/**
 * Convenience: compute pass@1 from a results array.
 * Equivalent to passAtK(results, 1).
 */
export function passAt1(results: TrialResult[]): PassAtKResult {
  return passAtK(results, 1);
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Compute C(a, k) / C(b, k) without overflow.
 * Returns the ratio using iterative multiplication to stay in safe float range.
 *
 * C(a, k) / C(b, k) = product_{i=0}^{k-1} (a - i) / (b - i)
 */
function combinatorialRatio(a: number, b: number, k: number): number {
  if (a < k) return 0; // C(a, k) = 0 when a < k
  let ratio = 1;
  for (let i = 0; i < k; i++) {
    ratio *= (a - i) / (b - i);
  }
  return ratio;
}

/** Clamp a number to [0, 1]. */
function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
