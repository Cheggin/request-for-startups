/**
 * Format — terminal output formatting utilities.
 *
 * No external deps. ANSI escape codes only.
 */

import { COLORS } from "./constants.js";

const { reset, bold, dim, red, green, yellow, blue, cyan, gray, magenta } = COLORS;

// ─── Basic Formatting ───────────────────────────────────────────────────────

export function heading(text: string): string {
  return `\n${bold}${cyan}${text}${reset}\n`;
}

export function subheading(text: string): string {
  return `${bold}${text}${reset}`;
}

export function success(text: string): string {
  return `${green}${text}${reset}`;
}

export function error(text: string): string {
  return `${red}${text}${reset}`;
}

export function warn(text: string): string {
  return `${yellow}${text}${reset}`;
}

export function info(text: string): string {
  return `${blue}${text}${reset}`;
}

export function muted(text: string): string {
  return `${dim}${text}${reset}`;
}

// ─── Status Indicators ──────────────────────────────────────────────────────

export function statusDot(status: string): string {
  switch (status) {
    case "running":
    case "done":
    case "in-progress":
      return `${green}*${reset}`;
    case "idle":
    case "todo":
      return `${gray}*${reset}`;
    case "error":
    case "blocked":
      return `${red}*${reset}`;
    default:
      return `${dim}*${reset}`;
  }
}

// ─── Tables ─────────────────────────────────────────────────────────────────

/**
 * Render a simple aligned table.
 *
 * @param rows - Array of column arrays
 * @param headers - Optional header row
 */
export function table(rows: string[][], headers?: string[]): string {
  const allRows = headers ? [headers, ...rows] : rows;
  if (allRows.length === 0) return "";

  // Calculate column widths (strip ANSI for measurement)
  const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
  const colCount = Math.max(...allRows.map((r) => r.length));
  const widths: number[] = [];
  for (let i = 0; i < colCount; i++) {
    widths[i] = Math.max(...allRows.map((r) => stripAnsi(r[i] ?? "").length));
  }

  const lines: string[] = [];

  for (let rowIdx = 0; rowIdx < allRows.length; rowIdx++) {
    const row = allRows[rowIdx];
    const cells = row.map((cell, i) => {
      const visible = stripAnsi(cell);
      const padding = widths[i] - visible.length;
      return cell + " ".repeat(Math.max(0, padding));
    });
    lines.push("  " + cells.join("  "));

    // Add separator after headers
    if (headers && rowIdx === 0) {
      const sep = widths.map((w) => "-".repeat(w));
      lines.push("  " + sep.join("  "));
    }
  }

  return lines.join("\n");
}

// ─── Counters ───────────────────────────────────────────────────────────────

export function count(n: number, singular: string, plural?: string): string {
  const p = plural ?? singular + "s";
  return `${n} ${n === 1 ? singular : p}`;
}

// ─── Phase Display ──────────────────────────────────────────────────────────

const PHASE_ICONS: Record<string, string> = {
  onboarding: "[1/7]",
  research: "[2/7]",
  spec: "[3/7]",
  design: "[4/7]",
  build: "[5/7]",
  deploy: "[6/7]",
  grow: "[7/7]",
};

export function phaseLabel(phase: string): string {
  const icon = PHASE_ICONS[phase] ?? "[?/7]";
  return `${bold}${icon} ${phase}${reset}`;
}

// ─── Cost ───────────────────────────────────────────────────────────────────

export function formatCost(usd: number): string {
  if (usd === 0) return muted("$0.00");
  if (usd < 0.01) return muted("<$0.01");
  return `$${usd.toFixed(2)}`;
}

// ─── Time ───────────────────────────────────────────────────────────────────

export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
