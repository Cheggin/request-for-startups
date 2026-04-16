/**
 * Agent Category Loader — reads agent-categories.yml and generates
 * per-agent configurations (hooks, MCP servers, skill lists).
 *
 * Fixes #10: agent-categories.yml rules are now applied programmatically.
 * Fixes #19: agents get category-specific skills.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { HARNESS_DIR, ROOT_DIR, SKILLS_DIR } from "./constants.js";
import { loadCategories } from "./config.js";

// ─── Types ─────────────────────────────────────────────────────────────────

interface AgentCategory {
  description: string;
  agents: string[];
  skill_categories: string[];
  ground_truth: string[];
  required_mcp: string[];
  required_hooks: string[];
}

interface AgentConfig {
  name: string;
  category: string;
  skills: string[];
  groundTruth: string[];
  mcp: string[];
  hooks: string[];
}

// ─── Skill Discovery ───────────────────────────────────────────────────────

interface SkillInfo {
  name: string;
  description: string;
}

/**
 * Get all skill names from the skills/ directory.
 * Skills are in plugin format: skills/<name>/SKILL.md
 */
function getSkillNames(): string[] {
  if (!existsSync(SKILLS_DIR)) return [];

  const dirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d: any) => d.isDirectory());

  return dirs
    .filter((d: any) => existsSync(join(SKILLS_DIR, d.name, "SKILL.md")))
    .map((d: any) => d.name);
}

/**
 * Read skill description from SKILL.md frontmatter.
 * Returns the 'description' field, truncated for prompt brevity.
 */
function getSkillDescription(skillName: string): string {
  const skillFile = join(SKILLS_DIR, skillName, "SKILL.md");
  if (!existsSync(skillFile)) return "";

  try {
    const content = readFileSync(skillFile, "utf-8");
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!fmMatch) return "";

    for (const line of fmMatch[1].split("\n")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        if (key === "description") {
          const val = line.slice(colonIdx + 1).trim();
          // Truncate long descriptions to first sentence or 120 chars
          const firstSentence = val.split(". ")[0];
          return firstSentence.length > 120
            ? firstSentence.slice(0, 117) + "..."
            : firstSentence;
        }
      }
    }
  } catch {
    // Skill file unreadable — skip silently
  }
  return "";
}

/**
 * Get skill names with descriptions for a list of skill names.
 * Reads each SKILL.md frontmatter at spawn time (not hardcoded).
 */
function getSkillManifest(skillNames: string[]): SkillInfo[] {
  return skillNames.map((name) => ({
    name,
    description: getSkillDescription(name),
  }));
}

/**
 * Canonical skill-to-category map.
 *
 * Every tracked skill in skills/<name>/SKILL.md MUST appear here.
 * The validateSkillCoverage() function enforces this at test time
 * so new skills can't slip through uncategorized.
 *
 * Fixes #53: replaces partial hardcoded map with complete coverage.
 */
