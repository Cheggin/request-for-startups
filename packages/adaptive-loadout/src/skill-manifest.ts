/**
 * Skill manifest: maps startup type + agent name to the set of skills that agent should load.
 * Skills are referenced by path relative to the skills/ directory.
 */

import type { StartupType } from "./detect-type.js";

export type AgentName =
  | "commander"
  | "website"
  | "backend"
  | "frontend"
  | "growth"
  | "content"
  | "ops"
  | "design"
  | "qa";

interface SkillSet {
  /** Skills every agent of this name loads regardless of startup type */
  universal: string[];
  /** Additional skills loaded only for specific startup types */
  typeSpecific: Partial<Record<StartupType, string[]>>;
}

const AGENT_SKILLS: Record<AgentName, SkillSet> = {
  commander: {
    universal: [
      "skills/project-management/task-decomposition",
      "skills/project-management/dependency-resolution",
      "skills/project-management/status-tracking",
    ],
    typeSpecific: {
      hardware: ["skills/hardware/supply-chain-planning"],
      fintech: ["skills/compliance/regulatory-checklist"],
      healthcare: ["skills/compliance/hipaa-checklist"],
    },
  },
  website: {
    universal: [
      "skills/website/landing-page",
      "skills/website/seo-basics",
      "skills/website/responsive-design",
    ],
    typeSpecific: {
      b2c: [
        "skills/website/social-proof",
        "skills/website/app-store-badges",
        "skills/website/viral-cta",
      ],
      devtool: [
        "skills/website/docs-site",
        "skills/website/code-playground",
        "skills/website/api-reference",
        "skills/website/changelog",
      ],
      "b2b-saas": [
        "skills/website/case-studies",
        "skills/website/enterprise-cta",
        "skills/website/comparison-table",
      ],
      marketplace: [
        "skills/website/two-sided-landing",
        "skills/website/trust-badges",
        "skills/website/category-browse",
      ],
      ecommerce: [
        "skills/website/product-gallery",
        "skills/website/cart-widget",
        "skills/website/shipping-calculator",
      ],
      fintech: [
        "skills/website/security-badges",
        "skills/website/compliance-footer",
      ],
      healthcare: [
        "skills/website/hipaa-badge",
        "skills/website/provider-directory",
      ],
      "content-platform": [
        "skills/website/content-preview",
        "skills/website/creator-showcase",
      ],
      hardware: [
        "skills/website/product-specs",
        "skills/website/preorder-cta",
      ],
    },
  },
  backend: {
    universal: [
      "skills/backend/schema-design",
      "skills/backend/api-routes",
      "skills/backend/auth-setup",
      "skills/backend/error-handling",
    ],
    typeSpecific: {
      devtool: [
        "skills/backend/api-key-management",
        "skills/backend/webhook-system",
        "skills/backend/rate-limiting",
        "skills/backend/usage-tracking",
      ],
      "b2b-saas": [
        "skills/backend/multi-tenancy",
        "skills/backend/rbac",
        "skills/backend/audit-log",
        "skills/backend/sso-integration",
      ],
      marketplace: [
        "skills/backend/escrow-payments",
        "skills/backend/matching-algorithm",
        "skills/backend/review-system",
      ],
      fintech: [
        "skills/backend/transaction-ledger",
        "skills/backend/kyc-verification",
        "skills/backend/encryption-at-rest",
      ],
      healthcare: [
        "skills/backend/hipaa-data-handling",
        "skills/backend/audit-trail",
        "skills/backend/consent-management",
      ],
      ecommerce: [
        "skills/backend/inventory-management",
        "skills/backend/order-processing",
        "skills/backend/shipping-integration",
      ],
      "content-platform": [
        "skills/backend/content-pipeline",
        "skills/backend/recommendation-engine",
        "skills/backend/subscription-billing",
      ],
    },
  },
  frontend: {
    universal: [
      "skills/frontend/component-library",
      "skills/frontend/form-validation",
      "skills/frontend/loading-states",
    ],
    typeSpecific: {
      b2c: [
        "skills/frontend/onboarding-flow",
        "skills/frontend/social-sharing",
        "skills/frontend/push-notifications",
      ],
      devtool: [
        "skills/frontend/code-editor",
        "skills/frontend/syntax-highlighting",
        "skills/frontend/terminal-emulator",
      ],
      "b2b-saas": [
        "skills/frontend/data-table",
        "skills/frontend/chart-dashboard",
        "skills/frontend/team-switcher",
      ],
      marketplace: [
        "skills/frontend/search-filters",
        "skills/frontend/listing-card",
        "skills/frontend/review-form",
      ],
      ecommerce: [
        "skills/frontend/product-card",
        "skills/frontend/cart-drawer",
        "skills/frontend/checkout-flow",
      ],
      healthcare: [
        "skills/frontend/appointment-picker",
        "skills/frontend/patient-form",
      ],
    },
  },
  growth: {
    universal: [
      "skills/growth/analytics-setup",
      "skills/growth/conversion-tracking",
    ],
    typeSpecific: {
      b2c: [
        "skills/growth/viral-loops",
        "skills/growth/referral-program",
        "skills/growth/social-media-strategy",
        "skills/growth/app-store-optimization",
      ],
      devtool: [
        "skills/growth/developer-advocacy",
        "skills/growth/github-community",
        "skills/growth/technical-blog",
        "skills/growth/hackathon-sponsorship",
      ],
      "b2b-saas": [
        "skills/growth/sales-enablement",
        "skills/growth/case-study-generation",
        "skills/growth/linkedin-strategy",
        "skills/growth/webinar-funnel",
      ],
      marketplace: [
        "skills/growth/supply-side-acquisition",
        "skills/growth/demand-side-acquisition",
        "skills/growth/liquidity-metrics",
      ],
      fintech: [
        "skills/growth/trust-building",
        "skills/growth/partnership-banking",
      ],
      ecommerce: [
        "skills/growth/email-marketing",
        "skills/growth/retargeting",
        "skills/growth/influencer-partnerships",
      ],
      "content-platform": [
        "skills/growth/creator-acquisition",
        "skills/growth/seo-content-strategy",
        "skills/growth/newsletter-growth",
      ],
    },
  },
  content: {
    universal: [
      "skills/content/copywriting",
      "skills/content/brand-voice",
    ],
    typeSpecific: {
      b2c: [
        "skills/content/social-media-posts",
        "skills/content/app-store-listing",
        "skills/content/user-testimonials",
      ],
      devtool: [
        "skills/content/technical-docs",
        "skills/content/api-guides",
        "skills/content/tutorial-creation",
        "skills/content/changelog-writing",
      ],
      "b2b-saas": [
        "skills/content/whitepapers",
        "skills/content/roi-calculator-copy",
        "skills/content/email-sequences",
      ],
      marketplace: [
        "skills/content/seller-guides",
        "skills/content/buyer-guides",
        "skills/content/trust-safety-docs",
      ],
      healthcare: [
        "skills/content/patient-education",
        "skills/content/compliance-docs",
      ],
      fintech: [
        "skills/content/financial-education",
        "skills/content/security-docs",
      ],
    },
  },
  ops: {
    universal: [
      "skills/ops/ci-cd-setup",
      "skills/ops/monitoring",
      "skills/ops/logging",
      "skills/ops/backup-strategy",
    ],
    typeSpecific: {
      fintech: ["skills/ops/pci-compliance", "skills/ops/disaster-recovery"],
      healthcare: ["skills/ops/hipaa-infrastructure", "skills/ops/data-encryption"],
      hardware: ["skills/ops/firmware-ota-updates", "skills/ops/device-fleet-management"],
    },
  },
  design: {
    universal: [
      "skills/design/design-system",
      "skills/design/accessibility",
      "skills/design/responsive-layouts",
    ],
    typeSpecific: {
      b2c: ["skills/design/gamification-patterns", "skills/design/onboarding-ux"],
      devtool: ["skills/design/developer-ux", "skills/design/terminal-ui"],
      "b2b-saas": ["skills/design/enterprise-patterns", "skills/design/data-dense-ui"],
      marketplace: ["skills/design/search-ux", "skills/design/listing-layout"],
      ecommerce: ["skills/design/product-display", "skills/design/checkout-ux"],
    },
  },
  qa: {
    universal: [
      "skills/qa/unit-testing",
      "skills/qa/e2e-testing",
      "skills/qa/accessibility-audit",
    ],
    typeSpecific: {
      fintech: ["skills/qa/security-testing", "skills/qa/compliance-validation"],
      healthcare: ["skills/qa/hipaa-audit", "skills/qa/data-privacy-testing"],
      marketplace: ["skills/qa/two-sided-flow-testing"],
      ecommerce: ["skills/qa/checkout-flow-testing", "skills/qa/inventory-edge-cases"],
    },
  },
};

/**
 * Get the list of skill paths to load for a given agent and startup type.
 * Returns universal skills for the agent plus any type-specific skills.
 */
export function getSkillsForType(
  startupType: StartupType,
  agentName: AgentName
): string[] {
  const skillSet = AGENT_SKILLS[agentName];
  if (!skillSet) {
    return [];
  }

  const universal = [...skillSet.universal];
  const specific = skillSet.typeSpecific[startupType] ?? [];

  return [...universal, ...specific];
}

/**
 * Get all registered agent names.
 */
export function getAgentNames(): AgentName[] {
  return Object.keys(AGENT_SKILLS) as AgentName[];
}

/**
 * Get the full skill manifest for all agents given a startup type.
 */
export function getFullManifest(
  startupType: StartupType
): Record<AgentName, string[]> {
  const manifest = {} as Record<AgentName, string[]>;
  for (const agent of getAgentNames()) {
    manifest[agent] = getSkillsForType(startupType, agent);
  }
  return manifest;
}
