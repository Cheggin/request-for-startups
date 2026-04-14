"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgents } from "@/lib/use-data";
import type { RealAgent } from "@/lib/data";

const STATUS_COLORS = {
  running: "var(--success)",
  idle: "var(--muted-foreground)",
  stopped: "var(--border)",
};

function StatusDot({ status }: { status: RealAgent["status"] }) {
  const color = STATUS_COLORS[status];
  return (
    <span className="relative flex h-2 w-2">
      {status === "running" && (
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
          style={{ backgroundColor: color }}
        />
      )}
      <span
        className="relative inline-flex rounded-full h-2 w-2"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

function AgentCard({ agent }: { agent: RealAgent }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-background border border-border-subtle hover:border-border transition-colors">
      <StatusDot status={agent.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-foreground">
            {agent.name}
          </span>
          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
            {agent.startup}
          </span>
        </div>
        <p className="text-[12px] text-muted mt-0.5 truncate font-mono">
          {agent.lastOutput || "No output"}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
          {agent.cwd}
        </p>
      </div>
    </div>
  );
}

export function AgentPanel() {
  const [expanded, setExpanded] = useState(true);
  const { agents, loading, error } = useAgents(5000); // poll every 5s
  const running = agents.filter((a) => a.status === "running");

  return (
    <div className="border-t border-border bg-surface">
      {/* Header bar — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-4 py-2.5 hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {agents.map((a) => (
              <StatusDot key={a.paneId} status={a.status} />
            ))}
          </div>
          <span className="text-[13px] font-semibold text-foreground">
            {loading
              ? "Loading agents..."
              : error
                ? "Agent data unavailable"
                : agents.length === 0
                  ? "No agents"
                  : `${running.length} agent${running.length !== 1 ? "s" : ""} running`}
          </span>
        </div>

        <div className="flex items-center gap-4 ml-auto text-[12px] text-muted">
          {running.map((a) => (
            <span key={a.paneId} className="hidden sm:inline-flex items-center gap-1.5">
              <StatusDot status="running" />
              <span className="font-medium text-foreground">{a.name}</span>
              <span className="text-muted-foreground">{a.startup}</span>
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
          className={`text-muted transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="18,15 12,9 6,15" />
        </svg>
      </button>

      {/* Expanded panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3">
              {agents.length === 0 && !loading ? (
                <p className="text-[12px] text-muted-foreground py-2">
                  No tmux sessions found. Agents appear here when running via <code className="bg-background px-1 rounded">harness init</code> or tmux.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {agents.map((agent) => (
                    <AgentCard key={agent.paneId} agent={agent} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
