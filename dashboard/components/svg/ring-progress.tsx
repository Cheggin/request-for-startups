"use client";

import { RING_SIZE, RING_STROKE, COLORS } from "@/lib/constants";

interface RingProgressProps {
  progress: number;
  size?: number;
  stroke?: number;
  isActive?: boolean;
  label?: string;
}

export function RingProgress({
  progress,
  size = RING_SIZE,
  stroke = RING_STROKE,
  isActive = false,
  label,
}: RingProgressProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;
  const center = size / 2;
  const fillColor = isActive ? COLORS.ringActive : progress === 1 ? COLORS.ringFill : COLORS.textTertiary;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label ?? "Progress"}: ${Math.round(progress * 100)}%`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={COLORS.ringTrack}
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 300ms ease" }}
        />
        {progress > 0 && (
          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="central"
            fill={COLORS.textSecondary}
            fontSize={size < 40 ? 9 : 11}
            fontFamily="var(--font-mono)"
            fontWeight={500}
          >
            {Math.round(progress * 100)}
          </text>
        )}
      </svg>
      {label && (
        <span className="text-[11px] font-medium tracking-wide uppercase" style={{ color: COLORS.textTertiary }}>
          {label}
        </span>
      )}
    </div>
  );
}
