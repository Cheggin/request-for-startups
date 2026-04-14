/**
 * Post structured comments to Issues as an audit trail.
 * Records who did what, when, and the result.
 */

import { execGh, execGhJson } from "./gh.js";

export interface AuditEntry {
  agentId: string;
  action: string;
  details?: string;
  filesChanged?: string[];
  testsWritten?: string[];
  testResults?: string;
  deployStatus?: string;
}

export interface IssueComment {
  id: string;
  body: string;
  author: { login: string };
  createdAt: string;
}

/**
 * Format an audit entry into a structured markdown comment.
 */
function formatAuditComment(entry: AuditEntry): string {
  const timestamp = new Date().toISOString();
  const lines: string[] = [
    `## Audit: ${entry.action}`,
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| Agent | \`${entry.agentId}\` |`,
    `| Action | ${entry.action} |`,
    `| Timestamp | ${timestamp} |`,
  ];

  if (entry.details) {
    lines.push("", "### Details", "", entry.details);
  }

  if (entry.filesChanged && entry.filesChanged.length > 0) {
    lines.push("", "### Files Changed", "");
    for (const file of entry.filesChanged) {
      lines.push(`- \`${file}\``);
    }
  }

  if (entry.testsWritten && entry.testsWritten.length > 0) {
    lines.push("", "### Tests Written", "");
    for (const test of entry.testsWritten) {
      lines.push(`- \`${test}\``);
    }
  }

  if (entry.testResults) {
    lines.push("", "### Test Results", "", "```", entry.testResults, "```");
  }

  if (entry.deployStatus) {
    lines.push("", "### Deploy Status", "", entry.deployStatus);
  }

  return lines.join("\n");
}

/**
 * Post an audit trail comment to an Issue.
 */
export async function postAuditComment(
  issueNumber: number,
  entry: AuditEntry
): Promise<void> {
  const body = formatAuditComment(entry);
  await execGh(["issue", "comment", String(issueNumber), "--body", body]);
}

/**
 * Post a task pickup comment (agent starting work).
 */
export async function postPickupComment(
  issueNumber: number,
  agentId: string
): Promise<void> {
  await postAuditComment(issueNumber, {
    agentId,
    action: "Task Pickup",
    details: `Agent \`${agentId}\` is starting work on this issue.`,
  });
}

/**
 * Post a task completion comment (agent finished, moving to review).
 */
export async function postCompletionComment(
  issueNumber: number,
  agentId: string,
  filesChanged: string[],
  testsWritten: string[]
): Promise<void> {
  await postAuditComment(issueNumber, {
    agentId,
    action: "Task Completed",
    details: "Work completed. Moving to In Review.",
    filesChanged,
    testsWritten,
  });
}

/**
 * Post a verification pass comment (tests passed, deploying).
 */
export async function postVerificationComment(
  issueNumber: number,
  agentId: string,
  testResults: string,
  deployStatus: string
): Promise<void> {
  await postAuditComment(issueNumber, {
    agentId,
    action: "Verification Passed",
    details: "All checks passed. Moving to Done.",
    testResults,
    deployStatus,
  });
}

/**
 * Get all comments on an Issue.
 */
export async function getIssueComments(issueNumber: number): Promise<IssueComment[]> {
  return execGhJson<IssueComment[]>([
    "issue",
    "view",
    String(issueNumber),
    "--json",
    "comments",
    "--jq",
    ".comments",
  ]);
}

/**
 * Get the most recent audit comments (by looking for "## Audit:" prefix).
 */
export async function getRecentAuditComments(
  issueNumber: number,
  limit: number = 10
): Promise<IssueComment[]> {
  const comments = await getIssueComments(issueNumber);
  return comments
    .filter((c) => c.body.startsWith("## Audit:"))
    .slice(-limit);
}
