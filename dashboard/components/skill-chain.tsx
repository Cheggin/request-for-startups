"use client";

import type { SkillChainState } from "@/lib/types";
import { COLORS } from "@/lib/constants";
import { RingProgress } from "./svg/ring-progress";
import { TimelineChart } from "./svg/timeline-chart";

interface SkillChainProps {
  chain: SkillChainState | null;
}

export function SkillChain({ chain }: SkillChainProps) {
  if (!chain) {
    return (
      <div className="py-8 text-center text-sm" style={{ color: COLORS.textTertiary }}>
        No skill chain active. Chains appear when a multi-phase flow is running.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">{chain.flowName}</h3>
          <p className="text-[12px]" style={{ color: COLORS.textTertiary }}>
            {chain.description}
          </p>
        </div>
        <span className="text-sm font-mono font-semibold tabular-nums" style={{ color: COLORS.info }}>
          {Math.round(chain.overallProgress * 100)}%
        </span>
      </div>

      <TimelineChart phases={chain.phases} />

      <div className="flex items-start justify-between gap-2">
        {chain.phases.map((phase) => (
          <div key={phase.name} className="flex-1 flex flex-col items-center gap-2">
            <RingProgress
              progress={phase.progress}
              isActive={phase.isActive}
              label={phase.name}
            />
            <div className="flex flex-col items-center gap-0.5">
              {phase.required.map((skill) => {
                const done = phase.completed.includes(skill);
                return (
                  <span
                    key={skill}
                    className="text-[10px] font-mono"
                    style={{
                      color: done ? COLORS.textPrimary : COLORS.textTertiary,
                      textDecoration: done ? "line-through" : "none",
                    }}
                  >
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
