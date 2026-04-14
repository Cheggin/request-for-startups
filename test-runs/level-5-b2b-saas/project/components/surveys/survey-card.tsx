"use client";

import Link from "next/link";
import { getStatusColor, formatDate, calculateResponseRate } from "@/lib/utils";

interface SurveyCardProps {
  title: string;
  status: string;
  responseCount: number;
  totalRecipients: number;
  createdAt: number;
  href: string;
}

export default function SurveyCard({
  title,
  status,
  responseCount,
  totalRecipients,
  createdAt,
  href,
}: SurveyCardProps) {
  const responseRate = calculateResponseRate(responseCount, totalRecipients);

  return (
    <Link href={href} className="block group">
      <div className="card transition-shadow hover:shadow-md cursor-pointer">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
            {title}
          </h3>
          <span className={`badge shrink-0 ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {responseCount} / {totalRecipients} responses ({responseRate}%)
          </span>
          <span>{formatDate(createdAt)}</span>
        </div>

        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${responseRate}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
