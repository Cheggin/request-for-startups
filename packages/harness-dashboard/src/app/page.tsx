"use client";

import { useAgents, useStartups, useGrowth } from "@/lib/use-data";
import { MetricCard } from "@/components/metrics/metric-card";
import { TrafficChart } from "@/components/charts/traffic-chart";

export default function OverviewPage() {
  const { agents, loading: agentsLoading } = useAgents(5000);
  const { startups, loading: startupsLoading } = useStartups();
  const { snapshot: growth, loading: growthLoading } = useGrowth();

  const running = agents.filter((a) => a.status === "running");
  const trafficData = growth?.traffic?.map((p) => ({ date: new Date(p.date), value: p.value })) ?? [];
  const trafficSparkline = growth?.traffic?.map((p) => p.value) ?? [];

  return (
    <div className="px-6 py-5 max-w-5xl">
      <h1 className="text-[18px] font-semibold text-text-primary leading-tight mb-6">Overview</h1>

      {/* Summary cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <MetricCard
          label="Running Agents"
          value={agentsLoading ? "-" : String(running.length)}
        />
        <MetricCard
          label="Startups"
          value={startupsLoading ? "-" : String(startups.length)}
        />
        <MetricCard
          label="Traffic"
          value={growthLoading ? "-" : String(trafficSparkline.reduce((a, b) => a + b, 0))}
          sparklineData={trafficSparkline.length >= 2 ? trafficSparkline : undefined}
        />
      </section>

      {/* Traffic chart */}
      <section className="mb-8">
        {growthLoading ? (
          <p className="text-[13px] text-text-tertiary">Loading traffic data...</p>
        ) : trafficData.length >= 2 ? (
          <TrafficChart data={trafficData} title="Traffic" subtitle="Daily visitors" />
        ) : (
          <div className="border border-border-subtle rounded-md px-4 py-5">
            <p className="text-[13px] text-text-secondary">No traffic data yet.</p>
            <p className="text-[12px] text-text-tertiary mt-1">
              Configure PostHog or add cached metrics to see the chart.
            </p>
          </div>
        )}
      </section>

      {/* Agent activity */}
      {!agentsLoading && agents.length > 0 && (
        <section className="mb-8">
          <h2 className="text-[13px] font-semibold text-text-primary mb-3">Agent Activity</h2>
          <div className="flex items-center gap-4 border border-border-subtle rounded-md px-4 py-3">
            <div>
              <span className="text-[24px] font-semibold tabular text-text-primary">{running.length}</span>
              <span className="text-[13px] text-text-tertiary ml-1.5">running</span>
              <span className="text-[13px] text-text-tertiary ml-3">{agents.length} total</span>
            </div>
          </div>
        </section>
      )}

      {/* Startups */}
      <section>
        <h2 className="text-[13px] font-semibold text-text-primary mb-3">Startups</h2>
        {startupsLoading ? (
          <p className="text-[13px] text-text-tertiary">Scanning project directories...</p>
        ) : startups.length === 0 ? (
          <div className="border border-border-subtle rounded-md px-4 py-5">
            <p className="text-[13px] text-text-secondary">No startups found.</p>
            <p className="text-[12px] text-text-tertiary mt-1">
              Run <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">harness init</code> to create your first startup.
            </p>
          </div>
        ) : (
          <div className="border border-border-subtle rounded-md divide-y divide-border-subtle">
            {startups.map((startup) => (
              <div key={startup.id} className="px-4 py-3 hover:bg-surface-hover transition-colors">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold text-text-primary">{startup.name}</span>
                  <span className="text-[11px] font-medium text-text-tertiary bg-bg px-1.5 py-0.5 rounded uppercase tracking-wide">
                    {startup.type}
                  </span>
                  {startup.deployUrl && (
                    <a href={startup.deployUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium text-accent hover:underline ml-auto">
                      Live
                    </a>
                  )}
                </div>
                <p className="text-[12px] text-text-tertiary truncate">{startup.idea}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
