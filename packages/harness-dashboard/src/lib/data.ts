/**
 * Real data sources — NO MOCKS.
 *
 * Every function here talks to a real system or real repo state:
 * - Agents: tmux panes
 * - Startups: filesystem (.harness/founder-profile.yml / config.yml)
 * - Deployments: vercel CLI + linked project config
 * - Competitors: research reports and competitor data files
 * - Growth: cached metrics files + real env/secrets inspection
 * - Settings: .harness config, loop registry, agent definitions
 *
 * If a source is unavailable, return empty — never fake it.
 */

import { execSync } from "child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { dirname, join, relative, resolve } from "path";

// ─── Repo Paths ────────────────────────────────────────────────────────────

function findHarnessRoot(startPath: string): string {
  let current = resolve(startPath);

  while (true) {
    if (existsSync(join(current, ".harness"))) return current;
    const parent = dirname(current);
    if (parent === current) return resolve(startPath);
    current = parent;
  }
}

const REPO_ROOT = findHarnessRoot(process.cwd());
const WORKSPACE_ROOT = dirname(REPO_ROOT);
const ROOT_HARNESS_DIR = join(REPO_ROOT, ".harness");
const LOOPS_YML_PATH = join(ROOT_HARNESS_DIR, "loops.yml");
const TEST_RUNS_DIR = join(REPO_ROOT, "test-runs");
const ROOT_ENV_FILES = [
  join(REPO_ROOT, ".env"),
  join(REPO_ROOT, ".env.local"),
  join(ROOT_HARNESS_DIR, "secrets.env"),
];

const PROJECT_SCAN_DIRS = [WORKSPACE_ROOT];
const GROWTH_CACHE_DIRS = [
  ".harness/metrics",
  ".harness/analytics",
  ".omc/analytics",
  "analytics",
  "metrics",
];

const SERVICE_DEFINITIONS = [
  { name: "PostHog", envs: ["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"] },
  { name: "Sentry", envs: ["SENTRY_DSN"] },
  { name: "Stripe", envs: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] },
  { name: "Browser Use", envs: ["BROWSER_USE_API_KEY"] },
  { name: "Fal.ai", envs: ["FAL_KEY"] },
  { name: "Convex", envs: ["CONVEX_URL", "NEXT_PUBLIC_CONVEX_URL"] },
  { name: "Vercel", envs: ["VERCEL_TOKEN"] },
  { name: "Railway", envs: ["RAILWAY_TOKEN"] },
  { name: "Resend", envs: ["RESEND_API_KEY"] },
] as const;

// ─── Types ─────────────────────────────────────────────────────────────────

export interface RealAgent {
  name: string;
  status: "running" | "idle" | "stopped";
  paneId: string;
  lastOutput: string;
  cwd: string;
  startup: string;
}

export interface RealStartup {
  id: string;
  name: string;
  type: string;
  idea: string;
  path: string;
  hasHarness: boolean;
  deployUrl?: string;
}

export interface RealLoop {
  name: string;
  agent: string;
  loopType: string;
  description: string;
  interval: string;
  skill: string;
  status: "running" | "stopped";
  createsIssues: boolean;
}

export interface RealDeployment {
  name: string;
  url: string;
  state: string;
  createdAt: string;
}

export interface GitHubIssue {
  number: number;
  title: string;
  url: string;
  severity: "P0" | "P1" | "P2" | "P3" | "unknown";
  type: string;
  author: string;
  createdAt: string;
  state: string;
}

export interface CompetitorTable {
  headers: string[];
  rows: Record<string, string>[];
}

export interface CompetitorReport {
  startupId: string;
  startupName: string;
  startupType: string;
  reportPath: string;
  updatedAt: string;
  summary: string;
  weaknesses: string[];
  table: CompetitorTable | null;
}

export interface GrowthTrafficPoint {
  date: string;
  value: number;
}

export interface GrowthTopPage {
  path: string;
  views: number;
}

export interface GrowthSnapshot {
  source: "cache" | "none";
  posthogConfigured: boolean;
  cacheFiles: string[];
  traffic: GrowthTrafficPoint[];
  topPages: GrowthTopPage[];
  notes: string[];
}

