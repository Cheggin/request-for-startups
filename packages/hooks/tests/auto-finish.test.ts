import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildCommitMessage,
  looksTaskComplete,
  parseTranscript,
  runAutoFinish,
  selectFilesToCommit,
  type CommandRunner,
} from "../src/auto-finish.js";

function writeTranscript(lines: unknown[]): string {
  const dir = mkdtempSync(join(tmpdir(), "auto-finish-"));
  const path = join(dir, "session.jsonl");
  writeFileSync(
    path,
    lines.map((line) => JSON.stringify(line)).join("\n") + "\n",
    "utf-8"
  );
  return path;
}

describe("parseTranscript", () => {
  it("extracts the issue number, task summary, touched files, and last assistant text", () => {
    const transcriptPath = writeTranscript([
      {
        type: "user",
        message: {
          role: "user",
          content: "gh issue view 36 then implement auto-commit Stop hook and auto-close issues",
        },
      },
      {
        type: "assistant",
        message: {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              name: "Edit",
              input: {
                file_path:
                  "/repo/packages/hooks/src/run-auto-finish.ts",
              },
            },
            {
              type: "text",
              text: "Implemented the stop hook automation and tests passed.",
            },
          ],
          stop_reason: "end_turn",
        },
      },
    ]);

    try {
      const parsed = parseTranscript(transcriptPath, "/repo");
      expect(parsed.issueNumber).toBe(36);
      expect(parsed.taskSummary).toBe(
        "implement auto-commit Stop hook and auto-close issues"
      );
      expect(parsed.touchedFiles).toEqual([
        "packages/hooks/src/run-auto-finish.ts",
      ]);
      expect(parsed.lastAssistantText).toContain("tests passed");
      expect(parsed.lastAssistantStopReason).toBe("end_turn");
    } finally {
      rmSync(dirname(transcriptPath), { recursive: true, force: true });
    }
  });
});

describe("selectFilesToCommit", () => {
  it("keeps only transcript-scoped changes and ignores ephemeral files", () => {
    const selected = selectFilesToCommit(
      [
        { path: "packages/hooks/src/run-auto-finish.ts", status: " M" },
        { path: ".claude/command-log.txt", status: " M" },
        { path: ".omc/session.json", status: "??" },
      ],
      ["packages/hooks/src/run-auto-finish.ts"],
      "main",
      36
    );

    expect(selected).toEqual(["packages/hooks/src/run-auto-finish.ts"]);
  });

  it("falls back to the full meaningful diff on a dedicated issue branch", () => {
    const selected = selectFilesToCommit(
      [
        { path: "packages/hooks/src/run-auto-finish.ts", status: " M" },
        { path: ".claude/settings.json", status: " M" },
      ],
      [],
      "feature/36-auto-finish",
      36
    );

    expect(selected).toEqual([
      "packages/hooks/src/run-auto-finish.ts",
      ".claude/settings.json",
    ]);
  });
});

describe("buildCommitMessage", () => {
  it("builds a conventional commit subject from the issue title and touched files", () => {
    const subject = buildCommitMessage({
      issueTitle:
        "[feat] CEO should be zero-action — automate all manual orchestration",
      taskSummary: "implement auto-commit Stop hook and auto-close issues",
      files: ["packages/hooks/src/run-auto-finish.ts", ".claude/settings.json"],
    });

    expect(subject).toBe(
      "feat(hooks): implement auto-commit Stop hook and auto-close issues"
    );
  });
});

describe("looksTaskComplete", () => {
  it("accepts completion-style final answers", () => {
    expect(
      looksTaskComplete(
        "Implemented the hook, added tests, and verified the flow.",
        "end_turn"
      )
    ).toBe(true);
  });

  it("rejects blocker-style final answers", () => {
    expect(
      looksTaskComplete(
        "Blocked on missing credentials. Remaining work is the GitHub close step.",
        "end_turn"
      )
    ).toBe(false);
  });
});

