/**
 * skill-chain-enforcer — PreToolUse hook that gates Edit/Write on required
 * skill invocations when a flow is active.
 *
 * A flow is active when its `trigger_skill` appears in the session transcript.
 * Each phase lists required skills (via `required`, `oneOf`, or `anyOf`). The
 * last Skill tool_use in the transcript determines the "current phase" — every
 * earlier phase must be complete before Edit/Write under `gate_patterns` is
 * permitted.
 */

export interface PhaseRequired {
  name: string;
  required: string[];
}

export interface PhaseOneOf {
  name: string;
  oneOf: string[];
}

export interface PhaseAnyOf {
  name: string;
  anyOf: { min: number; of: string[] };
}

export type Phase = PhaseRequired | PhaseOneOf | PhaseAnyOf;

export interface Flow {
  description?: string;
  trigger_skill: string;
  gate_patterns: string[];
  phases: Phase[];
}

export interface SkillChains {
  flows: Record<string, Flow>;
}

export interface ChainDecision {
  decision: "ALLOW" | "DENY";
  message?: string;
}

export function phaseSkills(phase: Phase): string[] {
  if ("required" in phase) return phase.required;
  if ("oneOf" in phase) return phase.oneOf;
  return phase.anyOf.of;
}

export function isPhaseComplete(phase: Phase, fired: Set<string>): boolean {
  if ("required" in phase) return phase.required.every((s) => fired.has(s));
  if ("oneOf" in phase) return phase.oneOf.some((s) => fired.has(s));
  const hits = phase.anyOf.of.filter((s) => fired.has(s)).length;
  return hits >= phase.anyOf.min;
}

export function missingFromPhase(phase: Phase, fired: Set<string>): string[] {
  if ("required" in phase) return phase.required.filter((s) => !fired.has(s));
  if ("oneOf" in phase) {
    return phase.oneOf.some((s) => fired.has(s)) ? [] : phase.oneOf;
  }
  const missing = phase.anyOf.of.filter((s) => !fired.has(s));
  const need = phase.anyOf.min - (phase.anyOf.of.length - missing.length);
  return need > 0 ? missing : [];
}

export function phaseIndexOfSkill(phases: Phase[], skill: string): number {
  for (let i = 0; i < phases.length; i++) {
    if (phaseSkills(phases[i]).includes(skill)) return i;
  }
  return -1;
}

export function matchesGate(filePath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (globMatch(filePath, pattern)) return true;
  }
  return false;
}

function globMatch(path: string, pattern: string): boolean {
  const re = new RegExp(
    "^" +
      pattern
        .replace(/[.+^$()|[\]\\]/g, "\\$&")
        .replace(/\*\*/g, "::DOUBLESTAR::")
        .replace(/\*/g, "[^/]*")
        .replace(/::DOUBLESTAR::/g, ".*")
        .replace(/\?/g, "[^/]") +
      "$"
  );
  return re.test(path);
}

export function findActiveFlow(
  chains: SkillChains,
  skillHistory: string[]
): { name: string; flow: Flow } | null {
  let latest: { idx: number; name: string; flow: Flow } | null = null;
  for (const [name, flow] of Object.entries(chains.flows)) {
    const idx = skillHistory.lastIndexOf(flow.trigger_skill);
    if (idx >= 0 && (!latest || idx > latest.idx)) {
      latest = { idx, name, flow };
    }
  }
  return latest ? { name: latest.name, flow: latest.flow } : null;
}

export function evaluate(
  chains: SkillChains,
  filePath: string,
  skillHistory: string[]
): ChainDecision {
  const active = findActiveFlow(chains, skillHistory);
  if (!active) return { decision: "ALLOW" };

  const { name, flow } = active;
  if (!matchesGate(filePath, flow.gate_patterns)) return { decision: "ALLOW" };

  const fired = new Set(skillHistory);
  const postTrigger = skillHistory.slice(
    skillHistory.lastIndexOf(flow.trigger_skill) + 1
  );
  const lastPhaseSkill = [...postTrigger]
    .reverse()
    .find((s) => phaseIndexOfSkill(flow.phases, s) >= 0);

  if (!lastPhaseSkill) {
    const firstPhase = flow.phases[0];
    return {
      decision: "DENY",
      message:
        `[skill-chain] Flow "${name}" is active but no phase skill has fired yet. ` +
        `Start phase 1 "${firstPhase.name}" by invoking: ${phaseSkills(firstPhase).join(", ")}.`,
    };
  }

  const currentPhaseIdx = phaseIndexOfSkill(flow.phases, lastPhaseSkill);

  for (let i = 0; i < currentPhaseIdx; i++) {
    const phase = flow.phases[i];
    if (!isPhaseComplete(phase, fired)) {
      const missing = missingFromPhase(phase, fired);
      return {
        decision: "DENY",
        message:
          `[skill-chain] Flow "${name}", phase ${i + 1} "${phase.name}" is incomplete. ` +
          `Invoke before continuing: ${missing.join(", ")}.`,
      };
    }
  }

  return { decision: "ALLOW" };
}
