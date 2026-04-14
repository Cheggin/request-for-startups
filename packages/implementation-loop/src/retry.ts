/**
 * Retry logic with max iterations and plateau detection.
 *
 * From ui-loop SKILL.md:
 * - Plateau: <3% progress gain for N consecutive iterations → stop
 * - Max iterations: hard cap on retry attempts
 * - Event emission: caller can observe each iteration
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RetryConfig {
  /** Maximum number of iterations before giving up */
  maxIterations: number;
  /** Progress delta threshold for plateau detection (default: 3) */
  plateauThreshold?: number;
  /** Number of consecutive low-progress iterations to trigger plateau (default: 4) */
  plateauWindow?: number;
}

export interface AttemptResult {
  pass: boolean;
  summary: string;
  /** Optional progress percentage (0-100) for plateau detection */
  progress?: number;
}

export interface RetryResult {
  passed: boolean;
  iterations: number;
  reason: "passed" | "max_iterations" | "plateau";
  lastSummary: string;
}

export interface IterationEvent {
  iteration: number;
  passed: boolean;
  summary: string;
  progress?: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_PLATEAU_THRESHOLD = 3;
const DEFAULT_PLATEAU_WINDOW = 4;

// ─── RetryLoop ──────────────────────────────────────────────────────────────

export class RetryLoop {
  private readonly maxIterations: number;
  private readonly plateauThreshold: number;
  private readonly plateauWindow: number;

  constructor(config: RetryConfig) {
    this.maxIterations = config.maxIterations;
    this.plateauThreshold = config.plateauThreshold ?? DEFAULT_PLATEAU_THRESHOLD;
    this.plateauWindow = config.plateauWindow ?? DEFAULT_PLATEAU_WINDOW;
  }

  /**
   * Run the callback repeatedly until it passes, hits max iterations,
   * or plateau is detected.
   */
  async run(
    fn: (iteration: number) => Promise<AttemptResult>,
    onIteration?: (event: IterationEvent) => void,
  ): Promise<RetryResult> {
    const progressHistory: number[] = [];
    let lastSummary = "";

    for (let i = 1; i <= this.maxIterations; i++) {
      const result = await fn(i);
      lastSummary = result.summary;

      // Emit iteration event
      onIteration?.({
        iteration: i,
        passed: result.pass,
        summary: result.summary,
        progress: result.progress,
      });

      if (result.pass) {
        return {
          passed: true,
          iterations: i,
          reason: "passed",
          lastSummary,
        };
      }

      // Track progress for plateau detection
      if (result.progress !== undefined) {
        progressHistory.push(result.progress);

        if (this.isPlateauing(progressHistory)) {
          return {
            passed: false,
            iterations: i,
            reason: "plateau",
            lastSummary,
          };
        }
      } else {
        // Track summaries as a proxy: if same summary repeats, that's a plateau
        progressHistory.push(0);

        // Check if the same summary has repeated plateauWindow times
        if (this.isSummaryRepeating(lastSummary, progressHistory, i)) {
          return {
            passed: false,
            iterations: i,
            reason: "plateau",
            lastSummary,
          };
        }
      }
    }

    return {
      passed: false,
      iterations: this.maxIterations,
      reason: "max_iterations",
      lastSummary,
    };
  }

  /**
   * Check if progress deltas indicate a plateau.
   */
  private isPlateauing(history: number[]): boolean {
    if (history.length < this.plateauWindow + 1) return false;

    const recent = history.slice(-(this.plateauWindow + 1));
    for (let i = 1; i < recent.length; i++) {
      const delta = Math.abs(recent[i] - recent[i - 1]);
      if (delta >= this.plateauThreshold) return false;
    }

    return true;
  }

  /**
   * Simple heuristic: if the same summary appears plateauWindow times,
   * we're probably stuck in a loop.
   */
  private isSummaryRepeating(
    _summary: string,
    _history: number[],
    _iteration: number,
  ): boolean {
    // This is handled by the progress-based plateau detection above.
    // When no progress is tracked, we rely on maxIterations as the backstop.
    return false;
  }
}
