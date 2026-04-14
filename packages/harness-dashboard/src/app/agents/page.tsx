"use client";

import { useState } from "react";
import { useAgents } from "@/lib/use-data";
import type { RealAgent } from "@/lib/data";

type StatusFilter = RealAgent["status"] | "all";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Running", value: "running" },
  { label: "Idle", value: "idle" },
  { label: "Stopped", value: "stopped" },
];

function StatusIndicator({ status }: { status: RealAgent["status"] }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        status === "running" ? "bg-positive status-running" :
        status === "idle" ? "bg-text-tertiary" : "bg-border"
      }`}
      role="img"
      aria-label={status}
    />
  );
}

export default function AgentsPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const { agents, loading, error, refetch } = useAgents(5000);

  const filtered = filter === "all" ? agents : agents.filter((a) => a.status === filter);
  const running = agents.filter((a) => a.status === "running");

  return (
    <div className="px-6 py-5 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[18px] font-semibold text-text-primary leading-tight">Agents</h1>
        <button
          onClick={refetch}
          className="text-[12px] font-medium text-text-secondary hover:text-text-primary border border-border px-3 py-1.5 rounded-md hover:bg-surface-hover transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary line */}
      <div className="flex items-baseline gap-6 mb-5">
        <div>
          <span className="text-[24px] font-semibold tabular text-text-primary">{running.length}</span>
          <span className="text-[13px] text-text-tertiary ml-1.5">running</span>
        </div>
        <div className="text-[13px] text-text-tertiary">
          {agents.length} total
        </div>
        <div className="text-[13px] text-text-tertiary">
          Source: tmux (live)
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0.5 border-b border-border-subtle mb-4" role="tablist" aria-label="Filter agents by status">
        {STATUS_FILTERS.map((f) => {
          const count = f.value === "all" ? agents.length : agents.filter((a) => a.status === f.value).length;
          const isSelected = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              role="tab"
              aria-selected={isSelected}
              className={`text-[12px] font-medium px-3 py-2 -mb-px transition-colors ${
                isSelected
                  ? "text-text-primary border-b-2 border-text-primary"
                  : "text-text-tertiary hover:text-text-primary"
              }`}
            >
              {f.label}
              <span className="text-[11px] text-text-tertiary ml-1">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Agent table */}
      {loading ? (
        <p className="text-[13px] text-text-tertiary py-4">Loading agent data from tmux...</p>
      ) : error ? (
        <p className="text-[13px] text-negative py-4">Error: {error}</p>
      ) : agents.length === 0 ? (
        <div className="border border-border-subtle rounded-md px-4 py-5">
          <p className="text-[13px] text-text-secondary">No tmux sessions found.</p>
          <p className="text-[12px] text-text-tertiary mt-1">
            Start agents with <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">harness init</code> or spawn tmux sessions manually.
          </p>
        </div>
      ) : (
        <div className="border border-border-subtle rounded-md overflow-hidden" role="tabpanel">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Agent</th>
                <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Last Output</th>
                <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Project</th>
                <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Working Dir</th>
                <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agent) => (
                <tr
                  key={agent.paneId}
                  className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <StatusIndicator status={agent.status} />
                      <span className="text-[13px] font-semibold text-text-primary">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 max-w-sm">
                    <p className="text-[12px] text-text-tertiary truncate font-mono">{agent.lastOutput || "No output"}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[12px] text-text-secondary">{agent.startup}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[11px] text-text-tertiary font-mono truncate max-w-48 block">{agent.cwd}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`text-[12px] font-medium capitalize ${
                      agent.status === "running" ? "text-positive" :
                      agent.status === "idle" ? "text-text-tertiary" : "text-text-tertiary"
                    }`}>
                      {agent.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-[13px] text-text-tertiary">
              No agents with status &ldquo;{filter}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
