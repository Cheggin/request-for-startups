"use client";

import { usePoll } from "@/lib/use-poll";
import { POLL_AGENTS_MS, POLL_CHAIN_MS, POLL_TRACES_MS, POLL_ACTIVITY_MS, COLORS } from "@/lib/constants";
import type { Agent, FleetSummary, SkillChainState, TraceEvent, ActivityPoint } from "@/lib/types";
import { FleetHeader } from "@/components/fleet-header";
import { AgentGrid } from "@/components/agent-grid";
import { SkillChain } from "@/components/skill-chain";
import { ActivitySection } from "@/components/activity-section";
import { SectionLabel } from "@/components/section-label";

export default function DashboardPage() {
  const agents = usePoll<{ agents: Agent[]; summary: FleetSummary }>("/api/agents", POLL_AGENTS_MS);
  const chain = usePoll<{ chain: SkillChainState | null }>("/api/chain", POLL_CHAIN_MS);
  const traces = usePoll<{ events: TraceEvent[] }>("/api/traces", POLL_TRACES_MS);
  const activity = usePoll<{ points: ActivityPoint[] }>("/api/activity", POLL_ACTIVITY_MS);

  const agentList = agents.data?.agents ?? [];
  const summary = agents.data?.summary ?? { running: 0, idle: 0, stuck: 0, total: 0 };
  const ceoAgent = agentList.find((a) => a.isCeo) ?? null;

  if (agents.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-sm font-mono" style={{ color: COLORS.textTertiary }}>
          Loading fleet data...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <FleetHeader summary={summary} ceoAgent={ceoAgent} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6 sm:gap-8">
        <section>
          <SectionLabel>Agent Fleet</SectionLabel>
          <AgentGrid agents={agentList} />
        </section>

        <section>
          <SectionLabel>Skill Chain</SectionLabel>
          <SkillChain chain={chain.data?.chain ?? null} />
        </section>

        <section>
          <ActivitySection
            activityData={activity.data?.points ?? []}
            traceEvents={traces.data?.events ?? []}
          />
        </section>
      </main>
    </div>
  );
}
