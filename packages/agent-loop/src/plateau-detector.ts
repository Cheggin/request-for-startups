/**
 * Plateau detector — detects stuck/plateau/repetition states.
 *
 * From ui-loop SKILL.md:
 * - <3% progress for 4 consecutive iterations = plateau (stop)
 * - <5% progress for 2 consecutive iterations = stuck (escalate)
 * - Same changes 3 times = repetition (stop)
 */

import type { PlateauSignal, ProgressEntry } from "./types.js";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Progress threshold below which iterations count as "low progress" for plateau detection */
export const PLATEAU_THRESHOLD = 3;

/** Number of consecutive low-progress iterations to trigger plateau */
export const PLATEAU_WINDOW = 4;

/** Progress threshold for stuck detection */
export const STUCK_THRESHOLD = 5;

/** Number of consecutive low-progress iterations to trigger stuck */
export const STUCK_WINDOW = 2;

/** Number of identical outputs to trigger repetition detection */
export const REPETITION_COUNT = 3;

// ─── Detector ────────────────────────────────────────────────────────────────

export class PlateauDetector {
  private entries: ProgressEntry[] = [];
  private recentOutputs: string[] = [];

  /**
   * Record a progress observation and return the current signal.
   */
  record(progress: number, output?: string): PlateauSignal {
    const entry: ProgressEntry = {
      iteration: this.entries.length + 1,
      progress,
      timestamp: Date.now(),
    };
    this.entries.push(entry);
    if (this.entries.length > PLATEAU_WINDOW) {
      this.entries.splice(0, this.entries.length - PLATEAU_WINDOW);
    }

    // Check repetition first (most severe)
    if (output !== undefined) {
      this.recentOutputs.push(output);
      if (this.recentOutputs.length > REPETITION_COUNT) {
        this.recentOutputs.splice(0, this.recentOutputs.length - REPETITION_COUNT);
      }
      if (this.isRepeating()) {
        return "plateau";
      }
    }

    // Check plateau (<3% for 4 consecutive)
    if (this.isPlateau()) {
      return "plateau";
    }

    // Check stuck (<5% for 2 consecutive)
    if (this.isStuck()) {
      return "stuck";
    }

    return "ok";
  }

  /**
   * Compute the progress delta between the last two entries.
   */
  lastDelta(): number {
    if (this.entries.length < 2) return 100;
    const prev = this.entries[this.entries.length - 2];
    const curr = this.entries[this.entries.length - 1];
    return curr.progress - prev.progress;
  }

  /**
   * Check if we're in a plateau state: <3% gain for PLATEAU_WINDOW consecutive iterations.
   */
  private isPlateau(): boolean {
    if (this.entries.length < PLATEAU_WINDOW) return false;

    const recent = this.entries.slice(-PLATEAU_WINDOW);
    for (let i = 1; i < recent.length; i++) {
      const delta = recent[i].progress - recent[i - 1].progress;
      if (delta >= PLATEAU_THRESHOLD) return false;
    }
    return true;
  }

  /**
   * Check if we're stuck: <5% gain for STUCK_WINDOW consecutive iterations.
   */
  private isStuck(): boolean {
    if (this.entries.length < STUCK_WINDOW) return false;

    const recent = this.entries.slice(-STUCK_WINDOW);
    for (let i = 1; i < recent.length; i++) {
      const delta = recent[i].progress - recent[i - 1].progress;
      if (delta >= STUCK_THRESHOLD) return false;
    }
    return true;
  }

  /**
   * Check if the last REPETITION_COUNT outputs are identical.
   */
  private isRepeating(): boolean {
    if (this.recentOutputs.length < REPETITION_COUNT) return false;

    const last = this.recentOutputs.slice(-REPETITION_COUNT);
    return last.every((o) => o === last[0]);
  }

  /**
   * Reset the detector state.
   */
  reset(): void {
    this.entries = [];
    this.recentOutputs = [];
  }

  /**
   * Get all recorded entries (immutable copy).
   */
  getEntries(): readonly ProgressEntry[] {
    return [...this.entries];
  }
}
