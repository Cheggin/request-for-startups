/**
 * harness feature — track and manage features.
 *
 * Subcommands:
 *   list [--done|--todo|--progress|--blocked] — with counts
 *   new <name>                                — create from template
 *   status <name>                             — detailed view
 *   assign <name> <agent>                     — assign to an agent
 */

import {
  loadState,
  addFeature,
  updateFeature,
  getFeaturesByStatus,
  type FeatureState,
} from "../lib/state.js";
import { loadAgents } from "../lib/config.js";
import {
  heading,
  table,
  statusDot,
  success,
  error,
  warn,
  muted,
  count,
  timeAgo,
} from "../lib/format.js";

export function run(args: string[]): void {
  const sub = args[0];
  switch (sub) {
    case "list":
      return featureList(args.slice(1));
    case "new":
      return featureNew(args.slice(1));
    case "status":
      return featureStatus(args.slice(1));
    case "assign":
      return featureAssign(args.slice(1));
    default:
      console.log(heading("harness feature"));
      console.log("  Usage:");
      console.log("    harness feature list [--done|--todo|--progress|--blocked]");
      console.log("    harness feature new <name>");
      console.log("    harness feature status <name>");
      console.log("    harness feature assign <name> <agent>");
      console.log();
  }
}

function featureList(args: string[]): void {
  console.log(heading("harness feature list"));

  // Parse filter flag
  let statusFilter: FeatureState["status"] | null = null;
  for (const arg of args) {
    if (arg === "--done") statusFilter = "done";
    else if (arg === "--todo") statusFilter = "todo";
    else if (arg === "--progress") statusFilter = "in-progress";
    else if (arg === "--blocked") statusFilter = "blocked";
  }

  const features = getFeaturesByStatus(statusFilter);
  const allFeatures = getFeaturesByStatus(null);

  // Show counts
  const counts: Record<string, number> = { todo: 0, "in-progress": 0, done: 0, blocked: 0 };
  for (const f of allFeatures) {
    counts[f.status] = (counts[f.status] ?? 0) + 1;
  }
  console.log(
    `  ${count(allFeatures.length, "feature")}: ` +
    `${counts.todo} todo, ${counts["in-progress"]} in-progress, ${counts.done} done, ${counts.blocked} blocked`
  );

  if (statusFilter) {
    console.log(muted(`  Filtered by: ${statusFilter}`));
  }
  console.log();

  if (features.length === 0) {
    console.log(muted("  No features match."));
    return;
  }

  const rows = features.map((f) => [
    `${statusDot(f.status)} ${f.name}`,
    f.status,
    f.assignee ?? muted("unassigned"),
    f.issueNumber ? `#${f.issueNumber}` : muted("-"),
    timeAgo(f.updatedAt),
  ]);

  console.log(table(rows, ["Feature", "Status", "Assignee", "Issue", "Updated"]));
  console.log();
}

function featureNew(args: string[]): void {
  const name = args.join("-").toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (!name) {
    console.log(error("  Usage: harness feature new <name>"));
    return;
  }

  // Check for duplicates
  const existing = getFeaturesByStatus(null);
  if (existing.some((f) => f.name === name)) {
    console.log(warn(`  Feature '${name}' already exists.`));
    return;
  }

  const feature = addFeature(name);
  console.log(success(`  Created feature: ${feature.name}`));
  console.log(muted("  Assign with: harness feature assign " + name + " <agent>"));
}

function featureStatus(args: string[]): void {
  const name = args[0];
  if (!name) {
    console.log(error("  Usage: harness feature status <name>"));
    return;
  }

  const features = getFeaturesByStatus(null);
  // Fuzzy match
  const feature = features.find(
    (f) => f.name === name || f.name.includes(name)
  );

  if (!feature) {
    console.log(error(`  Feature '${name}' not found.`));
    const suggestions = features
      .filter((f) => f.name.includes(name.slice(0, 3)))
      .map((f) => f.name);
    if (suggestions.length > 0) {
      console.log(muted(`  Did you mean: ${suggestions.join(", ")}?`));
    }
    return;
  }

  console.log(heading(`feature: ${feature.name}`));
  console.log(`  Status:    ${statusDot(feature.status)} ${feature.status}`);
  console.log(`  Assignee:  ${feature.assignee ?? muted("unassigned")}`);
  console.log(`  Issue:     ${feature.issueNumber ? `#${feature.issueNumber}` : muted("none")}`);
  console.log(`  Created:   ${timeAgo(feature.createdAt)}`);
  console.log(`  Updated:   ${timeAgo(feature.updatedAt)}`);
  console.log();
}

function featureAssign(args: string[]): void {
  const [name, agentName] = args;
  if (!name || !agentName) {
    console.log(error("  Usage: harness feature assign <name> <agent>"));
    return;
  }

  const agents = loadAgents();
  const agent = agents.find((a) => a.name === agentName);
  if (!agent) {
    console.log(error(`  Agent '${agentName}' not found.`));
    console.log(muted(`  Available: ${agents.map((a) => a.name).join(", ")}`));
    return;
  }

  const updated = updateFeature(name, { assignee: agentName, status: "in-progress" });
  if (!updated) {
    // Try fuzzy match
    const features = getFeaturesByStatus(null);
    const match = features.find((f) => f.name.includes(name));
    if (match) {
      const result = updateFeature(match.name, { assignee: agentName, status: "in-progress" });
      if (result) {
        console.log(success(`  Assigned ${match.name} to ${agentName}`));
        return;
      }
    }
    console.log(error(`  Feature '${name}' not found.`));
    return;
  }

  console.log(success(`  Assigned ${name} to ${agentName}`));
}
