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

function LastUpdated() {
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
  return (
    <span className="text-[11px] font-mono" style={{ color: COLORS.textTertiary }}>
      Updated {time}
    </span>
  );
}

export function FleetHeader({ summary, ceoAgent }: FleetHeaderProps) {
  return (
    <div className="border-b" style={{ borderColor: COLORS.border }}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6 sm:gap-10 flex-wrap">
            <StatBlock value={summary.running} label="Running" color={COLORS.running} />
            <StatBlock value={summary.idle} label="Idle" color={COLORS.idle} />
            <StatBlock value={summary.stuck} label="Stuck" color={COLORS.stuck} />
            <div className="hidden sm:block w-px h-12" style={{ backgroundColor: COLORS.border }} />
            <StatBlock value={summary.total} label="Total" color={COLORS.textPrimary} />
          </div>

          <div className="w-full lg:w-80 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${ceoAgent ? "animate-pulse-dot" : ""}`}
                  style={{ backgroundColor: ceoAgent ? COLORS.running : COLORS.textTertiary }}
                />
                <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: COLORS.textTertiary }}>
                  CEO Pane
                </span>
              </div>
              <LastUpdated />
            </div>
            {ceoAgent ? (
              <NudgeInput paneId={ceoAgent.paneId} label="CEO" />
            ) : (
              <p className="text-[12px] font-mono" style={{ color: COLORS.textTertiary }}>
                No CEO pane. Set title: tmux select-pane -T CEO
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
