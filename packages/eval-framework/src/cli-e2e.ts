#!/usr/bin/env bun
/**
 * CLI: Run E2E evals (diff-gated).
 * Tier 2 — actually executes tests via bun test / vitest / playwright.
 *
 * Fixes #7: no longer a placeholder pass-through.
 */

import * as path from "path";
import { execSync } from "child_process";
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
  const startTime = Date.now();

  try {
    // Try multiple test runners in order of preference
    const testCommands = [
      `bun test ${entry.path} 2>&1`,
      `npx vitest run ${entry.path} --reporter=verbose 2>&1`,
      `npx playwright test ${entry.path} 2>&1`,
    ];

    let testOutput = "";
    let passed = false;

    for (const cmd of testCommands) {
      try {
        testOutput = execSync(cmd, {
          encoding: "utf-8",
          timeout: 120000, // 2 min per eval
          cwd: projectRoot,
        });
        passed = true;
        break; // first successful runner wins
      } catch (e: any) {
        testOutput = e.stdout || e.stderr || String(e);
        // Check if this runner just isn't installed vs actual test failure
        if (testOutput.includes("not found") || testOutput.includes("Cannot find")) {
          continue; // try next runner
        }
        passed = false;
        break; // real test failure
      }
    }

    const durationMs = Date.now() - startTime;

    collector.addEntry({
      skill_name: entry.name,
      tier: "e2e",
      result: passed ? "pass" : "fail",
      metrics: { cost_usd: 0, turns: 0, duration_ms: durationMs },
      details: {
        output: testOutput.slice(-2000), // last 2KB of output
        runner: "auto-detected",
      },
    });

    console.error(`  ${passed ? "PASS" : "FAIL"} (${durationMs}ms)`);
  } catch (e) {
    const durationMs = Date.now() - startTime;
    collector.addEntry({
      skill_name: entry.name,
      tier: "e2e",
      result: "error",
      metrics: { cost_usd: 0, turns: 0, duration_ms: durationMs },
      details: { error: String(e) },
    });
    console.error(`  ERROR: ${e}`);
  }
}

const summaryPath = collector.finalize();
console.error(`\nResults saved to: ${summaryPath}`);

// Exit with failure code if any eval failed
const results = collector.getEntries();
const failures = results.filter((r: any) => r.result !== "pass");
if (failures.length > 0) {
  console.error(`\n${failures.length} eval(s) failed.`);
  process.exit(1);
}
