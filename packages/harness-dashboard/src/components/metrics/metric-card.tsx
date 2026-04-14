"use client";

import { Sparkline } from "@/components/charts/sparkline";

interface MetricCardProps {
  label: string;
  value: string;
  sparklineData?: number[];
  color?: string;
}

/**
 * Metric card — shows a label, value, and optional sparkline.
 * Sparkline ONLY renders if real data is provided. Never generates fake data.
 */
export function MetricCard({ label, value, sparklineData, color }: MetricCardProps) {
  return (
    <div className="bg-surface border border-border-subtle rounded-xl px-4 py-3.5 hover:border-border transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium text-muted mb-1">{label}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        {sparklineData && sparklineData.length >= 2 && (
          <Sparkline
            data={sparklineData}
            width={72}
            height={32}
            color={color || "var(--foreground)"}
          />
        )}
      </div>
    </div>
  );
}
