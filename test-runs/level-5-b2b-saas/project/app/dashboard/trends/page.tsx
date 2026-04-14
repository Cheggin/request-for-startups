"use client";

import { useState, useMemo } from "react";
import { WEEKLY_TRENDS } from "@/lib/mock-data";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const QUESTION_IDS = ["q1", "q2", "q3"] as const;
type QuestionId = (typeof QUESTION_IDS)[number];

const QUESTION_COLORS: Record<QuestionId, string> = {
  q1: "#6d28d9",
  q2: "#8b5cf6",
  q3: "#22c55e",
};

const QUESTION_LABELS: Record<QuestionId, string> = {
  q1: "Overall satisfaction",
  q2: "Team support",
  q3: "Workload manageability",
};

type ChartRow = {
  weekLabel: string;
  week: string;
  q1?: number;
  q2?: number;
  q3?: number;
};

function buildChartData(): ChartRow[] {
  const weekMap = new Map<string, ChartRow>();

  for (const entry of WEEKLY_TRENDS) {
    const existing = weekMap.get(entry.week) ?? { week: entry.week, weekLabel: entry.weekLabel };
    (existing as Record<string, unknown>)[entry.questionId] = entry.averageRating;
    weekMap.set(entry.week, existing as ChartRow);
  }

  return Array.from(weekMap.values()).sort((a, b) => a.week.localeCompare(b.week));
}

function computeSummary(chartData: ChartRow[]) {
  const first = chartData[0];
  const last = chartData[chartData.length - 1];

  const changes: Record<QuestionId, number> = {
    q1: (last.q1 ?? 0) - (first.q1 ?? 0),
    q2: (last.q2 ?? 0) - (first.q2 ?? 0),
    q3: (last.q3 ?? 0) - (first.q3 ?? 0),
  };

  const currentValues: Record<QuestionId, number> = {
    q1: last.q1 ?? 0,
    q2: last.q2 ?? 0,
    q3: last.q3 ?? 0,
  };

  const variances: Record<QuestionId, number> = {} as Record<QuestionId, number>;
  for (const qId of QUESTION_IDS) {
    const values = chartData.map((row) => (row[qId] ?? 0) as number).filter((v) => v > 0);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    variances[qId] = variance;
  }

  const highestTrending = QUESTION_IDS.reduce((best, qId) =>
    changes[qId] > changes[best] ? qId : best
  );

  const needsAttention = QUESTION_IDS.reduce((worst, qId) =>
    currentValues[qId] < currentValues[worst] ? qId : worst
  );

  const mostStable = QUESTION_IDS.reduce((stable, qId) =>
    variances[qId] < variances[stable] ? qId : stable
  );

  return { highestTrending, needsAttention, mostStable, changes, currentValues };
}

const CHART_DATA = buildChartData();

export default function TrendsPage() {
  const [hiddenQuestions, setHiddenQuestions] = useState<Set<QuestionId>>(new Set());

  const summary = useMemo(() => computeSummary(CHART_DATA), []);

  function toggleQuestion(qId: QuestionId) {
    setHiddenQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Highest Trending
          </p>
          <p className="text-sm font-semibold text-foreground">
            {QUESTION_LABELS[summary.highestTrending]}
          </p>
          <p className="text-xs text-emerald-600 mt-1 font-medium">
            +{summary.changes[summary.highestTrending].toFixed(2)} over 8 weeks
          </p>
        </div>

        <div className="card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Needs Attention
          </p>
          <p className="text-sm font-semibold text-foreground">
            {QUESTION_LABELS[summary.needsAttention]}
          </p>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            Current avg: {summary.currentValues[summary.needsAttention].toFixed(1)} / 5
          </p>
        </div>

        <div className="card">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
            Most Stable
          </p>
          <p className="text-sm font-semibold text-foreground">
            {QUESTION_LABELS[summary.mostStable]}
          </p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            Low variance over 8 weeks
          </p>
        </div>
      </div>

      {/* Chart card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-semibold text-foreground">Weekly Ratings</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Average scores per question over the last 8 weeks
            </p>
          </div>

          {/* Question filter */}
          <div className="flex flex-wrap gap-2">
            {QUESTION_IDS.map((qId) => {
              const hidden = hiddenQuestions.has(qId);
              return (
                <button
                  key={qId}
                  onClick={() => toggleQuestion(qId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer"
                  style={{
                    borderColor: hidden ? "#e2e8f0" : QUESTION_COLORS[qId],
                    background: hidden ? "#f1f5f9" : `${QUESTION_COLORS[qId]}18`,
                    color: hidden ? "#64748b" : QUESTION_COLORS[qId],
                  }}
                  aria-pressed={!hidden}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: hidden ? "#94a3b8" : QUESTION_COLORS[qId] }}
                  />
                  {QUESTION_LABELS[qId]}
                </button>
              );
            })}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={CHART_DATA}
            margin={{ top: 4, right: 16, left: -16, bottom: 4 }}
          >
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: "#64748b" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 13,
              }}
              labelStyle={{ fontWeight: 600, color: "#0f172a", marginBottom: 4 }}
              formatter={(value, name) => [typeof value === "number" ? value.toFixed(1) : value, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              formatter={(value) => (
                <span style={{ color: "#0f172a" }}>{value}</span>
              )}
            />
            {QUESTION_IDS.map((qId) =>
              hiddenQuestions.has(qId) ? null : (
                <Line
                  key={qId}
                  type="monotone"
                  dataKey={qId}
                  name={QUESTION_LABELS[qId]}
                  stroke={QUESTION_COLORS[qId]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: QUESTION_COLORS[qId], strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              )
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
