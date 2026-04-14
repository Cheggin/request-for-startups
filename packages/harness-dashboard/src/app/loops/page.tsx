"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLoops } from "@/lib/use-data";
import type { RealLoop } from "@/lib/data";

const STATUS_COLORS = {
  running: "var(--positive)",
  stopped: "var(--border)",
};

const LOOP_TYPE_COLORS: Record<string, string> = {
  custom: "var(--text-tertiary)",
  maintenance: "var(--caution)",
  monitoring: "var(--accent)",
  growth: "var(--positive)",
  improvement: "var(--accent)",
};

function StatusDot({ status }: { status: RealLoop["status"] }) {
  const color = STATUS_COLORS[status];
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      {status === "running" && (
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
  );
}

function LoopCard({
  loop,
  index,
  onAction,
  actionPending,
}: {
  loop: RealLoop;
  index: number;
  onAction: (name: string, action: "start" | "stop") => void;
  actionPending: string | null;
}) {
  const isPending = actionPending === loop.name;
  const typeColor = LOOP_TYPE_COLORS[loop.loopType] || "var(--text-tertiary)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-surface border border-border-subtle rounded-xl p-4 hover:border-border transition-colors"
    >
      {/* Header: status dot + name + badges */}
      <div className="flex items-start gap-2.5 mb-2">
        <StatusDot status={loop.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-text-primary">{loop.name}</span>
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                color: "var(--accent)",
                backgroundColor: "oklch(0.93 0.03 265)",
              }}
            >
              Loop
            </span>
            <span
              className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                color: typeColor,
                backgroundColor: "var(--bg)",
              }}
            >
              {loop.loopType}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-[12px] text-text-secondary mb-3 line-clamp-2 leading-relaxed">
        {loop.description}
      </p>

      {/* Metadata row */}
      <div className="flex items-center gap-4 mb-3 text-[11px] text-text-tertiary font-mono">
        <span title="Interval">
          <span className="text-text-secondary font-sans font-medium">every</span>{" "}
          {loop.interval}
        </span>
        <span title="Skill" className="truncate">
          {loop.skill}
        </span>
        <span title="Agent" className="ml-auto shrink-0">
          <span className="text-text-secondary font-sans font-medium">agent:</span>{" "}
          {loop.agent}
        </span>
      </div>

      {/* Footer: status + action button */}
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle">
        <span
          className="text-[12px] font-medium capitalize"
          style={{ color: STATUS_COLORS[loop.status] }}
        >
          {loop.status}
        </span>

        {loop.createsIssues && (
          <span className="text-[10px] text-text-tertiary">Creates issues</span>
        )}

        <button
          onClick={() => onAction(loop.name, loop.status === "running" ? "stop" : "start")}
          disabled={isPending}
          className={`text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors ${
            isPending
              ? "text-text-tertiary bg-bg cursor-not-allowed"
              : loop.status === "running"
                ? "text-negative bg-bg hover:bg-surface-hover"
                : "text-accent bg-bg hover:bg-surface-hover"
          }`}
        >
          {isPending
            ? loop.status === "running"
              ? "Stopping..."
              : "Starting..."
            : loop.status === "running"
              ? "Stop"
              : "Start"}
        </button>
      </div>
    </motion.div>
  );
}

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
      // Re-fetch after a brief delay to let tmux settle
      setTimeout(() => {
        refetch();
        setActionPending(null);
      }, 2000);
    } catch (e) {
      console.error(`[LoopsPage] Failed to ${action} loop ${name}:`, e);
      setActionPending(null);
    }
  }

  return (
    <div className="px-6 py-5 space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Loops</h1>
        <button
          onClick={refetch}
          className="text-[12px] font-medium text-text-tertiary hover:text-text-primary border border-border px-3 py-1.5 rounded-lg hover:bg-surface-hover transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3">
          <p className="text-[11px] font-medium text-text-tertiary mb-0.5">Running</p>
          <p className="text-xl font-semibold text-text-primary tabular">
            {loading ? "-" : running.length}
            <span className="text-[14px] text-text-tertiary font-normal ml-1">
              / {loops.length}
            </span>
          </p>
        </div>
        <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3">
          <p className="text-[11px] font-medium text-text-tertiary mb-0.5">Total Loops</p>
          <p className="text-xl font-semibold text-text-primary tabular">
            {loading ? "-" : loops.length}
          </p>
        </div>
        <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3">
          <p className="text-[11px] font-medium text-text-tertiary mb-0.5">Source</p>
          <p className="text-[13px] font-medium text-text-primary font-mono">.harness/loops.yml</p>
        </div>
      </div>

      {/* Loop cards */}
      {loading ? (
        <p className="text-[12px] text-text-tertiary py-4">Loading loop definitions...</p>
      ) : error ? (
        <p className="text-[12px] text-negative py-4">Failed to load loops: {error}</p>
      ) : loops.length === 0 ? (
        <div className="bg-surface border border-border-subtle rounded-xl px-4 py-8 text-center">
          <p className="text-[13px] text-text-secondary">No loops defined</p>
          <p className="text-[12px] text-text-tertiary mt-1">
            Define loops in{" "}
            <code className="bg-bg px-1.5 py-0.5 rounded font-mono">.harness/loops.yml</code>{" "}
            to see them here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {loops.map((loop, i) => (
            <LoopCard
              key={loop.name}
              loop={loop}
              index={i}
              onAction={handleAction}
              actionPending={actionPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