const SKILL_CATEGORIES: Record<string, string> = {
  // Design (17)
  impeccable: "design", polish: "design", layout: "design", typeset: "design",
  animate: "design", colorize: "design", bolder: "design", critique: "design",
  adapt: "design", audit: "design", clarify: "design", delight: "design",
  distill: "design", optimize: "design", overdrive: "design", quieter: "design",
  shape: "design",
  // Coding (12)
  "website-creation": "coding", "visual-qa-pipeline": "coding", "test-generator": "coding",
  "deploy-pipeline": "coding", "security-scanner": "coding", "accessibility-checker": "coding",
  "performance-benchmark": "coding", "seo-setup": "coding", "slop-cleaner": "coding",
  "cubic-codebase-scan": "coding", "sprint-contracts": "coding", "asset-generation": "coding",
  // Convex (13)
  convex: "convex", "convex-agents": "convex", "convex-best-practices": "convex",
  "convex-component-authoring": "convex", "convex-cron-jobs": "convex",
  "convex-file-storage": "convex", "convex-functions": "convex",
  "convex-http-actions": "convex", "convex-migrations": "convex",
  "convex-realtime": "convex", "convex-schema-validator": "convex",
  "convex-security-audit": "convex", "convex-security-check": "convex",
  // Content (9)
  "anti-ai-writing": "content", "blog-scaffolder": "content", "brand-guidelines": "content",
  "contributing-guide": "content", "data-driven-blog": "content",
  "documentation-generator": "content", "legal-generator": "content",
  "readme-generator": "content", "social-media": "content",
  // Growth (7)
  "analytics-integration": "growth", "competitor-research": "growth",
  "landing-page-optimizer": "growth", "programmatic-seo": "growth",
  "seo-chat": "growth", "social-intelligence": "growth", "user-feedback-collector": "growth",
  // Operations (6)
  "ci-cd-pipeline": "operations", "dependency-manager": "operations",
  "error-tracking": "operations", "incident-response": "operations",
  "log-aggregation": "operations", "uptime-monitor": "operations",
  // Agent / Orchestration (32)
  "agent-creator": "agent", autopilot: "agent", "avoid-feature-creep": "agent",
  cancel: "agent", "context-reset-handler": "agent", "cost-tracker": "agent",
  debug: "agent", "deep-dive": "agent", "deep-interview": "agent",
  "error-classifier": "agent", "eval-framework": "agent",
  "github-state-manager": "agent", "investor-updates": "agent",
  "issue-creator": "agent", "loop-prompt": "agent", plan: "agent",
  "post-deploy-loop": "agent", ralph: "agent", research: "agent",
  "self-improve": "agent", "gap-analysis": "agent",
  "slack-course-correction": "agent", "stack-extend": "agent",
  "startup-init": "agent", team: "agent", "tiered-memory": "agent",
  "tmux-spawn": "agent", trace: "agent", "trajectory-logging": "agent",
  ultraqa: "agent", ultrawork: "agent", verify: "agent",
};

/**
 * Build a category→skills[] lookup from the canonical map.
 */
function categorizeSkills(): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    design: [],
    coding: [],
    convex: [],
    content: [],
    growth: [],
    operations: [],
    agent: [],
  };

  for (const [skill, cat] of Object.entries(SKILL_CATEGORIES)) {
    if (categories[cat]) {
      categories[cat].push(skill);
    }
  }

  return categories;
}

/**
 * Validate that every tracked skill in skills/ is assigned a category.
 * Returns an array of skill names that exist on disk but have no category.
 * Call this in tests to prevent drift when new skills are added.
 */
export function validateSkillCoverage(): string[] {
  const tracked = getSkillNames();
  return tracked.filter((name) => !(name in SKILL_CATEGORIES));
}

// ─── Agent Config Generation ───────────────────────────────────────────────

/**
 * Generate per-agent configs from agent-categories.yml.
 * Each agent gets: skills from its category, ground truth rules, MCP servers, hooks.
 */
export function generateAgentConfigs(): AgentConfig[] {
  const rawCategories = loadCategories() as Record<string, any>;
  const skillsByCategory = categorizeSkills();
  const sharedSkills = (rawCategories.shared_skills || []) as string[];
  const configs: AgentConfig[] = [];

  // Resolve shared skill names (format: "agent/context-reset-handler" → "context-reset-handler")
  const sharedSkillNames = sharedSkills.map((s: string) => s.split("/").pop() || s);

  for (const [catName, catData] of Object.entries(rawCategories)) {
    if (catName === "shared_skills") continue;
    const cat = catData as AgentCategory;
    if (!cat.agents) continue;

    // Collect all skills for this category
    const categorySkills: string[] = [];
    for (const skillCat of (cat.skill_categories || [])) {
      const skills = skillsByCategory[skillCat] || [];
      categorySkills.push(...skills);
    }

    // Add shared skills
    categorySkills.push(...sharedSkillNames);

    // Deduplicate
    const uniqueSkills = [...new Set(categorySkills)];

    for (const agentName of cat.agents) {
      configs.push({
        name: agentName,
        category: catName,
        skills: uniqueSkills,
        groundTruth: cat.ground_truth || [],
        mcp: cat.required_mcp || [],
        hooks: cat.required_hooks || [],
      });
    }
  }

  return configs;
}

