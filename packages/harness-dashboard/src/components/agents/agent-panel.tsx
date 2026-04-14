"use client";

import { useState } from "react";
import { useAgents } from "@/lib/use-data";
import type { RealAgent } from "@/lib/data";

function StatusDot({ status }: { status: RealAgent["status"] }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        status === "running" ? "bg-positive status-running" :
        status === "idle" ? "bg-text-tertiary" : "bg-border"
      }`}
      role="img"
      aria-label={status}
    />
  );
}

function AgentCard({ agent }: { agent: RealAgent }) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2.5 border border-border-subtle rounded-md hover:bg-surface-hover transition-colors">
      <StatusDot status={agent.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-text-primary">
            {agent.name}
          </span>
          <span className="text-[11px] text-text-tertiary ml-auto shrink-0">
            {agent.startup}
          </span>
        </div>
        <p className="text-[12px] text-text-tertiary mt-0.5 truncate font-mono">
          {agent.lastOutput || "No output"}
        </p>
      </div>
    </div>
  );
}

export function AgentPanel() {
  const [expanded, setExpanded] = useState(true);
  const { agents, loading, error } = useAgents(5000);
  const running = agents.filter((a) => a.status === "running");

  return (
    <div className="border-t border-border bg-surface">
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-4 px-4 py-2 hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {agents.map((a) => (
              <StatusDot key={a.paneId} status={a.status} />
            ))}
          </div>
          <span className="text-[13px] font-semibold text-text-primary">
            {loading
              ? "Loading agents..."
              : error
                ? "Agent data unavailable"
                : agents.length === 0
                  ? "No agents"
                  : `${running.length} agent${running.length !== 1 ? "s" : ""} running`}
          </span>
        </div>

        <div className="flex items-center gap-4 ml-auto text-[12px]">
          {running.map((a) => (
            <span key={a.paneId} className="hidden sm:inline-flex items-center gap-1.5">
              <StatusDot status="running" />
              <span className="font-medium text-text-primary">{a.name}</span>
              <span className="text-text-tertiary">{a.startup}</span>
            </span>
          ))}
        </div>

        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-text-tertiary transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <polyline points="18,15 12,9 6,15" />
        </svg>
      </button>

      {/* CSS-only collapse — no framer-motion */}
      <div className="panel-collapse" data-open={expanded}>
        <div>
          <div className="px-4 pb-3">
            {agents.length === 0 && !loading ? (
              <p className="text-[12px] text-text-tertiary py-2">
                No tmux sessions found. Agents appear here when running via <code className="font-mono bg-bg px-1 rounded">harness init</code> or tmux.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {agents.map((agent) => (
                  <AgentCard key={agent.paneId} agent={agent} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
