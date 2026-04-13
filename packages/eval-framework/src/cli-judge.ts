#!/usr/bin/env bun
/**
 * CLI: Run LLM-as-judge evals.
 * Placeholder for Tier 3 -- uses Anthropic API to score skill quality.
 */

import * as path from "path";
import { autoSelectEvals } from "./touchfiles";
import { EvalCollector } from "./eval-store";

const projectRoot = path.resolve(import.meta.dir, "..", "..", "..");

const selection = autoSelectEvals(projectRoot, { tier: "judge" });

console.error(`Judge eval selection: ${selection.reason}`);
console.error(`  Selected: ${selection.selected.length}`);
console.error(`  Skipped: ${selection.skipped.length}`);

if (selection.selected.length === 0) {
  console.error("\nNo judge evals to run (no matching changes).");
  process.exit(0);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("\nWARNING: ANTHROPIC_API_KEY not set. Judge evals require API access.");
  process.exit(1);
}

const collector = new EvalCollector("judge", projectRoot);

for (const entry of selection.selected) {
  console.error(`\n  Running: ${entry.name}`);
  // Tier 3 placeholder -- actual LLM judge calls will be added later
  collector.addEntry({
    skill_name: entry.name,
    tier: "judge",
    result: "pass",
    metrics: { cost_usd: 0, turns: 0, duration_ms: 0 },
    details: { placeholder: true },
  });
}

const summaryPath = collector.finalize();
console.error(`\nResults saved to: ${summaryPath}`);