/**
 * Get the config for a specific agent by name.
 */
export function getAgentConfig(agentName: string): AgentConfig | null {
  const configs = generateAgentConfigs();
  return configs.find((c) => c.name === agentName) || null;
}

/**
 * Generate a system prompt snippet listing an agent's skills and ground truth.
 *
 * Skills are read from skills/ at spawn time with descriptions from SKILL.md
 * frontmatter. Output uses <Available_Skills> tags with /startup-harness: routes
 * so agents invoke via the Skill tool, never improvise.
 *
 * Fixes #34: inject skill routes into agent spawn prompts.
 */
export function generateAgentPrompt(agentName: string): string {
  const config = getAgentConfig(agentName);
  if (!config) return "";

  // Read descriptions from SKILL.md frontmatter at spawn time
  const manifest = getSkillManifest(config.skills);

  const skillLines = manifest.map((s) =>
    s.description
      ? `/startup-harness:${s.name} — ${s.description}`
      : `/startup-harness:${s.name}`
  );

  // Orchestration agents also get skill-creator
  const isOrchestration = config.category === "orchestration";

  // Ground truth rules may be strings or objects (YAML "Key: value" parses as {Key: "value"})
  const formatRule = (r: string | Record<string, string>): string => {
    if (typeof r === "string") return r;
    return Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(", ");
  };

  const lines: string[] = [
    `You are the ${agentName} agent (${config.category} category).`,
    "",
    "## Ground Truth Rules (non-negotiable)",
    ...config.groundTruth.map((r) => `- ${formatRule(r)}`),
    "",
    "<Available_Skills>",
    "You MUST invoke these via slash command. NEVER implement what a skill does yourself.",
    "Use the Skill tool with the exact /startup-harness:<skill-name> route shown below.",
    "",
    ...skillLines,
    ...(isOrchestration
      ? ["", "/startup-harness:skill-creator — create new skills for the harness"]
      : []),
    "</Available_Skills>",
  ];

  return lines.join("\n");
}

/**
 * Write per-agent config files to .harness/agents/<name>.json
 *
 * If a rich config already exists (has fileScope, mcpServers, rules, etc.),
 * only update the category-derived fields (skills, groundTruth, category)
 * without overwriting the rich runtime config surface.
 */
export function writeAgentConfigs(): number {
  const configs = generateAgentConfigs();
  const agentsDir = join(HARNESS_DIR, "agents");
  mkdirSync(agentsDir, { recursive: true });

  for (const config of configs) {
    const filePath = join(agentsDir, `${config.name}.json`);

    // If a rich config exists, merge category-derived fields into it
    if (existsSync(filePath)) {
      try {
        const existing = JSON.parse(readFileSync(filePath, "utf-8"));
        const isRichConfig = existing.fileScope || existing.mcpServers || existing.rules || existing.allowedTools;

        if (isRichConfig) {
          // Only update fields that come from agent-categories.yml
          existing.category = existing.category || config.category;
          existing.skills = config.skills;
          existing.groundTruth = config.groundTruth;
          existing.mcp = config.mcp;
          writeFileSync(filePath, JSON.stringify(existing, null, 2) + "\n");
          continue;
        }
      } catch {
        // Unparseable — overwrite with fresh config
      }
    }

    // Write rich schema with empty defaults so new agents match the canonical shape
    const richConfig = {
      name: config.name,
      description: "",
      category: config.category,
      mcpServers: {} as Record<string, unknown>,
      allowedTools: ["Read", "Bash", "Glob", "Grep"],
      fileScope: {
        writable: [] as string[],
        readonly: [] as string[],
        blocked: [".harness/agents/**", ".harness/agent-categories.yml"],
      },
      hooks: {
        "budget-enforcer": {
          turnLimit: 150,
          wallClockTimeout: "30m",
          action: "warn_then_stop",
        },
      },
      rules: [] as string[],
      skills: config.skills,
      groundTruth: config.groundTruth,
      mcp: config.mcp,
    };
    writeFileSync(filePath, JSON.stringify(richConfig, null, 2) + "\n");
  }

  return configs.length;
}
