/**
 * harness init — run the full startup lifecycle.
 *
 * Every phase spawns a REAL Claude Code session in tmux with skills loaded.
 * NO claude -p. Skills, hooks, and quality enforcement are active in every session.
 * The commander monitors each pane via tmux-bridge.
 */

import { execSync, spawnSync } from "child_process";
import { existsSync, writeFileSync, mkdirSync, readdirSync, symlinkSync, unlinkSync, lstatSync } from "fs";
import { join, resolve } from "path";
import { loadState, updateState } from "../lib/state.js";
import { loadAgents } from "../lib/config.js";
import { heading, success, warn, error, muted, info } from "../lib/format.js";
import { STARTUP_PHASES, ROOT_DIR, HARNESS_DIR, STACKS_FILE } from "../lib/constants.js";
import { spawnPane, ensureSession, isTmuxAvailable } from "../lib/tmux.js";
import {
  determineRequiredServices,
  collectCredentials,
  validateCredentialFormats,
  printCredentialSummary,
} from "../lib/credentials.js";

// ─── Install all skills into .claude/skills/ ────────────────────────────────

function installSkills(): number {
  const skillsRoot = join(ROOT_DIR, "skills");
  const claudeSkillsDir = join(ROOT_DIR, ".claude", "skills");
  const categories = ["design", "coding", "convex", "content", "growth", "operations", "agent"];
  let count = 0;

  mkdirSync(claudeSkillsDir, { recursive: true });

  for (const category of categories) {
    const categoryDir = join(skillsRoot, category);
    if (!existsSync(categoryDir)) continue;

    const files = readdirSync(categoryDir).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const name = file.replace(".md", "");
      const skillDir = join(claudeSkillsDir, name);
      const symlinkPath = join(skillDir, "SKILL.md");
      const targetPath = join("..", "..", "..", "skills", category, file);

      mkdirSync(skillDir, { recursive: true });

      // Remove existing symlink if stale
      if (existsSync(symlinkPath)) {
        try {
          const stat = lstatSync(symlinkPath);
          if (stat.isSymbolicLink()) unlinkSync(symlinkPath);
          else continue; // real file, don't overwrite
        } catch { continue; }
      }

      try {
        symlinkSync(targetPath, symlinkPath);
        count++;
      } catch {}
    }
  }

  return count;
}

// ─── Spawn a Claude Code session in tmux with a prompt ──────────────────────

function spawnClaudeSession(name: string, prompt: string, cwd?: string): boolean {
  ensureSession();
  const dir = cwd || ROOT_DIR;
  // Real Claude Code session with dangerously-skip-permissions
  // Skills, hooks, and CLAUDE.md are all loaded automatically
  const cmd = `cd "${dir}" && claude --dangerously-skip-permissions --append-system-prompt "${prompt.replace(/"/g, '\\"')}"`;
  return spawnPane(name, cmd);
}

// ─── Phase implementations ─────────────────────────────────────────────────

function runPhase0_Interview(): Record<string, string> {
  console.log(heading("Phase 0: Deep Founder Interview"));
  console.log(muted("  Answering these questions helps the harness build the right thing.\n"));

  const questions = [
    { key: "idea", prompt: "What's your startup idea?" },
    { key: "type", prompt: "What type of company? (b2c, b2b-saas, devtool, marketplace, hardware, fintech, healthcare, ecommerce)" },
    { key: "audience", prompt: "Who are the target users? Be specific." },
    { key: "business_model", prompt: "Business model? (subscription, usage-based, freemium, commission, one-time)" },
    { key: "budget", prompt: "Budget? (bootstrapped, seed-funded, enterprise)" },
    { key: "timeline", prompt: "Timeline? (weekend, month, quarter)" },
    { key: "design_preset", prompt: "Design style? (minimal, neobrutalist, glassmorphism, editorial, clean-saas, warm-soft)" },
  ];

  const answers: Record<string, string> = {};

  for (const q of questions) {
    process.stdout.write(`  ${info(q.prompt)} `);
    const input = spawnSync("bash", ["-c", "read -r line && echo $line"], {
      stdio: ["inherit", "pipe", "inherit"],
    });
    answers[q.key] = input.stdout?.toString().trim() || "";
    console.log();
  }

  // Save founder profile
  const profilePath = join(HARNESS_DIR, "founder-profile.yml");
  const yaml = Object.entries(answers)
    .map(([k, v]) => `${k}: "${v}"`)
    .join("\n");
  mkdirSync(HARNESS_DIR, { recursive: true });
  writeFileSync(profilePath, yaml);
  console.log(success(`  Saved founder profile to ${profilePath}`));

  writeFileSync(join(HARNESS_DIR, "idea.md"), `# Startup Idea\n\n${answers.idea}\n`);

  return answers;
}

function runPhase1_ValidateServices(): boolean {
  console.log(heading("Phase 1: Validate Services"));

  const checks = [
    { name: "GitHub", cmd: "gh auth status" },
    { name: "Vercel", cmd: "vercel whoami" },
    { name: "Railway", cmd: "railway whoami" },
  ];

  let allPassed = true;
  for (const check of checks) {
    try {
      execSync(check.cmd, { stdio: "pipe", timeout: 10000 });
      console.log(success(`  ${check.name}: connected`));
    } catch {
      console.log(error(`  ${check.name}: not connected — run the auth command first`));
      allPassed = false;
    }
  }

  if (!allPassed) {
    console.log(warn("\n  Some services not connected. Fix them and run 'harness resume'."));
  }
  return allPassed;
}

// ─── Main flow ─────────────────────────────────────────────────────────────

