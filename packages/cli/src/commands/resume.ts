/**
 * harness resume — continue from where we left off.
 *
 * Reads .harness/state.json, determines current phase,
 * and calls init with --resume-from to skip completed phases.
 * Does NOT use --force — preserves existing artifacts.
 */

import { loadState } from "../lib/state.js";
import { heading, phaseLabel, success, warn, muted } from "../lib/format.js";
import { run as runInit } from "./init.js";

export function run(args: string[]): void {
  console.log(heading("harness resume"));

  const state = loadState();
  const phase = state.phase;

  console.log(`  Current phase: ${phaseLabel(phase)}`);
  console.log(`  Last activity: ${state.lastActivityAt}`);
  console.log();

  if (phase === "onboarding") {
    console.log(muted("  Not initialized yet. Running 'harness init' instead."));
    runInit([]);
    return;
  }

  if (phase === "complete") {
    console.log(success("  Startup is complete! Nothing to resume."));
    console.log(muted("  Use 'harness status' to see the current state."));
    return;
  }

  // Resume from the current phase — skip completed phases, keep artifacts
  console.log(muted(`  Resuming from phase: ${phase}`));
  console.log(muted("  Completed phases will be skipped. Existing artifacts preserved."));
  console.log();

  // Pass --resume-from without --force so init skips completed work
  runInit([`--resume-from=${phase}`]);
}
