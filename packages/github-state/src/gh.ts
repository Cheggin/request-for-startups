/**
 * Low-level wrapper around the `gh` CLI.
 * Every other module imports `execGh` from here so tests can mock a single point.
 */

import { execFile } from "node:child_process";

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function execGh(args: string[]): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    execFile("gh", args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error && (error as NodeJS.ErrnoException).code === "ENOENT") {
        reject(new Error("gh CLI not found. Install it from https://cli.github.com"));
        return;
      }
      resolve({
        stdout: stdout ?? "",
        stderr: stderr ?? "",
        exitCode: error ? (error as any).code ?? 1 : 0,
      });
    });
  });
}

/**
 * Run `gh` and parse the stdout as JSON.
 * Throws on non-zero exit or invalid JSON.
 */
export async function execGhJson<T = unknown>(args: string[]): Promise<T> {
  const result = await execGh(args);
  if (result.exitCode !== 0) {
    throw new Error(`gh ${args.join(" ")} failed (exit ${result.exitCode}): ${result.stderr}`);
  }
  return JSON.parse(result.stdout) as T;
}
