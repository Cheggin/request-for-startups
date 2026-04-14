"use client";

import { useState } from "react";
import { useAgents, useLoops } from "@/lib/use-data";
import type { RealAgent, RealLoop } from "@/lib/data";

type StatusFilter = RealAgent["status"] | "all";

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Running", value: "running" },
  { label: "Idle", value: "idle" },
  { label: "Stopped", value: "stopped" },
];

function StatusIndicator({ status }: { status: "running" | "idle" | "stopped" }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${
        status === "running" ? "bg-positive status-running" :
        status === "idle" ? "bg-text-tertiary" : "bg-border"
      }`}
      role="img"
      aria-label={status}
    />
  );
}

function LoopBadge() {
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{ color: "var(--accent)", backgroundColor: "oklch(0.93 0.03 265)" }}
    >
      Loop
    </span>
  );
}

function LoopTypeBadge({ loopType }: { loopType: string }) {
  return (
    <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-bg text-text-tertiary">
      {loopType}
    </span>
  );
}

function LoopRow({
  loop,
  onAction,
  actionPending,
}: {
  loop: RealLoop;
  onAction: (name: string, action: "start" | "stop") => void;
  actionPending: string | null;
}) {
  const isPending = actionPending === loop.name;

  return (
    <tr className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <StatusIndicator status={loop.status} />
          <span className="text-[13px] font-semibold text-text-primary">{loop.name}</span>
          <LoopBadge />
          <LoopTypeBadge loopType={loop.loopType} />
        </div>
      </td>
      <td className="px-4 py-2.5 max-w-sm">
        <p className="text-[12px] text-text-secondary truncate">{loop.description}</p>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-[12px] text-text-secondary font-mono">{loop.interval}</span>
      </td>
      <td className="px-4 py-2.5">
        <span className="text-[11px] text-text-tertiary font-mono truncate max-w-48 block">{loop.skill}</span>
      </td>
      <td className="px-4 py-2.5 text-right">
        <div className="flex items-center justify-end gap-2">
          <span className={`text-[12px] font-medium capitalize ${
            loop.status === "running" ? "text-positive" : "text-text-tertiary"
          }`}>
            {loop.status}
          </span>
          <button
            onClick={() => onAction(loop.name, loop.status === "running" ? "stop" : "start")}
            disabled={isPending}
            className={`text-[11px] font-medium px-2 py-1 rounded-md transition-colors ${
              isPending
                ? "text-text-tertiary bg-bg cursor-not-allowed"
                : loop.status === "running"
                  ? "text-negative hover:bg-surface-hover border border-border"
                  : "text-accent hover:bg-surface-hover border border-border"
            }`}
          >
            {isPending
              ? loop.status === "running" ? "Stopping..." : "Starting..."
              : loop.status === "running" ? "Stop" : "Start"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AgentsPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const { agents, loading: agentsLoading, error: agentsError, refetch: refetchAgents } = useAgents(5000);
  const { loops, loading: loopsLoading, error: loopsError, refetch: refetchLoops } = useLoops(5000);
  const [actionPending, setActionPending] = useState<string | null>(null);

  const filtered = filter === "all" ? agents : agents.filter((a) => a.status === filter);
  const runningAgents = agents.filter((a) => a.status === "running");
  const runningLoops = loops.filter((l) => l.status === "running");

  function refetch() {
    refetchAgents();
    refetchLoops();
  }

  async function handleLoopAction(name: string, action: "start" | "stop") {
    setActionPending(name);
    console.log(`[AgentsPage] ${action} loop: ${name}`);
    try {
      const res = await fetch(`/api/loops/${name}/${action}`, { method: "POST" });
      const data = await res.json();
      console.log(`[AgentsPage] ${action} response:`, data);
      setTimeout(() => {
        refetchLoops();
        setActionPending(null);
      }, 2000);
    } catch (e) {
      console.error(`[AgentsPage] Failed to ${action} loop ${name}:`, e);
      setActionPending(null);
    }
  }

  const loading = agentsLoading || loopsLoading;
  const error = agentsError || loopsError;

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
          <span className="text-[24px] font-semibold tabular text-text-primary">{runningAgents.length}</span>
          <span className="text-[13px] text-text-tertiary ml-1.5">agents running</span>
        </div>
        <div>
          <span className="text-[24px] font-semibold tabular text-text-primary">{runningLoops.length}</span>
          <span className="text-[13px] text-text-tertiary ml-1.5">loops running</span>
        </div>
        <div className="text-[13px] text-text-tertiary">
          {agents.length + loops.length} total
        </div>
      </div>

      {loading ? (
        <p className="text-[13px] text-text-tertiary py-4">Loading from tmux and loops.yml...</p>
      ) : error ? (
        <p className="text-[13px] text-negative py-4">Error: {error}</p>
      ) : agents.length === 0 && loops.length === 0 ? (
        <div className="border border-border-subtle rounded-md px-4 py-5">
          <p className="text-[13px] text-text-secondary">No tmux sessions or loops found.</p>
          <p className="text-[12px] text-text-tertiary mt-1">
            Start agents with <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">harness init</code> or define loops in <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">.harness/loops.yml</code>
          </p>
        </div>
      ) : (
        <>
          {/* Loops section */}
          {loops.length > 0 && (
            <div className="mb-6">
              <h2 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
                Loops
                <span className="text-text-tertiary font-normal ml-1.5">({loops.length})</span>
              </h2>
              <div className="border border-border-subtle rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Loop</th>
                      <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Description</th>
                      <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Interval</th>
                      <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Skill</th>
                      <th className="px-4 py-2 text-[11px] font-medium text-text-tertiary uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loops.map((loop) => (
                      <LoopRow
                        key={loop.name}
                        loop={loop}
                        onAction={handleLoopAction}
                        actionPending={actionPending}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Agents section */}
          <div>
            <h2 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Agents
              <span className="text-text-tertiary font-normal ml-1.5">({agents.length})</span>
            </h2>

            {/* Filter tabs */}
            <div className="flex items-center gap-0.5 border-b border-border-subtle mb-3" role="tablist" aria-label="Filter agents by status">
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

            {agents.length === 0 ? (
              <div className="border border-border-subtle rounded-md px-4 py-5">
                <p className="text-[13px] text-text-secondary">No tmux sessions found.</p>
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
                          {agent.lastOutput ? (
                            <pre className="text-[11px] text-text-secondary font-mono whitespace-pre-wrap leading-relaxed line-clamp-3">{agent.lastOutput}</pre>
                          ) : (
                            <p className="text-[12px] text-text-tertiary font-mono">No output</p>
                          )}
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
        </>
      )}
    </div>
  );
}
