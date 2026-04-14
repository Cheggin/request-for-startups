"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { getRatingDistribution, calculateAverage } from "@/lib/utils";

const RATING_LABELS = ["1", "2", "3", "4", "5"];

function getBarColor(index: number): string {
  if (index <= 1) return "#ef4444";
  if (index === 2) return "#eab308";
  return "#22c55e";
}

interface ResponseChartProps {
  questionText: string;
  ratings: number[];
}

export default function ResponseChart({ questionText, ratings }: ResponseChartProps) {
  const distribution = getRatingDistribution(ratings);
  const average = calculateAverage(ratings);

  const data = distribution.map((count, i) => ({
    label: RATING_LABELS[i],
    count,
    index: i,
  }));

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4 mb-4">
        <p className="text-sm font-medium text-foreground leading-snug">{questionText}</p>
        <div className="shrink-0 text-right">
          <p className="text-xl font-bold text-primary leading-none">
            {average.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">avg / 5</p>
        </div>
      </div>

      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "#64748b" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
              formatter={(value) => [value, "Responses"]}
              labelFormatter={(label) => `Rating ${label}`}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.label} fill={getBarColor(entry.index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
