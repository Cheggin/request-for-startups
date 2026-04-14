import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

const FIXTURES_DIR = join(__dirname, "__fixtures__");
const CATALOG_PATH = join(FIXTURES_DIR, "tool-catalog.yml");
const STACKS_PATH = join(FIXTURES_DIR, "stacks.yml");
const ENV_PATH = join(FIXTURES_DIR, ".env");

// Minimal fixture data matching the real catalog structure
const TOOL_CATALOG = {
  analytics: {
    posthog: {
      package: "posthog-js",
      description:
        "Product analytics, feature flags, session replay, A/B testing",
      env_vars: ["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"],
      setup: "npm install posthog-js",
      docs: "https://posthog.com/docs",
      when: "Any startup — analytics is always needed",
    },
  },
  payments: {
    stripe: {
      package: "stripe",
      description: "Payments, subscriptions, billing, invoicing",
      env_vars: [
        "STRIPE_SECRET_KEY",
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
        "STRIPE_WEBHOOK_SECRET",
      ],
      setup: "npm install stripe @stripe/stripe-js",
      docs: "https://stripe.com/docs",
      when: "The startup charges money",
    },
  },
  auth: {
    clerk: {
      package: "@clerk/nextjs",
      description: "Authentication, user management, OAuth, session handling",
      env_vars: [
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        "CLERK_SECRET_KEY",
      ],
      setup: "npx clerk@latest init",
      docs: "https://clerk.com/docs",
      when: "The startup needs user accounts, login, or signup",
    },
  },
  email: {
    resend: {
      package: "resend",
      description: "Transactional email API",
      env_vars: ["RESEND_API_KEY"],
      setup: "npm install resend",
      docs: "https://resend.com/docs",
      when: "The startup sends emails (welcome, reset, notifications)",
    },
  },
};

const BASE_STACKS = {
  website: {
    framework: "nextjs",
    styling: "tailwindcss-v4",
    language: "typescript",
  },
  backend: {
    runtime: "nextjs-api-routes",
    database: "convex",
    authentication: null,
    payments: "stripe",
  },
  deployment: {
    frontend: "vercel",
    backend: "railway",
  },
  quality: {
    code_review: "cubic",
    testing: { unit: "vitest", e2e: "playwright" },
  },
};

const BASE_ENV = `GITHUB_WEBHOOK_SECRET=ghp_test123
CONVEX_URL=https://test.convex.cloud
GITHUB_REPO=TestOrg/test-repo
`;

// --- Helpers that simulate what the stack-extend skill does ---

function lookupCatalog(
  catalog: Record<string, Record<string, any>>,
  toolName: string
): { category: string; config: any } | null {
  for (const [category, tools] of Object.entries(catalog)) {
    if (tools[toolName]) {
      return { category, config: tools[toolName] };
    }
  }
  return null;
}

function isToolInStack(
  stacks: Record<string, any>,
  toolName: string
): boolean {
  const json = JSON.stringify(stacks);
  return json.includes(`"${toolName}"`);
}

function addToolToStack(
  stacks: Record<string, any>,
  toolName: string,
  category: string
): Record<string, any> {
  const updated = JSON.parse(JSON.stringify(stacks));

  const categoryMap: Record<string, [string, string]> = {
    analytics: ["website", "analytics"],
    payments: ["backend", "payments"],
    auth: ["backend", "authentication"],
    email: ["backend", "email"],
    "error-tracking": ["quality", "error_tracking"],
    monitoring: ["quality", "monitoring"],
    "file-storage": ["backend", "file_storage"],
    cms: ["backend", "cms"],
  };

  const mapping = categoryMap[category];
  if (mapping) {
    const [parent, key] = mapping;
    if (!updated[parent]) updated[parent] = {};
    updated[parent][key] = toolName;
  }

  return updated;
}

function addEnvVars(
  envContent: string,
  toolName: string,
  envVars: string[]
): string {
  let result = envContent;
  const newVars: string[] = [];

  for (const varName of envVars) {
    if (!result.includes(`${varName}=`)) {
      newVars.push(`${varName}=your_${varName.toLowerCase()}_here`);
    }
  }

  if (newVars.length > 0) {
    result += `\n# Added by stack-extend: ${toolName}\n`;
    result += newVars.join("\n") + "\n";
  }

  return result;
}

// --- Tests ---

