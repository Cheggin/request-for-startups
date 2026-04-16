"use client";

import { useState } from "react";
import { useAgents } from "@/lib/use-data";
import type { RealAgent } from "@/lib/data";

type AgentCategory = "working" | "idle" | "needs-permission" | "error";

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

const CATEGORY_META: Record<AgentCategory, { label: string; dot: string; text: string }> = {
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

function categorize(agent: RealAgent): { category: AgentCategory; summary: string } {
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

function truncate(text: string, max = 120) {
  return text.length <= max ? text : `${text.slice(0, max - 3).trimEnd()}...`;
}

async function restartAgent(paneId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/agents/${encodeURIComponent(paneId)}/restart`, { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

export default function AgentsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [restarting, setRestarting] = useState<string | null>(null);
  const { agents, loading, error, refetch } = useAgents(5000);

  async function handleRestart(paneId: string) {
    setRestarting(paneId);
    console.log(`[AgentsPage] Restarting agent: ${paneId}`);
    const ok = await restartAgent(paneId);
    if (!ok) console.error(`[AgentsPage] Failed to restart ${paneId}`);
    setTimeout(() => { refetch(); setRestarting(null); }, 2000);
  }

  // Group agents by category
  const categorized = agents.map((a) => ({ agent: a, ...categorize(a) }));
  const groups = (["working", "needs-permission", "error", "idle"] as AgentCategory[])
    .map((cat) => ({ category: cat, agents: categorized.filter((a) => a.category === cat) }))
    .filter((g) => g.agents.length > 0);

  return (
    <div className="px-8 py-6 max-w-[1200px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg heading-page text-text-primary leading-tight">Agents</h1>
          {!loading && (
            <span className="text-sm text-text-tertiary tabular">{agents.length} total</span>
          )}
        </div>
        <button onClick={refetch} className="text-xs font-medium text-text-secondary hover:text-text-primary border border-border-subtle px-2.5 py-1 rounded-md hover:bg-surface-hover transition-colors">
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-text-tertiary py-4">Loading from tmux...</p>
      ) : error ? (
        <p className="text-sm text-negative py-4">Error: {error}</p>
      ) : agents.length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface px-5 py-8 text-center">
          <p className="text-sm font-semibold text-text-secondary">No tmux sessions found</p>
          <p className="text-xs text-text-tertiary mt-1">
            Start agents with <code className="font-mono bg-bg px-1 py-0.5 rounded">harness init</code>
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Category summary pills */}
          <div className="flex flex-wrap gap-2.5">
            {groups.map(({ category, agents: groupAgents }) => {
              const meta = CATEGORY_META[category];
              return (
                <div key={category} className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface px-2.5 py-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${meta.dot}`} />
                  <span className="text-xs font-medium text-text-primary tabular">{groupAgents.length}</span>
                  <span className="text-xs text-text-secondary">{meta.label}</span>
                </div>
              );
            })}
          </div>

          {/* Agent cards by category */}
          {groups.map(({ category, agents: groupAgents }) => {
            const meta = CATEGORY_META[category];
            return (
              <section key={category}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${meta.dot}`} />
                  <h2 className="label-section text-text-secondary">
                    {meta.label}
                  </h2>
                  <span className="text-xs text-text-tertiary tabular">{groupAgents.length}</span>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {groupAgents.map(({ agent, summary }) => {
                    const isExpanded = expandedId === agent.paneId;
                    return (
                      <div key={agent.paneId} className="rounded-lg border border-border-subtle bg-surface overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : agent.paneId)}
                          className="w-full px-3 py-2.5 text-left hover:bg-surface-hover transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
                            <span className="text-sm font-semibold text-text-primary truncate">{agent.name}</span>
                            <span className="text-xs text-text-tertiary ml-auto shrink-0">{agent.startup}</span>
                          </div>
                          <p className="text-xs text-text-secondary truncate mt-0.5 pl-3.5">
                            {truncate(summary)}
                          </p>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-border-subtle bg-bg/60 px-3 py-2.5">
                            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                              <dt className="text-text-tertiary">Directory</dt>
                              <dd><code className="font-mono text-text-secondary break-all">{agent.cwd || "Unknown"}</code></dd>
                              <dt className="text-text-tertiary pt-1">Output</dt>
                              <dd>
                                <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded bg-surface px-2 py-1.5 font-mono text-xs leading-relaxed text-text-secondary">
                                  {agent.lastOutput || "No recent output."}
                                </pre>
                              </dd>
                            </dl>
                            <div className="mt-2 flex justify-end">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRestart(agent.paneId); }}
                                disabled={restarting === agent.paneId}
                                className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${
                                  restarting === agent.paneId
                                    ? "text-text-tertiary bg-bg cursor-not-allowed"
                                    : "text-accent hover:bg-surface-hover border border-border-subtle"
                                }`}
                              >
                                {restarting === agent.paneId ? "Restarting..." : "Restart"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
