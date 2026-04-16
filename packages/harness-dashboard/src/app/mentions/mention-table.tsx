"use client";

import type { MentionItem } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { PLATFORM_LABELS_SHORT } from "@/lib/constants";

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-text-tertiary",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface MentionTableProps {
  mentions: MentionItem[];
}

export function MentionTable({ mentions }: MentionTableProps) {
  return (
    <div className="border border-border-subtle rounded-md overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider w-12">
              Score
            </th>
            <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider w-16">
              Src
            </th>
            <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Title
            </th>
            <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider w-20">
              Keyword
            </th>
            <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right w-16">
              Eng.
            </th>
            <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider text-center w-16">
              Sent.
            </th>
            <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider text-right w-12">
              Age
            </th>
          </tr>
        </thead>
        <tbody>
          {mentions.map((mention) => (
            <tr
              key={mention.dedupKey}
              className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors"
            >
              <td className="px-4 py-2.5 text-sm font-mono font-semibold text-text-primary tabular">
                {mention.score.toFixed(1)}
              </td>
              <td className="px-4 py-2.5 text-xs font-medium text-text-secondary">
                {PLATFORM_LABELS[mention.platform] ?? mention.platform}
              </td>
              <td className="px-4 py-2.5 text-sm text-text-primary max-w-md truncate">
                <a
                  href={mention.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {mention.title.length > 80
                    ? mention.title.slice(0, 80) + "..."
                    : mention.title}
                </a>
              </td>
              <td className="px-4 py-2.5 text-xs font-mono text-text-tertiary truncate max-w-[100px]">
                {mention.keyword.split(",")[0]}
              </td>
              <td className="px-4 py-2.5 text-sm text-text-primary text-right tabular">
                {formatNumber(mention.engagement)}
              </td>
              <td
                className={`px-4 py-2.5 text-xs font-medium text-center ${SENTIMENT_COLORS[mention.sentiment] ?? ""}`}
              >
                {mention.sentiment}
              </td>
              <td className="px-4 py-2.5 text-xs text-text-tertiary text-right">
                {timeAgo(mention.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
