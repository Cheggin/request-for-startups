#!/usr/bin/env bun
/**
 * Scope Enforcer Hook — prevents agents from modifying files outside their domain.
 *
 * Fixes #9: agents can only modify files matching their category's allowed paths.
 *
 * Reads the agent name from HARNESS_AGENT env var, looks up their config
 * in .harness/agents/{name}.json, and blocks Edit/Write to files outside scope.
 *
 * Hook type: PreToolUse (Edit, Write)
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const HARNESS_DIR = join(process.cwd(), ".harness");

// Scope rules per category — which paths each category can modify
const CATEGORY_SCOPES: Record<string, { allow: string[]; deny: string[] }> = {
  coding: {
    allow: ["src/", "app/", "components/", "lib/", "pages/", "public/", "styles/", "tests/", "test/", "__tests__/", "convex/"],
    deny: [".harness/", ".claude/", "agents/", "skills/", "packages/hooks/", "packages/cli/"],
  },
  content: {
    allow: ["content/", "blog/", "docs/", "public/", "*.md"],
    deny: ["src/", "app/", "lib/", "convex/", ".harness/", ".claude/", "packages/"],
  },
  growth: {
    allow: ["src/", "app/", "content/", "public/", "scripts/"],
    deny: [".harness/", ".claude/", "agents/", "skills/", "packages/hooks/"],
  },
  operations: {
    allow: [".github/", "Dockerfile", "docker-compose", "railway.json", "vercel.json", ".env", "scripts/"],
    deny: ["src/", "app/", "components/", "lib/", ".harness/", ".claude/"],
  },
  orchestration: {
    // Commander can't write anything — enforced via disallowedTools in agent def
    allow: [".harness/"],
    deny: ["src/", "app/", "packages/"],
  },
  quality: {
    allow: ["src/", "app/", "components/", "lib/", "styles/"],
    deny: [".harness/", ".claude/", "agents/", "skills/", "packages/hooks/", "packages/cli/"],
  },
};

function getAgentCategories(): string[] | null {
  const agentName = process.env.HARNESS_AGENT;
  if (!agentName) return null;

  const configPath = join(HARNESS_DIR, "agents", `${agentName}.json`);
  if (!existsSync(configPath)) return null;

  try {
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    if (!config.category) return null;
    // Handle both string and string[] category values
    return Array.isArray(config.category) ? config.category : [config.category];
  } catch {
    return null;
  }
}

function isPathAllowed(filePath: string, categories: string[]): boolean {
  const relative = filePath.replace(process.cwd() + "/", "");

  // Merge scopes from all categories (union of allow, union of deny)
  const mergedAllow: string[] = [];
  const mergedDeny: string[] = [];
  let hasKnownCategory = false;

  for (const category of categories) {
    const scope = CATEGORY_SCOPES[category];
    if (!scope) continue;
    hasKnownCategory = true;
    mergedAllow.push(...scope.allow);
    mergedDeny.push(...scope.deny);
  }

  if (!hasKnownCategory) return true; // all unknown categories = allow

  // Check deny list first — but skip denies that are also in allow (multi-category override)
  const allowSet = new Set(mergedAllow);
  for (const pattern of mergedDeny) {
    if (allowSet.has(pattern)) continue; // explicitly allowed by another category
    if (relative.startsWith(pattern) || relative.includes(`/${pattern}`)) {
      return false;
    }
  }

  // If allow list exists, file must match at least one pattern
  if (mergedAllow.length > 0) {
    return mergedAllow.some(pattern => {
      if (pattern.startsWith("*.")) {
        return relative.endsWith(pattern.slice(1));
      }
      return relative.startsWith(pattern) || relative.includes(`/${pattern}`);
    });
  }

  return true;
}

// ─── Main ──────────────────────────────────────────────────────────────────

const chunks: string[] = [];
process.stdin.on("data", (chunk) => chunks.push(chunk.toString()));
process.stdin.on("end", () => {
  try {
    const raw = chunks.join("");
    const input = JSON.parse(raw) as { tool_name: string; tool_input: Record<string, unknown> };
    const filePath = (input.tool_input?.file_path as string) || "";

    if (!filePath) {
      console.log(raw);
      return;
    }

    const categories = getAgentCategories();
    if (!categories) {
      // No agent context (running manually, not via harness) — allow everything
      console.log(raw);
      return;
    }

    if (!isPathAllowed(filePath, categories)) {
      console.error(`[ScopeEnforcer] ${process.env.HARNESS_AGENT} (${categories.join(", ")}) cannot modify ${filePath} — outside allowed scope`);
      process.exit(2);
    }

    console.log(raw);
  } catch {
    console.log(chunks.join(""));
  }
});
