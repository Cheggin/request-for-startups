/**
 * Create, update, close, and search GitHub Issues.
 * Labels encode agent assignment and category.
 */

import { execGh, execGhJson } from "./gh.js";
import type { AgentLabel, CategoryLabel } from "./constants.js";

export interface CreateIssueOptions {
  title: string;
  body: string;
  labels?: string[];
  assignee?: string;
  agentLabel?: AgentLabel;
  categoryLabel?: CategoryLabel;
}

export interface Issue {
  number: number;
  title: string;
  body: string;
  state: string;
  labels: { name: string }[];
  assignees: { login: string }[];
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateIssueOptions {
  title?: string;
  body?: string;
  addLabels?: string[];
  removeLabels?: string[];
  assignee?: string;
  state?: "open" | "closed";
}

/**
 * Create a new GitHub Issue with optional labels for agent and category.
 */
export async function createIssue(opts: CreateIssueOptions): Promise<Issue> {
  const args = ["issue", "create", "--title", opts.title, "--body", opts.body];

  const labels: string[] = [...(opts.labels ?? [])];
  if (opts.agentLabel) labels.push(opts.agentLabel);
  if (opts.categoryLabel) labels.push(opts.categoryLabel);

  if (labels.length > 0) {
    args.push("--label", labels.join(","));
  }

  if (opts.assignee) {
    args.push("--assignee", opts.assignee);
  }

  args.push("--json", "number,title,body,state,labels,assignees,url,createdAt,updatedAt");

  return execGhJson<Issue>(args);
}

/**
 * Update an existing Issue (title, body, labels, state).
 */
export async function updateIssue(issueNumber: number, opts: UpdateIssueOptions): Promise<Issue> {
  const args = ["issue", "edit", String(issueNumber)];

  if (opts.title) args.push("--title", opts.title);
  if (opts.body) args.push("--body", opts.body);
  if (opts.addLabels && opts.addLabels.length > 0) {
    args.push("--add-label", opts.addLabels.join(","));
  }
  if (opts.removeLabels && opts.removeLabels.length > 0) {
    args.push("--remove-label", opts.removeLabels.join(","));
  }
  if (opts.assignee) args.push("--add-assignee", opts.assignee);

  await execGh(args);

  if (opts.state === "closed") {
    await execGh(["issue", "close", String(issueNumber)]);
  } else if (opts.state === "open") {
    await execGh(["issue", "reopen", String(issueNumber)]);
  }

  return getIssue(issueNumber);
}

/**
 * Close an Issue.
 */
export async function closeIssue(issueNumber: number): Promise<void> {
  await execGh(["issue", "close", String(issueNumber)]);
}

/**
 * Get a single Issue by number.
 */
export async function getIssue(issueNumber: number): Promise<Issue> {
  return execGhJson<Issue>([
    "issue",
    "view",
    String(issueNumber),
    "--json",
    "number,title,body,state,labels,assignees,url,createdAt,updatedAt",
  ]);
}

/**
 * Search Issues by label and/or state.
 */
export async function searchIssues(opts: {
  labels?: string[];
  state?: "open" | "closed" | "all";
  limit?: number;
}): Promise<Issue[]> {
  const args = ["issue", "list"];

  if (opts.labels && opts.labels.length > 0) {
    args.push("--label", opts.labels.join(","));
  }

  args.push("--state", opts.state ?? "open");
  args.push("--limit", String(opts.limit ?? 100));
  args.push("--json", "number,title,body,state,labels,assignees,url,createdAt,updatedAt");

  return execGhJson<Issue[]>(args);
}

/**
 * Check if an Issue is already assigned to an agent (by label).
 * Returns the agent label if assigned, null otherwise.
 */
export async function getAssignedAgent(issueNumber: number): Promise<string | null> {
  const issue = await getIssue(issueNumber);
  const agentLabels = ["website", "backend", "ops", "research", "spec"];
  const found = issue.labels.find((l) => agentLabels.includes(l.name));
  return found ? found.name : null;
}
