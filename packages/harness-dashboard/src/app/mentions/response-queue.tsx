"use client";

import type { ResponseQueueItem } from "@/lib/data";
import { PLATFORM_LABELS_SHORT } from "@/lib/constants";

const STATUS_STYLES: Record<string, string> = {
  queued: "bg-caution/10 text-caution",
  drafted: "bg-accent/10 text-accent",
  posted: "bg-positive/10 text-positive",
  attributed: "bg-text-secondary/10 text-text-secondary",
};

interface ResponseQueueProps {
  items: ResponseQueueItem[];
}

export function ResponseQueue({ items }: ResponseQueueProps) {
  return (
    <div className="border border-border-subtle rounded-md overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider w-12">
              Pri.
            </th>
            <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider w-16">
              Src
            </th>
            <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
              Reply Angle
            </th>
            <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider w-20 text-center">
              Status
            </th>
            <th className="px-4 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider w-16">
              Link
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.mentionId}
              className="border-b border-border-subtle last:border-0 hover:bg-surface-hover transition-colors"
            >
              <td className="px-4 py-2.5 text-sm font-mono font-semibold text-text-primary tabular">
                {item.priority.toFixed(1)}
              </td>
              <td className="px-4 py-2.5 text-xs font-medium text-text-secondary">
                {PLATFORM_LABELS_SHORT[item.platform] ?? item.platform}
              </td>
              <td className="px-4 py-2.5 text-sm text-text-secondary">
                {item.replyAngle}
              </td>
              <td className="px-4 py-2.5 text-center">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-2xs font-medium ${STATUS_STYLES[item.status] ?? ""}`}
                >
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-text-tertiary hover:text-text-primary hover:underline"
                >
                  Open
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
