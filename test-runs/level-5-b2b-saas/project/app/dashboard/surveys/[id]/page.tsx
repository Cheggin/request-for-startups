"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  SURVEYS,
  getSurveyResponses,
  getRatingAnswers,
  getTextAnswers,
  getOverallAverage,
} from "@/lib/mock-data";
import {
  calculateAverage,
  getRatingDistribution,
  calculateResponseRate,
  formatDate,
  getStatusColor,
} from "@/lib/utils";

const RATING_COLORS: Record<number, string> = {
  1: "#ef4444",
  2: "#f97316",
  3: "#eab308",
  4: "#22c55e",
  5: "#16a34a",
};

function getRatingBarColor(rating: number): string {
  if (rating <= 2) return "#ef4444";
  if (rating === 3) return "#eab308";
  return "#22c55e";
}

export default function SurveyDetailPage() {
  const params = useParams();
  const surveyId = typeof params.id === "string" ? params.id : params.id?.[0] ?? "";

  const survey = SURVEYS.find((s) => s.id === surveyId);

  if (!survey) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="card text-center py-16">
          <p className="text-muted-foreground text-sm">Survey not found.</p>
          <Link
            href="/dashboard/surveys"
            className="mt-4 inline-block text-primary text-sm font-medium hover:underline"
          >
            Back to Surveys
          </Link>
        </div>
      </div>
    );
  }

  const responses = getSurveyResponses(survey.id);
  const responseRate = calculateResponseRate(survey.responseCount, survey.totalRecipients);
  const overallAvg = getOverallAverage(survey.id);
  const ratingQuestions = survey.questions.filter((q) => q.type === "rating");
  const textQuestions = survey.questions.filter((q) => q.type === "text");

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Back link */}
      <Link
        href="/dashboard/surveys"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to Surveys
      </Link>

      {/* Survey header */}
      <div className="card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{survey.title}</h2>
            {survey.sentAt && (
              <p className="text-sm text-muted-foreground mt-1">
                Sent {formatDate(survey.sentAt)}
              </p>
            )}
            {!survey.sentAt && (
              <p className="text-sm text-muted-foreground mt-1">
                Created {formatDate(survey.createdAt)}
              </p>
            )}
          </div>
          <span className={`badge ${getStatusColor(survey.status)} shrink-0`}>
            {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
          </span>
        </div>

        {/* Response rate bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Response Rate</span>
            <span className="text-sm text-muted-foreground">
              {survey.responseCount}/{survey.totalRecipients} responded &middot; {responseRate}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${responseRate}%` }}
            />
          </div>
        </div>

        {/* Overall average */}
        {overallAvg > 0 && (
          <div className="mt-5 pt-5 border-t border-border flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white text-base font-bold"
              style={{ background: getRatingBarColor(Math.round(overallAvg)) }}
            >
              {overallAvg.toFixed(1)}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Overall Average Rating</p>
              <p className="text-xs text-muted-foreground">
                Across all rating questions and {responses.length} response
                {responses.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Rating questions */}
      {ratingQuestions.map((question) => {
        const ratings = getRatingAnswers(survey.id, question.id);
        const avg = calculateAverage(ratings);
        const distribution = getRatingDistribution(ratings);
        const chartData = [1, 2, 3, 4, 5].map((val) => ({
          rating: String(val),
          count: distribution[val - 1],
          ratingVal: val,
        }));

        return (
          <div key={question.id} className="card">
            <div className="flex items-start justify-between gap-4 mb-4">
              <p className="text-sm font-medium text-foreground">{question.text}</p>
              {avg > 0 && (
                <span
                  className="text-sm font-semibold shrink-0 px-2 py-0.5 rounded-md text-white"
                  style={{ background: getRatingBarColor(Math.round(avg)) }}
                >
                  {avg.toFixed(1)}
                </span>
              )}
            </div>

            {ratings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No responses yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 4, bottom: 4, left: -20 }}
                  barCategoryGap="30%"
                >
                  <XAxis
                    dataKey="rating"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(109,40,217,0.06)" }}
                    contentStyle={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#0f172a",
                    }}
                    formatter={(value) => [value, "Responses"]}
                    labelFormatter={(label) => `Rating ${label}`}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.rating}
                        fill={getRatingBarColor(entry.ratingVal)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}

            <p className="text-xs text-muted-foreground mt-1">
              {ratings.length} response{ratings.length !== 1 ? "s" : ""}
            </p>
          </div>
        );
      })}

      {/* Text questions */}
      {textQuestions.map((question) => {
        const answers = getTextAnswers(survey.id, question.id);
        return (
          <div key={question.id} className="card">
            <p className="text-sm font-medium text-foreground mb-4">{question.text}</p>

            {answers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No responses yet.</p>
            ) : (
              <ul className="space-y-2">
                {answers.map((answer, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-foreground bg-muted/30 rounded-lg px-4 py-3 border border-border/60"
                  >
                    {answer}
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs text-muted-foreground mt-3">
              {answers.length} response{answers.length !== 1 ? "s" : ""} &middot; Anonymous
            </p>
          </div>
        );
      })}

      {/* No data fallback */}
      {responses.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-muted-foreground text-sm">
            No responses have been submitted yet.
          </p>
        </div>
      )}
    </div>
  );
}
