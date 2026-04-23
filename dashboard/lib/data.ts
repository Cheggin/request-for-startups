import { execSync } from "child_process";
import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join, resolve } from "path";
import type {
  Agent,
  AgentStatus,
  FleetSummary,
  SkillChainState,
  ChainPhase,
  TraceEvent,
  ActivityPoint,
} from "./types";
import {
  IDLE_THRESHOLD_MS,
  STUCK_THRESHOLD_MS,
  CEO_PANE_TITLE,
  HEATMAP_DAYS,
} from "./constants";

const ROOT = resolve(process.cwd(), "..");

function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 5000 }).trim();
  } catch {
    return "";
  }
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function deriveStatus(lastActivityTs: number): AgentStatus {
  const elapsed = Date.now() - lastActivityTs;
  if (elapsed >= STUCK_THRESHOLD_MS) return "stuck";
  if (elapsed >= IDLE_THRESHOLD_MS) return "idle";
  return "running";
}

function loadAgentMetadata(): Map<string, { name: string; description: string }> {
  const map = new Map();
  const dir = join(ROOT, ".harness", "agents");
  if (!existsSync(dir)) return map;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    const data = readJson(join(dir, f)) as Record<string, string> | null;
    if (data?.name) {
      map.set(data.name.toLowerCase(), {
        name: data.name,
        description: data.description || "",
      });
    }
  }
  return map;
}

export function getAgents(): Agent[] {
  const raw = exec(
    'tmux list-panes -a -F "#{session_name}:#{window_index}.#{pane_index}|#{pane_id}|#{pane_title}|#{pane_current_command}|#{pane_activity}"'
  );
  if (!raw) return [];

  const metadata = loadAgentMetadata();
  const now = Date.now();

  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [target, paneId, paneTitle, cmd, activityEpoch] = line.split("|");
      const lastActivityTs = parseInt(activityEpoch, 10) * 1000;
      const idleDuration = now - lastActivityTs;

      let lastOutput = "";
      try {
        lastOutput = exec(`tmux capture-pane -t ${paneId} -p -S -5`);
      } catch {}

      const titleLower = (paneTitle || "").toLowerCase();
      const meta = metadata.get(titleLower);
      const name = meta?.name || paneTitle || target;
      const isCeo = paneTitle === CEO_PANE_TITLE;

      return {
        id: paneId,
        name,
        paneId,
        paneTitle: paneTitle || "",
        status: deriveStatus(lastActivityTs),
        currentCommand: cmd || "",
        lastOutput: lastOutput.slice(-500),
        lastActivityTs,
        idleDuration,
        isCeo,
      };
    })
    .sort((a, b) => {
      if (a.isCeo) return -1;
      if (b.isCeo) return 1;
      const order: Record<AgentStatus, number> = { stuck: 0, idle: 1, running: 2 };
      return order[a.status] - order[b.status];
    });
}

export function getFleetSummary(agents: Agent[]): FleetSummary {
  return {
    running: agents.filter((a) => a.status === "running").length,
    idle: agents.filter((a) => a.status === "idle").length,
    stuck: agents.filter((a) => a.status === "stuck").length,
    total: agents.length,
  };
}

