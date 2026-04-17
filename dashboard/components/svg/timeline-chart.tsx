"use client";

import { COLORS } from "@/lib/constants";
import type { ChainPhase } from "@/lib/types";

interface TimelineChartProps {
  phases: ChainPhase[];
}

export function TimelineChart({ phases }: TimelineChartProps) {
  if (phases.length === 0) return null;

  const dotR = 6;
  const activeR = 8;
  const stepX = 1 / (phases.length - 1 || 1);
  const svgHeight = 40;

  return (
    <svg width="100%" height={svgHeight} viewBox={`0 0 100 ${svgHeight}`} preserveAspectRatio="xMidYMid meet">
      <line
        x1={dotR}
        y1={svgHeight / 2}
        x2={100 - dotR}
        y2={svgHeight / 2}
        stroke={COLORS.timelineLine}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />

      {phases.map((phase, i) => {
        const cx = dotR + (100 - dotR * 2) * (i * stepX);
        const cy = svgHeight / 2;
        const r = phase.isActive ? activeR : dotR;
        const fill = phase.isDone
          ? COLORS.timelineDotDone
          : phase.isActive
            ? COLORS.timelineDotActive
            : COLORS.timelineDotPending;

        return (
          <g key={phase.name}>
            {phase.isActive && (
              <circle cx={cx} cy={cy} r={r + 3} fill={`${COLORS.timelineDotActive}20`} vectorEffect="non-scaling-stroke" />
            )}
            <circle cx={cx} cy={cy} r={r} fill={fill} vectorEffect="non-scaling-stroke">
              <title>{`${phase.name}: ${Math.round(phase.progress * 100)}%`}</title>
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
