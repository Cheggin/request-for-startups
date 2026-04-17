export const IDLE_THRESHOLD_MS = 5 * 60 * 1000;
export const STUCK_THRESHOLD_MS = 15 * 60 * 1000;
export const NUDGE_CONFIRM_LENGTH = 200;

export const POLL_AGENTS_MS = 3000;
export const POLL_CHAIN_MS = 10000;
export const POLL_TRACES_MS = 30000;
export const POLL_ACTIVITY_MS = 30000;

export const SPARKLINE_WIDTH = 120;
export const SPARKLINE_HEIGHT = 32;
export const SPARKLINE_POINTS = 60;

export const RING_SIZE = 48;
export const RING_STROKE = 4;

export const HEATMAP_DAYS = 7;
export const HEATMAP_HOURS = 24;
export const HEATMAP_CELL = 14;
export const HEATMAP_GAP = 2;

export const TRACE_LOG_LIMIT = 50;

export const GRID_COLUMNS = 4;

export const CEO_PANE_TITLE = "CEO";

export const COLORS = {
  running: "#22C55E",
  runningBg: "#F0FDF4",
  idle: "#F59E0B",
  idleBg: "#FFFBEB",
  stuck: "#EF4444",
  stuckBg: "#FEF2F2",
  info: "#3B82F6",
  infoBg: "#EFF6FF",
  border: "#E5E5E5",
  borderSubtle: "#EFEFEF",
  textPrimary: "#171717",
  textSecondary: "#525252",
  textTertiary: "#A3A3A3",
  surface: "#FFFFFF",
  background: "#FAFAFA",
  sparklineStroke: "#3B82F6",
  sparklineFill: "rgba(59,130,246,0.06)",
  heatmapEmpty: "#F5F5F5",
  heatmapLow: "#DBEAFE",
  heatmapMid: "#93C5FD",
  heatmapHigh: "#3B82F6",
  heatmapMax: "#1D4ED8",
  ringTrack: "#E5E5E5",
  ringFill: "#22C55E",
  ringActive: "#3B82F6",
  timelineLine: "#E5E5E5",
  timelineDotDone: "#171717",
  timelineDotActive: "#3B82F6",
  timelineDotPending: "#D4D4D4",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  running: "Running",
  idle: "Idle",
  stuck: "Stuck",
};
