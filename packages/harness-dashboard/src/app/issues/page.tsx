"use client";

import { useIssues } from "@/lib/use-data";
import type { GitHubIssue } from "@/lib/data";
import { formatRelativeTime } from "@/lib/format";

const SEVERITY_ORDER = ["P0", "P1", "P2", "P3", "unknown"] as const;

const SEV: Record<string, { label: string; dot: string; badge: string }> = {
  P0: { label: "Critical", dot: "bg-negative", badge: "bg-negative/10 text-negative" },
  P1: { label: "Broken", dot: "bg-caution", badge: "bg-caution/10 text-caution" },
  P2: { label: "Enhancement", dot: "bg-accent", badge: "bg-accent/10 text-accent" },
  P3: { label: "Low", dot: "bg-text-tertiary", badge: "bg-bg text-text-tertiary" },
  unknown: { label: "Unsorted", dot: "bg-text-tertiary", badge: "bg-bg text-text-tertiary" },
};

function groupBySeverity(issues: GitHubIssue[]): Record<string, GitHubIssue[]> {
  const groups: Record<string, GitHubIssue[]> = {};
  for (const sev of SEVERITY_ORDER) groups[sev] = [];
  for (const issue of issues) {
    const key = SEVERITY_ORDER.includes(issue.severity as typeof SEVERITY_ORDER[number]) ? issue.severity : "unknown";
    groups[key].push(issue);
  }
  return groups;
}

export default function IssuesPage() {
  const { issues, loading, error } = useIssues(30000);
  const grouped = groupBySeverity(issues);

  return (
    <div className="px-6 py-5">
      <div className="flex items-baseline gap-3 mb-5">
        <h1 className="text-lg heading-page text-text-primary">Issues</h1>
        {!loading && (
          <span className="text-sm text-text-tertiary tabular">{issues.length} open</span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-text-tertiary">Fetching issues from GitHub...</p>
      ) : error ? (
        <div className="rounded-lg border border-border-subtle bg-surface px-5 py-8 text-center">
          <p className="text-sm font-semibold text-text-secondary">Failed to fetch issues</p>
          <p className="text-xs text-text-tertiary mt-1">
            Ensure <code className="bg-bg px-1 py-0.5 rounded font-mono">gh</code> is authenticated
          </p>
        </div>
      ) : issues.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface px-5 py-8 text-center">
          <p className="text-sm font-semibold text-text-secondary">No open issues</p>
          <p className="text-xs text-text-tertiary mt-1">Scanner loops will create issues here as they find problems</p>
        </div>
      ) : (
        <div className="space-y-5">
          {SEVERITY_ORDER.map((sev) => {
            const sevIssues = grouped[sev];
            if (sevIssues.length === 0) return null;
            const config = SEV[sev];

            return (
              <section key={sev}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${config.dot}`} />
                  <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    {sev === "unknown" ? "Unsorted" : sev} — {config.label}
                  </h2>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded tabular ${config.badge}`}>
                    {sevIssues.length}
                  </span>
                </div>

                <div className="rounded-lg border border-border-subtle bg-surface divide-y divide-border-subtle">
                  {sevIssues.map((issue) => (
                    <div key={issue.number} className="px-3 py-2 flex items-center gap-2 hover:bg-surface-hover transition-colors">
                      <span className="text-xs font-mono text-text-tertiary shrink-0 tabular w-8">#{issue.number}</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-bg text-text-tertiary uppercase tracking-wide">
                        {issue.type}
                      </span>
                      <a href={issue.url} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-medium text-text-primary hover:text-accent truncate min-w-0 flex-1">
                        {issue.title}
                      </a>
                      <span className="text-xs text-text-tertiary shrink-0">{issue.author}</span>
                      <span className="text-xs text-text-tertiary shrink-0 tabular">{formatRelativeTime(issue.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