export interface ServiceStatus {
  name: string;
  envs: string[];
  configured: boolean;
  partiallyConfigured: boolean;
  configuredKeys: string[];
  sources: string[];
}

export interface HarnessFileSummary {
  name: string;
  path: string;
  exists: boolean;
  summary: string;
}

export interface StartupConfigSummary {
  startupId: string;
  startupName: string;
  path: string;
  values: Record<string, string>;
}

export interface AgentDefinitionSummary {
  name: string;
  category: string;
  path: string;
  allowedTools: number;
  writableScopes: number;
  blockedScopes: number;
  mcpServers: string[];
}

export interface SettingsSnapshot {
  services: ServiceStatus[];
  harnessFiles: HarnessFileSummary[];
  startupConfigs: StartupConfigSummary[];
  loops: RealLoop[];
  agents: AgentDefinitionSummary[];
}

// ─── Agents: Read from tmux ────────────────────────────────────────────────

export function getRunningAgents(): RealAgent[] {
  try {
    const raw = execSync(
      'tmux list-panes -a -F "#{session_name}|#{window_name}|#{pane_id}|#{pane_current_command}|#{pane_current_path}" 2>/dev/null',
      { encoding: "utf-8", timeout: 5000 }
    ).trim();

    if (!raw) return [];

    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|");
        const session = parts[0] || "";
        const windowName = parts[1] || "";
        const paneId = parts[2] || "";
        const command = parts[3] || "";
        const cwd = parts[4] || "";
        const name = windowName || session || "unknown";

        let lastOutput = "";
        try {
          lastOutput = execSync(
            `tmux capture-pane -t "${paneId}" -p -S -5 2>/dev/null`,
            { encoding: "utf-8", timeout: 3000 }
          ).trim();
        } catch {}

        const isClaudeRunning =
          /^\d+\.\d+\.\d+$/.test(command) ||
          command === "claude" ||
          command === "node" ||
          command === "bun" ||
          lastOutput.includes("Claude") ||
          lastOutput.includes("Embellishing") ||
          lastOutput.includes("Reading") ||
          lastOutput.includes("Writing") ||
          lastOutput.includes("Running") ||
          lastOutput.includes("bypass permissions");

        return {
          name,
          status: isClaudeRunning ? "running" : "idle",
          paneId,
          lastOutput,
          cwd,
          startup: cwd.split("/").pop() || "unknown",
        };
      });
  } catch {
    return [];
  }
}

// ─── Startups: Scan project directories ────────────────────────────────────

