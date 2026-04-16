"use client";

import { useAgents, useGrowth, useIssues } from "@/lib/use-data";
import { TrafficChart } from "@/components/charts/traffic-chart";
import { MetricCard } from "@/components/metrics/metric-card";
import { formatNumber } from "@/lib/format";
import Link from "next/link";

type HealthLevel = "healthy" | "warning" | "critical" | "unknown";

const HEALTH_DOT: Record<HealthLevel, string> = {
  healthy: "bg-positive",
  warning: "bg-caution",
  critical: "bg-negative",
  unknown: "bg-text-tertiary",
};

const HEALTH_TEXT: Record<HealthLevel, string> = {
  healthy: "text-positive",
  warning: "text-caution",
  critical: "text-negative",
  unknown: "text-text-tertiary",
};

function HealthSignal({ label, value, level, subtext, href }: {
  label: string;
  value: string;
  level: HealthLevel;
  subtext?: string;
  href: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-3 py-3.5 px-4 hover:bg-surface-hover transition-colors">
      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${HEALTH_DOT[level]}`} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
        <p className={`text-2xl number-hero ${HEALTH_TEXT[level]}`}>{value}</p>
      </div>
      {subtext && <span className="text-xs text-text-tertiary shrink-0">{subtext}</span>}
    </Link>
  );
}

export default function OverviewPage() {
  const { agents, loading: agentsLoading } = useAgents(5000);
  const { snapshot: growth, loading: growthLoading } = useGrowth();
  const { issues, loading: issuesLoading } = useIssues(30000);

  const trafficData = growth?.traffic?.map((p) => ({ date: new Date(p.date), value: p.value })) ?? [];
  const trafficSparkline = growth?.traffic?.map((p) => p.value) ?? [];
  const totalTraffic = growth?.traffic?.reduce((sum, p) => sum + p.value, 0) ?? 0;

  const runningAgents = agents.filter((a) => a.status === "running");
  const p0Count = issues.filter((i) => i.severity === "P0").length;
  const p1Count = issues.filter((i) => i.severity === "P1").length;

  const agentHealth: HealthLevel = agentsLoading ? "unknown"
    : agents.length === 0 ? "unknown"
    : runningAgents.length === agents.length ? "healthy"
    : runningAgents.length > 0 ? "warning"
    : "critical";

  const issueHealth: HealthLevel = issuesLoading ? "unknown"
    : p0Count > 0 ? "critical"
    : p1Count > 0 ? "warning"
    : "healthy";

  return (
    <div className="px-8 py-6 max-w-[1200px]">
      <h1 className="text-lg heading-page text-text-primary leading-tight mb-6">Overview</h1>

      {/* Health strip */}
      <section className="grid grid-cols-3 gap-px bg-border-subtle rounded-lg overflow-hidden mb-4">
        <div className="bg-surface">
          <HealthSignal label="Agents" value={agentsLoading ? "--" : `${runningAgents.length}/${agents.length}`} level={agentHealth} subtext={runningAgents.length > 0 ? "active" : undefined} href="/agents" />
        </div>
        <div className="bg-surface">
          <HealthSignal label="Issues" value={issuesLoading ? "--" : `${issues.length}`} level={issueHealth} subtext={p0Count > 0 ? `${p0Count} critical` : undefined} href="/issues" />
        </div>
        <div className="bg-surface">
          <HealthSignal label="Traffic" value={growthLoading ? "--" : formatNumber(totalTraffic)} level={totalTraffic > 0 ? "healthy" : "unknown"} subtext={totalTraffic > 0 ? "visitors" : undefined} href="/growth" />
        </div>
      </section>

      {/* Traffic chart */}
      <section className="mb-8">
        {growthLoading ? (
          <div className="h-64 rounded-lg border border-border-subtle bg-surface animate-pulse" />
        ) : trafficData.length >= 2 ? (
          <TrafficChart data={trafficData} title="Traffic" subtitle={`${formatNumber(totalTraffic)} total visitors`} />
        ) : (
          <div className="rounded-lg border border-border-subtle bg-surface px-5 py-8 text-center">
            <p className="text-sm font-semibold text-text-secondary">No traffic data</p>
            <p className="text-xs text-text-tertiary mt-1">
              Configure PostHog or add cached metrics to <code className="font-mono bg-bg px-1 py-0.5 rounded text-text-secondary">.harness/metrics/</code>
            </p>
          </div>
        )}
      </section>

      {/* Metric cards */}
      <section className="grid grid-cols-3 gap-3">
        <MetricCard label="Running Agents" value={agentsLoading ? "--" : `${runningAgents.length}`} />
        <MetricCard label="Open Issues" value={issuesLoading ? "--" : `${issues.length}`} />
        <MetricCard label="Total Visitors" value={growthLoading ? "--" : formatNumber(totalTraffic)} sparklineData={trafficSparkline} />
      </section>
    </div>
  );
}
