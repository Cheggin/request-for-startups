"use client";

import { Sparkline } from "@/components/charts/sparkline";

interface MetricCardProps {
  label: string;
  value: string;
  sparklineData?: number[];
  color?: string;
}

export function MetricCard({ label, value, sparklineData, color }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface px-4 py-3 hover:bg-surface-hover transition-colors">
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-0.5">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-display font-bold tabular text-text-primary leading-tight">{value}</p>
        {sparklineData && sparklineData.length >= 2 && (
          <Sparkline
            data={sparklineData}
            width={64}
            height={28}
            color={color || "var(--text-primary)"}
          />
        )}
      </div>
    </div>
  );
}