export function getStartups(): RealStartup[] {
  const startups: RealStartup[] = [];

  for (const scanDir of PROJECT_SCAN_DIRS) {
    if (!existsSync(scanDir)) continue;

    try {
      const dirs = readdirSync(scanDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      for (const dir of dirs) {
        const projectPath = join(scanDir, dir);
        const founderProfilePath = join(projectPath, ".harness", "founder-profile.yml");
        const configPath = join(projectPath, ".harness", "config.yml");

        if (!existsSync(founderProfilePath)) continue;

        const founderProfile = readYamlFile(founderProfilePath);
        const startupConfig = readYamlFile(configPath);

        startups.push({
          id: dir,
          name: getStartupDisplayName(dir, founderProfile, startupConfig),
          type: normalizeStartupType(
            founderProfile.type || founderProfile.startup_type || startupConfig.startup_type
          ),
          idea: founderProfile.idea || startupConfig.project_name || dir,
          path: projectPath,
          hasHarness: true,
          deployUrl: getVercelUrl(dir) || getVercelUrlFromConfig(projectPath),
        });
      }
    } catch {}
  }

  if (existsSync(TEST_RUNS_DIR)) {
    try {
      const dirs = readdirSync(TEST_RUNS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      for (const dir of dirs) {
        const projectPath = join(TEST_RUNS_DIR, dir, "project");
        if (!existsSync(projectPath)) continue;

        const founderProfile = readYamlFile(join(projectPath, ".harness", "founder-profile.yml"));
        const startupConfig = readYamlFile(join(projectPath, ".harness", "config.yml"));

        startups.push({
          id: dir,
          name:
            startupConfig.project_name ||
            startupConfig.domain ||
            getStartupDisplayName(dir, founderProfile, startupConfig),
          type: normalizeStartupType(
            founderProfile.type || founderProfile.startup_type || startupConfig.startup_type || "test-run"
          ),
          idea: founderProfile.idea || `Test run: ${dir}`,
          path: projectPath,
          hasHarness: existsSync(join(projectPath, ".harness")),
          deployUrl: getVercelUrlFromConfig(projectPath) || getVercelUrl(dir),
        });
      }
    } catch {}
  }

  return dedupeStartups(startups);
}

// ─── Deployments: Read from Vercel CLI ─────────────────────────────────────

export function getDeployments(): RealDeployment[] {
  try {
    const raw = execSync("vercel ls --json 2>/dev/null", {
      encoding: "utf-8",
      timeout: 15000,
    });

    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.deployments)
        ? parsed.deployments
        : Array.isArray(parsed?.projects)
          ? parsed.projects
          : [];

    return items.map((deployment: any) => ({
      name: deployment.name || deployment.project || "unknown",
      url: deployment.url || "",
      state: deployment.state || deployment.readyState || "unknown",
      createdAt: deployment.createdAt || deployment.created || "",
    }));
  } catch {
    return [];
  }
}

// ─── Costs: Read from .harness/costs/ ──────────────────────────────────────

export function getCosts(projectPath: string): { agent: string; cost: number }[] {
  const costsDir = join(projectPath, ".harness", "costs");
  if (!existsSync(costsDir)) return [];

  try {
    return readdirSync(costsDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const data = JSON.parse(readFileSync(join(costsDir, file), "utf-8"));
        return {
          agent: data.agent || file.replace(".json", ""),
          cost: data.totalCost || data.cost || 0,
        };
      });
  } catch {
    return [];
  }
}

// ─── Loops: Read from .harness/loops.yml + cross-ref tmux ─────────────────

