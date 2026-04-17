#!/usr/bin/env bun
// @bun

// packages/hooks/src/run-gateguard.ts
import { readFileSync, writeFileSync, existsSync } from "fs";
import { createHash } from "crypto";
var sessionId = process.env.CLAUDE_SESSION_ID || `pid-${process.ppid}`;
var repoHash = createHash("sha256").update(process.cwd()).digest("hex").slice(0, 8);
var STATE_FILE = `/tmp/gateguard-reads-${sessionId}-${repoHash}.json`;
function loadReadFiles() {
  try {
    if (existsSync(STATE_FILE)) {
      const data = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      return new Set(data.files || []);
    }
  } catch {}
  return new Set;
}
function saveReadFiles(files) {
  writeFileSync(STATE_FILE, JSON.stringify({ files: [...files] }));
}
var chunks = [];
process.stdin.on("data", (chunk) => chunks.push(chunk.toString()));
process.stdin.on("end", () => {
  try {
    const raw = chunks.join("");
    const input = JSON.parse(raw);
    const toolName = input.tool_name;
    const filePath = input.tool_input?.file_path || "";
    const readFiles = loadReadFiles();
    if (toolName === "Read" && filePath) {
      readFiles.add(filePath);
      saveReadFiles(readFiles);
      console.log(raw);
      return;
    }
    const GATED_TOOLS = new Set(["Edit", "Write"]);
    if (GATED_TOOLS.has(toolName) && filePath) {
      if (!readFiles.has(filePath)) {
        console.error(`[GateGuard] File ${filePath} must be Read before it can be ${toolName === "Write" ? "written" : "edited"}. Use the Read tool first to inspect the file contents.`);
        process.exit(2);
      }
    }
    console.log(raw);
  } catch {
    console.log(chunks.join(""));
  }
});
