/**
 * Credential Collection — reads tool-catalog.yml, determines which services
 * are needed based on founder answers, collects API keys interactively,
 * saves to .env, and validates each credential.
 *
 * Rule: WHENEVER YOU ADD A SERVICE, THE USER MUST ADD THE CREDENTIALS.
 * No service gets wired in without its keys collected here.
 */

import { readFileSync, existsSync, writeFileSync, appendFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { TOOL_CATALOG_FILE } from "./constants.js";
import { loadToolCatalog } from "./config.js";
import { heading, success, warn, error, muted, info, subheading } from "./format.js";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ServiceConfig {
  package?: string;
  description: string;
  env_vars: string[];
  setup?: string;
  docs: string;
  when: string;
}

interface ServiceRequirement {
  category: string;
  name: string;
  config: ServiceConfig;
  reason: string;
}

// ─── Determine Required Services ───────────────────────────────────────────

/**
 * Based on the founder's answers, determine which services from the
 * tool catalog are required. Returns a list of services with reasons.
 */
export function determineRequiredServices(
  answers: Record<string, string>
): ServiceRequirement[] {
  const catalog = loadToolCatalog() as Record<string, Record<string, ServiceConfig>>;
  if (!catalog || Object.keys(catalog).length === 0) {
    return [];
  }

  const required: ServiceRequirement[] = [];
  const type = (answers.type || "").toLowerCase();
  const model = (answers.business_model || "").toLowerCase();
  const idea = (answers.idea || "").toLowerCase();

  // ── Always needed ──────────────────────────────────────────────────────

  // Analytics — every startup
  if (catalog.analytics?.posthog) {
    required.push({
      category: "analytics",
      name: "posthog",
      config: catalog.analytics.posthog,
      reason: "Every startup needs product analytics",
    });
  }

  // Error tracking — every deployed startup
  if (catalog["error-tracking"]?.sentry) {
    required.push({
      category: "error-tracking",
      name: "sentry",
      config: catalog["error-tracking"].sentry,
      reason: "Every deployed startup needs error tracking",
    });
  }

  // Database — convex is in the canonical stack
  if (catalog.database?.convex) {
    required.push({
      category: "database",
      name: "convex",
      config: catalog.database.convex,
      reason: "Convex is the canonical database",
    });
  }

  // Deployment — vercel for frontend
  if (catalog.deployment?.vercel) {
    required.push({
      category: "deployment",
      name: "vercel",
      config: catalog.deployment.vercel,
      reason: "Vercel is the canonical frontend deployment",
    });
  }

  // Code review — cubic
  if (catalog["code-review"]?.cubic) {
    required.push({
      category: "code-review",
      name: "cubic",
      config: catalog["code-review"].cubic,
      reason: "Cubic code review is in the quality stack",
    });
  }

  // Browser Use — social media scraping, competitor monitoring, growth intelligence
  if (catalog["browser-automation"]?.["browser-use"]) {
    required.push({
      category: "browser-automation",
      name: "browser-use",
      config: catalog["browser-automation"]["browser-use"],
      reason: "Social media scraping and competitor monitoring for growth intelligence",
    });
  }

  // ── Conditional services ───────────────────────────────────────────────

  // Payments — if the startup charges money
  const needsPayments =
    model.includes("subscription") ||
    model.includes("usage") ||
    model.includes("freemium") ||
    model.includes("commission") ||
    model.includes("one-time") ||
    type === "b2b-saas" ||
    type === "fintech" ||
    type === "ecommerce" ||
    type === "marketplace";

  if (needsPayments && catalog.payments?.stripe) {
    required.push({
      category: "payments",
      name: "stripe",
      config: catalog.payments.stripe,
      reason: `Business model "${answers.business_model}" requires payments`,
    });
  }

  // Auth — if the startup needs user accounts
  const needsAuth =
    type === "b2b-saas" ||
    type === "marketplace" ||
    type === "fintech" ||
    type === "healthcare" ||
    idea.includes("account") ||
    idea.includes("login") ||
    idea.includes("user") ||
    idea.includes("dashboard");

  if (needsAuth && catalog.auth?.clerk) {
    required.push({
      category: "auth",
      name: "clerk",
      config: catalog.auth.clerk,
      reason: `${type} startups need user authentication`,
    });
  }

  // Email — if the startup sends transactional emails
  const needsEmail =
    needsAuth || // auth implies welcome emails
    type === "b2b-saas" ||
    type === "marketplace" ||
    type === "ecommerce" ||
    idea.includes("email") ||
    idea.includes("notification") ||
    idea.includes("invite");

  if (needsEmail && catalog.email?.resend) {
    required.push({
      category: "email",
      name: "resend",
      config: catalog.email.resend,
      reason: "Transactional emails (welcome, notifications, etc.)",
    });
  }

  // File uploads — if the startup handles user files
  const needsUploads =
    idea.includes("upload") ||
    idea.includes("image") ||
    idea.includes("file") ||
    idea.includes("photo") ||
    idea.includes("document") ||
    idea.includes("video") ||
    idea.includes("media") ||
    type === "marketplace";

  if (needsUploads && catalog["file-storage"]?.uploadthing) {
    required.push({
      category: "file-storage",
      name: "uploadthing",
      config: catalog["file-storage"].uploadthing,
      reason: "Startup involves file/media uploads",
    });
  }

  // Rate limiting — if the startup has a public API
  const needsRateLimiting =
    type === "devtool" ||
    idea.includes("api") ||
    idea.includes("developer") ||
    idea.includes("platform");

  if (needsRateLimiting && catalog["rate-limiting"]?.upstash) {
    required.push({
      category: "rate-limiting",
      name: "upstash",
      config: catalog["rate-limiting"].upstash,
      reason: "Public API needs rate limiting",
    });
  }

  // AI image generation — every startup gets a landing page with placeholder hero
  // Fal for prototyping, user replaces with Midjourney for production
  if (catalog["ai-images"]?.fal) {
    required.push({
      category: "ai-images",
      name: "fal",
      config: catalog["ai-images"].fal,
      reason: "Placeholder hero images during build (replace with Midjourney for production)",
    });
  }

  return required;
}

// ─── Interactive Credential Collection ─────────────────────────────────────

/**
 * Prompt the user for a single env var value. Returns the value or empty string.
 */
function promptForValue(varName: string, docs: string): string {
  process.stdout.write(`    ${info(varName)}: `);
  const input = spawnSync("bash", ["-c", "read -r line && echo $line"], {
    stdio: ["inherit", "pipe", "inherit"],
  });
  return input.stdout?.toString().trim() || "";
}

/**
 * Read existing .env file and return a map of key → value.
 */
function readExistingEnv(envPath: string): Map<string, string> {
  const existing = new Map<string, string>();
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (val) existing.set(key, val);
      }
    }
  }
  return existing;
}

