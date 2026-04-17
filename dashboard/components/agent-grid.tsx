"use client";

import type { Agent } from "@/lib/types";
import { COLORS } from "@/lib/constants";
import { AgentCard } from "./agent-card";

interface AgentGridProps {
  agents: Agent[];
}

export function AgentGrid({ agents }: AgentGridProps) {
  const nonCeoAgents = agents.filter((a) => !a.isCeo);

  if (nonCeoAgents.length === 0) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: COLORS.textTertiary }}>
        No active agents
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {nonCeoAgents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
