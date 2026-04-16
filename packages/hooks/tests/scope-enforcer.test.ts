import { describe, test, expect } from "bun:test";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

/**
 * Tests for run-scope-enforcer.ts logic — specifically multi-category agents.
 *
 * These tests validate the scope-merging behavior when an agent has
 * category: ["coding", "operations"] (like ops.json).
 */

const HARNESS_DIR = join(process.cwd(), ".harness");

// ─── Category scope rules (mirrored from run-scope-enforcer.ts) ─────────

const CATEGORY_SCOPES: Record<string, { allow: string[]; deny: string[] }> = {
  coding: {
    allow: ["src/", "app/", "components/", "lib/", "pages/", "public/", "styles/", "tests/", "test/", "__tests__/", "convex/"],
    deny: [".harness/", ".claude/", "agents/", "skills/", "packages/hooks/", "packages/cli/"],
  },
  operations: {
    allow: [".github/", "Dockerfile", "docker-compose", "railway.json", "vercel.json", ".env", "scripts/"],
    deny: ["src/", "app/", "components/", "lib/", ".harness/", ".claude/"],
  },
};

// Merging logic extracted for testing
function mergeScopes(categories: string[]): { allow: string[]; deny: string[] } {
  const mergedAllow: string[] = [];
  const mergedDeny: string[] = [];

  for (const category of categories) {
    const scope = CATEGORY_SCOPES[category];
    if (!scope) continue;
    mergedAllow.push(...scope.allow);
    mergedDeny.push(...scope.deny);
  }

  return { allow: mergedAllow, deny: mergedDeny };
}

function isPathAllowed(filePath: string, categories: string[]): boolean {
  const relative = filePath;
  const { allow, deny } = mergeScopes(categories);
  const allowSet = new Set(allow);

  for (const pattern of deny) {
    if (allowSet.has(pattern)) continue;
    if (relative.startsWith(pattern) || relative.includes(`/${pattern}`)) {
      return false;
    }
  }

  if (allow.length > 0) {
    return allow.some(pattern => {
      if (pattern.startsWith("*.")) {
        return relative.endsWith(pattern.slice(1));
      }
      return relative.startsWith(pattern) || relative.includes(`/${pattern}`);
    });
  }

  return true;
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("scope-enforcer: single category", () => {
  test("coding agent can modify src/", () => {
    expect(isPathAllowed("src/components/Header.tsx", ["coding"])).toBe(true);
  });

  test("coding agent cannot modify .harness/", () => {
    expect(isPathAllowed(".harness/agents/ops.json", ["coding"])).toBe(false);
  });

  test("operations agent can modify .github/", () => {
    expect(isPathAllowed(".github/workflows/ci.yml", ["operations"])).toBe(true);
  });

  test("operations agent cannot modify src/", () => {
    expect(isPathAllowed("src/app/page.tsx", ["operations"])).toBe(false);
  });
});

describe("scope-enforcer: multi-category agent (ops = coding + operations)", () => {
  const opsCategories = ["coding", "operations"];

  test("ops agent can modify src/ (from coding category)", () => {
    // src/ is in coding.allow — even though operations.deny has src/,
    // the allow-set override should let it through
    expect(isPathAllowed("src/components/Header.tsx", opsCategories)).toBe(true);
  });

  test("ops agent can modify .github/ (from operations category)", () => {
    expect(isPathAllowed(".github/workflows/ci.yml", opsCategories)).toBe(true);
  });

  test("ops agent can modify scripts/ (from operations category)", () => {
    expect(isPathAllowed("scripts/deploy.sh", opsCategories)).toBe(true);
  });

  test("ops agent cannot modify .harness/ (denied by both categories)", () => {
    expect(isPathAllowed(".harness/agents/ops.json", opsCategories)).toBe(false);
  });

  test("ops agent cannot modify .claude/ (denied by both categories)", () => {
    expect(isPathAllowed(".claude/settings.json", opsCategories)).toBe(false);
  });
});

describe("scope-enforcer: agent config parsing", () => {
  test("ops.json category field is an array", () => {
    const configPath = join(HARNESS_DIR, "agents", "ops.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    expect(Array.isArray(config.category)).toBe(true);
    expect(config.category).toContain("coding");
    expect(config.category).toContain("operations");
  });

  test("backend.json category field is a string", () => {
    const configPath = join(HARNESS_DIR, "agents", "backend.json");
    const config = JSON.parse(readFileSync(configPath, "utf-8"));
    expect(typeof config.category).toBe("string");
    expect(config.category).toBe("coding");
  });

  test("all agent configs have fileScope as object with writable/readonly/blocked", () => {
    const agentsDir = join(HARNESS_DIR, "agents");
    const files = readdirSync(agentsDir).filter((f: string) => f.endsWith(".json"));

    for (const file of files) {
      const config = JSON.parse(readFileSync(join(agentsDir, file), "utf-8"));
      expect(config.fileScope).toBeDefined();
      expect(config.fileScope.writable).toBeDefined();
      expect(Array.isArray(config.fileScope.writable)).toBe(true);
      expect(config.fileScope.readonly).toBeDefined();
      expect(Array.isArray(config.fileScope.readonly)).toBe(true);
      expect(config.fileScope.blocked).toBeDefined();
      expect(Array.isArray(config.fileScope.blocked)).toBe(true);
    }
  });
});

describe("scope-enforcer: agent inventory", () => {
  test("every agents/*.md has a matching .harness/agents/*.json", () => {
    const agentDefsDir = join(process.cwd(), "agents");
    const agentConfigsDir = join(HARNESS_DIR, "agents");

    const mdNames = readdirSync(agentDefsDir)
      .filter((f: string) => f.endsWith(".md"))
      .map((f: string) => f.replace(".md", ""))
      .sort();

    const jsonNames = readdirSync(agentConfigsDir)
      .filter((f: string) => f.endsWith(".json"))
      .map((f: string) => f.replace(".json", ""))
      .sort();

    const missingJson = mdNames.filter((n: string) => !jsonNames.includes(n));
    const missingMd = jsonNames.filter((n: string) => !mdNames.includes(n));

    if (missingJson.length > 0) {
      throw new Error(`Agent definitions without JSON configs: ${missingJson.join(", ")}`);
    }
    if (missingMd.length > 0) {
      throw new Error(`Agent JSON configs without definitions: ${missingMd.join(", ")}`);
    }

    expect(missingJson).toEqual([]);
    expect(missingMd).toEqual([]);
  });
});
