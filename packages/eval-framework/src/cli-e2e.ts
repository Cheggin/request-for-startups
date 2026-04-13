#!/usr/bin/env bun
/**
 * CLI: Run E2E evals (diff-gated).
 * Placeholder for Tier 2 -- runs session-runner based tests.
 */

import * as path from "path";
import { autoSelectEvals } from "./touchfiles";
import { EvalCollector } from "./eval-store";

const projectRoot = path.resolve(import.meta.dir, "..", "..", "..");

const selection = autoSelectEvals(projectRoot, { tier: "e2e" });

console.error(`E2E eval selection: ${selection.reason}`);
console.error(`  Selected: ${selection.selected.length}`);
console.error(`  Skipped: ${selection.skipped.length}`);

if (selection.selected.length === 0) {
  console.error("\nNo E2E evals to run (no matching changes).");
  process.exit(0);
}

const collector = new EvalCollector("e2e", projectRoot);

for (const entry of selection.selected) {
  console.error(`\n  Running: ${entry.name}`);
  // Tier 2 placeholder -- actual test execution will be added later
  collector.addEntry({
    skill_name: entry.name,
    tier: "e2e",
    result: "pass",
    metrics: { cost_usd: 0, turns: 0, duration_ms: 0 },
    details: { placeholder: true },
  });
}

const summaryPath = collector.finalize();
console.error(`\nResults saved to: ${summaryPath}`);
