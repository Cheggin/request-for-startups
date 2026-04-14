/**
 * harness resume — continue from where we left off.
 *
 * Reads .harness/state.json, determines current phase,
 * and calls the appropriate phase function directly.
 */

import { loadState, updateState } from "../lib/state.js";
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
    runInit(["--force"]);
    return;
  }

  if (phase === "complete") {
    console.log(success("  Startup is complete! Nothing to resume."));
    console.log(muted("  Use 'harness status' to see the current state."));
    return;
  }

  // Resume by re-running init with a --resume-from flag
  // The init command checks state and skips completed phases
  console.log(muted(`  Resuming from phase: ${phase}`));
  console.log(muted("  Completed phases will be skipped."));
  console.log();

  runInit(["--force", `--resume-from=${phase}`]);
}
