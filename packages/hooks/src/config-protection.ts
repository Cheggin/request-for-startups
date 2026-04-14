/**
 * Config Protection - PreToolUse hook on Edit/Write
 *
 * Has a PROTECTED_PATHS array of glob-style patterns.
 * Checks if the target file matches any protected path.
 * Returns ALLOW or DENY with message naming the protected file.
 */

export interface ToolCall {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface HookResult {
  decision: "ALLOW" | "DENY";
  message?: string;
}

const GATED_TOOLS = new Set(["Edit", "Write"]);

/**
 * Protected path patterns.
 * Entries ending with "/" match any file under that directory prefix.
 * All other entries match by exact basename or full path.
 */
/**
 * Paths that are EXEMPT from protection even if inside a protected directory.
 * tool-catalog.yml and founder-profile.yml are data files, not enforcement configs.
 */
const EXEMPT_PATHS: string[] = [
  "tool-catalog.yml",
  "founder-profile.yml",
  "idea.md",
  "state.json",
  "alignment-report.md",
];

const PROTECTED_PATHS: string[] = [
  ".harness/",
  ".github/workflows/",
  "tsconfig.json",
  "vitest.config.ts",
  "playwright.config.ts",
  ".eslintrc",
  ".eslintrc.js",
  ".eslintrc.cjs",
  ".eslintrc.json",
  ".eslintrc.yml",
  ".eslintrc.yaml",
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  "eslint.config.ts",
  "biome.json",
  "biome.jsonc",
  ".prettierrc",
  ".prettierrc.js",
  ".prettierrc.json",
  "prettier.config.js",
  "prettier.config.mjs",
];

function isProtected(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  const basename = normalized.split("/").pop() || "";

  // Check exemptions first — data files inside protected dirs
  if (EXEMPT_PATHS.some((exempt) => basename === exempt || normalized.endsWith(exempt))) {
    return false;
  }

  for (const pattern of PROTECTED_PATHS) {
    if (pattern.endsWith("/")) {
      // Directory prefix match
      if (normalized.startsWith(pattern) || normalized.includes("/" + pattern)) {
        return true;
      }
    } else {
      // Exact basename or full path match
      const basename = normalized.split("/").pop() || "";
      if (basename === pattern || normalized === pattern) {
        return true;
      }
    }
  }

  return false;
}

export function checkConfigProtection(call: ToolCall): HookResult {
  const { tool_name, tool_input } = call;

  if (!GATED_TOOLS.has(tool_name)) {
    return { decision: "ALLOW" };
  }

  const filePath = (tool_input.file_path as string) || "";
  if (!filePath) {
    return { decision: "ALLOW" };
  }

  if (isProtected(filePath)) {
    return {
      decision: "DENY",
      message:
        `BLOCKED: ${filePath} is a protected configuration file. ` +
        "Fix the source code to satisfy linter/formatter rules instead of " +
        "modifying protected config files.",
    };
  }

  return { decision: "ALLOW" };
}
