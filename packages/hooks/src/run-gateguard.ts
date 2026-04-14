#!/usr/bin/env bun
/**
 * CLI wrapper for GateGuard hook.
 * Uses file-based state (/tmp/gateguard-reads.json) to persist
 * which files have been Read across hook invocations.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";

const STATE_FILE = "/tmp/gateguard-reads.json";

function loadReadFiles(): Set<string> {
  try {
    if (existsSync(STATE_FILE)) {
      const data = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      return new Set(data.files || []);
    }
  } catch {}
  return new Set();
}

function saveReadFiles(files: Set<string>): void {
  writeFileSync(STATE_FILE, JSON.stringify({ files: [...files] }));
}

const chunks: string[] = [];
process.stdin.on("data", (chunk) => chunks.push(chunk.toString()));
process.stdin.on("end", () => {
  try {
    const raw = chunks.join("");
    const input = JSON.parse(raw) as { tool_name: string; tool_input: Record<string, unknown> };
    const toolName = input.tool_name;
    const filePath = (input.tool_input?.file_path as string) || "";

    const readFiles = loadReadFiles();

    // Track Read calls
    if (toolName === "Read" && filePath) {
      readFiles.add(filePath);
      saveReadFiles(readFiles);
      console.log(raw);
      return;
    }

    // Block Edit if file wasn't Read first
    if (toolName === "Edit" && filePath) {
      if (!readFiles.has(filePath)) {
        console.error(`[GateGuard] File ${filePath} must be Read before it can be edited. Use the Read tool first to inspect the file contents.`);
        process.exit(2);
      }
    }

    console.log(raw);
  } catch {
    console.log(chunks.join(""));
  }
});