export function getLoops(): RealLoop[] {
  if (!existsSync(LOOPS_YML_PATH)) return [];

  try {
    const raw = readFileSync(LOOPS_YML_PATH, "utf-8");
    const loops: RealLoop[] = [];

    let tmuxSessions: string[] = [];
    try {
      const tmuxRaw = execSync('tmux list-sessions -F "#{session_name}" 2>/dev/null', {
        encoding: "utf-8",
        timeout: 5000,
      }).trim();
      tmuxSessions = tmuxRaw ? tmuxRaw.split("\n").filter(Boolean) : [];
    } catch {}

    let currentName = "";
    let currentBlock: Record<string, string> = {};

    const flushBlock = () => {
      if (!currentName || Object.keys(currentBlock).length === 0) return;
      const isRunning = tmuxSessions.some(
        (session) => session === currentName || session.includes(currentName)
      );

      loops.push({
        name: currentName,
        agent: currentBlock.agent || "",
        loopType: currentBlock.loop_type || "custom",
        description: currentBlock.description || "",
        interval: currentBlock.interval || "",
        skill: currentBlock.skill || "",
        status: isRunning ? "running" : "stopped",
        createsIssues: currentBlock.creates_issues === "true",
      });
    };

    for (const line of raw.split("\n")) {
      if (line.startsWith("#") || line.trim() === "") continue;
      if (line.startsWith("    ")) continue;

      const topLevel = line.match(/^([a-z][a-z0-9_-]*):\s*$/);
      if (topLevel) {
        flushBlock();
        currentName = topLevel[1];
        currentBlock = {};
        continue;
      }

      const keyValue = line.match(/^\s{2}([a-z_]+):\s*(.+)/);
      if (keyValue && currentName) {
        currentBlock[keyValue[1]] = keyValue[2].replace(/^["']|["']$/g, "");
      }
    }

    flushBlock();
    return loops;
  } catch {
    return [];
  }
}

// ─── GitHub Issues: Read from gh CLI ───────────────────────────────────────

export function getGitHubIssues(): GitHubIssue[] {
  try {
    const raw = execSync(
      'gh issue list --state open --json number,title,url,author,createdAt,body,state --limit 100 2>/dev/null',
      { encoding: "utf-8", timeout: 15000 }
    );
    const issues = JSON.parse(raw);
    if (!Array.isArray(issues)) return [];

    return issues.map((issue: any) => {
      const body = issue.body || "";
      const severityMatch = body.match(/##\s*Severity\s*\n\s*(P[0-3])/i);
      const typeMatch = body.match(/##\s*Type\s*\n\s*(\w+)/i);

      return {
        number: issue.number,
        title: issue.title,
        url: issue.url,
        severity: severityMatch
          ? (severityMatch[1] as GitHubIssue["severity"])
          : "unknown",
        type: typeMatch ? typeMatch[1] : "unknown",
        author: issue.author?.login || "unknown",
        createdAt: issue.createdAt,
        state: issue.state || "OPEN",
      };
    });
  } catch {
    return [];
  }
}

// ─── Competitors: Read from research reports / data files ──────────────────

export function getCompetitorReports(): CompetitorReport[] {
  const reports: CompetitorReport[] = [];

  for (const startup of getStartups()) {
    const reportFiles = getCompetitorFilesForStartup(startup.path);
    for (const reportPath of reportFiles) {
      const report = parseCompetitorReport(reportPath, startup);
      if (report) reports.push(report);
    }
  }

  return reports.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

// ─── Growth: Read from cached metrics + env status ─────────────────────────

export function getGrowthSnapshot(): GrowthSnapshot {
  const configuredEnvVars = getConfiguredEnvVars();
  const posthogConfigured =
    configuredEnvVars.has("NEXT_PUBLIC_POSTHOG_KEY") &&
    configuredEnvVars.has("NEXT_PUBLIC_POSTHOG_HOST");

  const cacheFiles = getStartups()
    .flatMap((startup) => getGrowthCacheFiles(startup.path))
    .sort((left, right) => {
      try {
        return statSync(right).mtimeMs - statSync(left).mtimeMs;
      } catch {
        return 0;
      }
    });

  let traffic: GrowthTrafficPoint[] = [];
  let topPages: GrowthTopPage[] = [];

  for (const cacheFile of cacheFiles) {
    const parsed = safeReadJson(cacheFile);
    if (!parsed) continue;

    if (traffic.length === 0) {
      traffic = findTrafficSeries(parsed);
    }

    if (topPages.length === 0) {
      topPages = findTopPages(parsed);
    }

    if (traffic.length > 0 && topPages.length > 0) break;
  }

  const notes: string[] = [];
  if (posthogConfigured) {
    notes.push("PostHog client credentials detected in repo env/secrets.");
  } else {
    notes.push("PostHog is not configured in this repo environment.");
  }

  if (cacheFiles.length > 0) {
    notes.push(`Scanned ${cacheFiles.length} cached metric file${cacheFiles.length === 1 ? "" : "s"}.`);
  } else {
    notes.push("No cached metric files were found.");
  }

  if (traffic.length === 0 && topPages.length === 0) {
    notes.push("No real traffic metrics were available to render.");
  }

  return {
    source: traffic.length > 0 || topPages.length > 0 ? "cache" : "none",
    posthogConfigured,
    cacheFiles: cacheFiles.map(relativeToRepoRoot),
    traffic,
    topPages,
    notes,
  };
}

// ─── Settings: Read .harness config + env + agent definitions ─────────────

export function getSettingsSnapshot(): SettingsSnapshot {
  const configuredEnvVars = getConfiguredEnvVars();

  const services: ServiceStatus[] = SERVICE_DEFINITIONS.map((service) => {
    const configuredKeys = service.envs.filter((envName) => configuredEnvVars.has(envName));
    const sources = Array.from(
      new Set(
        configuredKeys.flatMap((envName) => configuredEnvVars.get(envName) || [])
      )
    );

    return {
      name: service.name,
      envs: [...service.envs],
      configured: configuredKeys.length === service.envs.length,
      partiallyConfigured:
        configuredKeys.length > 0 && configuredKeys.length < service.envs.length,
      configuredKeys,
      sources: sources.map(relativeToRepoRoot),
    };
  });

  const harnessFiles: HarnessFileSummary[] = [
    { name: "Founder Profile", path: join(ROOT_HARNESS_DIR, "founder-profile.yml") },
    { name: "Stack Defaults", path: join(ROOT_HARNESS_DIR, "stacks.yml") },
    { name: "Tool Catalog", path: join(ROOT_HARNESS_DIR, "tool-catalog.yml") },
    { name: "Agent Categories", path: join(ROOT_HARNESS_DIR, "agent-categories.yml") },
    { name: "Loop Registry", path: LOOPS_YML_PATH },
    { name: "Secrets", path: join(ROOT_HARNESS_DIR, "secrets.env") },
  ].map((file) => summarizeHarnessFile(file.name, file.path));

  const startupConfigs = getStartups()
    .map((startup) => {
      const configPath = join(startup.path, ".harness", "config.yml");
      const values = readYamlFile(configPath);
      if (Object.keys(values).length === 0) return null;

      return {
        startupId: startup.id,
        startupName: startup.name,
        path: relativeToRepoRoot(configPath),
        values,
      } satisfies StartupConfigSummary;
    })
    .filter((config): config is StartupConfigSummary => config !== null)
    .sort((left, right) => left.startupName.localeCompare(right.startupName));

  const agents = getAgentDefinitions();

  return {
    services,
    harnessFiles,
    startupConfigs,
    loops: getLoops(),
    agents,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function dedupeStartups(startups: RealStartup[]): RealStartup[] {
  const seen = new Map<string, RealStartup>();

  for (const startup of startups) {
    const existing = seen.get(startup.path);
    if (!existing) {
      seen.set(startup.path, startup);
      continue;
    }

    if (existing.name.length < startup.name.length) {
      seen.set(startup.path, startup);
    }
  }

  return Array.from(seen.values()).sort((left, right) =>
    left.name.localeCompare(right.name)
  );
}

function getStartupDisplayName(
  dir: string,
  founderProfile: Record<string, string>,
  startupConfig: Record<string, string>
): string {
  return (
    startupConfig.project_name ||
    startupConfig.domain ||
    founderProfile.project_name ||
    founderProfile.domain ||
    (founderProfile.idea
      ? founderProfile.idea.split(" ").slice(0, 3).join(" ")
      : undefined) ||
    dir.replace(/^level-\d+-/, "").replace(/-/g, " ")
  );
}

function normalizeStartupType(value?: string): string {
  if (!value) return "unknown";
  const normalized = value.toLowerCase();

  if (normalized.includes("b2b")) return "b2b-saas";
  if (normalized.includes("b2c")) return "b2c";
  if (normalized.includes("dev")) return "devtool";
  if (normalized.includes("market")) return "marketplace";
  if (normalized.includes("health")) return "healthcare";
  if (normalized.includes("fin")) return "fintech";
  if (normalized.includes("ecom")) return "ecommerce";
  if (normalized.includes("test")) return "test-run";

  return normalized.replace(/\s+/g, "-");
}

function readYamlFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};
  try {
    return parseSimpleYaml(readFileSync(filePath, "utf-8"));
  } catch {
    return {};
  }
}

function parseSimpleYaml(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of content.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.+)?$/);
    if (!match) continue;

    const key = match[1].trim();
    const value = (match[2] || "").trim().replace(/^["']|["']$/g, "");
    result[key] = value;
  }

  return result;
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};

  const result: Record<string, string> = {};

  try {
    const content = readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const index = trimmed.indexOf("=");
      if (index <= 0) continue;

      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
      result[key] = value;
    }
  } catch {}

  return result;
}

function getConfiguredEnvVars(extraFiles: string[] = []): Map<string, string[]> {
  const configured = new Map<string, string[]>();

  for (const filePath of [...ROOT_ENV_FILES, ...extraFiles]) {
    const envVars = parseEnvFile(filePath);
    for (const [key, value] of Object.entries(envVars)) {
      if (!value) continue;
      const sources = configured.get(key) || [];
      sources.push(filePath);
      configured.set(key, sources);
    }
  }

  return configured;
}

function summarizeHarnessFile(name: string, filePath: string): HarnessFileSummary {
  if (!existsSync(filePath)) {
    return {
      name,
      path: relativeToRepoRoot(filePath),
      exists: false,
      summary: "Missing",
    };
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    const summary = filePath.endsWith(".env")
      ? `${Object.keys(parseEnvFile(filePath)).length} env var(s)`
      : `${getTopLevelConfigKeys(content).length} top-level key(s)`;

    return {
      name,
      path: relativeToRepoRoot(filePath),
      exists: true,
      summary,
    };
  } catch {
    return {
      name,
      path: relativeToRepoRoot(filePath),
      exists: true,
      summary: "Readable but could not summarize",
    };
  }
}

function getTopLevelConfigKeys(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.match(/^([A-Za-z0-9_-]+):\s*/)?.[1] || null)
    .filter((key): key is string => key !== null);
}

function getAgentDefinitions(): AgentDefinitionSummary[] {
  const agentsDir = join(ROOT_HARNESS_DIR, "agents");
  if (!existsSync(agentsDir)) return [];

  try {
    return readdirSync(agentsDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const filePath = join(agentsDir, file);
        const parsed = JSON.parse(readFileSync(filePath, "utf-8"));

        return {
          name: parsed.name || file.replace(".json", ""),
          category: Array.isArray(parsed.category)
            ? parsed.category.join(", ")
            : parsed.category || "unknown",
          path: relativeToRepoRoot(filePath),
          allowedTools: Array.isArray(parsed.allowedTools) ? parsed.allowedTools.length : 0,
          writableScopes: Array.isArray(parsed.fileScope?.writable)
            ? parsed.fileScope.writable.length
            : 0,
          blockedScopes: Array.isArray(parsed.fileScope?.blocked)
            ? parsed.fileScope.blocked.length
            : 0,
          mcpServers: parsed.mcpServers ? Object.keys(parsed.mcpServers) : [],
        } satisfies AgentDefinitionSummary;
      })
      .sort((left, right) => left.name.localeCompare(right.name));
  } catch {
    return [];
  }
}