describe("runAutoFinish", () => {
  it("stages transcript-scoped files, commits, pushes, and closes the issue", () => {
    const transcriptPath = writeTranscript([
      {
        type: "user",
        message: {
          role: "user",
          content: "gh issue view 36 then implement auto-commit Stop hook and auto-close issues",
        },
      },
      {
        type: "assistant",
        message: {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              name: "Write",
              input: {
                file_path: "/repo/packages/hooks/src/run-auto-finish.ts",
              },
            },
            {
              type: "text",
              text: "Implemented the hook automation and tests passed.",
            },
          ],
          stop_reason: "end_turn",
        },
      },
    ]);

    const calls: Array<{ binary: string; args: string[] }> = [];
    const runner: CommandRunner = vi.fn((binary, args) => {
      calls.push({ binary, args });

      const joined = `${binary} ${args.join(" ")}`;
      if (joined === "git diff --name-only --diff-filter=U") {
        return { stdout: "", stderr: "", status: 0 };
      }
      if (joined === "git branch --show-current") {
        return { stdout: "main\n", stderr: "", status: 0 };
      }
      if (joined === "git status --porcelain --untracked-files=all") {
        return {
          stdout:
            " M packages/hooks/src/run-auto-finish.ts\n M SOUL.md\n?? .omc/session.json\n",
          stderr: "",
          status: 0,
        };
      }
      if (joined === "gh issue view 36 --json number,title,state") {
        return {
          stdout: JSON.stringify({
            number: 36,
            title:
              "[feat] CEO should be zero-action — automate all manual orchestration",
            state: "OPEN",
          }),
          stderr: "",
          status: 0,
        };
      }
      if (binary === "git" && args[0] === "add") {
        return { stdout: "", stderr: "", status: 0 };
      }
      if (joined === "git diff --cached --name-only") {
        return {
          stdout: "packages/hooks/src/run-auto-finish.ts\n",
          stderr: "",
          status: 0,
        };
      }
      if (binary === "git" && args[0] === "commit") {
        return { stdout: "[main abc1234] commit\n", stderr: "", status: 0 };
      }
      if (joined === "git rev-parse --abbrev-ref --symbolic-full-name @{u}") {
        return { stdout: "origin/main\n", stderr: "", status: 0 };
      }
      if (joined === "git push") {
        return { stdout: "", stderr: "", status: 0 };
      }
      if (joined === "git rev-parse HEAD") {
        return {
          stdout: "abc1234def5678abc1234def5678abc1234def0\n",
          stderr: "",
          status: 0,
        };
      }
      if (binary === "gh" && args[0] === "issue" && args[1] === "close") {
        return { stdout: "closed\n", stderr: "", status: 0 };
      }

      return { stdout: "", stderr: "", status: 0 };
    });

    try {
      process.env.HARNESS_AGENT = "agent-4";
      const result = runAutoFinish(
        {
          hook_event_name: "Stop",
          cwd: "/repo",
          transcript_path: transcriptPath,
        },
        {
          cwd: "/repo",
          runner,
        }
      );

      expect(result.status).toBe("committed");
      expect(result.issueNumber).toBe(36);
      expect(result.commitSha).toBe(
        "abc1234def5678abc1234def5678abc1234def0"
      );

      const addCall = calls.find(
        (call) => call.binary === "git" && call.args[0] === "add"
      );
      expect(addCall?.args).toEqual([
        "add",
        "-A",
        "--",
        "packages/hooks/src/run-auto-finish.ts",
      ]);

      const closeCall = calls.find(
        (call) => call.binary === "gh" && call.args[0] === "issue" && call.args[1] === "close"
      );
      expect(closeCall?.args).toContain("36");
      expect(closeCall?.args).toContain(
        "Closed by agent-4 in commit abc1234."
      );
    } finally {
      delete process.env.HARNESS_AGENT;
      rmSync(dirname(transcriptPath), { recursive: true, force: true });
    }
  });
});