describe("stack-extend: catalog lookup", () => {
  it("finds a tool that exists in the catalog", () => {
    const result = lookupCatalog(TOOL_CATALOG, "posthog");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("analytics");
    expect(result!.config.package).toBe("posthog-js");
    expect(result!.config.env_vars).toContain("NEXT_PUBLIC_POSTHOG_KEY");
  });

  it("finds stripe in the payments category", () => {
    const result = lookupCatalog(TOOL_CATALOG, "stripe");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("payments");
    expect(result!.config.package).toBe("stripe");
    expect(result!.config.env_vars).toHaveLength(3);
  });

  it("finds clerk in the auth category", () => {
    const result = lookupCatalog(TOOL_CATALOG, "clerk");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("auth");
    expect(result!.config.package).toBe("@clerk/nextjs");
  });

  it("returns null for an unknown tool", () => {
    const result = lookupCatalog(TOOL_CATALOG, "unknown-tool-xyz");
    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = lookupCatalog(TOOL_CATALOG, "");
    expect(result).toBeNull();
  });

  it("returns correct env_vars for resend", () => {
    const result = lookupCatalog(TOOL_CATALOG, "resend");
    expect(result).not.toBeNull();
    expect(result!.config.env_vars).toEqual(["RESEND_API_KEY"]);
  });

  it("returns docs URL for each catalog tool", () => {
    for (const [_cat, tools] of Object.entries(TOOL_CATALOG)) {
      for (const [_name, config] of Object.entries(tools)) {
        expect(config.docs).toBeDefined();
        expect(config.docs).toMatch(/^https?:\/\//);
      }
    }
  });
});

describe("stack-extend: stacks.yml detection", () => {
  it("detects stripe is already in the stack", () => {
    expect(isToolInStack(BASE_STACKS, "stripe")).toBe(true);
  });

  it("detects convex is already in the stack", () => {
    expect(isToolInStack(BASE_STACKS, "convex")).toBe(true);
  });

  it("detects posthog is NOT in the stack", () => {
    expect(isToolInStack(BASE_STACKS, "posthog")).toBe(false);
  });

  it("detects clerk is NOT in the stack (auth is null)", () => {
    expect(isToolInStack(BASE_STACKS, "clerk")).toBe(false);
  });
});

describe("stack-extend: stacks.yml modification", () => {
  it("adds posthog under website.analytics", () => {
    const updated = addToolToStack(BASE_STACKS, "posthog", "analytics");
    expect(updated.website.analytics).toBe("posthog");
  });

  it("adds clerk under backend.authentication", () => {
    const updated = addToolToStack(BASE_STACKS, "clerk", "auth");
    expect(updated.backend.authentication).toBe("clerk");
  });

  it("adds sentry under quality.error_tracking", () => {
    const updated = addToolToStack(BASE_STACKS, "sentry", "error-tracking");
    expect(updated.quality.error_tracking).toBe("sentry");
  });

  it("adds resend under backend.email", () => {
    const updated = addToolToStack(BASE_STACKS, "resend", "email");
    expect(updated.backend.email).toBe("resend");
  });

  it("does not overwrite existing keys in other categories", () => {
    const updated = addToolToStack(BASE_STACKS, "posthog", "analytics");
    expect(updated.backend.payments).toBe("stripe");
    expect(updated.backend.database).toBe("convex");
    expect(updated.website.framework).toBe("nextjs");
  });

  it("creates parent key if missing", () => {
    const minimal = { website: { framework: "nextjs" } };
    const updated = addToolToStack(minimal, "resend", "email");
    expect(updated.backend).toBeDefined();
    expect(updated.backend.email).toBe("resend");
  });

  it("preserves the full stacks structure after modification", () => {
    const updated = addToolToStack(BASE_STACKS, "posthog", "analytics");
    expect(updated.deployment.frontend).toBe("vercel");
    expect(updated.quality.testing.unit).toBe("vitest");
  });
});

describe("stack-extend: .env modification", () => {
  it("adds missing env vars with placeholders", () => {
    const result = addEnvVars(BASE_ENV, "posthog", [
      "NEXT_PUBLIC_POSTHOG_KEY",
      "NEXT_PUBLIC_POSTHOG_HOST",
    ]);
    expect(result).toContain("NEXT_PUBLIC_POSTHOG_KEY=");
    expect(result).toContain("NEXT_PUBLIC_POSTHOG_HOST=");
    expect(result).toContain("# Added by stack-extend: posthog");
  });

  it("does not duplicate existing env vars", () => {
    const envWithExisting = BASE_ENV + "NEXT_PUBLIC_POSTHOG_KEY=pk_live_abc\n";
    const result = addEnvVars(envWithExisting, "posthog", [
      "NEXT_PUBLIC_POSTHOG_KEY",
      "NEXT_PUBLIC_POSTHOG_HOST",
    ]);
    // Should only add the missing one
    const keyCount = (
      result.match(/NEXT_PUBLIC_POSTHOG_KEY=/g) || []
    ).length;
    expect(keyCount).toBe(1); // the existing one, not duplicated
    expect(result).toContain("NEXT_PUBLIC_POSTHOG_HOST=");
  });

  it("preserves original env content", () => {
    const result = addEnvVars(BASE_ENV, "stripe", [
      "STRIPE_SECRET_KEY",
    ]);
    expect(result).toContain("GITHUB_WEBHOOK_SECRET=ghp_test123");
    expect(result).toContain("CONVEX_URL=https://test.convex.cloud");
  });

  it("handles empty env_vars array (no changes)", () => {
    const result = addEnvVars(BASE_ENV, "custom-tool", []);
    expect(result).toBe(BASE_ENV);
  });

  it("adds tool name comment for traceability", () => {
    const result = addEnvVars(BASE_ENV, "sentry", [
      "SENTRY_DSN",
      "SENTRY_AUTH_TOKEN",
    ]);
    expect(result).toContain("# Added by stack-extend: sentry");
  });
});
