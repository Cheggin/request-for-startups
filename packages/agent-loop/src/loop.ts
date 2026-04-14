/**
 * Main agent loop — orchestrates mode cycle, hooks, plateau detection,
 * error handling, and subprocess spawning.
 *
 * Spawns `claude -p` as a subprocess with the agent's system prompt + loaded skills.
 */

import { spawn } from "child_process";
import { existsSync, readFileSync, appendFileSync, mkdirSync } from "fs";
import { join } from "path";
import { loadAgent } from "./agent-loader.js";
import { loadSkills, concatSkills } from "./skill-loader.js";
import { createDefaultHooks, runBeforeHooks, runAfterHooks } from "./hook-runner.js";
import { PlateauDetector } from "./plateau-detector.js";
import { classifyError, shouldRetry } from "./error-classifier.js";
import type {
  LoopConfig,
  LoopEvent,
  ModeName,
  ModeResult,
  HookSet,
  AgentDefinition,
  LearningContext,
  PostTaskResult,
} from "./types.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_MODES: ModeName[] = ["research", "plan", "build", "verify"];

const MODE_PROMPTS: Record<ModeName, string> = {
  research:
    "You are in RESEARCH mode. Investigate the codebase, read files, search for patterns, and understand the current state before making changes. Do not edit files yet.",
  plan:
    "You are in PLAN mode. Based on your research, create a concrete plan of action. List the files to change, the order of changes, and the expected outcome for each step.",
  build:
    "You are in BUILD mode. Execute the plan. Make targeted edits, write tests, and implement the required changes. Verify each change compiles/passes before moving on.",
  verify:
    "You are in VERIFY mode. Run tests, check for regressions, verify the implementation matches requirements. Report any remaining issues.",
};

// ─── Knowledge Paths ────────────────────────────────────────────────────────

const KNOWLEDGE_BASE_DIR = ".harness/knowledge";

function knowledgeCategoryDir(cwd: string, category: string): string {
  return join(cwd, KNOWLEDGE_BASE_DIR, category);
}

// ─── Pre-task Learning ──────────────────────────────────────────────────────

/**
 * Query the knowledge wiki before task execution.
 * Reads the category index, searches for relevant prior findings,
 * and reads recent ledger entries to inject context into the agent prompt.
 */
export async function preTaskLearning(
  category: string,
  taskDescription: string,
  cwd: string = process.cwd(),
): Promise<LearningContext> {
  const categoryDir = knowledgeCategoryDir(cwd, category);
  const indexPath = join(categoryDir, "index.md");
  const logPath = join(categoryDir, "log.md");

  let indexContent = "";
  let recentLogs: string[] = [];
  const relevantFindings: string[] = [];

  // Read category index
  if (existsSync(indexPath)) {
    indexContent = readFileSync(indexPath, "utf-8");
  }

  // Read recent ledger entries (last 20 lines)
  if (existsSync(logPath)) {
    const logContent = readFileSync(logPath, "utf-8");
    const lines = logContent.split("\n").filter((l) => l.startsWith("- "));
    recentLogs = lines.slice(-20);
  }

  // Search for relevant wiki pages by extracting keywords from task
  const keywords = taskDescription
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 5);

  const wikiDir = join(categoryDir, "wiki");
  if (existsSync(wikiDir)) {
    try {
      const { readdirSync } = await import("fs");
      const files = readdirSync(wikiDir).filter((f: string) => f.endsWith(".md"));
      for (const file of files) {
        const content = readFileSync(join(wikiDir, file), "utf-8");
        const lowerContent = content.toLowerCase();
        const matchCount = keywords.filter((k) => lowerContent.includes(k)).length;
        if (matchCount >= 2) {
          relevantFindings.push(content.slice(0, 500));
        }
      }
    } catch {
      // Wiki dir may not exist yet — that is fine
    }
  }

  // Build context string for injection
  const contextParts: string[] = [];

  if (relevantFindings.length > 0) {
    contextParts.push("## Prior Knowledge");
    contextParts.push(
      ...relevantFindings.slice(0, 5).map((f, i) => `### Finding ${i + 1}\n${f}`),
    );
  }

  if (recentLogs.length > 0) {
    contextParts.push("## Recent Activity");
    contextParts.push(recentLogs.join("\n"));
  }

  return {
    contextToInject: contextParts.join("\n\n"),
    indexContent,
    relevantFindings,
    recentLogEntries: recentLogs,
  };
}

// ─── Post-task Learning ─────────────────────────────────────────────────────

/**
 * Ingest learnings after task execution completes.
 * Appends to the category log, ingests key findings into wiki on success,
 * and logs failures to avoid repeating them.
 */
export async function postTaskLearning(
  category: string,
  result: PostTaskResult,
  cwd: string = process.cwd(),
): Promise<void> {
  const categoryDir = knowledgeCategoryDir(cwd, category);
  const logPath = join(categoryDir, "log.md");

  // Ensure directory exists
  mkdirSync(categoryDir, { recursive: true });

  // Initialize log file if it does not exist
  if (!existsSync(logPath)) {
    const header = `# ${category} Knowledge Log\n\n_Append-only operation chronicle._\n`;
    appendFileSync(logPath, header);
  }

  const timestamp = new Date().toISOString();
  const status = result.success ? "SUCCESS" : "FAILURE";

  // Build log entry
  const entry = [
    `- ${timestamp} [TASK] ${status}`,
    `  duration: ${result.duration_ms}ms`,
    `  turns: ${result.turns_used}`,
    `  files: ${result.filesChanged.join(", ") || "none"}`,
  ];

  if (result.lessonsLearned) {
    entry.push(`  lessons: ${result.lessonsLearned}`);
  }

  appendFileSync(logPath, "\n" + entry.join("\n") + "\n");

  // Track metrics to a ledger file
  const ledgerPath = join(categoryDir, "ledger.json");
  let ledger: Array<{
    timestamp: string;
    success: boolean;
    duration_ms: number;
    turns_used: number;
    filesChanged: string[];
  }> = [];

  if (existsSync(ledgerPath)) {
    try {
      ledger = JSON.parse(readFileSync(ledgerPath, "utf-8"));
    } catch {
      ledger = [];
    }
  }

  ledger.push({
    timestamp,
    success: result.success,
    duration_ms: result.duration_ms,
    turns_used: result.turns_used,
    filesChanged: result.filesChanged,
  });

  // Write atomically via temp approach using sync fs
  const { writeFileSync } = await import("fs");
  writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2));
}

