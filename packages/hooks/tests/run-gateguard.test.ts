import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawn } from "child_process";
import { unlinkSync, existsSync } from "fs";
import { resolve } from "path";
import { createHash } from "crypto";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const SCRIPT_PATH = resolve(__dirname, "../src/run-gateguard.ts");
const TEST_SESSION_ID = "test-gateguard-cli";

function repoHash(cwd: string): string {
  return createHash("sha256").update(cwd).digest("hex").slice(0, 8);
}

function stateFile(sessionId: string, cwd: string): string {
  return `/tmp/gateguard-reads-${sessionId}-${repoHash(cwd)}.json`;
}

function runGateGuard(
  input: object,
  opts?: { sessionId?: string; cwd?: string }
): Promise<{ code: number; stdout: string; stderr: string }> {
  const sid = opts?.sessionId ?? TEST_SESSION_ID;
  const cwd = opts?.cwd ?? process.cwd();
  return new Promise((resolve) => {
    const proc = spawn("bun", ["run", SCRIPT_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd,
      env: { ...process.env, CLAUDE_SESSION_ID: sid },
    });
    const stdout: string[] = [];
    const stderr: string[] = [];

    proc.stdout.on("data", (d) => stdout.push(d.toString()));
    proc.stderr.on("data", (d) => stderr.push(d.toString()));

    proc.on("close", (code) => {
      resolve({ code: code ?? 1, stdout: stdout.join(""), stderr: stderr.join("") });
    });

    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}

function cleanupStateFile(sessionId: string, cwd: string): void {
  const path = stateFile(sessionId, cwd);
  if (existsSync(path)) unlinkSync(path);
}

describe("run-gateguard CLI", () => {
  beforeEach(() => {
    cleanupStateFile(TEST_SESSION_ID, process.cwd());
  });

  afterEach(() => {
    cleanupStateFile(TEST_SESSION_ID, process.cwd());
  });

  it("should track Read calls in state file", async () => {
    const result = await runGateGuard({
      tool_name: "Read",
      tool_input: { file_path: "/src/app.ts" },
    });

    expect(result.code).toBe(0);
  });

  it("should ALLOW Edit if file was previously Read", async () => {
    await runGateGuard({ tool_name: "Read", tool_input: { file_path: "/src/app.ts" } });

    const result = await runGateGuard({
      tool_name: "Edit",
      tool_input: { file_path: "/src/app.ts", old_string: "foo", new_string: "bar" },
    });

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("should DENY Edit if file was NOT previously Read", async () => {
    const result = await runGateGuard({
      tool_name: "Edit",
      tool_input: { file_path: "/src/app.ts", old_string: "foo", new_string: "bar" },
    });

    expect(result.code).toBe(2);
    expect(result.stderr).toContain("GateGuard");
    expect(result.stderr).toContain("/src/app.ts");
  });

  it("should DENY Write if file was NOT previously Read", async () => {
    const result = await runGateGuard({
      tool_name: "Write",
      tool_input: { file_path: "/src/new-file.ts", content: "hello world" },
    });

    expect(result.code).toBe(2);
    expect(result.stderr).toContain("GateGuard");
    expect(result.stderr).toContain("/src/new-file.ts");
  });

  it("should ALLOW Write if file was previously Read", async () => {
    await runGateGuard({ tool_name: "Read", tool_input: { file_path: "/src/new-file.ts" } });

    const result = await runGateGuard({
      tool_name: "Write",
      tool_input: { file_path: "/src/new-file.ts", content: "hello world" },
    });

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("should ALLOW non-gated tool calls without restriction", async () => {
    const result = await runGateGuard({
      tool_name: "Bash",
      tool_input: { command: "ls" },
    });

    expect(result.code).toBe(0);
  });
});

describe("session isolation", () => {
  const SESSION_A = "session-a";
  const SESSION_B = "session-b";

  afterEach(() => {
    cleanupStateFile(SESSION_A, process.cwd());
    cleanupStateFile(SESSION_B, process.cwd());
  });

  it("should DENY Edit in session B even if session A Read the same file", async () => {
    // Session A reads the file
    await runGateGuard(
      { tool_name: "Read", tool_input: { file_path: "/src/shared.ts" } },
      { sessionId: SESSION_A }
    );

    // Session B tries to edit without reading — should be denied
    const result = await runGateGuard(
      { tool_name: "Edit", tool_input: { file_path: "/src/shared.ts", old_string: "a", new_string: "b" } },
      { sessionId: SESSION_B }
    );

    expect(result.code).toBe(2);
    expect(result.stderr).toContain("GateGuard");
  });

  it("should ALLOW Edit in session B after session B reads the file", async () => {
    // Session A reads
    await runGateGuard(
      { tool_name: "Read", tool_input: { file_path: "/src/shared.ts" } },
      { sessionId: SESSION_A }
    );

    // Session B reads
    await runGateGuard(
      { tool_name: "Read", tool_input: { file_path: "/src/shared.ts" } },
      { sessionId: SESSION_B }
    );

    // Session B edits — should succeed
    const result = await runGateGuard(
      { tool_name: "Edit", tool_input: { file_path: "/src/shared.ts", old_string: "a", new_string: "b" } },
      { sessionId: SESSION_B }
    );

    expect(result.code).toBe(0);
  });
});

describe("repo isolation", () => {
  let repoA: string;
  let repoB: string;

  beforeEach(() => {
    repoA = mkdtempSync(join(tmpdir(), "gateguard-repo-a-"));
    repoB = mkdtempSync(join(tmpdir(), "gateguard-repo-b-"));
  });

  afterEach(() => {
    cleanupStateFile(TEST_SESSION_ID, repoA);
    cleanupStateFile(TEST_SESSION_ID, repoB);
    rmSync(repoA, { recursive: true, force: true });
    rmSync(repoB, { recursive: true, force: true });
  });

  it("should DENY Edit in repo B even if same session Read the file in repo A", async () => {
    // Read in repo A
    await runGateGuard(
      { tool_name: "Read", tool_input: { file_path: "/src/model.ts" } },
      { cwd: repoA }
    );

    // Edit in repo B without reading — should be denied
    const result = await runGateGuard(
      { tool_name: "Edit", tool_input: { file_path: "/src/model.ts", old_string: "x", new_string: "y" } },
      { cwd: repoB }
    );

    expect(result.code).toBe(2);
    expect(result.stderr).toContain("GateGuard");
  });

  it("should ALLOW Edit in repo B after reading in repo B", async () => {
    // Read in repo A only
    await runGateGuard(
      { tool_name: "Read", tool_input: { file_path: "/src/model.ts" } },
      { cwd: repoA }
    );

    // Read in repo B
    await runGateGuard(
      { tool_name: "Read", tool_input: { file_path: "/src/model.ts" } },
      { cwd: repoB }
    );

    // Edit in repo B — should succeed
    const result = await runGateGuard(
      { tool_name: "Edit", tool_input: { file_path: "/src/model.ts", old_string: "x", new_string: "y" } },
      { cwd: repoB }
    );

    expect(result.code).toBe(0);
  });
});
