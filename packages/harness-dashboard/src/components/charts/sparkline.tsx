"use client";

import { LinePath, AreaClosed } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { scaleLinear } from "@visx/scale";
import { LinearGradient } from "@visx/gradient";
import { useId } from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  width = 80,
  height = 28,
  color = "var(--foreground)",
  fillOpacity = 0.08,
  strokeWidth = 1.5,
}: SparklineProps) {
  const id = useId();
  const gradientId = `sparkline-grad-${id}`;

  if (data.length < 2) return null;

  const xScale = scaleLinear({
    domain: [0, data.length - 1],
    range: [0, width],
  });

  const yMin = Math.min(...data);
  const yMax = Math.max(...data);
  const padding = (yMax - yMin) * 0.15 || 1;

  const yScale = scaleLinear({
    domain: [yMin - padding, yMax + padding],
    range: [height, 0],
  });

  const getX = (_: number, i: number) => xScale(i) ?? 0;
  const getY = (d: number) => yScale(d) ?? 0;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <LinearGradient
        id={gradientId}
        from={color}
        to={color}
        fromOpacity={fillOpacity}
        toOpacity={0}
      />
      <AreaClosed
        data={data}
        x={getX}
        y={getY}
        yScale={yScale}
        curve={curveMonotoneX}
        fill={`url(#${gradientId})`}
      />
      <LinePath
        data={data}
        x={getX}
        y={getY}
        curve={curveMonotoneX}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* End dot */}
      <circle
        cx={xScale(data.length - 1)}
        cy={yScale(data[data.length - 1])}
        r={2}
        fill={color}
      />
    </svg>
  );
}
