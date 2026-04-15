import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { basename, join } from "path";

export interface HookEventInput {
  hook_event_name?: string;
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  permission_mode?: string;
  tool_name?: string;
  tool_use_id?: string;
  tool_input?: Record<string, unknown>;
  [key: string]: unknown;
}

type SupportedHookEvent = "PermissionRequest" | "Stop";

const SIGNAL_FILE_BY_EVENT: Record<SupportedHookEvent, string> = {
  Stop: "done",
  PermissionRequest: "needs-approval",
};

export function getSignalFileName(
  hookEventName: string | undefined
): string | undefined {
  if (!hookEventName) {
    return undefined;
  }

  return SIGNAL_FILE_BY_EVENT[hookEventName as SupportedHookEvent];
}

export function detectAgentName(fallbackCwd: string): string {
  if (process.env.HARNESS_AGENT) {
    return process.env.HARNESS_AGENT;
  }

  try {
    const windowName = execSync(
      "tmux display-message -p '#{window_name}' 2>/dev/null",
      {
        encoding: "utf-8",
        timeout: 3000,
      }
    ).trim();

    if (windowName) {
      return windowName;
    }
  } catch {
    // Fall back to the repo directory name outside tmux.
  }

  return basename(fallbackCwd) || "unknown";
}

export function buildSignalPayload(
  input: HookEventInput,
  options?: {
    agent?: string;
    at?: string;
    cwd?: string;
  }
): Record<string, unknown> {
  const cwd = input.cwd || options?.cwd || process.cwd();
  const event = input.hook_event_name || "unknown";

  return {
    agent: options?.agent || detectAgentName(cwd),
    at: options?.at || new Date().toISOString(),
    cwd,
    event,
    permission_mode: input.permission_mode || null,
    session_id: input.session_id || null,
    tool_input: input.tool_input || null,
    tool_name: input.tool_name || null,
    tool_use_id: input.tool_use_id || null,
    transcript_path: input.transcript_path || null,
  };
}

export function writeInterAgentSignal(
  projectRoot: string,
  input: HookEventInput,
  options?: {
    agent?: string;
    at?: string;
  }
): string | undefined {
  const signalFileName = getSignalFileName(input.hook_event_name);

  if (!signalFileName) {
    return undefined;
  }

  const signalsDir = join(projectRoot, ".harness", "signals");
  mkdirSync(signalsDir, { recursive: true });

  const payload = buildSignalPayload(input, {
    agent: options?.agent,
    at: options?.at,
    cwd: input.cwd || projectRoot,
  });

  const signalPath = join(signalsDir, signalFileName);
  writeFileSync(signalPath, JSON.stringify(payload, null, 2) + "\n");

  return signalPath;
}
