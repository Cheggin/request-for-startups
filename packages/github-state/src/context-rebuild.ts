/**
 * Read all open Issues to rebuild context after a context reset.
 * Outputs a structured handoff document so an agent can resume work.
 */

import { searchIssues, type Issue } from "./issues.js";
import { getRecentAuditComments } from "./audit-trail.js";
import { COLUMNS, STALE_THRESHOLD_HOURS } from "./constants.js";

export interface HandoffSection {
  column: string;
  issues: HandoffIssue[];
}

export interface HandoffIssue {
  number: number;
  title: string;
  labels: string[];
  assignedAgent: string | null;
  acceptanceCriteria: string;
  recentActivity: string[];
  isStale: boolean;
}

export interface HandoffDocument {
  generatedAt: string;
  totalOpen: number;
  sections: HandoffSection[];
  staleIssues: number[];
  summary: string;
}

/**
 * Extract acceptance criteria from an Issue body.
 * Looks for a section headed "## Acceptance Criteria" or similar.
 */
function extractAcceptanceCriteria(body: string): string {
  const patterns = [
    /## Acceptance Criteria\s*\n([\s\S]*?)(?=\n##|\n$|$)/i,
    /## AC\s*\n([\s\S]*?)(?=\n##|\n$|$)/i,
    /\*\*Acceptance Criteria\*\*\s*\n([\s\S]*?)(?=\n##|\n\*\*|\n$|$)/i,
  ];

  for (const pattern of patterns) {
    const match = body.match(pattern);
    if (match) return match[1].trim();
  }

  return "(none found in body)";
}

/**
 * Determine if an Issue is stale (stuck In Progress beyond threshold).
 */
function isStale(issue: Issue, thresholdHours: number): boolean {
  const updatedAt = new Date(issue.updatedAt).getTime();
  const now = Date.now();
  const hoursElapsed = (now - updatedAt) / (1000 * 60 * 60);
  return hoursElapsed > thresholdHours;
}

/**
 * Categorize an Issue into a column based on its labels.
 * Falls back to Backlog if no column label is found.
 */
function inferColumn(issue: Issue): string {
  const labelNames = issue.labels.map((l) => l.name.toLowerCase());

  if (labelNames.includes("done")) return COLUMNS.DONE;
  if (labelNames.includes("in review") || labelNames.includes("review"))
    return COLUMNS.IN_REVIEW;
  if (labelNames.includes("in progress") || labelNames.includes("wip"))
    return COLUMNS.IN_PROGRESS;
  return COLUMNS.BACKLOG;
}

/**
 * Get the assigned agent label from an Issue.
 */
function getAgentFromLabels(issue: Issue): string | null {
  const agentLabels = ["website", "backend", "ops", "research", "spec"];
  const found = issue.labels.find((l) => agentLabels.includes(l.name));
  return found ? found.name : null;
}

/**
 * Rebuild full project context from open Issues.
 * This is the primary function for context recovery after a reset.
 */
export async function rebuildContext(
  staleThresholdHours: number = STALE_THRESHOLD_HOURS
): Promise<HandoffDocument> {
  const openIssues = await searchIssues({ state: "open", limit: 200 });

  const columnMap = new Map<string, HandoffIssue[]>();
  const staleIssues: number[] = [];

  // Initialize columns
  for (const col of Object.values(COLUMNS)) {
    columnMap.set(col, []);
  }

  for (const issue of openIssues) {
    const column = inferColumn(issue);
    const stale = column === COLUMNS.IN_PROGRESS && isStale(issue, staleThresholdHours);

    let recentActivity: string[] = [];
    try {
      const comments = await getRecentAuditComments(issue.number, 3);
      recentActivity = comments.map(
        (c) => `[${c.createdAt}] ${c.body.split("\n")[0]}`
      );
    } catch {
      // Comments may fail for permissions; skip gracefully
    }

    const handoffIssue: HandoffIssue = {
      number: issue.number,
      title: issue.title,
      labels: issue.labels.map((l) => l.name),
      assignedAgent: getAgentFromLabels(issue),
      acceptanceCriteria: extractAcceptanceCriteria(issue.body ?? ""),
      recentActivity,
      isStale: stale,
    };

    if (stale) staleIssues.push(issue.number);

    const bucket = columnMap.get(column) ?? [];
    bucket.push(handoffIssue);
    columnMap.set(column, bucket);
  }

  const sections: HandoffSection[] = Object.values(COLUMNS).map((col) => ({
    column: col,
    issues: columnMap.get(col) ?? [],
  }));

  const summary = buildSummary(sections, staleIssues);

  return {
    generatedAt: new Date().toISOString(),
    totalOpen: openIssues.length,
    sections,
    staleIssues,
    summary,
  };
}

/**
 * Build a human-readable summary of the handoff document.
 */
function buildSummary(sections: HandoffSection[], staleIssues: number[]): string {
  const lines: string[] = ["# Context Rebuild Summary", ""];

  for (const section of sections) {
    lines.push(`## ${section.column} (${section.issues.length})`);
    if (section.issues.length === 0) {
      lines.push("  (empty)");
    } else {
      for (const issue of section.issues) {
        const staleTag = issue.isStale ? " [STALE]" : "";
        const agentTag = issue.assignedAgent ? ` [${issue.assignedAgent}]` : "";
        lines.push(`  - #${issue.number}: ${issue.title}${agentTag}${staleTag}`);
      }
    }
    lines.push("");
  }

  if (staleIssues.length > 0) {
    lines.push(`## Stale Issues (${staleIssues.length})`);
    lines.push(`Issues stuck In Progress: ${staleIssues.map((n) => `#${n}`).join(", ")}`);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Format the handoff document as a markdown string.
 */
export function formatHandoffMarkdown(doc: HandoffDocument): string {
  const lines: string[] = [
    "---",
    `generated: ${doc.generatedAt}`,
    `total_open: ${doc.totalOpen}`,
    `stale_issues: [${doc.staleIssues.join(", ")}]`,
    "---",
    "",
    doc.summary,
  ];

  return lines.join("\n");
}
