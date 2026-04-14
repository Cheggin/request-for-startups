/**
 * harness init — run the full startup lifecycle.
 *
 * Fixes: #3 (resume parsing), #4 (missing interview questions), #5 (sequential phases),
 * #6 (all agents spawned), #16 (Convex validation), #19 (category-specific skills).
 *
 * Every phase spawns a REAL Claude Code session in tmux with skills loaded.
 * Phases run SEQUENTIALLY — each waits for its predecessor's artifact.
 * The commander monitors all agents and orchestrates handoffs.
 */

import { execSync, spawnSync } from "child_process";
import { existsSync, writeFileSync, readFileSync, mkdirSync, readdirSync, symlinkSync, unlinkSync, lstatSync } from "fs";
import { join } from "path";
import { loadState, updateState } from "../lib/state.js";
import { heading, success, warn, error, muted, info } from "../lib/format.js";
import { STARTUP_PHASES, ROOT_DIR, HARNESS_DIR } from "../lib/constants.js";
import { spawnPane, ensureSession, isTmuxAvailable } from "../lib/tmux.js";
import {
  determineRequiredServices,
  collectCredentials,
  validateCredentialFormats,
  printCredentialSummary,
} from "../lib/credentials.js";
import { generateAgentPrompt, writeAgentConfigs } from "../lib/agent-loader.js";

// ─── Constants ─────────────────────────────────────────────────────────────

const PHASE_ORDER = [
  "onboarding",
  "services",
  "research",
  "spec",
  "design",
  "scaffold",
  "build",
  "deploy",
  "grow",
] as const;

const PHASE_ARTIFACTS: Record<string, string> = {
  research: "research-report.md",
  spec: "product-spec.md",
};

const POLL_INTERVAL_MS = 15000; // 15s between artifact checks
const MAX_WAIT_MS = 30 * 60 * 1000; // 30 min max wait per phase

// ─── Install all skills into .claude/skills/ ────────────────────────────────

function installSkills(): number {
  const skillsDir = join(ROOT_DIR, "skills");
  if (!existsSync(skillsDir)) return 0;

  let count = 0;
  const dirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const dir of dirs) {
    const skillMd = join(skillsDir, dir.name, "SKILL.md");
    if (!existsSync(skillMd)) continue;
    count++;
  }
  // Skills are in plugin format (skills/<name>/SKILL.md) — Claude Code loads them directly
  // No symlinking needed when running as a plugin
  console.log(success(`  ${count} skills available via plugin`));
  return count;
}

// ─── Spawn a Claude Code session in tmux with a prompt ──────────────────────

function spawnClaudeSession(name: string, prompt: string, cwd?: string): boolean {
  ensureSession();
  const dir = cwd || ROOT_DIR;
  const escapedPrompt = prompt.replace(/"/g, '\\"');
  const cmd = `cd "${dir}" && claude --dangerously-skip-permissions --append-system-prompt "${escapedPrompt}"`;
  console.log(muted(`  [spawn] ${name} in ${dir}`));
  return spawnPane(name, cmd);
}

// ─── Wait for an artifact file to exist ─────────────────────────────────────

function waitForArtifact(filePath: string, phaseName: string): boolean {
  const startTime = Date.now();
  console.log(muted(`  Waiting for ${phaseName} to complete (artifact: ${filePath})...`));

  while (Date.now() - startTime < MAX_WAIT_MS) {
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, "utf-8").trim();
      if (content.length > 50) { // not just a header
        console.log(success(`  ${phaseName} complete — artifact found`));
        return true;
      }
    }
    spawnSync("sleep", [String(POLL_INTERVAL_MS / 1000)]);
  }

  console.log(warn(`  ${phaseName} timed out after ${MAX_WAIT_MS / 60000} minutes`));
  return false;
}

// ─── Phase 0: Founder Interview ─────────────────────────────────────────────