/**
 * Collect credentials for all required services interactively.
 * Saves to projectDir/.env.local (Next.js convention).
 *
 * Returns the map of collected credentials.
 */
export function collectCredentials(
  required: ServiceRequirement[],
  projectDir: string
): Map<string, string> {
  console.log(heading("Credential Collection"));
  console.log(muted("  The harness needs API keys for each service your startup uses."));
  console.log(muted("  Press Enter to skip optional services. You can add them later.\n"));

  const envPath = join(projectDir, ".env.local");
  const existing = readExistingEnv(envPath);
  const collected = new Map<string, string>(existing);
  const newEntries: string[] = [];
  let skippedCount = 0;

  for (const svc of required) {
    const envVars = svc.config.env_vars;
    if (!envVars || envVars.length === 0) continue;

    // Check if all vars are already set
    const allSet = envVars.every((v) => collected.has(v) && collected.get(v) !== "");
    if (allSet) {
      console.log(success(`  ${svc.name} — already configured`));
      continue;
    }

    console.log(subheading(`  ${svc.name}`) + muted(` — ${svc.reason}`));
    console.log(muted(`    Docs: ${svc.config.docs}`));

    let svcSkipped = false;
    for (const envVar of envVars) {
      if (collected.has(envVar) && collected.get(envVar) !== "") {
        console.log(success(`    ${envVar}: already set`));
        continue;
      }

      const value = promptForValue(envVar, svc.config.docs);
      if (value) {
        collected.set(envVar, value);
        newEntries.push(`${envVar}=${value}`);
        console.log(success(`    Set.`));
      } else {
        svcSkipped = true;
        skippedCount++;
        console.log(warn(`    Skipped.`));
      }
    }

    if (svcSkipped) {
      console.log(warn(`    ${svc.name} partially configured — add missing keys to ${envPath} later.`));
    }
    console.log();
  }

  // Write new entries to .env.local
  if (newEntries.length > 0) {
    const header = existsSync(envPath)
      ? ""
      : "# Generated by harness init — API keys for your startup\n# Do NOT commit this file.\n\n";

    const content = header + newEntries.map((e) => e).join("\n") + "\n";

    if (existsSync(envPath)) {
      appendFileSync(envPath, "\n" + newEntries.join("\n") + "\n");
    } else {
      writeFileSync(envPath, content);
    }

    console.log(success(`  Saved ${newEntries.length} credentials to ${envPath}`));
  }

  // Ensure .env.local is in .gitignore
  ensureGitignore(projectDir, ".env.local");

  if (skippedCount > 0) {
    console.log(warn(`\n  ${skippedCount} credential(s) skipped. Add them to ${envPath} before deploying.`));
  }

  return collected;
}

