"use client";

import { useAgents, useStartups } from "@/lib/use-data";

export default function OverviewPage() {
  const { agents, loading: agentsLoading } = useAgents(5000);
  const { startups, loading: startupsLoading } = useStartups();

  const running = agents.filter((a) => a.status === "running");

  return (
    <div className="px-6 py-5 space-y-6 max-w-6xl">
      <h1 className="text-lg font-semibold text-foreground">Overview</h1>

      {/* Agents summary */}
      <div>
        <h2 className="text-[14px] font-semibold text-foreground mb-3">Agents</h2>
        {agentsLoading ? (
          <p className="text-[12px] text-muted-foreground">Loading agent data from tmux...</p>
        ) : agents.length === 0 ? (
          <div className="bg-surface border border-border-subtle rounded-xl px-4 py-6 text-center">
            <p className="text-[13px] text-muted">No tmux sessions found</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Agents appear when running via <code className="bg-background px-1.5 py-0.5 rounded">harness init</code> or tmux
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3.5">
              <p className="text-[12px] font-medium text-muted mb-1">Running</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {running.length}
                <span className="text-[14px] text-muted font-normal ml-1">/ {agents.length}</span>
              </p>
            </div>
            <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3.5">
              <p className="text-[12px] font-medium text-muted mb-1">Total Sessions</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">{agents.length}</p>
            </div>
            <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3.5">
              <p className="text-[12px] font-medium text-muted mb-1">Status</p>
              <div className="flex items-center gap-1 mt-1">
                {agents.map((a) => (
                  <span
                    key={a.paneId}
                    className={`w-2.5 h-2.5 rounded-full ${
                      a.status === "running" ? "bg-success" : a.status === "idle" ? "bg-muted-foreground" : "bg-border"
                    }`}
                    title={`${a.name}: ${a.status}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Startups */}
      <div>
        <h2 className="text-[14px] font-semibold text-foreground mb-3">Startups</h2>
        {startupsLoading ? (
          <p className="text-[12px] text-muted-foreground">Scanning project directories...</p>
        ) : startups.length === 0 ? (
          <div className="bg-surface border border-border-subtle rounded-xl px-4 py-6 text-center">
            <p className="text-[13px] text-muted">No startups found</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              Run <code className="bg-background px-1.5 py-0.5 rounded">harness init</code> to create your first startup
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {startups.map((startup) => (
              <div
                key={startup.id}
                className="bg-surface border border-border-subtle rounded-xl p-4 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-[14px] font-semibold text-foreground">{startup.name}</h3>
                  <span className="text-[10px] font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded uppercase">
                    {startup.type}
                  </span>
                </div>
                <p className="text-[12px] text-muted truncate mb-2">{startup.idea}</p>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="truncate max-w-40 font-mono">{startup.path}</span>
                  {startup.deployUrl && (
                    <a
                      href={startup.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground hover:underline shrink-0"
                    >
                      Live
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