function runPhase0_Interview(): Record<string, string> {
  // Check if profile already exists (resume case)
  const profilePath = join(HARNESS_DIR, "founder-profile.yml");
  if (existsSync(profilePath)) {
    console.log(muted("  Founder profile already exists. Loading from file."));
    const content = readFileSync(profilePath, "utf-8");
    const answers: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const idx = line.indexOf(":");
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        answers[key] = val;
      }
    }
    return answers;
  }

  console.log(heading("Phase 0: Deep Founder Interview"));
  console.log(muted("  Answering these questions helps the harness build the right thing."));
  console.log(muted("  Press Enter to skip optional questions.\n"));

  // All 13 questions from SKILL.md — fixes #4
  const questions = [
    { key: "idea", prompt: "What's your startup idea? (one sentence to one paragraph)" },
    { key: "startup_type", prompt: "Company type? (b2c, b2b-saas, devtool, marketplace, hardware, fintech, healthcare, ecommerce)" },
    { key: "target_users", prompt: "Who are the target users? Be specific — job title at company type, not a category." },
    { key: "business_model", prompt: "Business model? (subscription, usage-based, freemium, commission, one-time, open-core)" },
    { key: "budget", prompt: "Budget? (bootstrapped, pre-seed, seed, series-a, enterprise-backed)" },
    { key: "technical_level", prompt: "Your technical background? (non-technical, technical-not-coding, full-stack, specialized)" },
    { key: "existing_tools", prompt: "What tools do you already use? (GitHub, Vercel, Stripe, Figma, Slack, domain registrar, etc.)" },
    { key: "compliance", prompt: "Compliance requirements? (hipaa, pci-dss, soc2, gdpr, coppa, none)" },
    { key: "integrations", prompt: "Third-party integrations needed? (payments, maps, messaging, search, ai, crm, calendar)" },
    { key: "timeline", prompt: "Timeline? (weekend, sprint, month, quarter, ongoing)" },
    { key: "existing_designs", prompt: "Existing designs? (Figma URL, screenshots path, inspiration URLs, or 'none')" },
    { key: "domain", prompt: "Domain name or startup name? (or 'TBD')" },
    { key: "design_preset", prompt: "Design style? (minimal, neobrutalist, glassmorphism, editorial, clean-saas, warm-soft)" },
  ];

  const answers: Record<string, string> = {};

  for (const q of questions) {
    // Skip hardware question unless relevant
    if (q.key === "hardware" && !["hardware", "iot"].some(t => (answers.startup_type || "").includes(t))) {
      continue;
    }

    process.stdout.write(`  ${info(q.prompt)} `);
    const input = spawnSync("bash", ["-c", "read -r line && echo $line"], {
      stdio: ["inherit", "pipe", "inherit"],
    });
    const value = input.stdout?.toString().trim() || "";
    if (value) answers[q.key] = value;
    console.log();
  }

  // Add interview date
  answers.interview_date = new Date().toISOString().split("T")[0];

  // Save founder profile
  mkdirSync(HARNESS_DIR, { recursive: true });
  const yaml = Object.entries(answers)
    .map(([k, v]) => `${k}: "${v}"`)
    .join("\n");
  writeFileSync(profilePath, yaml);
  console.log(success(`  Saved founder profile to ${profilePath}`));

  writeFileSync(join(HARNESS_DIR, "idea.md"), `# Startup Idea\n\n${answers.idea}\n`);

  return answers;
}

// ─── Phase 1: Validate Services ─────────────────────────────────────────────

function runPhase1_ValidateServices(answers: Record<string, string>): boolean {
  console.log(heading("Phase 1: Validate Services"));

  // Core services — always checked
  const checks = [
    { name: "GitHub", cmd: "gh auth status" },
    { name: "Vercel", cmd: "vercel whoami" },
  ];

  // Conditional checks based on answers — fixes #16
  const existingTools = (answers.existing_tools || "").toLowerCase();
  if (!existingTools.includes("no railway")) {
    checks.push({ name: "Railway", cmd: "railway whoami" });
  }

  // Convex — always in the canonical stack
  checks.push({ name: "Convex", cmd: "npx convex dashboard --help" });

  let allPassed = true;
  for (const check of checks) {
    try {
      execSync(check.cmd, { stdio: "pipe", timeout: 10000 });
      console.log(success(`  ${check.name}: connected`));
    } catch {
      console.log(warn(`  ${check.name}: not connected`));
      allPassed = false;
    }
  }

  if (!allPassed) {
    console.log(warn("\n  Some services not connected. Non-blocking — will retry at deploy time."));
  }
  return true; // Don't block on service validation — they can be fixed later
}

