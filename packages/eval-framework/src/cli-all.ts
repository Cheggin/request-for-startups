#!/usr/bin/env bun
/**
 * CLI: Run all eval tiers (static, e2e, judge).
 */

import { spawnSync } from "child_process";
import * as path from "path";

const dir = path.resolve(import.meta.dir, "..");

console.error("=== Tier 1: Static Validation ===\n");
const staticResult = spawnSync("bun", ["run", "eval:static"], {
  cwd: dir,
  stdio: "inherit",
});

console.error("\n=== Tier 2: E2E Evals ===\n");
const e2eResult = spawnSync("bun", ["run", "eval:e2e"], {
  cwd: dir,
  stdio: "inherit",
});

console.error("\n=== Tier 3: LLM Judge Evals ===\n");
const judgeResult = spawnSync("bun", ["run", "eval:judge"], {
  cwd: dir,
  stdio: "inherit",
});

const exitCode = Math.max(
  staticResult.status ?? 1,
  e2eResult.status ?? 1,
  judgeResult.status ?? 1,
);

process.exit(exitCode);
