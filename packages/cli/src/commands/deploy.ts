/**
 * harness deploy — manage deployments.
 *
 * Subcommands:
 *   staging      — deploy to staging
 *   production   — deploy to production (requires rollback plan)
 *   status       — check deployment status
 */

import { execSync } from "child_process";
import { loadStacks } from "../lib/config.js";
import { loadState, updateState } from "../lib/state.js";
import { heading, success, error, muted, info, warn } from "../lib/format.js";
import { ROOT_DIR } from "../lib/constants.js";

export function run(args: string[]): void {
  const sub = args[0];
  switch (sub) {
    case "staging":
      return deployStaging();
    case "production":
      return deployProduction(args.slice(1));
    case "status":
      return deployStatus();
    default:
      console.log(heading("harness deploy"));
      console.log("  Usage:");
      console.log("    harness deploy staging              — deploy to staging");
      console.log("    harness deploy production           — deploy to production");
      console.log("    harness deploy status               — check status");
      console.log();
  }
}

function deployStaging(): void {
  console.log(heading("harness deploy staging"));

  const stacks = loadStacks();
  const deployment = stacks.deployment as Record<string, string> | undefined;

  if (!deployment) {
    console.log(error("  No deployment config in stacks.yml."));
    return;
  }

  console.log(info("  Deploying to staging..."));
  console.log(`  Frontend: ${deployment.frontend ?? "unknown"}`);
  console.log(`  Backend:  ${deployment.backend ?? "unknown"}`);
  console.log();

  // Deploy frontend via Vercel
  if (deployment.frontend === "vercel") {
    console.log(info("  Deploying frontend to Vercel (preview)..."));
    try {
      execSync("vercel --yes 2>&1", { cwd: ROOT_DIR, stdio: "inherit", timeout: 120000 });
      console.log(success("  Frontend deployed to staging."));
    } catch {
      console.log(error("  Frontend deploy failed. Is vercel CLI installed and linked?"));
    }
  }

  // Deploy backend via Railway
  if (deployment.backend === "railway") {
    console.log(info("  Deploying backend to Railway (staging)..."));
    try {
      execSync("railway up 2>&1", { cwd: ROOT_DIR, stdio: "inherit", timeout: 120000 });
      console.log(success("  Backend deployed to staging."));
    } catch {
      console.log(error("  Backend deploy failed. Is railway CLI installed and linked?"));
    }
  }

  updateState({ meta: { lastDeploy: { env: "staging", at: new Date().toISOString() } } });
}

function deployProduction(args: string[]): void {
  console.log(heading("harness deploy production"));

  // Require rollback plan
  const hasRollbackFlag = args.includes("--rollback-plan");
  if (!hasRollbackFlag) {
    console.log(error("  Production deploy requires a rollback plan."));
    console.log();
    console.log("  Pass --rollback-plan to confirm you have a rollback strategy:");
    console.log(muted("    harness deploy production --rollback-plan"));
    console.log();
    console.log("  Before deploying to production:");
    console.log("    1. Verify staging deployment works");
    console.log("    2. Run 'harness eval all' to validate");
    console.log("    3. Ensure you can rollback (previous version available)");
    return;
  }

  const stacks = loadStacks();
  const deployment = stacks.deployment as Record<string, string> | undefined;

  if (!deployment) {
    console.log(error("  No deployment config in stacks.yml."));
    return;
  }

  console.log(warn("  Deploying to PRODUCTION..."));
  console.log(`  Frontend: ${deployment.frontend ?? "unknown"}`);
  console.log(`  Backend:  ${deployment.backend ?? "unknown"}`);
  console.log();

  // Deploy frontend to production via Vercel
  if (deployment.frontend === "vercel") {
    console.log(info("  Deploying frontend to Vercel (production)..."));
    try {
      execSync("vercel --prod --yes 2>&1", { cwd: ROOT_DIR, stdio: "inherit", timeout: 120000 });
      console.log(success("  Frontend deployed to production."));
    } catch {
      console.log(error("  Frontend deploy failed."));
    }
  }

  // Deploy backend to production via Railway
  if (deployment.backend === "railway") {
    console.log(info("  Deploying backend to Railway (production)..."));
    try {
      execSync("railway up --detach 2>&1", { cwd: ROOT_DIR, stdio: "inherit", timeout: 120000 });
      console.log(success("  Backend deployed to production."));
    } catch {
      console.log(error("  Backend deploy failed."));
    }
  }

  updateState({ meta: { lastDeploy: { env: "production", at: new Date().toISOString() } } });
}

function deployStatus(): void {
  console.log(heading("harness deploy status"));

  const stacks = loadStacks();
  const deployment = stacks.deployment as Record<string, string> | undefined;
  const state = loadState();
  const lastDeploy = state.meta.lastDeploy as { env: string; at: string } | undefined;

  if (lastDeploy) {
    console.log(`  Last deploy: ${lastDeploy.env} at ${lastDeploy.at}`);
    console.log();
  }

  if (!deployment) {
    console.log(muted("  No deployment config in stacks.yml."));
    return;
  }

  // Check Vercel status
  if (deployment.frontend === "vercel") {
    console.log(info("  Frontend (Vercel):"));
    try {
      const output = execSync("vercel ls --limit 3 2>&1", {
        cwd: ROOT_DIR,
        encoding: "utf-8",
        timeout: 15000,
      });
      console.log(output.split("\n").map((l) => "    " + l).join("\n"));
    } catch {
      console.log(muted("    Unable to query Vercel. Is CLI installed and authenticated?"));
    }
    console.log();
  }

  // Check Railway status
  if (deployment.backend === "railway") {
    console.log(info("  Backend (Railway):"));
    try {
      const output = execSync("railway status 2>&1", {
        cwd: ROOT_DIR,
        encoding: "utf-8",
        timeout: 15000,
      });
      console.log(output.split("\n").map((l) => "    " + l).join("\n"));
    } catch {
      console.log(muted("    Unable to query Railway. Is CLI installed and authenticated?"));
    }
    console.log();
  }
}
