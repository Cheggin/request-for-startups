/**
 * Commander constants — agent routing rules, keywords, and file-path patterns.
 */

/** Known agent names matching agents/*.md definitions. */
export const AGENT_NAMES = [
  "website",
  "backend",
  "growth",
  "writing",
  "ops",
] as const;

export type AgentName = (typeof AGENT_NAMES)[number];

/**
 * File-path glob patterns that map to agents.
 * First match wins — order matters.
 */
export const FILE_PATH_ROUTES: Record<AgentName, string[]> = {
  website: [
    "packages/website-template/**",
    "apps/web/**",
    "*.css",
    "*.tsx",
    "*.jsx",
    "components/**",
    "pages/**",
    "public/**",
  ],
  backend: [
    "packages/api/**",
    "packages/backend/**",
    "supabase/**",
    "prisma/**",
    "db/**",
    "*.sql",
    "migrations/**",
  ],
  growth: [
    "packages/growth/**",
    "analytics/**",
    "packages/eval-framework/**",
    "metrics/**",
  ],
  writing: [
    "content/**",
    "blog/**",
    "docs/**",
    "copy/**",
    "*.mdx",
  ],
  ops: [
    "packages/cli/**",
    "packages/agent-loop/**",
    "packages/hooks/**",
    "packages/commander/**",
    "packages/github-state/**",
    "packages/webhook-receiver/**",
    ".github/**",
    "Dockerfile",
    "docker-compose.*",
    "infra/**",
    "Taskfile.yml",
  ],
};

/**
 * Keyword patterns (case-insensitive) that map to agents.
 * Matched against issue title + body via fuzzy substring.
 */
export const KEYWORD_ROUTES: Record<AgentName, string[]> = {
  website: [
    "landing page",
    "ui",
    "ux",
    "frontend",
    "css",
    "responsive",
    "design",
    "layout",
    "component",
    "tailwind",
    "react",
    "next.js",
    "nextjs",
  ],
  backend: [
    "api",
    "endpoint",
    "database",
    "migration",
    "schema",
    "supabase",
    "prisma",
    "auth",
    "webhook",
    "server",
    "rest",
    "graphql",
  ],
  growth: [
    "metric",
    "analytics",
    "conversion",
    "funnel",
    "a/b test",
    "experiment",
    "retention",
    "churn",
    "growth",
    "kpi",
    "dashboard",
  ],
  writing: [
    "blog post",
    "copy",
    "content",
    "documentation",
    "readme",
    "announcement",
    "newsletter",
    "tweet",
    "social media",
  ],
  ops: [
    "deploy",
    "ci/cd",
    "pipeline",
    "infrastructure",
    "docker",
    "monitoring",
    "logging",
    "devops",
    "terraform",
    "github action",
    "cli",
    "tooling",
    "agent",
  ],
};

/**
 * GitHub label names that directly map to agents.
 */
export const LABEL_ROUTES: Record<string, AgentName> = {
  website: "website",
  backend: "backend",
  growth: "growth",
  writing: "writing",
  ops: "ops",
  frontend: "website",
  api: "backend",
  infra: "ops",
  devops: "ops",
  content: "writing",
  analytics: "growth",
};

/** Monitor polling interval in milliseconds. */
export const MONITOR_POLL_INTERVAL_MS = 30_000;

/** Max consecutive failures before an agent is considered dead. */
export const MAX_AGENT_FAILURES = 2;

/** Stale threshold for in-progress tasks (hours). */
export const STALE_THRESHOLD_HOURS = 24;

/** Main loop tick interval in milliseconds. */
export const LOOP_TICK_INTERVAL_MS = 60_000;
