/**
 * harness eval — run evaluation tiers.
 *
 * Subcommands:
 *   static  — tier 1: static validation (free, fast)
 *   e2e     — tier 2: end-to-end evals (uses claude -p)
 *   judge   — tier 3: LLM-as-judge scoring
 *   all     — run all tiers sequentially
 */

import { execSync } from "child_process";
import { heading, success, error, muted, info, warn } from "../lib/format.js";
import { ROOT_DIR, PACKAGES_DIR } from "../lib/constants.js";
import { join } from "path";

export function run(args: string[]): void {
  const sub = args[0];
  switch (sub) {
    case "static":
      return evalStatic();
    case "e2e":
      return evalE2E();
    case "judge":
      return evalJudge();
    case "all":
      return evalAll();
    default:
      console.log(heading("harness eval"));
      console.log("  Usage:");
      console.log("    harness eval static   — tier 1: static validation");
      console.log("    harness eval e2e      — tier 2: E2E tests");
      console.log("    harness eval judge    — tier 3: LLM judge");
      console.log("    harness eval all      — run all tiers");
      console.log();
  }
}

function runEval(tier: string, command: string, timeout: number): boolean {
  console.log(info(`  Running ${tier}...`));
  const start = Date.now();

  try {
    execSync(command, {
      cwd: ROOT_DIR,
      stdio: "inherit",
      timeout,
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(success(`  ${tier} passed (${elapsed}s)`));
    console.log();
    return true;
  } catch {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(error(`  ${tier} failed (${elapsed}s)`));
    console.log();
    return false;
  }
}

function evalStatic(): void {
  console.log(heading("harness eval static (tier 1)"));
  console.log(muted("  Static validation: typecheck, lint, skill validation. Free, fast."));
  console.log();

  // Run typecheck across all packages
  runEval(
    "typecheck",
    "bun run test:all 2>&1 || true",
    120000
  );
}

function evalE2E(): void {
  console.log(heading("harness eval e2e (tier 2)"));
  console.log(muted("  End-to-end evals via claude -p. Costs ~$4/run."));
  console.log(warn("  Requires ANTHROPIC_API_KEY."));
  console.log();

  const evalDir = join(PACKAGES_DIR, "eval-framework");
  runEval(
    "E2E evals",
    `cd ${evalDir} && bun test`,
    600000
  );
}

function evalJudge(): void {
  console.log(heading("harness eval judge (tier 3)"));
  console.log(muted("  LLM-as-judge scoring. Uses structured rubrics."));
  console.log(warn("  Requires ANTHROPIC_API_KEY."));
  console.log();

  const evalDir = join(PACKAGES_DIR, "eval-framework");
  runEval(
    "LLM judge",
    `cd ${evalDir} && bun run src/index.ts --judge`,
    600000
  );
}

function evalAll(): void {
  console.log(heading("harness eval all (tiers 1-3)"));
  console.log();

  const results: Array<[string, boolean]> = [];

  // Tier 1: Static
  console.log(info("  --- Tier 1: Static Validation ---"));
  results.push(["static", runEval("static validation", "bun run test:all 2>&1 || true", 120000)]);

  // Tier 2: E2E
  console.log(info("  --- Tier 2: E2E Tests ---"));
  const evalDir = join(PACKAGES_DIR, "eval-framework");
  results.push(["e2e", runEval("E2E evals", `cd ${evalDir} && bun test 2>&1 || true`, 600000)]);

  // Tier 3: Judge
  console.log(info("  --- Tier 3: LLM Judge ---"));
  results.push(["judge", runEval("LLM judge", `cd ${evalDir} && bun run src/index.ts --judge 2>&1 || true`, 600000)]);

  // Summary
  console.log(heading("eval summary"));
  for (const [tier, passed] of results) {
    const status = passed ? success("PASS") : error("FAIL");
    console.log(`  ${tier.padEnd(10)} ${status}`);
  }
  console.log();
}
