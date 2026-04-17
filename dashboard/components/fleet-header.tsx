"use client";

import type { FleetSummary, Agent } from "@/lib/types";
import { COLORS } from "@/lib/constants";
import { NudgeInput } from "./nudge-input";

interface FleetHeaderProps {
  summary: FleetSummary;
  ceoAgent: Agent | null;
}

function StatBlock({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="text-5xl font-bold font-mono tabular-nums leading-none"
        style={{ color, letterSpacing: "-0.02em" }}
      >
        {value}
      </span>
      <span className="mt-1 text-[11px] font-medium uppercase tracking-widest" style={{ color: COLORS.textTertiary }}>
        {label}
      </span>
    </div>
  );
}

export function FleetHeader({ summary, ceoAgent }: FleetHeaderProps) {
  return (
    <div className="border-b" style={{ borderColor: COLORS.border }}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-10">
            <StatBlock value={summary.running} label="Running" color={COLORS.running} />
            <StatBlock value={summary.idle} label="Idle" color={COLORS.idle} />
            <StatBlock value={summary.stuck} label="Stuck" color={COLORS.stuck} />
            <div className="w-px h-12" style={{ backgroundColor: COLORS.border }} />
            <StatBlock value={summary.total} label="Total" color={COLORS.textPrimary} />
          </div>

          <div className="w-80">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-block w-2 h-2 rounded-full ${ceoAgent ? "animate-pulse-dot" : ""}`}
                style={{ backgroundColor: ceoAgent ? COLORS.running : COLORS.textTertiary }}
              />
              <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: COLORS.textTertiary }}>
                CEO Pane
              </span>
            </div>
            {ceoAgent ? (
              <NudgeInput paneId={ceoAgent.paneId} label="CEO" />
            ) : (
              <p className="text-[12px] font-mono" style={{ color: COLORS.textTertiary }}>
                CEO pane not found. Set title: tmux select-pane -T CEO
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
