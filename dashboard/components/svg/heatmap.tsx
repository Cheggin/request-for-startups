"use client";

import { HEATMAP_DAYS, HEATMAP_HOURS, HEATMAP_CELL, HEATMAP_GAP, COLORS } from "@/lib/constants";
import type { ActivityPoint } from "@/lib/types";

interface HeatmapProps {
  data: ActivityPoint[];
}

function getColor(count: number, max: number): string {
  if (count === 0) return COLORS.heatmapEmpty;
  const ratio = count / Math.max(max, 1);
  if (ratio < 0.25) return COLORS.heatmapLow;
  if (ratio < 0.5) return COLORS.heatmapMid;
  if (ratio < 0.75) return COLORS.heatmapHigh;
  return COLORS.heatmapMax;
}

const DAY_LABELS = (() => {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const labels: string[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    labels.push(i === 0 ? "Today" : days[d.getDay()]);
  }
  return labels;
})();
const HOUR_LABELS = ["0", "6", "12", "18"];

export function Heatmap({ data }: HeatmapProps) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const cellStep = HEATMAP_CELL + HEATMAP_GAP;
  const labelOffset = 28;
  const topOffset = 16;
  const width = HEATMAP_HOURS * cellStep + labelOffset;
  const height = HEATMAP_DAYS * cellStep + topOffset;

  const lookup = new Map<string, number>();
  for (const p of data) {
    lookup.set(`${p.day}-${p.hour}`, p.count);
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {HOUR_LABELS.map((label) => {
        const h = parseInt(label);
        return (
          <text
            key={`h-${label}`}
            x={labelOffset + h * cellStep + HEATMAP_CELL / 2}
            y={10}
            textAnchor="middle"
            fill={COLORS.textTertiary}
            fontSize={9}
            fontFamily="var(--font-mono)"
          >
            {label}
          </text>
        );
      })}

      {Array.from({ length: HEATMAP_DAYS }, (_, day) => (
        <text
          key={`d-${day}`}
          x={labelOffset - 6}
          y={topOffset + day * cellStep + HEATMAP_CELL / 2 + 3}
          textAnchor="end"
          fill={COLORS.textTertiary}
          fontSize={9}
          fontFamily="var(--font-mono)"
        >
          {DAY_LABELS[day]}
        </text>
      ))}

      {Array.from({ length: HEATMAP_DAYS }, (_, day) =>
        Array.from({ length: HEATMAP_HOURS }, (_, hour) => {
          const count = lookup.get(`${day}-${hour}`) || 0;
          return (
            <rect
              key={`${day}-${hour}`}
              x={labelOffset + hour * cellStep}
              y={topOffset + day * cellStep}
              width={HEATMAP_CELL}
              height={HEATMAP_CELL}
              rx={2}
              fill={getColor(count, max)}
            >
              <title>{`${DAY_LABELS[day]} ${hour}:00 — ${count} commit${count !== 1 ? "s" : ""}`}</title>
            </rect>
          );
        })
      )}
    </svg>
  );
}
