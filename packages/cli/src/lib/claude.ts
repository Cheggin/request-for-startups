/**
 * Claude invocation helper.
 * Properly runs claude -p in a target directory.
 */
import { execSync } from "child_process";
import { writeFileSync, mkdtempSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export interface ClaudeResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Run a prompt through claude -p in a specific directory.
 * Writes prompt to a temp file to avoid shell escaping issues.
 */
export function runClaude(
  prompt: string,
  options: {
    cwd?: string;
    timeout?: number;
    addDirs?: string[];
  } = {}
): ClaudeResult {
  const { cwd = process.cwd(), timeout = 300000, addDirs = [] } = options;

  // Write prompt to temp file to avoid shell escaping nightmares
  const tmpFile = join(mkdtempSync(join(tmpdir(), "harness-")), "prompt.txt");
  writeFileSync(tmpFile, prompt);

  const addDirArgs = addDirs.map((d) => `--add-dir "${d}"`).join(" ");

  try {
    const output = execSync(
      `cat "${tmpFile}" | claude -p --dangerously-skip-permissions ${addDirArgs}`,
      {
        cwd,
        encoding: "utf-8",
        timeout,
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    try { unlinkSync(tmpFile); } catch {}
    return { success: true, output: output.trim() };
  } catch (err: any) {
    try { unlinkSync(tmpFile); } catch {}
    return {
      success: false,
      output: err.stdout?.toString() || "",
      error: err.stderr?.toString() || err.message,
    };
  }
}
