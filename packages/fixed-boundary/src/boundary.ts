/**
 * Fixed Boundary — enforces which files agents can modify.
 *
 * The harness code is frozen. Agents must never modify packages/*, .harness/*,
 * agent definitions, skills, or core config files.
 *
 * This is designed as a PreToolUse hook that blocks Edit/Write to frozen paths.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BoundaryResult {
  allowed: boolean;
  reason: string;
}

export interface FileScope {
  writable: string[];
  readonly: string[];
  blocked: string[];
}

export interface AgentConfig {
  name: string;
  fileScope?: string[] | FileScope;
}

// ─── Constants ──────────────────────────────────────────────────────────────

/**
 * Paths agents can NEVER modify.
 * Entries ending with "/" are directory prefixes.
 * All other entries match by exact basename or full path.
 */
export const FROZEN_PATHS: string[] = [
  "packages/",
  ".harness/",
  "agents/",
  "skills/",
  ".claude/settings.json",
  "Taskfile.yml",
  "SOUL.md",
];

/** Tools that perform write operations */
const WRITE_TOOLS = new Set(["Edit", "Write"]);

// ─── Agent Scopes ───────────────────────────────────────────────────────────

/**
 * Load per-agent file scopes from agent definition files.
 * Reads .harness/agents/*.json and extracts fileScope arrays.
 * Returns empty map if directory doesn't exist.
 */
export function loadAgentScopes(agentsDir: string): Map<string, string[]> {
  const scopes = new Map<string, string[]>();

  try {
    const files = readdirSync(agentsDir);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const content = readFileSync(join(agentsDir, file), "utf-8");
        const config = JSON.parse(content) as AgentConfig;
        if (config.name && config.fileScope) {
          // Handle both shapes: string[] (legacy) and {writable, readonly, blocked} (rich)
          const scope = Array.isArray(config.fileScope)
            ? config.fileScope
            : config.fileScope.writable || [];
          scopes.set(config.name, scope);
        }
      } catch {
        // Skip unparseable files
      }
    }
  } catch {
    // Directory doesn't exist — return empty map
  }

  return scopes;
}

// ─── Path Matching ──────────────────────────────────────────────────────────

function normalizePath(filePath: string): string {
  let normalized = filePath.replace(/\\/g, "/");
  // Strip leading slash for relative matching
  if (normalized.startsWith("/")) {
    normalized = normalized.slice(1);
  }
  return normalized;
}

function isFrozen(filePath: string): boolean {
  const normalized = normalizePath(filePath);

  for (const pattern of FROZEN_PATHS) {
    if (pattern.endsWith("/")) {
      // Directory prefix match — check if path starts with it or contains it after a /
      if (normalized.startsWith(pattern) || normalized.includes("/" + pattern)) {
        return true;
      }
    } else {
      // Exact file match — check basename or full path
      const basename = normalized.split("/").pop() || "";
      if (basename === pattern || normalized === pattern || normalized.endsWith("/" + pattern)) {
        return true;
      }
    }
  }

  return false;
}

function isWithinScope(filePath: string, scope: string[]): boolean {
  const normalized = normalizePath(filePath);

  for (const allowedPrefix of scope) {
    const normalizedPrefix = allowedPrefix.replace(/\\/g, "/");
    if (normalized.startsWith(normalizedPrefix)) {
      return true;
    }
  }

  return false;
}

// ─── Main Check ─────────────────────────────────────────────────────────────

/**
 * Check whether an agent is allowed to perform an operation on a file.
 *
 * Rules (in order):
 * 1. Read is always allowed (never blocked)
 * 2. Non-write tools (Bash, Grep, Glob) are allowed
 * 3. Frozen paths are always blocked for Edit/Write
 * 4. If agent has a fileScope, path must be within scope
 * 5. Otherwise, allowed
 */
export function checkBoundary(
  agentName: string,
  filePath: string,
  operation: string,
  agentScopes?: Map<string, string[]>,
): BoundaryResult {
  // Rule 1 & 2: Only gate write operations
  if (!WRITE_TOOLS.has(operation)) {
    return { allowed: true, reason: "non-write operation" };
  }

  // Rule 3: Check frozen paths
  if (isFrozen(filePath)) {
    return {
      allowed: false,
      reason: `BLOCKED: "${filePath}" is in a frozen path. Harness code cannot be modified by agents.`,
    };
  }

  // Rule 4: Check agent-specific scope
  if (agentScopes) {
    const scope = agentScopes.get(agentName);
    if (scope && !isWithinScope(filePath, scope)) {
      return {
        allowed: false,
        reason: `BLOCKED: Agent "${agentName}" is not allowed to modify "${filePath}". Agent scope is limited to: ${scope.join(", ")}`,
      };
    }
  }

  // Rule 5: Default allow
  return { allowed: true, reason: "allowed" };
}
