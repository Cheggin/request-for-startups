"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAgents } from "@/lib/use-data";
import type { RealAgent } from "@/lib/data";

const STATUS_COLORS = {
  running: "var(--success)",
  idle: "var(--muted-foreground)",
  stopped: "var(--border)",
};

type StatusFilter = RealAgent["status"] | "all";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Running", value: "running" },
  { label: "Idle", value: "idle" },
  { label: "Stopped", value: "stopped" },
];

function AgentRow({ agent, index }: { agent: RealAgent; index: number }) {
  const color = STATUS_COLORS[agent.status];
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="border-b border-border-subtle last:border-0 hover:bg-surface-hover/50 transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            {agent.status === "running" && (
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                style={{ backgroundColor: color }}
              />
            )}
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ backgroundColor: color }}
            />
          </span>
          <span className="text-[13px] font-semibold text-foreground">{agent.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 max-w-sm">
        <p className="text-[12px] text-muted truncate font-mono">{agent.lastOutput || "No output"}</p>
      </td>
      <td className="px-4 py-3">
        <span className="text-[12px] text-muted-foreground">{agent.startup}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-[11px] text-muted-foreground font-mono truncate max-w-48 block">{agent.cwd}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-[12px] font-medium capitalize" style={{ color }}>
          {agent.status}
        </span>
      </td>
    </motion.tr>
  );
}

export default function AgentsPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const { agents, loading, error, refetch } = useAgents(5000);

  const filtered = filter === "all" ? agents : agents.filter((a) => a.status === filter);
  const running = agents.filter((a) => a.status === "running");

  return (
    <div className="px-6 py-5 space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Agents</h1>
        <button
          onClick={refetch}
          className="text-[12px] font-medium text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3">
          <p className="text-[11px] font-medium text-muted mb-0.5">Running</p>
          <p className="text-xl font-semibold text-foreground">{running.length}</p>
        </div>
        <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3">
          <p className="text-[11px] font-medium text-muted mb-0.5">Total Sessions</p>
          <p className="text-xl font-semibold text-foreground">{agents.length}</p>
        </div>
        <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3">
          <p className="text-[11px] font-medium text-muted mb-0.5">Source</p>
          <p className="text-[13px] font-medium text-foreground">tmux (live)</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-border-subtle pb-px">
        {STATUS_FILTERS.map((f) => {
          const count = f.value === "all" ? agents.length : agents.filter((a) => a.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-[12px] font-medium px-3 py-1.5 rounded-t-md transition-colors ${
                filter === f.value
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
              <span className="text-[10px] text-muted-foreground ml-1">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Agent table */}
      {loading ? (
        <p className="text-[12px] text-muted-foreground py-4">Loading agent data from tmux...</p>
      ) : error ? (
        <p className="text-[12px] text-error py-4">Error: {error}</p>
      ) : agents.length === 0 ? (
        <div className="bg-surface border border-border-subtle rounded-xl px-4 py-8 text-center">
          <p className="text-[13px] text-muted">No tmux sessions found</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            Start agents with <code className="bg-background px-1.5 py-0.5 rounded">harness init</code> or spawn tmux sessions manually
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Agent</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Last Output</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Project</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Working Dir</th>
                <th className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((agent, i) => (
                <AgentRow key={agent.paneId} agent={agent} index={i} />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
              No agents with status &ldquo;{filter}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
