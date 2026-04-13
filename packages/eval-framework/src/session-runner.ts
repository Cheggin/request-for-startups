/**
 * E2E subprocess runner skeleton for skill testing.
 *
 * Spawns `claude -p` with a prompt, captures JSON output,
 * and tracks execution metrics. This is the foundation for
 * Tier 2 E2E evals -- just the runner, not the tests.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// --- Interfaces ---

export interface SessionRunnerOptions {
  /** The prompt to send to claude -p */
  prompt: string;
  /** Working directory for the subprocess */
  workingDirectory: string;
  /** Max turns before giving up (default: 15) */
  maxTurns?: number;
  /** Allowed tools (default: Bash, Read, Write) */
  allowedTools?: string[];
  /** Timeout in ms (default: 120000) */
  timeout?: number;
  /** Human-readable test name */
  testName?: string;
  /** Model override (default: claude-sonnet-4-6 or EVALS_MODEL env) */
  model?: string;
}

export interface SessionResult {
  /** Final text output from the session */
  output: string;
  /** Number of assistant turns used */
  turns_used: number;
  /** Estimated cost in USD */
  cost_usd: number;
  /** Why the session ended */
  exit_reason: "success" | "timeout" | "error" | string;
  /** Last tool that was called before exit */
  last_tool_call: string | null;
  /** Total wall-clock duration in ms */
  duration_ms: number;
  /** Full NDJSON transcript */
  transcript: unknown[];
  /** Tool calls extracted from transcript */
  tool_calls: Array<{ tool: string; input: unknown }>;
  /** Model used */
  model: string;
  /** Time from spawn to first response in ms */
  first_response_ms: number;
  /** Peak latency between consecutive tool calls in ms */
  max_inter_turn_ms: number;
}

// --- NDJSON parsing ---

export interface ParsedNDJSON {
  transcript: unknown[];
  resultLine: any | null;
  turnCount: number;
  toolCalls: Array<{ tool: string; input: unknown }>;
}

/**
 * Parse NDJSON lines into structured transcript data.
 * Pure function -- no I/O, no side effects.
 */
export function parseNDJSON(lines: string[]): ParsedNDJSON {
  const transcript: unknown[] = [];
  let resultLine: any = null;
  let turnCount = 0;
  const toolCalls: ParsedNDJSON["toolCalls"] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      transcript.push(event);

      if (event.type === "assistant") {
        turnCount++;
        const content = event.message?.content || [];
        for (const item of content) {
          if (item.type === "tool_use") {
            toolCalls.push({
              tool: item.name || "unknown",
              input: item.input || {},
            });
          }
        }
      }

      if (event.type === "result") resultLine = event;
    } catch {
      // skip malformed lines
    }
  }

  return { transcript, resultLine, turnCount, toolCalls };
}

// --- Main runner ---

/**
 * Run a claude -p session as a subprocess and capture results.
 *
 * This spawns a completely independent process (not via Agent SDK)
 * so it works inside Claude Code sessions. Uses NDJSON streaming
 * for real-time progress tracking.
 */
export async function runSession(
  options: SessionRunnerOptions,
): Promise<SessionResult> {
  const {
    prompt,
    workingDirectory,
    maxTurns = 15,
    allowedTools = ["Bash", "Read", "Write"],
    timeout = 120_000,
    testName,
  } = options;
  const model =
    options.model ?? process.env.EVALS_MODEL ?? "claude-sonnet-4-6";

  const startTime = Date.now();

  // Write prompt to temp file to avoid shell escaping issues
  const promptFile = path.join(
    os.tmpdir(),
    `.eval-prompt-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  fs.writeFileSync(promptFile, prompt);

  // Build claude args
  const args = [
    "-p",
    "--model",
    model,
    "--output-format",
    "stream-json",
    "--verbose",
    "--dangerously-skip-permissions",
    "--max-turns",
    String(maxTurns),
    "--allowed-tools",
    ...allowedTools,
  ];

  const proc = Bun.spawn(
    [
      "sh",
      "-c",
      `cat "${promptFile}" | claude ${args.map((a) => `"${a}"`).join(" ")}`,
    ],
    {
      cwd: workingDirectory,
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  // Race against timeout
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    proc.kill();
  }, timeout);

  // Stream and collect NDJSON
  const collectedLines: string[] = [];
  let firstResponseMs = 0;
  let lastToolTime = 0;
  let maxInterTurnMs = 0;
  let liveTurnCount = 0;
  let liveToolCount = 0;

  const stderrPromise = new Response(proc.stderr).text();
  const reader = proc.stdout.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        collectedLines.push(line);

        // Track timing for telemetry
        try {
          const event = JSON.parse(line);
          if (event.type === "assistant") {
            liveTurnCount++;
            const content = event.message?.content || [];
            for (const item of content) {
              if (item.type === "tool_use") {
                liveToolCount++;
                const now = Date.now();
                if (firstResponseMs === 0) firstResponseMs = now - startTime;
                if (lastToolTime > 0) {
                  const interTurn = now - lastToolTime;
                  if (interTurn > maxInterTurnMs) maxInterTurnMs = interTurn;
                }
                lastToolTime = now;

                // Progress to stderr
                const elapsed = Math.round((now - startTime) / 1000);
                const label = testName || "eval";
                process.stderr.write(
                  `  [${elapsed}s] ${label} turn ${liveTurnCount} tool #${liveToolCount}: ${item.name}\n`,
                );
              }
            }
          }
        } catch {
          // skip parse errors during streaming
        }
      }
    }
  } catch {
    // stream read error
  }

  // Flush remaining buffer
  if (buf.trim()) {
    collectedLines.push(buf);
  }

  await stderrPromise;
  const exitCode = await proc.exited;
  clearTimeout(timeoutId);

  // Clean up prompt file
  try {
    fs.unlinkSync(promptFile);
  } catch {
    // non-fatal
  }

  // Determine exit reason
  let exit_reason: string;
  if (timedOut) {
    exit_reason = "timeout";
  } else if (exitCode === 0) {
    exit_reason = "success";
  } else {
    exit_reason = `exit_code_${exitCode}`;
  }

  const duration_ms = Date.now() - startTime;

  // Parse collected NDJSON
  const parsed = parseNDJSON(collectedLines);
  const { transcript, resultLine, toolCalls } = parsed;

  // Refine exit reason from result line
  if (resultLine) {
    if (resultLine.subtype === "success" && resultLine.is_error) {
      exit_reason = "error_api";
    } else if (resultLine.subtype === "success") {
      exit_reason = "success";
    } else if (resultLine.subtype) {
      exit_reason = resultLine.subtype;
    }
  }

  // Extract metrics
  const turns_used = resultLine?.num_turns || liveTurnCount;
  const cost_usd = resultLine?.total_cost_usd || 0;
  const last_tool_call =
    toolCalls.length > 0 ? toolCalls[toolCalls.length - 1].tool : null;

  return {
    output: resultLine?.result || "",
    turns_used,
    cost_usd: Math.round(cost_usd * 100) / 100,
    exit_reason,
    last_tool_call,
    duration_ms,
    transcript,
    tool_calls: toolCalls,
    model,
    first_response_ms: firstResponseMs,
    max_inter_turn_ms: maxInterTurnMs,
  };
}
