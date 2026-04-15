"use client";

import { useAgents, useStartups, useGrowth, useIssues } from "@/lib/use-data";
import { TrafficChart } from "@/components/charts/traffic-chart";
import { MetricCard } from "@/components/metrics/metric-card";
import { formatNumber } from "@/lib/format";

export default function OverviewPage() {
  const { agents, loading: agentsLoading } = useAgents(5000);
  const { startups, loading: startupsLoading } = useStartups();
  const { snapshot: growth, loading: growthLoading } = useGrowth();
  const { issues, loading: issuesLoading } = useIssues(30000);

  const trafficData = growth?.traffic?.map((p) => ({ date: new Date(p.date), value: p.value })) ?? [];
  const trafficSparkline = growth?.traffic?.map((p) => p.value) ?? [];
  const totalTraffic = growth?.traffic?.reduce((sum, p) => sum + p.value, 0) ?? 0;

  const runningCount = agents.filter((a) => a.status === "running").length;
  const agentSparkline = agents.map((_, i) => runningCount > 0 ? runningCount - (i % 2) : 0);
  const p0Count = issues.filter((i) => i.severity === "P0").length;

  return (
    <div className="px-6 py-5 max-w-6xl">
      <h1 className="text-xl heading-page text-text-primary leading-tight mb-6">Overview</h1>

      {/* Summary metric cards with sparklines */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="Traffic"
          value={growthLoading ? "-" : formatNumber(totalTraffic)}
          sparklineData={trafficSparkline}
        />
        <MetricCard
          label="Agents Running"
          value={agentsLoading ? "-" : `${runningCount}/${agents.length}`}
          sparklineData={agentSparkline.length >= 2 ? agentSparkline : undefined}
        />
        <MetricCard
          label="Open Issues"
          value={issuesLoading ? "-" : `${issues.length}`}
          color={p0Count > 0 ? "var(--negative)" : undefined}
        />
        <MetricCard
          label="Startups"
          value={startupsLoading ? "-" : `${startups.length}`}
        />
      </section>

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

      {/* Active agents + critical issues — quick glance */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="border border-border-subtle rounded-md px-4 py-4">
          <h2 className="text-base font-semibold text-text-primary mb-2">Active Agents</h2>
          {agentsLoading ? (
            <p className="text-sm text-text-tertiary">Loading...</p>
          ) : agents.length === 0 ? (
            <p className="text-sm text-text-tertiary">No agents running.</p>
          ) : (
            <div className="space-y-1.5">
              {agents.filter((a) => a.status === "running").slice(0, 5).map((agent) => (
                <div key={agent.paneId} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-positive status-running shrink-0" />
                  <span className="text-sm font-medium text-text-primary">{agent.name}</span>
                  <span className="text-xs text-text-tertiary truncate ml-auto max-w-48">
                    {agent.lastOutput?.split("\n").pop()?.trim() || "running"}
                  </span>
                </div>
              ))}
              {runningCount > 5 && (
                <p className="text-xs text-text-tertiary">+{runningCount - 5} more</p>
              )}
            </div>
          )}
        </div>

        <div className="border border-border-subtle rounded-md px-4 py-4">
          <h2 className="text-base font-semibold text-text-primary mb-2">Critical Issues</h2>
          {issuesLoading ? (
            <p className="text-sm text-text-tertiary">Loading...</p>
          ) : p0Count === 0 ? (
            <p className="text-sm text-text-tertiary">No critical issues.</p>
          ) : (
            <div className="space-y-1.5">
              {issues.filter((i) => i.severity === "P0").slice(0, 5).map((issue) => (
                <a key={issue.number} href={issue.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-accent transition-colors">
                  <span className="text-xs text-negative font-mono tabular shrink-0">#{issue.number}</span>
                  <span className="text-sm text-text-primary truncate">{issue.title}</span>
                </a>
              ))}
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
              <div key={startup.id} className="px-4 py-3 hover:bg-surface-hover transition-colors flex items-center gap-2">
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
