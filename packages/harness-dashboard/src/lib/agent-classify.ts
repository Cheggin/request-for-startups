import type { RealAgent } from "./data";

export type AgentCategory = "working" | "idle" | "needs-permission" | "error";

const ACTIVITY_PATTERNS = [
  /\bReading\b/i, /\bWriting\b/i, /\bRunning\b/i, /\bSearching\b/i,
  /\bEditing\b/i, /\bPlanning\b/i, /\bTesting\b/i, /\bBuilding\b/i,
  /\bFixing\b/i, /\bUpdating\b/i, /\bReviewing\b/i, /\bImplementing\b/i,
];

const PERMISSION_PATTERNS = [
  /\bneeds permission\b/i, /\bwaiting for permission\b/i,
  /\bapproval required\b/i, /\ballow this\b/i,
  /\bdo you want to continue\b/i, /\bpress enter to continue\b/i,
];

const ERROR_PATTERNS = [
  /\bfailed\b/i, /\berror\b/i, /\bexception\b/i, /\btraceback\b/i,
  /\bfatal\b/i, /\bpanic\b/i, /\bENOENT\b/i, /\btimed out\b/i,
];

const ERROR_EXCLUDE = [/\bno errors?\b/i, /\b0 errors?\b/i, /\bwithout errors?\b/i];

export const CATEGORY_META: Record<AgentCategory, { label: string; dot: string; text: string }> = {
  working: { label: "Working", dot: "bg-positive status-running", text: "text-positive" },
  "needs-permission": { label: "Needs Permission", dot: "bg-caution", text: "text-caution" },
  error: { label: "Error", dot: "bg-negative", text: "text-negative" },
  idle: { label: "Idle", dot: "bg-text-tertiary", text: "text-text-tertiary" },
};

function matchLine(lines: string[], patterns: RegExp[], exclude: RegExp[] = []): string | null {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (patterns.some((p) => p.test(lines[i])) && !exclude.some((p) => p.test(lines[i]))) return lines[i];
  }
  return null;
}

function getMeaningfulLines(output: string): string[] {
  return output.split("\n").map((l) => l.replace(/\s+/g, " ").replace(/^[•\-*]\s*/, "").trim()).filter(Boolean);
}

export function categorize(agent: RealAgent): { category: AgentCategory; summary: string } {
  const lines = getMeaningfulLines(agent.lastOutput);

  if (matchLine(lines, PERMISSION_PATTERNS)) {
    return { category: "needs-permission", summary: matchLine(lines, PERMISSION_PATTERNS) || "Waiting for approval" };
  }
  if (matchLine(lines, ERROR_PATTERNS, ERROR_EXCLUDE)) {
    return { category: "error", summary: matchLine(lines, ERROR_PATTERNS, ERROR_EXCLUDE) || "Error detected" };
  }
  if (agent.status === "running") {
    const activity = matchLine(lines, ACTIVITY_PATTERNS);
    return { category: "working", summary: activity || lines.at(-1) || `Working in ${agent.startup}` };
  }
  return { category: "idle", summary: "Waiting for task" };
}

export function truncate(text: string, max = 120) {
  return text.length <= max ? text : `${text.slice(0, max - 3).trimEnd()}...`;
}
