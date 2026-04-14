"use client";

import { useState } from "react";
import Link from "next/link";
import { SURVEYS } from "@/lib/mock-data";
import { formatDate, getStatusColor } from "@/lib/utils";

const FILTER_TABS = ["All", "Active", "Draft", "Closed"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

export default function SurveysPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");

  const filteredSurveys = SURVEYS.filter((survey) => {
    if (activeFilter === "All") return true;
    return survey.status === activeFilter.toLowerCase();
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Surveys</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and review your team pulse surveys
          </p>
        </div>
        <Link href="/dashboard/surveys/new">
          <button className="btn-primary">New Survey</button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b border-border">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={[
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              activeFilter === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Survey list */}
      <div className="card p-0 overflow-hidden">
        {filteredSurveys.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            No surveys found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Title
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Responses
                </th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">
                  Date Created
                </th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSurveys.map((survey, idx) => (
                <tr
                  key={survey.id}
                  className={[
                    "transition-colors hover:bg-muted/20",
                    idx < filteredSurveys.length - 1 ? "border-b border-border" : "",
                  ].join(" ")}
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/dashboard/surveys/${survey.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {survey.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge ${getStatusColor(survey.status)}`}>
                      {survey.status.charAt(0).toUpperCase() + survey.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {survey.responseCount}/{survey.totalRecipients}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {formatDate(survey.createdAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/dashboard/surveys/${survey.id}`}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
