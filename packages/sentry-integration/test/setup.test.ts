import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { addToMcpConfig } from "../src/setup";

describe("setup", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "sentry-setup-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe("addToMcpConfig", () => {
    test("creates new .mcp.json with sentry config", () => {
      const mcpPath = join(tempDir, ".mcp.json");
      const result = addToMcpConfig(mcpPath);

      expect(result.success).toBe(true);

      const config = JSON.parse(readFileSync(mcpPath, "utf-8"));
      expect(config.mcpServers.sentry).toBeDefined();
      expect(config.mcpServers.sentry.command).toBe("npx");
      expect(config.mcpServers.sentry.args).toContain("@sentry/mcp-server@latest");
    });

    test("adds sentry to existing .mcp.json without overwriting other servers", () => {
      const mcpPath = join(tempDir, ".mcp.json");
      writeFileSync(
        mcpPath,
        JSON.stringify({
          mcpServers: {
            existing: { command: "node", args: ["server.js"] },
          },
        })
      );

      const result = addToMcpConfig(mcpPath);
      expect(result.success).toBe(true);

      const config = JSON.parse(readFileSync(mcpPath, "utf-8"));
      expect(config.mcpServers.existing).toBeDefined();
      expect(config.mcpServers.sentry).toBeDefined();
    });

    test("overwrites existing sentry config", () => {
      const mcpPath = join(tempDir, ".mcp.json");
      writeFileSync(
        mcpPath,
        JSON.stringify({
          mcpServers: {
            sentry: { command: "old-command" },
          },
        })
      );

      addToMcpConfig(mcpPath);
      const config = JSON.parse(readFileSync(mcpPath, "utf-8"));
      expect(config.mcpServers.sentry.command).toBe("npx");
    });
  });
});
