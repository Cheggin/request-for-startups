"use client";

import { ParentSize } from "@visx/responsive";
import { AreaClosed, LinePath } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { scaleTime, scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { LinearGradient } from "@visx/gradient";
import { Group } from "@visx/group";
import { useTooltip, TooltipWithBounds } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { bisector } from "d3-array";
import { useId } from "react";

export interface DataPoint {
  date: Date;
  value: number;
}

interface TrafficChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  valueLabel?: string;
}

const getDate = (d: DataPoint) => d.date;
const getValue = (d: DataPoint) => d.value;
const bisectDate = bisector<DataPoint, Date>((d) => d.date).left;

const margin = { top: 12, right: 12, bottom: 32, left: 44 };

function Chart({ width, height, data }: { width: number; height: number; data: DataPoint[] }) {
  const gradientId = useId();
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    showTooltip,
    hideTooltip,
    tooltipOpen,
  } = useTooltip<DataPoint>();

  if (innerWidth < 10 || innerHeight < 10) return null;

  const xScale = scaleTime({
    domain: [data[0].date, data[data.length - 1].date],
    range: [0, innerWidth],
  });

  const yScale = scaleLinear({
    domain: [0, Math.max(...data.map(getValue)) * 1.15],
    range: [innerHeight, 0],
    nice: true,
  });

  function handleTooltip(event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) {
    const point = localPoint(event) || { x: 0 };
    const x0 = xScale.invert(point.x - margin.left);
    const index = bisectDate(data, x0, 1);
    const d0 = data[index - 1];
    const d1 = data[index];
    const d = d1 && x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
    if (!d) return;
    showTooltip({
      tooltipData: d,
      tooltipLeft: xScale(getDate(d)) + margin.left,
      tooltipTop: yScale(getValue(d)) + margin.top,
    });
  }

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <LinearGradient
          id={gradientId}
          from="var(--foreground)"
          to="var(--foreground)"
          fromOpacity={0.06}
          toOpacity={0}
        />
        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            stroke="var(--border-subtle)"
            strokeDasharray="2,4"
            numTicks={4}
          />
          <AreaClosed
            data={data}
            x={(d) => xScale(getDate(d)) ?? 0}
            y={(d) => yScale(getValue(d)) ?? 0}
            yScale={yScale}
            curve={curveMonotoneX}
            fill={`url(#${gradientId})`}
          />
          <LinePath
            data={data}
            x={(d) => xScale(getDate(d)) ?? 0}
            y={(d) => yScale(getValue(d)) ?? 0}
            curve={curveMonotoneX}
            stroke="var(--foreground)"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          {tooltipData && (
            <>
              <line
                x1={xScale(getDate(tooltipData))}
                x2={xScale(getDate(tooltipData))}
                y1={0}
                y2={innerHeight}
                stroke="var(--border)"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
              <circle
                cx={xScale(getDate(tooltipData))}
                cy={yScale(getValue(tooltipData))}
                r={4}
                fill="var(--surface)"
                stroke="var(--foreground)"
                strokeWidth={2}
              />
            </>
          )}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            numTicks={6}
            tickFormat={(d) => {
              const date = d as Date;
              return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }}
            stroke="var(--border-subtle)"
            tickStroke="transparent"
            tickLabelProps={() => ({
              fill: "var(--muted)",
              fontSize: 11,
              textAnchor: "middle" as const,
              dy: 4,
            })}
          />
          <AxisLeft
            scale={yScale}
            numTicks={4}
            stroke="transparent"
            tickStroke="transparent"
            tickLabelProps={() => ({
              fill: "var(--muted)",
              fontSize: 11,
              textAnchor: "end" as const,
              dx: -6,
              dy: 4,
            })}
          />
          {/* Invisible overlay for mouse events */}
          <rect
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onMouseMove={handleTooltip}
            onMouseLeave={hideTooltip}
            onTouchMove={handleTooltip}
            onTouchEnd={hideTooltip}
          />
        </Group>
      </svg>
      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          className="!bg-foreground !text-background !rounded-lg !shadow-lg !px-2.5 !py-1.5 !text-[12px] !font-medium"
        >
          <div>{getValue(tooltipData)} visitors</div>
          <div className="text-[10px] opacity-60">
            {getDate(tooltipData).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              weekday: "short",
            })}
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}

/**
 * TrafficChart — renders a line chart with area fill.
 * Requires REAL data passed via props. Never generates fake data.
 */
export function TrafficChart({ data, title = "Traffic", subtitle = "Daily visitors", valueLabel = "visitors" }: TrafficChartProps) {
  if (!data || data.length < 2) {
    return (
      <div className="bg-surface border border-border-subtle rounded-xl px-4 py-8 text-center">
        <p className="text-[13px] text-muted">No {title.toLowerCase()} data</p>
        <p className="text-[12px] text-muted-foreground mt-1">
          Connect a data source to see the chart.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border-subtle rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
        <span className="text-[11px] text-muted-foreground">{subtitle}</span>
      </div>
      <div style={{ height: 240 }}>
        <ParentSize debounceTime={10}>
          {({ width, height }) => <Chart width={width} height={height} data={data} />}
        </ParentSize>
      </div>
    </div>
  );
}