function getCompetitorFilesForStartup(startupPath: string): string[] {
  const files = new Set<string>();

  const explicitFiles = [
    join(startupPath, "research-report.md"),
    join(startupPath, "competitor-report.md"),
    join(startupPath, "competitors.json"),
    join(startupPath, ".harness", "competitors.json"),
  ];

  for (const filePath of explicitFiles) {
    if (existsSync(filePath)) files.add(filePath);
  }

  const knowledgeDirs = [
    join(startupPath, ".harness", "knowledge"),
    join(startupPath, "knowledge"),
  ];

  for (const knowledgeDir of knowledgeDirs) {
    for (const filePath of findFilesByNameFragments(
      knowledgeDir,
      ["competitor"],
      3
    )) {
      files.add(filePath);
    }
  }

  return Array.from(files).sort();
}

function findFilesByNameFragments(
  directory: string,
  fragments: string[],
  maxDepth: number
): string[] {
  if (!existsSync(directory) || maxDepth < 0) return [];

  const matches: string[] = [];

  try {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        matches.push(...findFilesByNameFragments(entryPath, fragments, maxDepth - 1));
        continue;
      }

      const lower = entry.name.toLowerCase();
      if (!lower.endsWith(".md") && !lower.endsWith(".json")) continue;
      if (fragments.some((fragment) => lower.includes(fragment))) {
        matches.push(entryPath);
      }
    }
  } catch {}

  return matches;
}

