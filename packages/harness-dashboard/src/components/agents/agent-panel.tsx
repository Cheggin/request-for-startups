"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useAgents, useLoops } from "@/lib/use-data";
import type { RealAgent, RealLoop } from "@/lib/data";

type PanelTab = "agents" | "loops";
type AgentCategory = "working" | "idle" | "needs-permission" | "error";
type StatusTone = AgentCategory | "loop-running" | "loop-stopped";

interface AgentGroup {
  key: AgentCategory;
  label: string;
  count: number;
  agents: AgentRowModel[];
}

interface AgentRowModel {
  agent: RealAgent;
  category: AgentCategory;
  summary: string;
}

const PANEL_TABS: { key: PanelTab; label: string }[] = [
  { key: "agents", label: "Agents" },
  { key: "loops", label: "Loops" },
];

const CATEGORY_ORDER: AgentCategory[] = [
  "working",
  "idle",
  "needs-permission",
  "error",
];

const CATEGORY_LABELS: Record<AgentCategory, string> = {
  working: "Working",
  idle: "Idle",
  "needs-permission": "Needs Permission",
  error: "Error",
};

const STATUS_DOT_CLASS: Record<StatusTone, string> = {
  working: "bg-positive status-running",
  idle: "bg-text-tertiary",
  "needs-permission": "bg-caution",
  error: "bg-negative",
  "loop-running": "bg-positive status-running",
  "loop-stopped": "bg-border",
};

const ACTIVITY_PATTERNS = [
  /\bReading\b/i,
  /\bWriting\b/i,
  /\bRunning\b/i,
  /\bSearching\b/i,
  /\bEditing\b/i,
  /\bPlanning\b/i,
  /\bTesting\b/i,
  /\bBuilding\b/i,
  /\bFixing\b/i,
  /\bUpdating\b/i,
  /\bReviewing\b/i,
  /\bImplementing\b/i,
];

const PERMISSION_PATTERNS = [
  /\bneeds permission\b/i,
  /\bwaiting for permission\b/i,
  /\bapproval required\b/i,
  /\bwaiting for approval\b/i,
  /\ballow this\b/i,
  /\bgrant access\b/i,
  /\bdo you want to continue\b/i,
  /\bdo you want to proceed\b/i,
  /\bpress enter to continue\b/i,
];

const ERROR_PATTERNS = [
  /\bfailed\b/i,
  /\berror\b/i,
  /\bexception\b/i,
  /\btraceback\b/i,
  /\bfatal\b/i,
  /\bpanic\b/i,
  /\bENOENT\b/i,
  /\bEACCES\b/i,
  /\bECONN\b/i,
  /\bnot found\b/i,
  /\btimed out\b/i,
  /\bunhandled\b/i,
];

const ERROR_EXCLUDE_PATTERNS = [
  /\bno errors?\b/i,
  /\b0 errors?\b/i,
  /\bwithout errors?\b/i,
];

const COMPLETED_PATTERNS = [
  /\bcompleted\b/i,
  /\bcomplete\b/i,
  /\bfinished\b/i,
  /\bdone\b/i,
  /\bsuccess\b/i,
  /\bshipped\b/i,
];

const OUTPUT_NOISE_PATTERNS = [
  /^❯$/,
  /^>$/,
  /^\$$/,
  /^\d+\.\d+\.\d+$/,
];

function truncate(text: string, max = 96) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 3).trimEnd()}...`;
}

function normalizeLine(line: string) {
  return line.replace(/\s+/g, " ").replace(/^[•\-*]\s*/, "").trim();
}

function getMeaningfulLines(output: string) {
  return output
    .split("\n")
    .map(normalizeLine)
    .filter(
      (line) =>
        line.length > 0 &&
        !OUTPUT_NOISE_PATTERNS.some((pattern) => pattern.test(line)),
    );
}

function findLastMatchingLine(
  lines: string[],
  patterns: RegExp[],
  excludePatterns: RegExp[] = [],
) {
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    const matches = patterns.some((pattern) => pattern.test(line));
    const excluded = excludePatterns.some((pattern) => pattern.test(line));
    if (matches && !excluded) return line;
  }

  return null;
}

function getAgentCategory(agent: RealAgent, lines: string[]): AgentCategory {
  if (findLastMatchingLine(lines, PERMISSION_PATTERNS)) {
    return "needs-permission";
  }

  if (findLastMatchingLine(lines, ERROR_PATTERNS, ERROR_EXCLUDE_PATTERNS)) {
    return "error";
  }

  if (agent.status === "running") {
    return "working";
  }

  return "idle";
}

function getAgentSummary(agent: RealAgent, category: AgentCategory, lines: string[]) {
  if (category === "needs-permission") {
    return truncate(
      findLastMatchingLine(lines, PERMISSION_PATTERNS) ?? "Waiting for approval",
    );
  }

  if (category === "error") {
    return truncate(
      findLastMatchingLine(lines, ERROR_PATTERNS, ERROR_EXCLUDE_PATTERNS) ??
        "Error detected in session output",
    );
  }

  if (category === "idle") {
    const completed = findLastMatchingLine(lines, COMPLETED_PATTERNS);
    return completed ? "completed" : "waiting for task";
  }

  return truncate(
    findLastMatchingLine(lines, ACTIVITY_PATTERNS) ??
      lines.at(-1) ??
      `Working in ${agent.startup}`,
  );
}

function buildAgentRow(agent: RealAgent): AgentRowModel {
  const lines = getMeaningfulLines(agent.lastOutput);
  const category = getAgentCategory(agent, lines);

  return {
    agent,
    category,
    summary: getAgentSummary(agent, category, lines),
  };
}

function buildAgentGroups(agents: RealAgent[]): AgentGroup[] {
  const rows = agents.map(buildAgentRow);

  return CATEGORY_ORDER.map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    count: rows.filter((row) => row.category === key).length,
    agents: rows.filter((row) => row.category === key),
  }));
}

function StatusDot({
  tone,
  ariaLabel,
}: {
  tone: StatusTone;
  ariaLabel: string;
}) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full shrink-0 ${STATUS_DOT_CLASS[tone]}`}
      role="img"
      aria-label={ariaLabel}
    />
  );
}

