"use client";

import { useAgents, useStartups, useGrowth, useIssues } from "@/lib/use-data";
import { TrafficChart } from "@/components/charts/traffic-chart";
import { formatNumber } from "@/lib/format";

type AgentCategory = "running" | "idle" | "stopped";

const CATEGORY_COLORS: Record<AgentCategory, string> = {
  running: "bg-positive",
  idle: "bg-text-tertiary",
  stopped: "bg-border",
};

export default function OverviewPage() {
  const { agents, loading: agentsLoading } = useAgents(5000);
  const { startups, loading: startupsLoading } = useStartups();
  const { snapshot: growth, loading: growthLoading } = useGrowth();
  const { issues, loading: issuesLoading } = useIssues(30000);

  const trafficData = growth?.traffic?.map((p) => ({ date: new Date(p.date), value: p.value })) ?? [];
  const totalTraffic = growth?.traffic?.reduce((sum, p) => sum + p.value, 0) ?? 0;

  // Agent breakdown
  const agentCounts: Record<AgentCategory, number> = { running: 0, idle: 0, stopped: 0 };
  for (const a of agents) {
    const cat = a.status === "running" ? "running" : a.status === "idle" ? "idle" : "stopped";
    agentCounts[cat]++;
  }
  const agentTotal = agents.length;

  // Issue severity counts
  const p0Count = issues.filter((i) => i.severity === "P0").length;
  const p1Count = issues.filter((i) => i.severity === "P1").length;

  return (
    <div className="px-6 py-5 max-w-6xl">
      <h1 className="text-xl font-semibold text-text-primary leading-tight mb-6">Overview</h1>

      {/* Traffic chart — primary visualization */}
      <section className="mb-8">
        {growthLoading ? (
          <p className="text-base text-text-tertiary">Loading traffic data...</p>
        ) : trafficData.length >= 2 ? (
          <TrafficChart data={trafficData} title="Traffic" subtitle={`${formatNumber(totalTraffic)} total visitors`} />
        ) : (
          <div className="border border-border-subtle rounded-md px-4 py-5">
            <p className="text-base text-text-secondary">No traffic data yet.</p>
            <p className="text-sm text-text-tertiary mt-1">
              Configure PostHog or add cached metrics to see the chart.
            </p>
          </div>
        )}
      </section>

      {/* Agent status bar + Issues summary — side by side */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Agent breakdown */}
        <div className="border border-border-subtle rounded-md px-4 py-4">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold text-text-primary">Agents</h2>
            <span className="text-xs text-text-tertiary tabular">{agentsLoading ? "-" : `${agentTotal} total`}</span>
          </div>
          {agentsLoading ? (
            <p className="text-sm text-text-tertiary">Loading from tmux...</p>
          ) : agentTotal === 0 ? (
            <p className="text-sm text-text-tertiary">No agents running.</p>
          ) : (
            <>
              {/* Horizontal bar */}
              <div className="flex h-2 rounded-full overflow-hidden mb-3">
                {(["running", "idle", "stopped"] as AgentCategory[]).map((cat) => {
                  const pct = agentTotal > 0 ? (agentCounts[cat] / agentTotal) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={cat}
                      className={`${CATEGORY_COLORS[cat]} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4">
                {(["running", "idle", "stopped"] as AgentCategory[]).map((cat) => (
                  <div key={cat} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[cat]}`} />
                    <span className="text-xs text-text-secondary capitalize">{cat}</span>
                    <span className="text-xs text-text-primary tabular font-semibold">{agentCounts[cat]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Issues summary */}
        <div className="border border-border-subtle rounded-md px-4 py-4">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-semibold text-text-primary">Issues</h2>
            <span className="text-xs text-text-tertiary tabular">{issuesLoading ? "-" : `${issues.length} open`}</span>
          </div>
          {issuesLoading ? (
            <p className="text-sm text-text-tertiary">Fetching from GitHub...</p>
          ) : issues.length === 0 ? (
            <p className="text-sm text-text-tertiary">No open issues.</p>
          ) : (
            <div className="space-y-2">
              {p0Count > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-negative/10">
                  <span className="text-sm font-semibold text-negative tabular">{p0Count}</span>
                  <span className="text-sm text-negative">Critical (P0)</span>
                </div>
              )}
              {p1Count > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-caution/10">
                  <span className="text-sm font-semibold text-caution tabular">{p1Count}</span>
                  <span className="text-sm text-caution">Broken (P1)</span>
                </div>
              )}
              {issues.length - p0Count - p1Count > 0 && (
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-sm font-semibold text-text-secondary tabular">{issues.length - p0Count - p1Count}</span>
                  <span className="text-sm text-text-tertiary">Other</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Startups */}
      <section>
        <h2 className="text-base font-semibold text-text-primary mb-3">Startups</h2>
        {startupsLoading ? (
          <p className="text-base text-text-tertiary">Scanning project directories...</p>
        ) : startups.length === 0 ? (
          <div className="border border-border-subtle rounded-md px-4 py-5">
            <p className="text-base text-text-secondary">No startups found.</p>
            <p className="text-sm text-text-tertiary mt-1">
              Run <code className="font-mono text-sm text-text-secondary bg-bg px-1 py-0.5 rounded">harness init</code> to create your first startup.
            </p>
          </div>
        ) : (
          <div className="border border-border-subtle rounded-md divide-y divide-border-subtle">
            {startups.map((startup) => (
              <div key={startup.id} className="px-4 py-3 hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base font-semibold text-text-primary">{startup.name}</span>
                  <span className="text-xs font-medium text-text-tertiary bg-bg px-1.5 py-0.5 rounded uppercase tracking-wide">
                    {startup.type}
                  </span>
                  {startup.deployUrl && (
                    <a href={startup.deployUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-accent hover:underline ml-auto">
                      Live
                    </a>
                  )}
                </div>
                <p className="text-sm text-text-tertiary truncate">{startup.idea}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
