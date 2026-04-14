"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  SURVEYS,
  WEEKLY_TRENDS,
  getOverallAverage,
} from "@/lib/mock-data";
import { getStatusColor, formatRelativeDate } from "@/lib/utils";

const ACTIVE_SURVEY = SURVEYS.find((s) => s.id === "survey_1")!;
const HEALTH_SCORE = getOverallAverage("survey_1");
const RESPONSE_COUNT = ACTIVE_SURVEY.responseCount;
const TOTAL_RECIPIENTS = ACTIVE_SURVEY.totalRecipients;
const RESPONSE_RATE = Math.round((RESPONSE_COUNT / TOTAL_RECIPIENTS) * 100);
const RECENT_SURVEYS = SURVEYS.slice(0, 3);

// Build sparkline data: overall average per week across all questions for last 8 weeks
const WEEK_LABELS = ["W7", "W8", "W9", "W10", "W11", "W12", "W13", "W14"];
const SPARKLINE_DATA = WEEK_LABELS.map((week) => {
  const entries = WEEKLY_TRENDS.filter((t) => t.week === week);
  const avg =
    entries.length > 0
      ? entries.reduce((sum, e) => sum + e.averageRating, 0) / entries.length
      : 0;
  const weekLabel = entries[0]?.weekLabel ?? week;
  return { week, weekLabel, avg: Math.round(avg * 10) / 10 };
});

function ScoreRing({ value }: { value: number }) {
  const pct = value / 5;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} strokeWidth="8" stroke="#ede9fe" fill="none" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          strokeWidth="8"
          stroke="#6d28d9"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground leading-none">
          {value.toFixed(1)}
        </span>
        <span className="text-[10px] text-muted-foreground mt-0.5">/ 5</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${getStatusColor(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Health Score */}
        <div className="card flex items-center gap-5">
          <ScoreRing value={HEALTH_SCORE} />
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Health Score
            </p>
            <p className="text-sm text-foreground/80">
              Based on latest survey
            </p>
            <p className="text-xs text-muted-foreground mt-1">Week 14 · Active</p>
          </div>
        </div>

        {/* Response Rate */}
        <div className="card flex flex-col justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Response Rate
          </p>
          <div>
            <p className="text-4xl font-bold text-foreground leading-none">
              {RESPONSE_RATE}
              <span className="text-xl font-medium text-muted-foreground">%</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {RESPONSE_COUNT} of {TOTAL_RECIPIENTS} responded
            </p>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${RESPONSE_RATE}%` }}
            />
          </div>
        </div>

        {/* Recent Survey */}
        <div className="card flex flex-col justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Current Survey
          </p>
          <div>
            <p className="text-base font-semibold text-foreground leading-snug">
              {ACTIVE_SURVEY.title}
            </p>
            {ACTIVE_SURVEY.sentAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Sent {formatRelativeDate(ACTIVE_SURVEY.sentAt)}
              </p>
            )}
          </div>
          <StatusBadge status={ACTIVE_SURVEY.status} />
        </div>
      </div>

      {/* Weekly Sparkline */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Weekly Trend</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Overall average rating — last 8 weeks
            </p>
          </div>
          <span className="text-2xl font-bold text-primary">
            {SPARKLINE_DATA[SPARKLINE_DATA.length - 1].avg.toFixed(1)}
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={SPARKLINE_DATA} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="weekLabel"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[1, 5]}
                ticks={[1, 2, 3, 4, 5]}
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
                labelStyle={{ fontWeight: 600, marginBottom: 2 }}
                formatter={(value) => [typeof value === "number" ? value.toFixed(1) : value, "Avg rating"]}
              />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#6d28d9"
                strokeWidth={2}
                dot={{ r: 3, fill: "#6d28d9", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#6d28d9", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Surveys */}
      <div className="card">
        <p className="text-sm font-semibold text-foreground mb-4">Recent Surveys</p>
        <div className="divide-y divide-border">
          {RECENT_SURVEYS.map((survey) => (
            <div
              key={survey.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {survey.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {survey.responseCount} / {survey.totalRecipients} responses
                  {survey.sentAt ? ` · ${formatRelativeDate(survey.sentAt)}` : ""}
                </p>
              </div>
              <div className="shrink-0">
                <StatusBadge status={survey.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
