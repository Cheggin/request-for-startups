"use client";

import { useAgents, useStartups, useGrowth, useIssues } from "@/lib/use-data";
import { TrafficChart } from "@/components/charts/traffic-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { formatNumber } from "@/lib/format";
import Link from "next/link";

type HealthLevel = "healthy" | "warning" | "critical" | "unknown";

function healthColor(level: HealthLevel): string {
  if (level === "healthy") return "text-positive";
  if (level === "warning") return "text-caution";
  if (level === "critical") return "text-negative";
  return "text-text-tertiary";
}

function healthDotClass(level: HealthLevel): string {
  if (level === "healthy") return "bg-positive";
  if (level === "warning") return "bg-caution";
  if (level === "critical") return "bg-negative";
  return "bg-text-tertiary";
}

function HealthSignal({ label, value, level, subtext, href }: {
  label: string;
  value: string;
  level: HealthLevel;
  subtext?: string;
  href: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-surface-hover transition-colors">
      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${healthDotClass(level)}`} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-display font-bold tabular leading-tight ${healthColor(level)}`}>
          {value}
        </p>
      </div>
      {subtext && (
        <span className="text-xs text-text-tertiary shrink-0">{subtext}</span>
      )}
    </Link>
  );
}

function AgentRow({ name, status, output }: {
  name: string;
  status: "running" | "idle" | "stopped";
  output: string;
}) {
  const lastLine = output.split("\n").filter(Boolean).pop()?.trim() || "";
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span
        className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
          status === "running" ? "bg-positive status-running" : "bg-text-tertiary"
        }`}
      />
      <div className="min-w-0 flex-1">
        <span className="text-sm font-semibold text-text-primary">{name}</span>
        {lastLine && (
          <p className="text-xs text-text-tertiary truncate mt-0.5">{lastLine}</p>
        )}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const { agents, loading: agentsLoading } = useAgents(5000);
  const { startups, loading: startupsLoading } = useStartups();
  const { snapshot: growth, loading: growthLoading } = useGrowth();
  const { issues, loading: issuesLoading } = useIssues(30000);

  const trafficData = growth?.traffic?.map((p) => ({ date: new Date(p.date), value: p.value })) ?? [];
  const trafficSparkline = growth?.traffic?.map((p) => p.value) ?? [];
  const totalTraffic = growth?.traffic?.reduce((sum, p) => sum + p.value, 0) ?? 0;

  const runningAgents = agents.filter((a) => a.status === "running");
  const idleAgents = agents.filter((a) => a.status !== "running");
  const p0Count = issues.filter((i) => i.severity === "P0").length;
  const p1Count = issues.filter((i) => i.severity === "P1").length;

  // Health calculations
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
    <div className="px-6 py-5">
      <h1 className="text-lg heading-page text-text-primary leading-tight mb-5">Overview</h1>

      {/* ── Health strip ─────────────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-px bg-border-subtle rounded-lg overflow-hidden mb-6">
        <div className="bg-surface">
          <HealthSignal
            label="Agents"
            value={agentsLoading ? "--" : `${runningAgents.length}/${agents.length}`}
            level={agentHealth}
            subtext={runningAgents.length > 0 ? "active" : undefined}
            href="/agents"
          />
        </div>
        <div className="bg-surface">
          <HealthSignal
            label="Issues"
            value={issuesLoading ? "--" : `${issues.length}`}
            level={issueHealth}
            subtext={p0Count > 0 ? `${p0Count} critical` : undefined}
            href="/issues"
          />
        </div>
        <div className="bg-surface">
          <HealthSignal
            label="Traffic"
            value={growthLoading ? "--" : formatNumber(totalTraffic)}
            level={totalTraffic > 0 ? "healthy" : "unknown"}
            subtext={totalTraffic > 0 ? "visitors" : undefined}
            href="/growth"
          />
        </div>
      </section>

      {/* ── Traffic chart (hero) ─────────────────────────────────── */}
      <section className="mb-6">
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

      {/* ── Two-column: Agents + Issues ──────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Active agents */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Active Agents</h2>
            <Link href="/agents" className="text-xs font-medium text-text-tertiary hover:text-accent transition-colors">
              View all
            </Link>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2">
            {agentsLoading ? (
              <p className="text-xs text-text-tertiary py-3">Loading from tmux...</p>
            ) : agents.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-text-secondary">No agents</p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Start with <code className="font-mono bg-bg px-1 py-0.5 rounded">harness init</code>
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {runningAgents.slice(0, 6).map((agent) => (
                  <AgentRow key={agent.paneId} name={agent.name} status={agent.status} output={agent.lastOutput} />
                ))}
                {idleAgents.slice(0, 3).map((agent) => (
                  <AgentRow key={agent.paneId} name={agent.name} status={agent.status} output={agent.lastOutput} />
                ))}
                {agents.length > 9 && (
                  <p className="text-xs text-text-tertiary py-1.5">+{agents.length - 9} more</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Issues by severity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">Issues</h2>
            <Link href="/issues" className="text-xs font-medium text-text-tertiary hover:text-accent transition-colors">
              View all
            </Link>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2">
            {issuesLoading ? (
              <p className="text-xs text-text-tertiary py-3">Fetching from GitHub...</p>
            ) : issues.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-text-secondary">No open issues</p>
                <p className="text-xs text-text-tertiary mt-0.5">Scanner loops will create issues as they find problems</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {issues
                  .sort((a, b) => {
                    const order = { P0: 0, P1: 1, P2: 2, P3: 3, unknown: 4 };
                    return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
                  })
                  .slice(0, 8)
                  .map((issue) => (
                    <a
                      key={issue.number}
                      href={issue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 py-1.5 hover:text-accent transition-colors"
                    >
                      <span className={`text-[10px] font-semibold px-1 py-0.5 rounded shrink-0 tabular ${
                        issue.severity === "P0" ? "bg-negative/10 text-negative"
                        : issue.severity === "P1" ? "bg-caution/10 text-caution"
                        : "bg-bg text-text-tertiary"
                      }`}>
                        {issue.severity === "unknown" ? "—" : issue.severity}
                      </span>
                      <span className="text-sm text-text-primary truncate">{issue.title}</span>
                      <span className="text-xs text-text-tertiary shrink-0 tabular ml-auto">#{issue.number}</span>
                    </a>
                  ))}
                {issues.length > 8 && (
                  <p className="text-xs text-text-tertiary py-1.5">+{issues.length - 8} more</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Startups ─────────────────────────────────────────────── */}
      {!startupsLoading && startups.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary mb-2">Startups</h2>
          <div className="flex flex-wrap gap-2">
            {startups.map((startup) => (
              <div
                key={startup.id}
                className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface px-3 py-1.5 text-sm"
              >
                <span className="font-semibold text-text-primary">{startup.name}</span>
                <span className="text-[10px] uppercase tracking-wide text-text-tertiary">{startup.type}</span>
                {startup.deployUrl && (
                  <a href={startup.deployUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
                    Live
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
