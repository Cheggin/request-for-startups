"use client";

import { useState } from "react";
import type { Agent } from "@/lib/types";
import { COLORS, STATUS_LABELS } from "@/lib/constants";
import { NudgeInput } from "./nudge-input";

interface AgentCardProps {
  agent: Agent;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function statusColor(status: string): string {
  if (status === "running") return COLORS.running;
  if (status === "idle") return COLORS.idle;
  return COLORS.stuck;
}

function statusBg(status: string): string {
  if (status === "stuck") return COLORS.stuckBg;
  if (status === "idle") return COLORS.idleBg;
  return "transparent";
}

export function AgentCard({ agent }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const color = statusColor(agent.status);
  const bg = statusBg(agent.status);

  return (
    <div
      className="border rounded-lg p-4 flex flex-col gap-3"
      style={{
        borderColor: agent.status === "stuck" ? COLORS.stuck : COLORS.border,
        backgroundColor: bg === "transparent" ? COLORS.surface : bg,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`inline-block w-2 h-2 rounded-full shrink-0 ${agent.status === "running" ? "animate-pulse-dot" : ""}`}
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-semibold truncate">{agent.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono" style={{ color: COLORS.textTertiary }}>
            {agent.paneId}
          </span>
          <span
            className="text-[11px] font-medium uppercase tracking-wide"
            style={{ color }}
          >
            {STATUS_LABELS[agent.status]}
          </span>
        </div>
      </div>

      {agent.status !== "running" && (
        <span className="text-[12px] font-mono" style={{ color }}>
          {formatDuration(agent.idleDuration)} idle
        </span>
      )}

      <button
        type="button"
        className="text-left text-[12px] font-mono leading-relaxed cursor-pointer w-full"
        style={{ color: COLORS.textSecondary }}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Collapse" : "Expand"} output for ${agent.name}`}
      >
        {expanded ? (
          <pre className="whitespace-pre-wrap break-all">{agent.lastOutput || "No output"}</pre>
        ) : (
          <p className="line-clamp-2">{agent.lastOutput?.split("\n").slice(-2).join(" ") || "No output"}</p>
        )}
      </button>

      <NudgeInput paneId={agent.paneId} label={agent.name} />
    </div>
  );
}