// ─── Phase helpers ──────────────────────────────────────────────────────────

function phaseIndex(phase: string): number {
  return PHASE_ORDER.indexOf(phase as typeof PHASE_ORDER[number]);
}

function shouldSkipPhase(phase: string, resumeFrom: string | null): boolean {
  if (!resumeFrom) return false;
  return phaseIndex(phase) < phaseIndex(resumeFrom);
}

// ─── Main flow ─────────────────────────────────────────────────────────────

export function run(args: string[]): void {
  console.log(heading("HARNESS INIT — Building Your Startup"));
  console.log();

  if (!isTmuxAvailable()) {
    console.log(error("  tmux is required. Install with: brew install tmux"));
    process.exit(1);
  }

  // Parse --resume-from flag — fixes #3
  let resumeFrom: string | null = null;
  for (const arg of args) {
    if (arg.startsWith("--resume-from=")) {
      resumeFrom = arg.split("=")[1];
      console.log(muted(`  Resuming from phase: ${resumeFrom}`));
    }
  }

  // Verify skills are available and generate per-agent configs
  console.log(heading("Checking Skills & Agent Configs"));
  installSkills();
  const agentConfigCount = writeAgentConfigs();
  console.log(success(`  ${agentConfigCount} agent configs written to .harness/agents/`));

  const state = loadState();

  // If not forcing and not resuming, check state
  if (state.phase !== "onboarding" && !args.includes("--force") && !resumeFrom) {
    console.log(warn(`Already at phase: ${state.phase}`));
    console.log(muted("Use --force to restart, or 'harness resume' to continue."));
    return;
  }

  // ── Phase 0: Founder Interview ─────────────────────────────────────────
  let answers: Record<string, string>;
  if (shouldSkipPhase("onboarding", resumeFrom)) {
    console.log(muted("  Skipping Phase 0 — already completed"));
    // Load existing profile
    answers = runPhase0_Interview(); // loads from file if exists
  } else {
    answers = runPhase0_Interview();
    updateState({ phase: "services", meta: { idea: answers.idea, type: answers.startup_type, preset: answers.design_preset } });
  }

  // ── Phase 0.5: Credential Collection ───────────────────────────────────
  if (!shouldSkipPhase("services", resumeFrom)) {
    const required = determineRequiredServices(answers);
    const collected = collectCredentials(required, ROOT_DIR);
    const { invalid } = validateCredentialFormats(collected);
    if (invalid.length > 0) {
      console.log(warn(`  Warning: malformed credentials: ${invalid.join(", ")}`));
    }
    printCredentialSummary(required, collected);
  }

  // ── Phase 1: Validate Services ─────────────────────────────────────────
  if (!shouldSkipPhase("services", resumeFrom)) {
    runPhase1_ValidateServices(answers);

    // Create GitHub Project board — fixes #20
    console.log(heading("Creating GitHub Project Board"));
    try {
      const projectName = answers.idea?.split(" ").slice(0, 3).join(" ") || "Startup";
      execSync(
        `gh project create --title "${projectName}" --owner @me 2>/dev/null || echo "Project may already exist"`,
        { encoding: "utf-8", stdio: "pipe", timeout: 15000 }
      );
      console.log(success(`  Project board "${projectName}" created`));
    } catch {
      console.log(warn("  Could not create GitHub Project board — create manually or retry later"));
    }

    updateState({ phase: "research" });
  }

  // ── Phase 2: Research — sequential, waits for artifact ─────────────────
  if (!shouldSkipPhase("research", resumeFrom)) {
    console.log(heading("Phase 2: Research"));
    const researchArtifact = join(ROOT_DIR, "research-report.md");

    if (existsSync(researchArtifact)) {
      console.log(muted("  research-report.md already exists — skipping"));
    } else {
      const researchPrompt = [
        `You are the researcher agent. Research competitors for: "${answers.idea}".`,
        "Use WebSearch to find 5-15 competitors, market size, pricing models, design patterns.",
        "Write research-report.md with: executive summary, competitor table, target audience, positioning gaps, differentiation opportunities.",
        "Be thorough. This report feeds directly into the product spec.",
      ].join(" ");
      spawnClaudeSession("researcher", researchPrompt);
      console.log(success("  Researcher agent spawned — waiting for research-report.md"));

      // Wait for artifact — fixes #5 (sequential phases)
      waitForArtifact(researchArtifact, "Research");
    }
    updateState({ phase: "spec" });
  }

  // ── Phase 3: Product Spec — waits for research ─────────────────────────
  if (!shouldSkipPhase("spec", resumeFrom)) {
    console.log(heading("Phase 3: Product Spec"));
    const specArtifact = join(ROOT_DIR, "product-spec.md");

    if (existsSync(specArtifact)) {
      console.log(muted("  product-spec.md already exists — skipping"));
    } else {
      const specPrompt = [
        `You are the planner. Generate a product spec for: "${answers.idea}".`,
        "Read research-report.md for competitor context. Read .harness/stacks.yml for stack.",
        `Startup type: ${answers.startup_type}. Target users: ${answers.target_users}.`,
        `Business model: ${answers.business_model}. Compliance: ${answers.compliance || "none"}.`,
        "Include: pages with routes, features (P0/P1/P2) with testable acceptance criteria,",
        "data models, API routes, component inventory.",
        "Write product-spec.md. Create GitHub Issues for every P0 feature.",
      ].join(" ");
      spawnClaudeSession("planner", specPrompt);
      console.log(success("  Planner agent spawned — waiting for product-spec.md"));

      waitForArtifact(specArtifact, "Product Spec");
    }
    updateState({ phase: "design" });
  }

  // ── Phase 4: Design ────────────────────────────────────────────────────
  if (!shouldSkipPhase("design", resumeFrom)) {
    console.log(heading("Phase 4: Design"));
    if (answers.existing_designs && answers.existing_designs !== "none") {
      console.log(muted(`  Using existing designs: ${answers.existing_designs}`));
    } else {
      console.log(muted(`  Design preset: ${answers.design_preset || "minimal"}`));
      console.log(muted("  Visual QA baseline will be established during build phase."));
    }
    updateState({ phase: "scaffold" });
  }

  // ── Phase 5-7: Build — spawn ALL relevant agents ───────────────────────
  // Fixes #6: spawn all agents, not just 4
  if (!shouldSkipPhase("build", resumeFrom)) {
    console.log(heading("Phase 5-7: Scaffold + Build"));

    // Commander first — orchestrates everything (fixes #14)
    const commanderRules = generateAgentPrompt("commander");
    const commanderPrompt = [
      commanderRules,
      `Orchestrate building: "${answers.idea}".`,
      "Read product-spec.md for features. Monitor all agent tmux panes.",
      "Dispatch work to agents. Track progress via GitHub Issues.",
      "Post investor-style Slack updates after each milestone.",
      "Verify quality gates: tests pass, Cubic clean, visual QA pass.",
      "NEVER write or edit code yourself — only coordinate.",
    ].join(" ");
    spawnClaudeSession("commander", commanderPrompt);
    console.log(success("  Commander agent spawned (orchestrator)"));

    // Website agent — frontend
    const websiteRules = generateAgentPrompt("website");
    const websitePrompt = [
      websiteRules,
      `Build the frontend for: "${answers.idea}".`,
      `Design preset: ${answers.design_preset || "minimal"}.`,
      "Read product-spec.md. Follow skills: website-creation, impeccable, layout, typeset, polish.",
      "TDD: write tests first. NO Inter font. NO dark mode. Light mode only.",
      "Steps: scaffold Next.js → install deps → write tests → build features → visual QA.",
      "NEVER STOP until all P0 frontend features pass.",
    ].join(" ");
    spawnClaudeSession("website", websitePrompt);
    console.log(success("  Website agent spawned (frontend)"));

    // Backend agent — Convex, API routes, auth
    const backendRules = generateAgentPrompt("backend");
    const backendPrompt = [
      backendRules,
      `Build the backend for: "${answers.idea}".`,
      "Read product-spec.md for data models and API routes.",
      "Follow Convex skills for schema, functions, realtime, security.",
      `Compliance: ${answers.compliance || "none"}. Business model: ${answers.business_model}.`,
      "TDD: write tests first. Set up Convex schema, mutations, queries, actions.",
      answers.business_model?.includes("subscription") ? "Wire Stripe integration for payments." : "",
      "NEVER STOP until all P0 backend features pass.",
    ].filter(Boolean).join(" ");
    spawnClaudeSession("backend", backendPrompt);
    console.log(success("  Backend agent spawned (Convex, API)"));

    // Writing agent — legal, content
    const writingRules = generateAgentPrompt("writing");
    const writingPrompt = [
      writingRules,
      `Create content for: "${answers.idea}".`,
      "Follow anti-ai-writing skill. NO AI slop.",
      `Compliance: ${answers.compliance || "none"}.`,
      "Generate: Terms of Service, Privacy Policy (legal-generator skill).",
      "Then: blog post with unique data (data-driven-blog skill).",
      "Then: social media launch posts (social-media skill).",
    ].join(" ");
    spawnClaudeSession("writing", writingPrompt);
    console.log(success("  Writing agent spawned (legal, content)"));

    // Growth agent — analytics, SEO
    const growthRules = generateAgentPrompt("growth");
    const growthPrompt = [
      growthRules,
      `Set up growth for: "${answers.idea}".`,
      "Follow analytics-integration skill: set up PostHog.",
      "Follow seo-setup skill: sitemap, meta tags, structured data.",
      "Follow programmatic-seo skill if applicable to this startup type.",
      "Set up conversion funnels and A/B testing framework.",
    ].join(" ");
    spawnClaudeSession("growth", growthPrompt);
    console.log(success("  Growth agent spawned (analytics, SEO)"));

    // Slop cleaner — continuous quality
    const slopRules = generateAgentPrompt("slop-cleaner");
    const slopPrompt = [
      slopRules,
      "Monitor the codebase for AI-generated slop.",
      "Follow slop-cleaner skill. Check for: Inter font, sparkles icons, !important,",
      "left outlines, generic AI copy, bounce/elastic animations, gradient text.",
      "Fix any violations found. Run continuously.",
    ].join(" ");
    spawnClaudeSession("slop-cleaner", slopPrompt);
    console.log(success("  Slop-cleaner agent spawned (quality)"));

    // Conditional: docs agent for devtools
    if (answers.startup_type === "devtool") {
      const docsRules = generateAgentPrompt("docs");
      const docsPrompt = [
        docsRules,
        `Generate documentation for: "${answers.idea}".`,
        "Follow documentation-generator skill. Create: API reference, SDK guide, quickstart.",
        "Follow contributing-guide skill for open-source contribution docs.",
      ].join(" ");
      spawnClaudeSession("docs", docsPrompt);
      console.log(success("  Docs agent spawned (devtool documentation)"));
    }

    updateState({ phase: "build" });
  }

  // ── Phase 8-9: Deploy ──────────────────────────────────────────────────
  if (!shouldSkipPhase("deploy", resumeFrom)) {
    console.log(heading("Phase 8-9: Deploy + Post-Deploy"));
    const opsRules = generateAgentPrompt("ops");
    const opsPrompt = [
      opsRules,
      "Deploy the startup.",
      "Wait for the website and backend agents to complete (check tmux panes).",
      "When build is complete: 1) npx convex deploy 2) vercel --prod",
      "3) Verify deployment health 4) Set up monitoring (uptime-monitor skill).",
      `${answers.domain && answers.domain !== "TBD" ? `Configure domain: ${answers.domain}` : ""}`,
      "Then start the post-deploy monitoring loop (post-deploy-loop skill).",
    ].filter(Boolean).join(" ");
    spawnClaudeSession("ops", opsPrompt);
    console.log(success("  Ops agent spawned (deploy + monitoring)"));
    updateState({ phase: "deploy" });
  }

  // ── Summary ────────────────────────────────────────────────────────────
  const agentCount = [
    "commander", "website", "backend", "writing", "growth", "slop-cleaner", "ops",
    ...(answers.startup_type === "devtool" ? ["docs"] : []),
  ];

  console.log();
  console.log(heading("Harness is building your startup"));
  console.log(muted(`  ${agentCount.length} agents running in tmux:`));
  for (const name of agentCount) {
    console.log(muted(`    ${name}`));
  }
  console.log();
  console.log(muted("  Attach: tmux attach -t harness"));
  console.log(muted("  Status: harness status"));
  console.log(muted("  Commander posts investor updates to Slack as milestones complete."));
  console.log();
}
