import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildSignalPayload,
  getSignalFileName,
  writeInterAgentSignal,
} from "../src/inter-agent-signal.js";

describe("inter-agent-signal", () => {
  it("maps Stop to the done signal file", () => {
    expect(getSignalFileName("Stop")).toBe("done");
  });

  it("maps PermissionRequest to the needs-approval signal file", () => {
    expect(getSignalFileName("PermissionRequest")).toBe("needs-approval");
  });

  it("ignores unsupported hook events", () => {
    expect(getSignalFileName("PreToolUse")).toBeUndefined();
  });

  it("builds a payload with the expected event metadata", () => {
    const payload = buildSignalPayload(
      {
        hook_event_name: "PermissionRequest",
        session_id: "sess-123",
        cwd: "/tmp/project",
        tool_name: "Bash",
        tool_input: { command: "git push" },
      },
      {
        agent: "loop-commander",
        at: "2026-04-14T23:59:59.000Z",
      }
    );

    expect(payload).toEqual({
      agent: "loop-commander",
      at: "2026-04-14T23:59:59.000Z",
      cwd: "/tmp/project",
      event: "PermissionRequest",
      permission_mode: null,
      session_id: "sess-123",
      tool_input: { command: "git push" },
      tool_name: "Bash",
      tool_use_id: null,
      transcript_path: null,
    });
  });

  it("writes the done signal into .harness/signals", () => {
    const projectRoot = mkdtempSync(join(tmpdir(), "signal-hook-"));

    try {
      const writtenPath = writeInterAgentSignal(
        projectRoot,
        {
          hook_event_name: "Stop",
          session_id: "sess-stop",
          cwd: projectRoot,
        },
        {
          agent: "loop-content",
          at: "2026-04-14T20:00:00.000Z",
        }
      );

      expect(writtenPath).toBe(join(projectRoot, ".harness", "signals", "done"));

      const payload = JSON.parse(readFileSync(writtenPath!, "utf-8"));
      expect(payload.agent).toBe("loop-content");
      expect(payload.event).toBe("Stop");
      expect(payload.session_id).toBe("sess-stop");
    } finally {
      rmSync(projectRoot, { recursive: true, force: true });
    }
  });
});
