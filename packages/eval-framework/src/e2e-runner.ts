/**
 * E2E test runner for skill evaluation.
 *
 * Spawns `claude -p --output-format json` as a subprocess, pipes a fixture
 * prompt via stdin, captures output, and verifies skill activation, artifact
 * production, and clean exit.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface E2ERunnerOptions {
  /** Skill name being tested (used for logging / diagnostics). */
  skillName: string;
  /** The fixture prompt to send to claude. */
  prompt: string;
  /** Working directory for the subprocess. */
  workingDirectory: string;
  /** Maximum agentic turns before we cut off. Default 15. */
  maxTurns?: number;
  /** Tools the subprocess is allowed to call. Default ['Bash','Read','Write']. */
  allowedTools?: string[];
  /** Timeout in milliseconds. Default 120_000. */
  timeout?: number;
  /** Model override. Defaults to EVALS_MODEL env or 'claude-sonnet-4-6'. */
  model?: string;
}

export interface E2EResult {
  pass: boolean;
  turns: number;
  cost_usd: number;
  exit_reason: string;
  last_tool_call: string;
  duration_ms: number;
  transcript: object[];
}

/** A single parsed tool call extracted from the NDJSON stream. */
export interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  output: string;
}

// ---------------------------------------------------------------------------
// NDJSON parser (pure, no I/O)
// ---------------------------------------------------------------------------

export interface ParsedNDJSON {
  transcript: object[];
  resultLine: Record<string, unknown> | null;
  turnCount: number;
  toolCalls: ToolCall[];
}

/**
 * Parse an array of NDJSON lines into structured transcript data.
 * Pure function — no I/O, no side effects.
 */
export function parseNDJSON(lines: string[]): ParsedNDJSON {
  const transcript: object[] = [];
  let resultLine: Record<string, unknown> | null = null;
  let turnCount = 0;
  const toolCalls: ToolCall[] = [];

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
              output: "",
            });
          }
        }
      }

      if (event.type === "result") {
        resultLine = event;
      }
    } catch {
      // skip malformed lines
    }
  }

  return { transcript, resultLine, turnCount, toolCalls };
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

export async function runE2E(options: E2ERunnerOptions): Promise<E2EResult> {
  const {
    skillName,
    prompt,
    workingDirectory,
    maxTurns = 15,
    allowedTools = ["Bash", "Read", "Write"],
    timeout = 120_000,
  } = options;
  const model =
    options.model ?? process.env.EVALS_MODEL ?? "claude-sonnet-4-6";

  const startTime = Date.now();

  // Write prompt to a temp file to avoid shell-escaping issues.
  const promptFile = path.join(
    os.tmpdir(),
    `.eval-prompt-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  fs.writeFileSync(promptFile, prompt);

  // Build args for claude -p
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

  const shellCmd = `cat "${promptFile}" | claude ${args.map((a) => `"${a}"`).join(" ")}`;

  const proc = Bun.spawn(["sh", "-c", shellCmd], {
    cwd: workingDirectory,
    stdout: "pipe",
    stderr: "pipe",
  });

  // Race against timeout
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    proc.kill();
  }, timeout);

  // Stream and collect NDJSON from stdout
  const collectedLines: string[] = [];
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

        // Real-time progress to stderr
        try {
          const event = JSON.parse(line);
          if (event.type === "assistant") {
            const content = event.message?.content || [];
            for (const item of content) {
              if (item.type === "tool_use") {
                const elapsed = Math.round((Date.now() - startTime) / 1000);
                process.stderr.write(
                  `  [${elapsed}s] [${skillName}] tool: ${item.name}\n`
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
    // stream read error — fall through
  }

  // Flush remaining buffer
  if (buf.trim()) {
    collectedLines.push(buf);
  }

  await stderrPromise;
  const exitCode = await proc.exited;
  clearTimeout(timeoutId);

  // Clean up temp file
  try {
    fs.unlinkSync(promptFile);
  } catch {
    // non-fatal
  }

  const duration_ms = Date.now() - startTime;

  // Parse collected NDJSON
  const parsed = parseNDJSON(collectedLines);
  const { transcript, resultLine, turnCount, toolCalls } = parsed;

  // Determine exit reason
  let exit_reason: string;
  if (timedOut) {
    exit_reason = "timeout";
  } else if (resultLine) {
    const rl = resultLine as Record<string, unknown>;
    if (rl.subtype === "success" && rl.is_error) {
      exit_reason = "error_api";
    } else if (rl.subtype === "success") {
      exit_reason = "success";
    } else if (rl.subtype) {
      exit_reason = String(rl.subtype);
    } else {
      exit_reason = exitCode === 0 ? "success" : `exit_code_${exitCode}`;
    }
  } else {
    exit_reason = exitCode === 0 ? "success" : `exit_code_${exitCode}`;
  }

  // Extract cost from result line
  const rl = (resultLine || {}) as Record<string, unknown>;
  const cost_usd =
    typeof rl.total_cost_usd === "number"
      ? Math.round(rl.total_cost_usd * 100) / 100
      : 0;
  const turns =
    typeof rl.num_turns === "number" ? (rl.num_turns as number) : turnCount;

  // Last tool call
  const last_tool_call =
    toolCalls.length > 0 ? toolCalls[toolCalls.length - 1].tool : "none";

  // Determine pass: skill activated (at least one tool call), clean exit
  const pass = exit_reason === "success" && toolCalls.length > 0;

  return {
    pass,
    turns,
    cost_usd,
    exit_reason,
    last_tool_call,
    duration_ms,
    transcript,
  };
}

// ---------------------------------------------------------------------------
// Verification helpers
// ---------------------------------------------------------------------------

/**
 * Check that expected tools were called during the E2E run.
 * Returns the list of expected tools that were NOT called.
 */
export function verifyToolsActivated(
  result: E2EResult,
  expectedTools: string[]
): string[] {
  const calledTools = new Set(
    (result.transcript as Array<Record<string, unknown>>)
      .filter((e) => e.type === "assistant")
      .flatMap((e) => {
        const msg = e.message as Record<string, unknown> | undefined;
        const content = (msg?.content || []) as Array<
          Record<string, unknown>
        >;
        return content
          .filter((c) => c.type === "tool_use")
          .map((c) => String(c.name));
      })
  );

  return expectedTools.filter((t) => !calledTools.has(t));
}

/**
 * Check that expected artifact files were created in the working directory.
 * Returns the list of expected files that do NOT exist.
 */
export function verifyArtifactsProduced(
  workingDirectory: string,
  expectedFiles: string[]
): string[] {
  return expectedFiles.filter((f) => {
    const fullPath = path.isAbsolute(f) ? f : path.join(workingDirectory, f);
    return !fs.existsSync(fullPath);
  });
}
