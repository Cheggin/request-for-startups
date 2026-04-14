"use client";

import { useAgents, useStartups } from "@/lib/use-data";

export default function OverviewPage() {
  const { agents, loading: agentsLoading } = useAgents(5000);
  const { startups, loading: startupsLoading } = useStartups();

  const running = agents.filter((a) => a.status === "running");

  return (
    <div className="px-6 py-5 max-w-5xl">
      <h1 className="text-[18px] font-semibold text-text-primary leading-tight mb-6">Overview</h1>

      {/* Agents */}
      <section className="mb-8">
        <h2 className="text-[13px] font-semibold text-text-primary mb-3">Agents</h2>
        {agentsLoading ? (
          <p className="text-[13px] text-text-tertiary">Loading agent data from tmux...</p>
        ) : agents.length === 0 ? (
          <div className="border border-border-subtle rounded-md px-4 py-5">
            <p className="text-[13px] text-text-secondary">No tmux sessions found.</p>
            <p className="text-[12px] text-text-tertiary mt-1">
              Agents appear when running via <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">harness init</code> or tmux.
            </p>
          </div>
        ) : (
          <div className="flex items-baseline gap-6 mb-3">
            <div>
              <span className="text-[24px] font-semibold tabular text-text-primary">{running.length}</span>
              <span className="text-[13px] text-text-tertiary ml-1.5">running</span>
            </div>
            <div className="text-[13px] text-text-tertiary">
              {agents.length} total session{agents.length !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {agents.map((a) => (
                <span
                  key={a.paneId}
                  className={`w-2 h-2 rounded-full ${
                    a.status === "running" ? "bg-positive status-running" : "bg-border"
                  }`}
                  role="img"
                  aria-label={`${a.name}: ${a.status}`}
                />
              ))}
            </div>
          </div>
        )}
      </section>

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
              <div
                key={startup.id}
                className="px-4 py-3 hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[13px] font-semibold text-text-primary">{startup.name}</span>
                  <span className="text-[11px] font-medium text-text-tertiary bg-bg px-1.5 py-0.5 rounded uppercase tracking-wide">
                    {startup.type}
                  </span>
                  {startup.deployUrl && (
                    <a
                      href={startup.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-medium text-accent hover:underline ml-auto"
                    >
                      Live
                    </a>
                  )}
                </div>
                <p className="text-[12px] text-text-tertiary truncate">{startup.idea}</p>
                <p className="text-[11px] text-text-tertiary font-mono mt-0.5 truncate">{startup.path}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
