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
    <div className="border border-border-subtle rounded-md px-4 py-3 hover:bg-surface-hover transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-semibold tabular text-text-primary leading-tight">{value}</p>
        </div>
        {sparklineData && sparklineData.length >= 2 && (
          <Sparkline
            data={sparklineData}
            width={72}
            height={32}
            color={color || "var(--text-primary)"}
          />
        )}
      </div>
    </div>
  );
}
