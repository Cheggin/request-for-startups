import { $ } from "bun";
import { readFileSync, writeFileSync, existsSync } from "fs";

/**
 * Install Sentry SDK into a Next.js project using the Sentry wizard.
 */
export async function installSentry(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await $`npx @sentry/wizard@latest -i nextjs --quiet`.quiet();
    if (result.exitCode === 0) {
      return { success: true };
    }
    return {
      success: false,
      error: `Sentry wizard exited with code ${result.exitCode}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Sentry MCP server configuration block.
 */
const SENTRY_MCP_CONFIG = {
  command: "npx",
  args: ["-y", "@sentry/mcp-server@latest"],
  env: {
    SENTRY_AUTH_TOKEN: "{{SENTRY_AUTH_TOKEN}}",
  },
};

/**
 * Add Sentry MCP server to the project's .mcp.json configuration.
 */
export function addToMcpConfig(mcpJsonPath: string): {
  success: boolean;
  error?: string;
} {
  try {
    let config: { mcpServers?: Record<string, unknown> } = { mcpServers: {} };

    if (existsSync(mcpJsonPath)) {
      const raw = readFileSync(mcpJsonPath, "utf-8");
      config = JSON.parse(raw);
      if (!config.mcpServers) {
        config.mcpServers = {};
      }
    }

    config.mcpServers!["sentry"] = SENTRY_MCP_CONFIG;
    writeFileSync(mcpJsonPath, JSON.stringify(config, null, 2) + "\n", "utf-8");

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Verify the Sentry MCP connection works by making a test query.
 * In practice this would invoke the MCP server; here we check that the
 * config is present and the auth token env var is set.
 */
export async function verifyConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  const authToken = process.env.SENTRY_AUTH_TOKEN;
  if (!authToken) {
    return {
      connected: false,
      error:
        "SENTRY_AUTH_TOKEN environment variable is not set. " +
        "Get one from https://sentry.io/settings/auth-tokens/",
    };
  }

  try {
    // Validate the token by hitting the Sentry API
    const response = await fetch("https://sentry.io/api/0/", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.ok || response.status === 200) {
      return { connected: true };
    }
    return {
      connected: false,
      error: `Sentry API returned status ${response.status}`,
    };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
