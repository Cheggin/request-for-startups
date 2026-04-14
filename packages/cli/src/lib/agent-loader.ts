/**
 * Agent Category Loader — reads agent-categories.yml and generates
 * per-agent configurations (hooks, MCP servers, skill lists).
 *
 * Fixes #10: agent-categories.yml rules are now applied programmatically.
 * Fixes #19: agents get category-specific skills.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { HARNESS_DIR, ROOT_DIR } from "./constants.js";
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

/**
 * Get all skill names from the skills/ directory.
 * Skills are in plugin format: skills/<name>/SKILL.md
 */
function getSkillNames(): string[] {
  const skillsDir = join(ROOT_DIR, "skills");
  if (!existsSync(skillsDir)) return [];

  const { readdirSync } = require("fs");
  const dirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter((d: any) => d.isDirectory());

  return dirs
    .filter((d: any) => existsSync(join(skillsDir, d.name, "SKILL.md")))
    .map((d: any) => d.name);
}

/**
 * Map skill names to their former categories based on frontmatter.
 * Reads the 'category' tag from each SKILL.md if present,
 * otherwise infers from the skill name patterns.
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

  // Known mappings (hardcoded since we know the reorganization)
  const SKILL_TO_CATEGORY: Record<string, string> = {
    // Design
    impeccable: "design", polish: "design", layout: "design", typeset: "design",
    animate: "design", colorize: "design", bolder: "design", critique: "design",
    adapt: "design", audit: "design", clarify: "design", delight: "design",
    distill: "design", optimize: "design", overdrive: "design", quieter: "design",
    shape: "design",
    // Coding
    "website-creation": "coding", "visual-qa-pipeline": "coding", "test-generator": "coding",
    "deploy-pipeline": "coding", "security-scanner": "coding", "accessibility-checker": "coding",
    "performance-benchmark": "coding", "seo-setup": "coding", "slop-cleaner": "coding",
    "cubic-codebase-scan": "coding", "sprint-contracts": "coding", "asset-generation": "coding",
    // Convex
    convex: "convex", "convex-agents": "convex", "convex-best-practices": "convex",
    "convex-component-authoring": "convex", "convex-cron-jobs": "convex",
    "convex-file-storage": "convex", "convex-functions": "convex",
    "convex-http-actions": "convex", "convex-migrations": "convex",
    "convex-realtime": "convex", "convex-schema-validator": "convex",
    "convex-security-audit": "convex", "convex-security-check": "convex",
    // Content
    "anti-ai-writing": "content", "blog-scaffolder": "content", "brand-guidelines": "content",
    "contributing-guide": "content", "data-driven-blog": "content",
    "documentation-generator": "content", "legal-generator": "content",
    "readme-generator": "content", "social-media": "content",
    // Growth
    "analytics-integration": "growth", "competitor-research": "growth",
    "landing-page-optimizer": "growth", "programmatic-seo": "growth",
    "seo-chat": "growth", "social-intelligence": "growth", "user-feedback-collector": "growth",
    // Operations
    "ci-cd-pipeline": "operations", "dependency-manager": "operations",
    "error-tracking": "operations", "incident-response": "operations",
    "log-aggregation": "operations", "uptime-monitor": "operations",
    // Agent
    "loop-prompt": "agent", "context-reset-handler": "agent", "cost-tracker": "agent",
    "error-classifier": "agent", "eval-framework": "agent", "trajectory-logging": "agent",
    "tiered-memory": "agent", "investor-updates": "agent", "github-state-manager": "agent",
    "slack-course-correction": "agent", "stack-extend": "agent", "post-deploy-loop": "agent",
    research: "agent", "avoid-feature-creep": "agent",
  };

  for (const [skill, cat] of Object.entries(SKILL_TO_CATEGORY)) {
    if (categories[cat]) {
      categories[cat].push(skill);
    }
  }

  return categories;
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
 */
export function generateAgentPrompt(agentName: string): string {
  const config = getAgentConfig(agentName);
  if (!config) return "";

  const lines: string[] = [
    `You are the ${agentName} agent (${config.category} category).`,
    "",
    "## Ground Truth Rules (non-negotiable)",
    ...config.groundTruth.map((r) => `- ${r}`),
    "",
    "## Available Skills",
    `You have ${config.skills.length} skills loaded. Use them by following the instructions in each SKILL.md:`,
    ...config.skills.map((s) => `- ${s}`),
  ];

  return lines.join("\n");
}

/**
 * Write per-agent config files to .harness/agents/<name>.json
 */
export function writeAgentConfigs(): number {
  const configs = generateAgentConfigs();
  const agentsDir = join(HARNESS_DIR, "agents");
  mkdirSync(agentsDir, { recursive: true });

  for (const config of configs) {
    const filePath = join(agentsDir, `${config.name}.json`);
    writeFileSync(filePath, JSON.stringify(config, null, 2) + "\n");
  }

  return configs.length;
}
