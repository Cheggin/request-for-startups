/**
 * CLI constants — paths, defaults, formatting.
 */

import { resolve, join } from "path";

// ─── Paths ──────────────────────────────────────────────────────────────────

/** Root of the startup-harness monorepo. */
export const ROOT_DIR = resolve(import.meta.dir, "../../../..");

/** .harness config directory. */
export const HARNESS_DIR = join(ROOT_DIR, ".harness");

/** Agent definitions directory. */
export const AGENTS_DIR = join(ROOT_DIR, "agents");

/** Skills directory. */
export const SKILLS_DIR = join(ROOT_DIR, "skills");

/** Packages directory. */
export const PACKAGES_DIR = join(ROOT_DIR, "packages");

/** State file path. */
export const STATE_FILE = join(HARNESS_DIR, "state.json");

/** Stacks config path. */
export const STACKS_FILE = join(HARNESS_DIR, "stacks.yml");

/** Agent categories config path. */
export const CATEGORIES_FILE = join(HARNESS_DIR, "agent-categories.yml");

/** Tool catalog config path. */
export const TOOL_CATALOG_FILE = join(HARNESS_DIR, "tool-catalog.yml");

/** Claude settings.json path. */
export const CLAUDE_SETTINGS_FILE = join(ROOT_DIR, ".claude", "settings.json");

// ─── Tmux ───────────────────────────────────────────────────────────────────

/** Prefix for all harness tmux sessions. */
export const TMUX_SESSION_PREFIX = "harness";

/** Max lines to capture from tmux pane. */
export const TMUX_CAPTURE_LINES = 200;

// ─── Formatting ─────────────────────────────────────────────────────────────

export const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
} as const;

// ─── Startup Phases ─────────────────────────────────────────────────────────

export const STARTUP_PHASES = [
  "onboarding",
  "research",
  "spec",
  "design",
  "build",
  "deploy",
  "grow",
] as const;

export type StartupPhase = (typeof STARTUP_PHASES)[number];