export function getSkillChain(): SkillChainState | null {
  const chainsPath = join(ROOT, "chains", "skill-chains.json");
  const missionPath = join(ROOT, ".omc", "state", "mission-state.json");

  const chains = readJson(chainsPath) as { flows: Record<string, { description: string; phases: { name: string; required: string[] }[] }> } | null;
  const mission = readJson(missionPath) as Record<string, unknown> | null;

  if (!chains) return null;

  const completedSkills = new Set<string>();
  if (mission && typeof mission === "object") {
    const skills = (mission as Record<string, unknown>).completedSkills;
    if (Array.isArray(skills)) {
      skills.forEach((s) => completedSkills.add(String(s)));
    }
    const phase = (mission as Record<string, unknown>).currentPhase;
    if (typeof phase === "object" && phase !== null) {
      const completed = (phase as Record<string, unknown>).completed;
      if (Array.isArray(completed)) {
        completed.forEach((s) => completedSkills.add(String(s)));
      }
    }
  }

  let flowName = Object.keys(chains.flows)[0] || "website-end-to-end";
  let bestCount = 0;
  for (const [fn, f] of Object.entries(chains.flows)) {
    const count = f.phases.reduce((s, p) => s + p.required.filter((sk) => completedSkills.has(sk)).length, 0);
    if (count > bestCount) { bestCount = count; flowName = fn; }
  }
  const flow = chains.flows[flowName];
  if (!flow) return null;

  let foundActive = false;
  const phases: ChainPhase[] = flow.phases.map((p) => {
    const completed = p.required.filter((s) => completedSkills.has(s));
    const progress = p.required.length > 0 ? completed.length / p.required.length : 0;
    const isDone = progress === 1;
    const isActive = !isDone && !foundActive;
    if (isActive) foundActive = true;

    return {
      name: p.name,
      required: p.required,
      completed,
      progress,
      isActive,
      isDone,
    };
  });

  const totalSkills = phases.reduce((s, p) => s + p.required.length, 0);
  const doneSkills = phases.reduce((s, p) => s + p.completed.length, 0);

  return {
    flowName,
    description: flow.description,
    phases,
    overallProgress: totalSkills > 0 ? doneSkills / totalSkills : 0,
  };
}

export function getTraceEvents(): TraceEvent[] {
  const signalsDir = join(ROOT, ".harness", "signals");
  if (!existsSync(signalsDir)) return [];

  const events: TraceEvent[] = [];

  for (const file of readdirSync(signalsDir)) {
    const filePath = join(signalsDir, file);
    try {
      const stat = statSync(filePath);
      const content = readFileSync(filePath, "utf-8").trim();
      const type = file.includes("done")
        ? "done"
        : file.includes("needs-approval")
          ? "needs-approval"
          : "signal";

      events.push({
        timestamp: stat.mtimeMs,
        type,
        file,
        content: (() => { try { const p = JSON.parse(content); return p.agent ? p.agent + " · " + (p.session_id || "").slice(0,8) : file.replace(/\.json$/, ""); } catch { return file.replace(/\.json$/, ""); } })(),
      });
    } catch {}
  }

  return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
}

export function getActivity(): ActivityPoint[] {
  const since = new Date();
  since.setDate(since.getDate() - HEATMAP_DAYS);
  const sinceStr = since.toISOString().split("T")[0];

  const raw = exec(
    `git -C "${ROOT}" log --format="%aI" --since="${sinceStr}" 2>/dev/null`
  );
  if (!raw) return [];

  const buckets = new Map<string, number>();
  const now = new Date();
  for (let d = 0; d < HEATMAP_DAYS; d++) {
    for (let h = 0; h < 24; h++) {
      buckets.set(`${d}-${h}`, 0);
    }
  }

  for (const line of raw.split("\n").filter(Boolean)) {
    const date = new Date(line);
    const dayDiff = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (dayDiff >= 0 && dayDiff < HEATMAP_DAYS) {
      const key = `${dayDiff}-${date.getHours()}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
  }

  const points: ActivityPoint[] = [];
  for (const [key, count] of buckets) {
    const [day, hour] = key.split("-").map(Number);
    const d = new Date(now);
    d.setDate(d.getDate() - day);
    points.push({
      day,
      hour,
      count,
      date: d.toISOString().split("T")[0],
    });
  }

  return points;
}

export function sendNudge(paneId: string, message: string): { success: boolean; error?: string } {
  try {
    execSync(`tmux send-keys -t ${paneId} ${JSON.stringify(message)}`, {
      timeout: 3000,
    });
    execSync(`tmux send-keys -t ${paneId} Enter`, { timeout: 3000 });
    return { success: true };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