function parseCompetitorReport(
  reportPath: string,
  startup: RealStartup
): CompetitorReport | null {
  if (!existsSync(reportPath)) return null;

  try {
    const updatedAt = statSync(reportPath).mtime.toISOString();

    if (reportPath.endsWith(".json")) {
      const parsed = safeReadJson(reportPath);
      if (!parsed) return null;

      const rows = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.competitors)
          ? parsed.competitors
          : [];

      const normalizedRows = rows
        .filter((row): row is Record<string, unknown> => isPlainObject(row))
        .map((row) =>
          Object.fromEntries(
            Object.entries(row).map(([key, value]) => [key, String(value ?? "")])
          )
        );

      const headers = normalizedRows[0] ? Object.keys(normalizedRows[0]) : [];

      return {
        startupId: startup.id,
        startupName: startup.name,
        startupType: startup.type,
        reportPath: relativeToRepoRoot(reportPath),
        updatedAt,
        summary:
          (isPlainObject(parsed) && typeof parsed.summary === "string" && parsed.summary) ||
          "Competitor data file",
        weaknesses:
          isPlainObject(parsed) && Array.isArray(parsed.weaknesses)
            ? parsed.weaknesses.map((entry) => String(entry))
            : [],
        table: headers.length > 0 ? { headers, rows: normalizedRows } : null,
      };
    }

    const content = readFileSync(reportPath, "utf-8");
    const competitorSection =
      extractMarkdownSection(content, "Competitor Analysis") || content;
    const weaknessesSection = extractMarkdownSection(content, "Key Weaknesses in Market");
    const executiveSummarySection = extractMarkdownSection(content, "Executive Summary");

    return {
      startupId: startup.id,
      startupName: startup.name,
      startupType: startup.type,
      reportPath: relativeToRepoRoot(reportPath),
      updatedAt,
      summary:
        extractFirstParagraph(executiveSummarySection) ||
        extractFirstParagraph(content) ||
        "Research report",
      weaknesses: extractListItems(weaknessesSection),
      table: parseMarkdownTable(competitorSection),
    };
  } catch {
    return null;
  }
}

