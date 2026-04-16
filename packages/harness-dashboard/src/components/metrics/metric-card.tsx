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
      <p className="label-section text-text-tertiary mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-2xl number-hero text-text-primary">{value}</p>
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
