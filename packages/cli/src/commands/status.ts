/**
 * harness status — overview of running agents, feature progress, stack.
 */

import type { ParsedArgs } from "../index";
import { loadAgents, getRunningPanes } from "./agent";
import { loadFeatures } from "./feature";
import { loadSkills } from "./skill";

export async function runStatus(parsed: ParsedArgs, root: string): Promise<void> {
  // Run all loads in parallel
  const [agents, features, skills, panes] = await Promise.all([
    loadAgents(root),
    loadFeatures(root),
    loadSkills(root),
    getRunningPanes(),
  ]);

  console.log("=== Harness Status ===\n");

  // Agents section
  console.log(`\x1b[1mAgents\x1b[0m (${agents.length} defined)`);
  if (agents.length > 0) {
    for (const a of agents) {
      const running = panes.has(a.name);
      const status = running ? "\x1b[32m running\x1b[0m" : "\x1b[90m idle\x1b[0m";
      console.log(`  ${a.name.padEnd(15)} L${a.level} ${a.model.padEnd(20)}${status}`);
    }
  } else {
    console.log("  (none)");
  }

  // Features section
  console.log(`\n\x1b[1mFeatures\x1b[0m (${features.length} total)`);
  if (features.length > 0) {
    let doneCount = 0;
    let progressCount = 0;
    let todoCount = 0;
    let blockedCount = 0;

    for (const f of features) {
      const s = f.status.toLowerCase();
      if (s.includes("complete") || s.includes("done")) doneCount++;
      else if (s.includes("in progress")) progressCount++;
      else if (s.includes("blocked")) blockedCount++;
      else todoCount++;
    }

    console.log(`  Done:        ${doneCount}`);
    console.log(`  In progress: ${progressCount}`);
    console.log(`  Blocked:     ${blockedCount}`);
    console.log(`  Not started: ${todoCount}`);

    // Overall progress
    let totalItems = 0;
    let doneItems = 0;
    for (const f of features) {
      totalItems += f.totalItems;
      doneItems += f.doneItems;
    }
    const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
    console.log(`\n  Checklist progress: ${doneItems}/${totalItems} (${pct}%)`);
  } else {
    console.log("  (none)");
  }

  // Skills section
  console.log(`\n\x1b[1mSkills\x1b[0m (${skills.length} total)`);
  const categories = new Set(skills.map((s) => s.category));
  for (const cat of categories) {
    const count = skills.filter((s) => s.category === cat).length;
    console.log(`  ${cat.padEnd(15)} ${count} skills`);
  }

  // Running panes
  const runningPanes = Array.from(panes.keys());
  console.log(`\n\x1b[1mTmux Panes\x1b[0m (${runningPanes.length} running)`);
  if (runningPanes.length > 0) {
    for (const name of runningPanes) {
      console.log(`  ${name}`);
    }
  } else {
    console.log("  (none — run 'task panes:start' to create harness session)");
  }
}
