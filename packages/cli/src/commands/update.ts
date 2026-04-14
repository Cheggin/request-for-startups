/**
 * harness update — investor updates.
 *
 * Subcommands:
 *   post      — post investor update to Slack
 *   history   — show recent updates
 */

import { execSync } from "child_process";
import { loadState } from "../lib/state.js";
import { heading, success, error, muted, info, warn, formatCost, phaseLabel, count } from "../lib/format.js";
import { ROOT_DIR } from "../lib/constants.js";

export function run(args: string[]): void {
  const sub = args[0];
  switch (sub) {
    case "post":
      return updatePost();
    case "history":
      return updateHistory();
    default:
      console.log(heading("harness update"));
      console.log("  Usage:");
      console.log("    harness update post      — post investor update to Slack");
      console.log("    harness update history   — show recent updates");
      console.log();
  }
}

function updatePost(): void {
  console.log(heading("harness update post"));

  const state = loadState();

  // Build update content from current state
  const features = state.features;
  const done = features.filter((f) => f.status === "done").length;
  const inProgress = features.filter((f) => f.status === "in-progress").length;
  const blocked = features.filter((f) => f.status === "blocked").length;

  const update = [
    `Startup Harness Update - ${new Date().toISOString().split("T")[0]}`,
    "",
    `Phase: ${state.phase}`,
    `Features: ${count(features.length, "feature")} (${done} done, ${inProgress} in-progress, ${blocked} blocked)`,
    `Total cost: ${formatCost(state.totalCostUsd)}`,
    `Agent loops completed: ${state.completedLoops}`,
    "",
    "Recent activity:",
    ...state.agents
      .filter((a) => a.currentTask)
      .map((a) => `  - ${a.name}: ${a.currentTask}`),
  ].join("\n");

  console.log(info("  Update content:"));
  console.log();
  console.log(update.split("\n").map((l) => "    " + l).join("\n"));
  console.log();

  // Try to post via commander's investor-update module
  console.log(info("  Posting to Slack..."));
  try {
    execSync(
      `cd ${ROOT_DIR} && bun run packages/commander/src/investor-update.ts`,
      { stdio: "inherit", timeout: 30000 }
    );
    console.log(success("  Update posted to Slack."));
  } catch {
    console.log(warn("  Could not auto-post. Copy the update above and post manually."));
  }
}

function updateHistory(): void {
  console.log(heading("harness update history"));

  const state = loadState();
  const updates = (state.meta.updates ?? []) as Array<{ date: string; phase: string; summary: string }>;

  if (updates.length === 0) {
    console.log(muted("  No update history. Post your first with: harness update post"));
    return;
  }

  for (const update of updates.slice(-10).reverse()) {
    console.log(`  ${update.date}  ${phaseLabel(update.phase)}`);
    console.log(`    ${update.summary}`);
    console.log();
  }
}