function SummaryPill({ group }: { group: AgentGroup }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-bg px-2.5 py-1">
      <StatusDot tone={group.key} ariaLabel={group.label} />
      <span className="text-xs font-medium text-text-primary">
        {group.count} {group.label}
      </span>
    </div>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`text-text-tertiary transition-transform shrink-0 ${expanded ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <polyline points="18,15 12,9 6,15" />
    </svg>
  );
}

function AgentGroupSection({
  group,
  expandedItems,
  onToggle,
}: {
  group: AgentGroup;
  expandedItems: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  if (group.count === 0) return null;

  return (
    <section className="overflow-hidden rounded-md border border-border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
        <div className="flex items-center gap-2">
          <StatusDot tone={group.key} ariaLabel={group.label} />
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
            {group.label}
          </h3>
        </div>
        <span className="tabular text-sm text-text-tertiary">{group.count}</span>
      </div>

      <div className="divide-y divide-border-subtle">
        {group.agents.map((row) => {
          const isExpanded = expandedItems[row.agent.paneId] === true;

          return (
            <div key={row.agent.paneId}>
              <button
                type="button"
                onClick={() => onToggle(row.agent.paneId)}
                aria-expanded={isExpanded}
                className="w-full px-3 py-2.5 text-left hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <StatusDot tone={row.category} ariaLabel={CATEGORY_LABELS[row.category]} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-base font-semibold text-text-primary">
                        {row.agent.name}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-text-tertiary">
                        {row.agent.startup}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-text-secondary">
                      {row.summary}
                    </p>
                  </div>
                  <Chevron expanded={isExpanded} />
                </div>
              </button>

              {isExpanded ? (
                <div className="border-t border-border-subtle bg-bg/60 px-3 py-3">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                    <dt className="text-text-tertiary">Project</dt>
                    <dd className="text-text-primary">{row.agent.startup}</dd>
                    <dt className="text-text-tertiary">Directory</dt>
                    <dd>
                      <code className="break-all rounded bg-surface px-1.5 py-0.5 font-mono text-text-secondary">
                        {row.agent.cwd || "Unknown"}
                      </code>
                    </dd>
                    <dt className="pt-1 text-text-tertiary">Live Output</dt>
                    <dd>
                      <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded bg-surface px-2 py-1.5 font-mono text-xs leading-relaxed text-text-secondary">
                        {row.agent.lastOutput || "No recent output captured."}
                      </pre>
                    </dd>
                  </dl>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LoopsList({
  loops,
  expandedItems,
  onToggle,
}: {
  loops: RealLoop[];
  expandedItems: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  if (loops.length === 0) {
    return (
      <div className="rounded-md border border-border-subtle bg-surface px-3 py-4">
        <p className="text-sm text-text-tertiary">
          No loops configured in <code className="rounded bg-bg px-1 font-mono">.harness/loops.yml</code>.
        </p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-md border border-border-subtle bg-surface">
      <div className="divide-y divide-border-subtle">
        {loops.map((loop) => {
          const isExpanded = expandedItems[loop.name] === true;
          const tone: StatusTone = loop.status === "running" ? "loop-running" : "loop-stopped";

          return (
            <div key={loop.name}>
              <button
                type="button"
                onClick={() => onToggle(loop.name)}
                aria-expanded={isExpanded}
                className="w-full px-3 py-2.5 text-left hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <StatusDot tone={tone} ariaLabel={loop.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-text-primary">
                        {loop.name}
                      </span>
                      <span className="rounded-full border border-border-subtle bg-bg px-2 py-0.5 font-mono text-xs text-text-secondary">
                        {loop.interval}
                      </span>
                      <span className="rounded-full bg-bg px-2 py-0.5 text-xs uppercase tracking-[0.12em] text-text-tertiary">
                        {loop.loopType}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-text-secondary">
                      {loop.description || `${loop.agent} loop`}
                    </p>
                  </div>
                  <span className="hidden text-xs capitalize text-text-tertiary sm:block">
                    {loop.status}
                  </span>
                  <Chevron expanded={isExpanded} />
                </div>
              </button>

              {isExpanded ? (
                <div className="border-t border-border-subtle bg-bg/60 px-3 py-3">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                    <dt className="text-text-tertiary">Agent</dt>
                    <dd className="text-text-primary">{loop.agent}</dd>
                    <dt className="text-text-tertiary">Skill</dt>
                    <dd>
                      <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-text-secondary">
                        /{loop.skill}
                      </code>
                    </dd>
                    <dt className="text-text-tertiary">Issues</dt>
                    <dd className="text-text-secondary">
                      {loop.createsIssues ? "Creates issues" : "No issue creation"}
                    </dd>
                  </dl>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function AgentPanel() {
  const [expanded, setExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<PanelTab>("agents");
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});
  const [expandedLoops, setExpandedLoops] = useState<Record<string, boolean>>({});
  const { agents, loading: agentsLoading, error: agentsError } = useAgents(5000);
  const { loops, loading: loopsLoading, error: loopsError } = useLoops(5000);

  const loading = agentsLoading || loopsLoading;
  const error = agentsError || loopsError;
  const agentGroups = buildAgentGroups(agents);
  const activeGroups = agentGroups.filter((group) => group.count > 0);
  const summaryText = loading
    ? "Loading agent and loop status..."
    : error
      ? "Agent panel unavailable"
      : activeGroups.length === 0
        ? "No active agents"
        : activeGroups
            .map((group) => `${group.count} ${group.label}`)
            .join(" | ");

  function toggleExpandedItem(
    key: string,
    setter: Dispatch<SetStateAction<Record<string, boolean>>>,
  ) {
    setter((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  }

  return (
    <div className="border-t border-border bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-4 px-4 py-2.5 hover:bg-surface-hover transition-colors"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-text-primary">
              Agent Overview
            </span>
            <span className="text-xs text-text-tertiary">
              {agents.length} agents · {loops.length} loops
            </span>
          </div>
          <p className="truncate text-sm text-text-tertiary">{summaryText}</p>
        </div>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {activeGroups.map((group) => (
            <SummaryPill key={group.key} group={group} />
          ))}
        </div>

        <Chevron expanded={expanded} />
      </button>

      <div className="panel-collapse" data-open={expanded}>
        <div>
          <div className="px-4 pb-4">
            {error ? (
              <p className="py-2 text-sm text-negative">{error}</p>
            ) : loading && agents.length === 0 && loops.length === 0 ? (
              <p className="py-2 text-sm text-text-tertiary">
                Loading from tmux and <code className="rounded bg-bg px-1 font-mono">.harness/loops.yml</code>...
              </p>
            ) : agents.length === 0 && loops.length === 0 ? (
              <p className="py-2 text-sm text-text-tertiary">
                No tmux sessions or loops found. Agents appear here when running via{" "}
                <code className="rounded bg-bg px-1 font-mono">harness init</code>.
              </p>
            ) : (
              <>
                <div
                  className="mb-4 flex items-center gap-0.5 border-b border-border-subtle"
                  role="tablist"
                  aria-label="Agent panel sections"
                >
                  {PANEL_TABS.map((tab) => {
                    const count = tab.key === "agents" ? agents.length : loops.length;
                    const selected = activeTab === tab.key;

                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        role="tab"
                        aria-selected={selected}
                        className={`px-3 py-2 text-sm font-medium transition-colors ${
                          selected
                            ? "border-b-2 border-text-primary text-text-primary"
                            : "text-text-tertiary hover:text-text-primary"
                        }`}
                      >
                        {tab.label}
                        <span className="ml-1 text-xs text-text-tertiary">({count})</span>
                      </button>
                    );
                  })}
                </div>

                {activeTab === "agents" ? (
                  <>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {agentGroups.map((group) => (
                        <SummaryPill key={group.key} group={group} />
                      ))}
                    </div>

                    {agents.length === 0 ? (
                      <div className="rounded-md border border-border-subtle bg-surface px-3 py-4">
                        <p className="text-sm text-text-tertiary">
                          No tmux sessions found.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        {agentGroups.map((group) => (
                          <AgentGroupSection
                            key={group.key}
                            group={group}
                            expandedItems={expandedAgents}
                            onToggle={(key) => toggleExpandedItem(key, setExpandedAgents)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <LoopsList
                    loops={loops}
                    expandedItems={expandedLoops}
                    onToggle={(key) => toggleExpandedItem(key, setExpandedLoops)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
