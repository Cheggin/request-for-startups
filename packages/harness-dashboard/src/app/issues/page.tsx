"use client";

import { useState } from "react";
import { useIssues } from "@/lib/use-data";
import type { GitHubIssue } from "@/lib/data";
import { formatRelativeTime } from "@/lib/format";

async function dismissIssue(number: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/issues/${number}/dismiss`, { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

const SEVERITY_ORDER = ["P0", "P1", "P2", "P3", "unknown"] as const;

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  P0: { label: "P0 — Critical", color: "text-negative", bg: "bg-negative/10" },
  P1: { label: "P1 — Broken", color: "text-caution", bg: "bg-caution/10" },
  P2: { label: "P2 — Enhancement", color: "text-accent", bg: "bg-accent/10" },
  P3: { label: "P3 — Low", color: "text-text-tertiary", bg: "bg-text-tertiary/10" },
  unknown: { label: "Unsorted", color: "text-text-tertiary", bg: "bg-text-tertiary/10" },
};

const TYPE_COLORS: Record<string, string> = {
  feat: "bg-accent/10 text-accent",
  fix: "bg-negative/10 text-negative",
  refactor: "bg-caution/10 text-caution",
  docs: "bg-text-tertiary/10 text-text-secondary",
  test: "bg-positive/10 text-positive",
  chore: "bg-text-tertiary/10 text-text-secondary",
};


function groupBySeverity(issues: GitHubIssue[]): Record<string, GitHubIssue[]> {
  const groups: Record<string, GitHubIssue[]> = {};
  for (const sev of SEVERITY_ORDER) {
    groups[sev] = [];
  }
  for (const issue of issues) {
    const key = SEVERITY_ORDER.includes(issue.severity as any) ? issue.severity : "unknown";
    groups[key].push(issue);
  }
  return groups;
}

export default function IssuesPage() {
  const { issues, loading, error, refetch } = useIssues(30000);
  const [dismissing, setDismissing] = useState<number | null>(null);

  async function handleDismiss(issueNumber: number) {
    setDismissing(issueNumber);
    console.log(`[IssuesPage] Dismissing issue #${issueNumber}`);
    const ok = await dismissIssue(issueNumber);
    if (!ok) console.error(`[IssuesPage] Failed to dismiss #${issueNumber}`);
    setTimeout(() => { refetch(); setDismissing(null); }, 2000);
  }

  const grouped = groupBySeverity(issues);
  const totalOpen = issues.length;

  return (
    <div className="px-6 py-5 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <h1 className="text-xl heading-page text-text-primary">Issues</h1>
        {!loading && (
          <span className="text-sm font-medium text-text-tertiary tabular">
            {totalOpen} open
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-text-tertiary">Fetching issues from GitHub...</p>
      ) : error ? (
        <div className="bg-surface border border-border-subtle rounded-md px-4 py-6 text-center">
          <p className="text-base text-text-secondary">Failed to fetch issues</p>
          <p className="text-sm text-text-tertiary mt-1">
            Ensure <code className="bg-bg px-1.5 py-0.5 rounded font-mono">gh</code> is authenticated and accessible
          </p>
        </div>
      ) : totalOpen === 0 ? (
        <div className="bg-surface border border-border-subtle rounded-md px-4 py-6 text-center">
          <p className="text-base text-text-secondary">No open issues</p>
          <p className="text-sm text-text-tertiary mt-1">
            Scanner loops will create issues here as they find problems
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {SEVERITY_ORDER.map((sev) => {
            const sevIssues = grouped[sev];
            if (sevIssues.length === 0) return null;

            const config = SEVERITY_CONFIG[sev];

            return (
              <div key={sev}>
                {/* Severity header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-semibold ${config.color}`}>
                    {config.label}
                  </span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color} tabular`}>
                    {sevIssues.length}
                  </span>
                </div>

                {/* Issue list */}
                <div className="bg-surface border border-border-subtle rounded-md divide-y divide-border-subtle">
                  {sevIssues.map((issue) => {
                    const typeStyle = TYPE_COLORS[issue.type] || TYPE_COLORS.chore;
                    return (
                      <div key={issue.number} className="px-4 py-3 flex items-center gap-3">
                        {/* Issue number */}
                        <span className="text-sm font-mono text-text-tertiary shrink-0 tabular">
                          #{issue.number}
                        </span>

                        {/* Type badge */}
                        <span className={`text-2xs font-medium px-1.5 py-0.5 rounded shrink-0 ${typeStyle}`}>
                          {issue.type}
                        </span>

                        {/* Title — links to GitHub */}
                        <a
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base font-medium text-text-primary hover:text-accent truncate min-w-0 flex-1"
                        >
                          {issue.title}
                        </a>

                        {/* Metadata */}
                        <span className="text-xs text-text-tertiary shrink-0">
                          {issue.author}
                        </span>
                        <span className="text-xs text-text-tertiary shrink-0 tabular">
                          {formatRelativeTime(issue.createdAt)}
                        </span>
                        <button
                          onClick={() => handleDismiss(issue.number)}
                          disabled={dismissing === issue.number}
                          className={`text-xs font-medium px-2 py-1 rounded-md transition-colors shrink-0 ${
                            dismissing === issue.number
                              ? "text-text-tertiary bg-bg cursor-not-allowed"
                              : "text-text-tertiary hover:text-negative hover:bg-surface-hover border border-border"
                          }`}
                        >
                          {dismissing === issue.number ? "Closing..." : "Dismiss"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