function extractMarkdownSection(content: string, heading: string): string {
  const lines = content.split("\n");
  let start = -1;
  let level = 0;

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,6})\s+(.*?)\s*$/);
    if (!match) continue;

    if (start === -1 && match[2].trim().toLowerCase() === heading.toLowerCase()) {
      start = index + 1;
      level = match[1].length;
      continue;
    }

    if (start !== -1 && match[1].length <= level) {
      return lines.slice(start, index).join("\n").trim();
    }
  }

  return start === -1 ? "" : lines.slice(start).join("\n").trim();
}

function extractFirstParagraph(content: string): string {
  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .find(
      (paragraph) =>
        Boolean(paragraph) &&
        !paragraph.startsWith("#") &&
        !paragraph.startsWith("|") &&
        !paragraph.startsWith("- ") &&
        !paragraph.startsWith("* ") &&
        !/^\d+\.\s+/.test(paragraph)
    ) || "";
}

function extractListItems(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^([-*]|\d+\.)\s+/.test(line))
    .map((line) => line.replace(/^([-*]|\d+\.)\s+/, ""));
}

function parseMarkdownTable(content: string): CompetitorTable | null {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  if (lines.length < 3) return null;

  const headers = splitMarkdownRow(lines[0]);
  const separator = splitMarkdownRow(lines[1]);

  if (
    headers.length === 0 ||
    separator.length !== headers.length ||
    !separator.every((cell) => /^:?-{3,}:?$/.test(cell))
  ) {
    return null;
  }

  const rows = lines
    .slice(2)
    .map(splitMarkdownRow)
    .filter((cells) => cells.length >= headers.length)
    .map((cells) =>
      Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]))
    );

  return rows.length > 0 ? { headers, rows } : null;
}

function splitMarkdownRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function getGrowthCacheFiles(startupPath: string): string[] {
  const files: string[] = [];

  for (const relativeDir of GROWTH_CACHE_DIRS) {
    const directory = join(startupPath, relativeDir);
    if (!existsSync(directory)) continue;

    try {
      for (const file of readdirSync(directory, { withFileTypes: true })) {
        if (!file.isFile() || !file.name.endsWith(".json")) continue;
        files.push(join(directory, file.name));
      }
    } catch {}
  }

  return files;
}