// ─── Gitignore ─────────────────────────────────────────────────────────────

function ensureGitignore(dir: string, entry: string): void {
  const gitignorePath = join(dir, ".gitignore");
  if (existsSync(gitignorePath)) {
    const content = readFileSync(gitignorePath, "utf-8");
    if (content.includes(entry)) return;
    appendFileSync(gitignorePath, `\n${entry}\n`);
  } else {
    writeFileSync(gitignorePath, `${entry}\n`);
  }
}

// ─── Credential Validation ─────────────────────────────────────────────────

/**
 * Validate that collected credentials are well-formed.
 * Does NOT make API calls — just checks format.
 */
export function validateCredentialFormats(
  collected: Map<string, string>
): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  const patterns: Record<string, RegExp> = {
    // Stripe keys start with sk_ or pk_
    STRIPE_SECRET_KEY: /^sk_(test|live)_[A-Za-z0-9]+$/,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: /^pk_(test|live)_[A-Za-z0-9]+$/,
    // Clerk keys
    CLERK_SECRET_KEY: /^sk_(test|live)_[A-Za-z0-9]+$/,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: /^pk_(test|live)_[A-Za-z0-9]+$/,
    // Sentry DSN is a URL
    SENTRY_DSN: /^https:\/\/[a-f0-9]+@[a-z0-9.]+\/\d+$/,
    // PostHog key is typically phc_
    NEXT_PUBLIC_POSTHOG_KEY: /^phc_[A-Za-z0-9]+$/,
    // Convex URL
    NEXT_PUBLIC_CONVEX_URL: /^https:\/\/.+\.convex\.cloud$/,
    // Resend key starts with re_
    RESEND_API_KEY: /^re_[A-Za-z0-9]+$/,
  };

  for (const [key, value] of collected) {
    if (!value) continue;
    const pattern = patterns[key];
    if (pattern && !pattern.test(value)) {
      invalid.push(key);
    } else {
      valid.push(key);
    }
  }

  return { valid, invalid };
}

// ─── Summary ───────────────────────────────────────────────────────────────

/**
 * Print a summary of credential collection results.
 */
export function printCredentialSummary(
  required: ServiceRequirement[],
  collected: Map<string, string>
): void {
  console.log(heading("Credential Summary"));

  for (const svc of required) {
    const envVars = svc.config.env_vars;
    if (!envVars || envVars.length === 0) {
      console.log(success(`  ${svc.name} — no credentials needed`));
      continue;
    }

    const allSet = envVars.every((v) => collected.has(v) && collected.get(v) !== "");
    const someSet = envVars.some((v) => collected.has(v) && collected.get(v) !== "");

    if (allSet) {
      console.log(success(`  ${svc.name} — ready`));
    } else if (someSet) {
      console.log(warn(`  ${svc.name} — partially configured`));
    } else {
      console.log(error(`  ${svc.name} — not configured`));
    }
  }
}
