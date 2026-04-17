"use client";

import type { TraceEvent } from "@/lib/types";
import { COLORS } from "@/lib/constants";

interface TraceLogProps {
  events: TraceEvent[];
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function typeColor(type: string): string {
  if (type === "done") return COLORS.running;
  if (type === "needs-approval") return COLORS.idle;
  return COLORS.info;
}

export function TraceLog({ events }: TraceLogProps) {
  if (events.length === 0) {
    return (
      <div className="py-4 text-center text-sm" style={{ color: COLORS.textTertiary }}>
        No trace events yet. Events appear as hooks fire.
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto" role="log" aria-label="Hook trace events">
      <table className="w-full text-[12px] font-mono">
        <thead className="sr-only">
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Type</th>
            <th scope="col">Content</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev, i) => (
            <tr key={`${ev.file}-${i}`} className="border-b" style={{ borderColor: COLORS.borderSubtle }}>
              <td className="py-1.5 pr-3 whitespace-nowrap" style={{ color: COLORS.textTertiary }}>
                {formatTime(ev.timestamp)}
              </td>
              <td className="py-1.5 pr-3 whitespace-nowrap">
                <span
                  className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium uppercase"
                  style={{
                    color: typeColor(ev.type),
                    backgroundColor: ev.type === "done" ? COLORS.runningBg : ev.type === "needs-approval" ? COLORS.idleBg : COLORS.infoBg,
                  }}
                >
                  {ev.type}
                </span>
              </td>
              <td className="py-1.5 truncate max-w-xs" style={{ color: COLORS.textSecondary }}>
                {ev.content}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