// ─── Event Emitter ───────────────────────────────────────────────────────────

export type LoopEventSink = (event: LoopEvent) => void;

// ─── System Prompt Builder ───────────────────────────────────────────────────

export function buildSystemPrompt(
  agent: AgentDefinition,
  skills: string,
  modePrompt: string,
  task: string,
): string {
  const parts: string[] = [];

  parts.push(`# Agent: ${agent.name}`);
  parts.push(`Model: ${agent.model} | Level: ${agent.level} | Max turns: ${agent.maxTurns}`);
  parts.push("");

  if (agent.disallowedTools.length > 0) {
    parts.push(`Disallowed tools: ${agent.disallowedTools.join(", ")}`);
    parts.push("");
  }

  parts.push("## Current Mode");
  parts.push(modePrompt);
  parts.push("");

  parts.push("## Task");
  parts.push(task);
  parts.push("");

  if (agent.body) {
    parts.push("## Agent Instructions");
    parts.push(agent.body);
    parts.push("");
  }

  if (skills) {
    parts.push("## Loaded Skills");
    parts.push(skills);
    parts.push("");
  }

  return parts.join("\n");
}

// ─── Subprocess Runner ───────────────────────────────────────────────────────

/**
 * Spawn `claude -p` with the given prompt and return its stdout output.
 */
export async function spawnClaude(
  systemPrompt: string,
  cwd?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("claude", ["-p", systemPrompt], {
      cwd: cwd ?? process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`claude exited with code ${code}: ${stderr || stdout}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });
  });
}

// ─── Mode Runner ─────────────────────────────────────────────────────────────

async function runMode(
  mode: ModeName,
  agent: AgentDefinition,
  skills: string,
  config: LoopConfig,
  hooks: HookSet,
  emit: LoopEventSink,
): Promise<ModeResult> {
  emit({ type: "mode_start", mode });

  const modePrompt = MODE_PROMPTS[mode];
  const systemPrompt = buildSystemPrompt(agent, skills, modePrompt, config.task);

  let output: string;
  let attempt = 0;

  while (true) {
    try {
      output = await spawnClaude(systemPrompt, config.cwd);
      break;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      const classified = classifyError(error);
      emit({ type: "error_classified", error: classified });

      if (shouldRetry(error, attempt)) {
        attempt++;
        continue;
      }

      // Cannot recover
      const result: ModeResult = {
        mode,
        progress: 0,
        summary: `Failed: ${classified.message}`,
        completed: false,
      };
      emit({ type: "mode_end", result });
      return result;
    }
  }

  emit({ type: "subprocess_output", data: output });

  const result: ModeResult = {
    mode,
    progress: 100,
    summary: output.slice(0, 500),
    completed: true,
  };

  emit({ type: "mode_end", result });
  return result;
}

// ─── Main Loop ───────────────────────────────────────────────────────────────

/**
 * Run the full agent loop: load agent, load skills, cycle through modes,
 * apply hooks, detect plateaus, classify errors.
 */
export async function runLoop(
  config: LoopConfig,
  agentName: string,
  emit: LoopEventSink = () => {},
): Promise<ModeResult[]> {
  // 1. Load agent definition
  const agent = loadAgent(config.agentsDir, agentName);

  // 2. Load and concat skills
  const skills = concatSkills(loadSkills(config.skillsDir, agentName));

  // 3. Set up hooks
  const hooks = createDefaultHooks(agent.disallowedTools, (msg) =>
    emit({ type: "subprocess_output", data: msg }),
  );

  // 4. Determine mode sequence
  const modes = config.modes ?? DEFAULT_MODES;
  const maxTurns = config.maxTurns ?? agent.maxTurns;

  // 5. Initialize plateau detector
  const detector = new PlateauDetector();

  emit({ type: "loop_start", agent: agent.name, task: config.task });

  const results: ModeResult[] = [];
  let totalTurns = 0;

  for (const mode of modes) {
    if (totalTurns >= maxTurns) {
      emit({ type: "loop_end", reason: "max_turns_reached", totalTurns });
      return results;
    }

    totalTurns++;
    emit({ type: "turn", turn: totalTurns, maxTurns });

    const result = await runMode(mode, agent, skills, config, hooks, emit);
    results.push(result);

    // Record progress and check for plateau
    const signal = detector.record(result.progress);
    if (signal !== "ok") {
      emit({
        type: "plateau_detected",
        signal,
        progress: result.progress,
      });

      if (signal === "plateau") {
        emit({ type: "loop_end", reason: "plateau_detected", totalTurns });
        return results;
      }
      // "stuck" = escalate but continue for now
    }

    if (!result.completed) {
      emit({ type: "loop_end", reason: "mode_failed", totalTurns });
      return results;
    }
  }

  emit({ type: "loop_end", reason: "completed", totalTurns });
  return results;
}
