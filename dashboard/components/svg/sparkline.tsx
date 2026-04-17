"use client";

import { SPARKLINE_WIDTH, SPARKLINE_HEIGHT, COLORS } from "@/lib/constants";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

function buildPath(data: number[], w: number, h: number): { line: string; area: string } {
  if (data.length < 2) return { line: "", area: "" };

  const max = Math.max(...data, 1);
  const stepX = w / (data.length - 1);
  const padding = 2;
  const usableH = h - padding * 2;

  const points = data.map((v, i) => ({
    x: i * stepX,
    y: padding + usableH - (v / max) * usableH,
  }));

  const lineSegments = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`));
  const line = lineSegments.join(" ");
  const area = `${line} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;

  return { line, area };
}

export function Sparkline({ data, width = SPARKLINE_WIDTH, height = SPARKLINE_HEIGHT }: SparklineProps) {
  const { line, area } = buildPath(data, width, height);

  if (!line) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={COLORS.border}
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      </svg>
    );
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={area} fill={COLORS.sparklineFill} />
      <path d={line} fill="none" stroke={COLORS.sparklineStroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
