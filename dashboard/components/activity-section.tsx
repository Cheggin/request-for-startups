"use client";

import type { ActivityPoint, TraceEvent } from "@/lib/types";
import { COLORS } from "@/lib/constants";
import { Heatmap } from "./svg/heatmap";
import { TraceLog } from "./trace-log";
import { SectionLabel } from "./section-label";

interface ActivitySectionProps {
  activityData: ActivityPoint[];
  traceEvents: TraceEvent[];
}

export function ActivitySection({ activityData, traceEvents }: ActivitySectionProps) {
  return (
    <div className="grid grid-cols-2 gap-8">
      <div>
        <SectionLabel>Git Activity (7 days)</SectionLabel>
        {activityData.length > 0 ? (
          <Heatmap data={activityData} />
        ) : (
          <p className="text-sm" style={{ color: COLORS.textTertiary }}>No data</p>
        )}
      </div>
      <div>
        <SectionLabel>Hook Trace Events</SectionLabel>
        <TraceLog events={traceEvents} />
      </div>
    </div>
  );
}
