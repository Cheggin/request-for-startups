"use client";

import { useState } from "react";
import { useLoops } from "@/lib/use-data";

export default function LoopsPage() {
  const { loops, loading, error, refetch } = useLoops(5000);
  const [actionPending, setActionPending] = useState<string | null>(null);

  const running = loops.filter((l) => l.status === "running");

  async function handleAction(name: string, action: "start" | "stop") {
    setActionPending(name);
    console.log(`[LoopsPage] ${action} loop: ${name}`);
    try {
      const res = await fetch(`/api/loops/${name}/${action}`, { method: "POST" });
      const data = await res.json();
      console.log(`[LoopsPage] ${action} response:`, data);
      setTimeout(() => { refetch(); setActionPending(null); }, 2000);
    } catch (e) {
      console.error(`[LoopsPage] Failed to ${action} loop ${name}:`, e);
      setActionPending(null);
    }
  }

  return (
    <div className="px-6 py-5 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[18px] font-semibold text-text-primary leading-tight">Loops</h1>
        <button onClick={refetch} className="text-[12px] font-medium text-text-tertiary hover:text-text-primary border border-border px-3 py-1.5 rounded-md hover:bg-surface-hover transition-colors">
          Refresh
        </button>
      </div>

      <div className="flex items-baseline gap-6 mb-5">
        <div>
          <span className="text-[24px] font-semibold tabular text-text-primary">{loading ? "-" : running.length}</span>
          <span className="text-[13px] text-text-tertiary ml-1.5">running</span>
        </div>
        <div className="text-[13px] text-text-tertiary">{loops.length} total</div>
      </div>

      {loading ? (
        <p className="text-[13px] text-text-tertiary py-4">Loading loop definitions...</p>
      ) : error ? (
        <p className="text-[13px] text-negative py-4">Failed to load loops: {error}</p>
      ) : loops.length === 0 ? (
        <div className="border border-border-subtle rounded-md px-4 py-5">
          <p className="text-[13px] text-text-secondary">No loops defined.</p>
          <p className="text-[12px] text-text-tertiary mt-1">
            Define loops in <code className="font-mono text-[12px] text-text-secondary bg-bg px-1 py-0.5 rounded">.harness/loops.yml</code>
          </p>
        </div>
      ) : (
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
              {loops.map((loop) => {
                const isPending = actionPending === loop.name;
                return (
                  <tr key={loop.name} className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${loop.status === "running" ? "bg-positive status-running" : "bg-border"}`} />
                        <span className="text-[13px] font-semibold text-text-primary">{loop.name}</span>
                        <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-bg text-text-tertiary">{loop.loopType}</span>
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
                        <span className={`text-[12px] font-medium capitalize ${loop.status === "running" ? "text-positive" : "text-text-tertiary"}`}>
                          {loop.status}
                        </span>
                        <button
                          onClick={() => handleAction(loop.name, loop.status === "running" ? "stop" : "start")}
                          disabled={isPending}
                          className={`text-[11px] font-medium px-2 py-1 rounded-md transition-colors ${
                            isPending ? "text-text-tertiary bg-bg cursor-not-allowed"
                            : loop.status === "running" ? "text-negative hover:bg-surface-hover border border-border"
                            : "text-accent hover:bg-surface-hover border border-border"
                          }`}>
                          {isPending ? (loop.status === "running" ? "Stopping..." : "Starting...") : (loop.status === "running" ? "Stop" : "Start")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
