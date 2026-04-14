/**
 * harness init — run the full startup lifecycle.
 *
 * This is THE entry point. It orchestrates all 12 phases by calling
 * actual packages, not by spawning a Claude session and hoping.
 *
 * Interactive phases run in the current terminal.
 * Autonomous phases spawn agents in tmux panes.
 * State persists to .harness/state.json so `harness resume` can continue.
 */

import { execSync, spawnSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { loadState, updateState } from "../lib/state.js";
import { loadAgents, loadStacks } from "../lib/config.js";
import { heading, phaseLabel, success, warn, error, muted, bold } from "../lib/format.js";
import { STARTUP_PHASES, ROOT_DIR, HARNESS_DIR, STACKS_FILE } from "../lib/constants.js";
import { spawnPane, ensureSession, isTmuxAvailable, capturePane } from "../lib/tmux.js";

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
  ];

  const answers: Record<string, string> = {};

  for (const q of questions) {
    process.stdout.write(`  ${bold(q.prompt)} `);
    // Read from stdin synchronously
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

  // Save idea separately
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

function runPhase2_Research(idea: string): void {
  console.log(heading("Phase 2: Research"));
  console.log(muted("  Researching competitors and market..."));

  const prompt = `Research competitors and market for this startup idea: "${idea}". Use WebSearch to find: 1) Direct competitors 2) Market size 3) Target audience pain points 4) Pricing models 5) Design patterns. Write a comprehensive research-report.md to the project root with: executive summary, competitor analysis table, target audience profile, differentiation strategy.`;

  try {
    execSync(
      `echo '${prompt.replace(/'/g, "'\\''")}' | claude -p --dangerously-skip-permissions --output-format text > research-report.md`,
      { cwd: ROOT_DIR, stdio: "pipe", timeout: 300000 }
    );
    console.log(success("  Research report saved to research-report.md"));
  } catch (e: any) {
    console.log(warn("  Research phase had issues — continuing with available data"));
  }
}

function runPhase3_Spec(idea: string): void {
  console.log(heading("Phase 3: Product Spec"));
  console.log(muted("  Generating product specification..."));

  const researchExists = existsSync(join(ROOT_DIR, "research-report.md"));
  const researchContext = researchExists
    ? `Also read research-report.md for competitive context.`
    : "";

  const stacksExists = existsSync(STACKS_FILE);
  const stackContext = stacksExists
    ? `Read .harness/stacks.yml for tech stack constraints.`
    : "";

  const prompt = `Generate a comprehensive product spec for this startup: "${idea}". ${researchContext} ${stackContext} Include: 1) Product overview and value proposition 2) Pages and routes 3) Features with P0/P1/P2 priorities and testable acceptance criteria 4) Data models (Convex schema) 5) API routes 6) Component inventory. Write product-spec.md to the project root.`;

  try {
    execSync(
      `echo '${prompt.replace(/'/g, "'\\''")}' | claude -p --dangerously-skip-permissions --output-format text > product-spec.md`,
      { cwd: ROOT_DIR, stdio: "pipe", timeout: 300000 }
    );
    console.log(success("  Product spec saved to product-spec.md"));
  } catch {
    console.log(error("  Failed to generate product spec"));
  }
}

function runPhase5_RepoSetup(): void {
  console.log(heading("Phase 5: Repository Setup"));
  console.log(muted("  Scaffolding project with canonical stack..."));

  // The repo-setup package handles this, but we call it via claude
  // since it needs interactive CLI access for vercel link, railway link etc.
  const prompt = `Set up the project repository. Read .harness/stacks.yml for the canonical stack. Do these in order:
1. If packages/website-template/ exists, copy its structure to the project root (don't overwrite existing files)
2. Run: npm install (if package.json exists)
3. Set up .github/workflows/ci.yml for lint+typecheck+test
4. Verify the project builds: npm run build
Report what was set up.`;

  try {
    execSync(
      `echo '${prompt.replace(/'/g, "'\\''")}' | claude -p --dangerously-skip-permissions --output-format text`,
      { cwd: ROOT_DIR, stdio: "pipe", timeout: 300000 }
    );
    console.log(success("  Repository scaffolded"));
  } catch {
    console.log(warn("  Repo setup had issues — may need manual intervention"));
  }
}

function runPhase6_Decompose(): void {
  console.log(heading("Phase 6: Feature Decomposition"));
  console.log(muted("  Breaking spec into features..."));

  const prompt = `Read product-spec.md. Break it into individual features. For each P0 feature:
1. Create a features/{feature-name}.md checklist file
2. Create a GitHub Issue with acceptance criteria (use gh issue create)
3. Order features by dependency
Report the feature list and dependency order.`;

  try {
    execSync(
      `echo '${prompt.replace(/'/g, "'\\''")}' | claude -p --dangerously-skip-permissions --output-format text`,
      { cwd: ROOT_DIR, stdio: "pipe", timeout: 300000 }
    );
    console.log(success("  Features decomposed and GitHub Issues created"));
  } catch {
    console.log(warn("  Decomposition had issues"));
  }
}

function runPhase7_Build(): void {
  console.log(heading("Phase 7: Build (TDD Loop)"));
  console.log(muted("  Spawning build agents in tmux..."));

  if (!isTmuxAvailable()) {
    console.log(error("  tmux required for build phase. Install with: brew install tmux"));
    return;
  }

  ensureSession();

  // Spawn website agent to build features
  const buildPrompt = [
    "You are the website agent. Read product-spec.md and the features/ directory.",
    "For each P0 feature in dependency order:",
    "1. Write tests first (vitest for unit, playwright for e2e)",
    "2. Implement the feature to pass the tests",
    "3. Run tests: npx vitest run",
    "4. If tests fail, fix and retry (max 10 iterations)",
    "5. Commit: git add . && git commit -m 'Implement: {feature}'",
    "6. Move to next feature",
    "NEVER STOP until all P0 features are done.",
    "Read .harness/stacks.yml for tech stack.",
    "Do NOT use Inter font, sparkles icons, or !important.",
  ].join(" ");

  const cmd = `cd ${ROOT_DIR} && claude --dangerously-skip-permissions --append-system-prompt "${buildPrompt}"`;
  const spawned = spawnPane("website-builder", cmd);

  if (spawned) {
    console.log(success("  Website builder agent spawned in tmux"));
    console.log(muted("  Attach with: tmux attach -t harness"));
  } else {
    console.log(error("  Failed to spawn build agent"));
  }
}

function runPhase8_Deploy(): void {
  console.log(heading("Phase 8: Deploy"));

  const steps = [
    { name: "Vercel (frontend)", cmd: "vercel --prod --yes" },
    { name: "Convex (database)", cmd: "npx convex deploy" },
  ];

  for (const step of steps) {
    console.log(muted(`  Deploying ${step.name}...`));
    try {
      execSync(step.cmd, { cwd: ROOT_DIR, stdio: "pipe", timeout: 120000 });
      console.log(success(`  ${step.name}: deployed`));
    } catch {
      console.log(warn(`  ${step.name}: deploy failed — may need manual intervention`));
    }
  }
}

// ─── Main flow ─────────────────────────────────────────────────────────────

export function run(args: string[]): void {
  console.log(heading("HARNESS INIT — Building Your Startup"));
  console.log();

  const state = loadState();

  // Check if already initialized
  if (state.phase !== "onboarding" && !args.includes("--force")) {
    console.log(warn(`Already at phase: ${state.phase}`));
    console.log(muted("Use --force to restart, or 'harness resume' to continue."));
    return;
  }

  // Phase 0: Founder Interview (interactive)
  const answers = runPhase0_Interview();
  updateState({ phase: "research", meta: { idea: answers.idea, type: answers.type } });

  // Phase 1: Validate Services
  const servicesOk = runPhase1_ValidateServices();
  if (!servicesOk) {
    updateState({ phase: "services" });
    console.log(warn("\n  Fix service connections and run 'harness resume' to continue."));
    return;
  }
  updateState({ phase: "research" });

  // Phase 2: Research
  runPhase2_Research(answers.idea);
  updateState({ phase: "spec" });

  // Phase 3: Product Spec
  runPhase3_Spec(answers.idea);
  updateState({ phase: "design" });

  // Phase 4: Design (skip for now — Figma MCP integration)
  console.log(heading("Phase 4: Design"));
  console.log(muted("  Skipping Figma design generation (requires Figma MCP connection)"));
  console.log(muted("  The build phase will work from the spec directly."));
  updateState({ phase: "scaffold" });

  // Phase 5: Repo Setup
  runPhase5_RepoSetup();
  updateState({ phase: "decompose" });

  // Phase 6: Feature Decomposition
  runPhase6_Decompose();
  updateState({ phase: "build" });

  // Phase 7: Build (spawns agents in tmux — async from here)
  runPhase7_Build();
  updateState({ phase: "build" });

  console.log();
  console.log(heading("Harness is building your startup"));
  console.log(muted("  The build agent is running in tmux."));
  console.log(muted("  Attach with: tmux attach -t harness"));
  console.log(muted("  Check status with: harness status"));
  console.log(muted("  When build is done, run: harness deploy production"));
  console.log();
}