function safeReadJson(filePath: string): any | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function findTrafficSeries(value: unknown): GrowthTrafficPoint[] {
  if (Array.isArray(value)) {
    const direct = parseTrafficArray(value);
    if (direct.length > 0) return direct;

    for (const item of value) {
      const nested = findTrafficSeries(item);
      if (nested.length > 0) return nested;
    }
  }

  if (isPlainObject(value)) {
    for (const key of ["traffic", "visitors", "dailyVisitors", "pageviews", "series", "data"]) {
      const nested = findTrafficSeries(value[key]);
      if (nested.length > 0) return nested;
    }

    for (const child of Object.values(value)) {
      const nested = findTrafficSeries(child);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

function parseTrafficArray(value: unknown[]): GrowthTrafficPoint[] {
  const numericKeys = ["visitors", "value", "count", "pageviews", "page_views", "total", "users"];
  const points: GrowthTrafficPoint[] = [];

  for (const entry of value) {
    if (!isPlainObject(entry)) return [];

    const date =
      normalizeDate(entry.date) ||
      normalizeDate(entry.timestamp) ||
      normalizeDate(entry.day) ||
      normalizeDate(entry.label);

    if (!date) return [];

    const numericValue = findNumericValue(entry, numericKeys);
    if (numericValue === null) return [];

    points.push({ date, value: numericValue });
  }

  const unique = new Map<string, number>();
  for (const point of points) {
    unique.set(point.date, point.value);
  }

  return Array.from(unique.entries())
    .map(([date, numericValue]) => ({ date, value: numericValue }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function findTopPages(value: unknown): GrowthTopPage[] {
  if (Array.isArray(value)) {
    const direct = parseTopPagesArray(value);
    if (direct.length > 0) return direct;

    for (const item of value) {
      const nested = findTopPages(item);
      if (nested.length > 0) return nested;
    }
  }

  if (isPlainObject(value)) {
    for (const key of ["topPages", "pages", "pageStats", "pageviews"]) {
      const nested = findTopPages(value[key]);
      if (nested.length > 0) return nested;
    }

    for (const child of Object.values(value)) {
      const nested = findTopPages(child);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

function parseTopPagesArray(value: unknown[]): GrowthTopPage[] {
  const numericKeys = ["views", "pageviews", "visitors", "count", "value"];
  const pathKeys = ["path", "url", "page", "slug", "title"];
  const pages: GrowthTopPage[] = [];

  for (const entry of value) {
    if (!isPlainObject(entry)) return [];

    const pathValue = findStringValue(entry, pathKeys);
    const views = findNumericValue(entry, numericKeys);

    if (!pathValue || views === null) return [];
    pages.push({ path: pathValue, views });
  }

  return pages
    .sort((left, right) => right.views - left.views)
    .slice(0, 8);
}

function normalizeDate(value: unknown): string | null {
  if (typeof value === "number") {
    const milliseconds = value > 1_000_000_000_000 ? value : value * 1000;
    const parsed = new Date(milliseconds);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  if (typeof value !== "string") return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function findNumericValue(
  record: Record<string, unknown>,
  keys: string[]
): number | null {
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === "string" && candidate.trim() !== "") {
      const numericValue = Number(candidate);
      if (Number.isFinite(numericValue)) return numericValue;
    }
  }

  return null;
}

function findStringValue(
  record: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  return null;
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getVercelUrl(projectName: string): string | undefined {
  try {
    const raw = execSync(`vercel ls ${projectName} --json 2>/dev/null`, {
      encoding: "utf-8",
      timeout: 10000,
    });
    const parsed = JSON.parse(raw);
    const deployments = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.deployments)
        ? parsed.deployments
        : [];

    if (deployments.length > 0 && deployments[0]?.url) {
      return `https://${deployments[0].url}`;
    }
  } catch {}

  return undefined;
}

function getVercelUrlFromConfig(projectPath: string): string | undefined {
  const vercelConfigPath = join(projectPath, ".vercel", "project.json");
  if (!existsSync(vercelConfigPath)) return undefined;

  try {
    const parsed = JSON.parse(readFileSync(vercelConfigPath, "utf-8"));
    if (parsed.projectId) {
      return `https://${parsed.projectId}.vercel.app`;
    }
  } catch {}

  return undefined;
}

function relativeToRepoRoot(filePath: string): string {
  const relativePath = relative(REPO_ROOT, filePath);
  return relativePath || ".";
}
