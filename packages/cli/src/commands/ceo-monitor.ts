/**
 * harness ceo-monitor — CEO zero-action monitor for agent fleet supervision.
 *
 * Polls tmux panes, classifies agent status, auto-approves safe prompts,
 * detects stuck/idle agents, and reports fleet health.
 *
 * Subcommands:
 *   once / tick    — run one monitoring cycle
 *   status         — quick fleet status report
 */

import {
  monitorOnce,
  type MonitorResult,
  type MonitoredPane,
} from "../lib/tmux-monitor.js";
import { isTmuxAvailable } from "../lib/tmux.js";
import {
  heading,
  success,
  error,
  warn,
  muted,
  info,
} from "../lib/format.js";

// ─── Types ────────────────────────────────────────────────────────────────

const VALID_SUBCOMMANDS = ["once", "tick", "status", "help"] as const;
type Subcommand = "once" | "status" | "help";

export type FleetHealth = "healthy" | "degraded" | "critical" | "idle";

export interface MonitorArgs {
  subcommand: Subcommand;
  json: boolean;
  verbose: boolean;
}

// ─── Arg Parsing ──────────────────────────────────────────────────────────

export function parseMonitorArgs(args: string[]): MonitorArgs {
  const raw = args[0] ?? "";
  const flags = new Set(args.slice(1));

  let subcommand: Subcommand;
  if (raw === "once" || raw === "tick") {
    subcommand = "once";
  } else if (raw === "status") {
    subcommand = "status";
  } else {
    subcommand = "help";
  }

  return {
    subcommand,
    json: flags.has("--json"),
    verbose: flags.has("--verbose"),
  };
}

// ─── Fleet Health Classification ──────────────────────────────────────────

export function classifyFleetHealth(result: MonitorResult): FleetHealth {
  const { panes } = result;

  if (panes.length === 0) return "idle";

  const stuckCount = panes.filter((p) => p.status === "stuck").length;
  const approvalCount = panes.filter((p) => p.status === "needs-approval").length;
  const idleCount = panes.filter((p) => p.status === "idle").length;
  const workingCount = panes.filter((p) => p.status === "working").length;

  // Critical: majority stuck
  if (stuckCount > panes.length / 2) return "critical";

  // Degraded: any stuck or needs-approval
  if (stuckCount > 0 || approvalCount > 0) return "degraded";

  // Idle: all idle
  if (idleCount === panes.length) return "idle";

  return "healthy";
}

// ─── Tick Report Formatting ───────────────────────────────────────────────

const STATUS_TAG: Record<string, string> = {
  working: "[WORKING]",
  idle: "[IDLE]",
  stuck: "[STUCK]",
  "needs-approval": "[APPROVE]",
};

const HEALTH_LABEL: Record<FleetHealth, string> = {
  healthy: "HEALTHY",
  degraded: "DEGRADED",
  critical: "CRITICAL",
  idle: "IDLE",
};

export function formatTickReport(
  result: MonitorResult,
  opts: { json?: boolean; verbose?: boolean } = {}
): string {
  const health = classifyFleetHealth(result);

  // JSON mode
  if (opts.json) {
    return JSON.stringify({
      health,
      panes: result.panes.map((p) => ({
        name: p.name,
        status: p.status,
        lastLine: p.lastLine,
      })),
      signals: result.signals,
      autoApproved: result.autoApproved,
    });
  }

  // No agents
  if (result.panes.length === 0) {
    return "No agents running.";
  }

  const lines: string[] = [];

  // Header
  lines.push(
    `Fleet: ${HEALTH_LABEL[health]} | ${result.panes.length} agents`
  );

  // Per-pane status
  for (const pane of result.panes) {
    const tag = STATUS_TAG[pane.status] ?? "[?]";
    let line = `  ${tag} ${pane.name}`;
    if (opts.verbose && pane.lastLine) {
      line += `: ${pane.lastLine}`;
    }
    lines.push(line);
  }

  // Auto-approved actions
  if (result.autoApproved.length > 0) {
    lines.push("");
    lines.push(`Auto-approved: ${result.autoApproved.join(", ")}`);
  }

  // Signals
  if (result.signals.length > 0) {
    lines.push("");
    lines.push(
      `${result.signals.length} signal${result.signals.length === 1 ? "" : "s"}: ${result.signals.map((s) => `${s.type}(${s.agent})`).join(", ")}`
    );
  }

  return lines.join("\n");
}

// ─── Subcommand Handlers ──────────────────────────────────────────────────

function runOnce(args: MonitorArgs): void {
  if (!isTmuxAvailable()) {
    console.log(error("  tmux is not installed. Install with: brew install tmux"));
    return;
  }

  console.log(muted("  Polling tmux panes..."));

  const result = monitorOnce();
  const health = classifyFleetHealth(result);
  const report = formatTickReport(result, {
    json: args.json,
    verbose: args.verbose,
  });

  // Color the output by health
  if (args.json) {
    console.log(report);
  } else if (health === "critical") {
    console.log(error(report));
  } else if (health === "degraded") {
    console.log(warn(report));
  } else if (health === "healthy") {
    console.log(success(report));
  } else {
    console.log(muted(report));
  }
}

function showStatus(args: MonitorArgs): void {
  if (!isTmuxAvailable()) {
    console.log(error("  tmux is not installed."));
    return;
  }

  const result = monitorOnce();
  const report = formatTickReport(result, {
    json: args.json,
    verbose: true,
  });

  if (args.json) {
    console.log(report);
  } else {
    console.log(report);
  }
}

function showHelp(): void {
  console.log(heading("harness ceo-monitor"));
  console.log("  CEO zero-action monitor for agent fleet supervision.");
  console.log();
  console.log("  Usage:");
  console.log("    harness ceo-monitor once [--json] [--verbose]  Run one monitoring cycle");
  console.log("    harness ceo-monitor tick                       Alias for once");
  console.log("    harness ceo-monitor status [--json]            Fleet status (verbose)");
  console.log();
  console.log("  Monitors tmux panes, classifies agents as working/idle/stuck/needs-approval,");
  console.log("  auto-approves safe permission prompts, and reports fleet health.");
  console.log();
}

// ─── Subcommand Routing ───────────────────────────────────────────────────

export function run(args: string[]): void {
  const parsed = parseMonitorArgs(args);

  switch (parsed.subcommand) {
    case "once":
      return runOnce(parsed);
    case "status":
      return showStatus(parsed);
    case "help":
    default:
      return showHelp();
  }
}