export function run(args: string[]): void {
  console.log(heading("HARNESS INIT — Building Your Startup"));
  console.log();

  if (!isTmuxAvailable()) {
    console.log(error("  tmux is required. Install with: brew install tmux"));
    process.exit(1);
  }

  // Install all skills into .claude/skills/ so every agent session has them
  console.log(heading("Installing Skills"));
  const skillCount = installSkills();
  console.log(success(`  ${skillCount} skills installed into .claude/skills/`));
  console.log(muted("  All agent sessions will have access to design, coding, growth, and operations skills.\n"));

  const state = loadState();

  if (state.phase !== "onboarding" && !args.includes("--force")) {
    console.log(warn(`Already at phase: ${state.phase}`));
    console.log(muted("Use --force to restart, or 'harness resume' to continue."));
    return;
  }

  // Phase 0: Founder Interview (interactive, in this terminal)
  const answers = runPhase0_Interview();
  updateState({ phase: "research", meta: { idea: answers.idea, type: answers.type, preset: answers.design_preset } });

  // Phase 0.5: Credential Collection — every service gets its keys HERE
  const required = determineRequiredServices(answers);
  const projectDir = ROOT_DIR; // credentials go in the harness root for now; copied to project dir at scaffold time
  const collected = collectCredentials(required, projectDir);

  // Validate credential formats
  const { valid, invalid } = validateCredentialFormats(collected);
  if (invalid.length > 0) {
    console.log(warn(`\n  Warning: these credentials look malformed: ${invalid.join(", ")}`));
    console.log(muted("  Double-check them or update .env.local before deploying."));
  }

  printCredentialSummary(required, collected);

  // Phase 1: Validate Services (CLI auth — gh, vercel, railway)
  const servicesOk = runPhase1_ValidateServices();
  if (!servicesOk) {
    updateState({ phase: "services" });
    return;
  }
  updateState({ phase: "research" });

  // Phase 2: Research — real Claude Code session
  console.log(heading("Phase 2: Research"));
  const researchPrompt = [
    `Research competitors for this startup: "${answers.idea}".`,
    "Use WebSearch to find competitors, market size, pricing, design patterns.",
    "Write research-report.md with: executive summary, competitor table, target audience, differentiation.",
    "Post a Slack update when done: 'Research complete. [X] competitors found.'",
  ].join(" ");
  spawnClaudeSession("researcher", researchPrompt);
  console.log(success("  Research agent spawned in tmux pane 'researcher'"));
  updateState({ phase: "spec" });

  // Phase 3: Spec — real Claude Code session
  console.log(heading("Phase 3: Product Spec"));
  const specPrompt = [
    `Generate a product spec for: "${answers.idea}".`,
    "Read research-report.md if it exists. Read .harness/stacks.yml for stack.",
    "Include: pages with routes, features (P0/P1/P2) with testable acceptance criteria,",
    "data models, API routes, component inventory.",
    "Write product-spec.md. Create GitHub Issues for every P0 feature.",
    "Post Slack update when done.",
  ].join(" ");
  spawnClaudeSession("planner", specPrompt);
  console.log(success("  Planner agent spawned in tmux pane 'planner'"));
  updateState({ phase: "design" });

  // Phase 4: Design — skipped (Figma MCP)
  console.log(heading("Phase 4: Design"));
  console.log(muted("  Skipping Figma generation. Build phase will use preset: " + (answers.design_preset || "minimal")));
  updateState({ phase: "scaffold" });

  // Phase 5: Scaffold + Build — real Claude Code session with ALL skills
  console.log(heading("Phase 5-7: Scaffold + Build"));
  const buildPrompt = [
    `You are the website agent. Build the startup: "${answers.idea}".`,
    `Design preset: ${answers.design_preset || "minimal"}. Follow the website-creation skill exactly.`,
    "Read product-spec.md for features. Read .harness/stacks.yml for stack.",
    "Load and follow these skills: website-creation, anti-ai-writing, polish, layout, typeset.",
    "Steps: 1) Scaffold Next.js project 2) Install deps 3) Write tests first (TDD)",
    "4) Build each feature 5) Run Playwright screenshots 6) Evaluate visual QA",
    "7) Post Slack update per feature shipped.",
    "Use shadcn/ui for components. NO Inter font. NO dark mode. NO vibe coding.",
    "NEVER STOP until all P0 features are done.",
  ].join(" ");
  spawnClaudeSession("website-builder", buildPrompt);
  console.log(success("  Website builder agent spawned in tmux pane 'website-builder'"));
  updateState({ phase: "build" });

  // Phase 8: Deploy — spawns when build is done (commander monitors)
  console.log(heading("Phase 8-9: Deploy + Post-Deploy"));
  const opsPrompt = [
    "You are the ops agent. Wait for the website-builder to finish (check tmux pane).",
    "When build is complete: 1) vercel --prod 2) Verify deployment health",
    "3) Set up sitemap, robots.txt 4) Post Slack update with live URL.",
    "Then start the post-deploy monitoring loop.",
  ].join(" ");
  spawnClaudeSession("ops", opsPrompt);
  console.log(success("  Ops agent spawned in tmux pane 'ops'"));

  console.log();
  console.log(heading("Harness is building your startup"));
  console.log(muted("  4 agents running in tmux:"));
  console.log(muted("    researcher  — market research"));
  console.log(muted("    planner     — product spec"));
  console.log(muted("    website-builder — scaffold + build + visual QA"));
  console.log(muted("    ops         — deploy + monitoring"));
  console.log();
  console.log(muted("  Attach: tmux attach -t harness"));
  console.log(muted("  Status: harness status"));
  console.log(muted("  Each agent posts updates to Slack as it completes milestones."));
  console.log();
}
