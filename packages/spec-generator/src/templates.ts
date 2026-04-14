/**
 * Spec templates for different startup types.
 * Each template provides a system prompt tailored to the business model,
 * plus default page inventories and common data models.
 */

export type StartupType = "b2c" | "devtool" | "b2b-saas" | "marketplace";

export interface SpecTemplate {
  type: StartupType;
  label: string;
  systemPrompt: string;
  defaultPages: string[];
  commonModels: string[];
  commonFlows: string[];
}

const B2C_TEMPLATE: SpecTemplate = {
  type: "b2c",
  label: "B2C Consumer App",
  systemPrompt: `You are a product architect specializing in consumer-facing applications.
Focus on:
- Frictionless onboarding (minimize steps to value)
- Viral loops and sharing mechanics
- Mobile-first responsive design
- Engagement hooks (notifications, streaks, social proof)
- Simple, intuitive navigation with minimal cognitive load
- Free tier with clear upgrade path`,
  defaultPages: [
    "Landing Page",
    "Sign Up / Login",
    "Onboarding Flow",
    "Dashboard / Home",
    "Profile / Settings",
    "Pricing",
    "Invite / Share",
  ],
  commonModels: ["User", "Session", "Subscription", "Notification", "Invite"],
  commonFlows: [
    "Sign up with email or OAuth",
    "Complete onboarding questionnaire",
    "Perform core action for first time",
    "Invite a friend",
    "Upgrade to paid plan",
  ],
};

const DEVTOOL_TEMPLATE: SpecTemplate = {
  type: "devtool",
  label: "Developer Tool",
  systemPrompt: `You are a product architect specializing in developer tools and infrastructure.
Focus on:
- CLI-first or API-first design with a web dashboard
- Excellent documentation and code examples
- Quick start (under 5 minutes to first successful use)
- Clear API reference with request/response schemas
- Usage-based pricing with generous free tier
- SDK / integration patterns for popular languages
- Webhook support for event-driven workflows`,
  defaultPages: [
    "Landing Page",
    "Documentation",
    "Dashboard",
    "API Keys / Settings",
    "Usage & Billing",
    "Quickstart Guide",
    "Changelog",
  ],
  commonModels: [
    "User",
    "Organization",
    "ApiKey",
    "Project",
    "UsageRecord",
    "WebhookEndpoint",
  ],
  commonFlows: [
    "Sign up and create first API key",
    "Send first API request via quickstart",
    "Configure webhook endpoint",
    "View usage dashboard",
    "Upgrade plan when hitting limits",
  ],
};

const B2B_SAAS_TEMPLATE: SpecTemplate = {
  type: "b2b-saas",
  label: "B2B SaaS",
  systemPrompt: `You are a product architect specializing in B2B SaaS platforms.
Focus on:
- Multi-tenant architecture with workspace isolation
- Role-based access control (admin, member, viewer)
- Team collaboration features
- Admin dashboard with audit logs
- SSO / SAML integration support
- Data export and API access
- Seat-based or usage-based pricing`,
  defaultPages: [
    "Landing Page",
    "Sign Up / Login",
    "Workspace Setup",
    "Dashboard",
    "Team Management",
    "Settings / Billing",
    "Admin Panel",
    "Integrations",
  ],
  commonModels: [
    "User",
    "Workspace",
    "Member",
    "Role",
    "AuditLog",
    "Subscription",
    "Integration",
  ],
  commonFlows: [
    "Sign up and create workspace",
    "Invite team members",
    "Configure roles and permissions",
    "Perform core workflow",
    "Review audit log",
    "Upgrade subscription",
  ],
};

const MARKETPLACE_TEMPLATE: SpecTemplate = {
  type: "marketplace",
  label: "Marketplace",
  systemPrompt: `You are a product architect specializing in two-sided marketplaces.
Focus on:
- Separate experiences for buyers and sellers (or supply and demand)
- Trust and safety (reviews, verification, dispute resolution)
- Search and discovery with filters and recommendations
- Transaction flow with escrow or payment processing
- Onboarding for both sides of the marketplace
- Network effects and liquidity strategies
- Commission / fee structure`,
  defaultPages: [
    "Landing Page",
    "Sign Up / Login (Buyer)",
    "Sign Up / Login (Seller)",
    "Search / Browse",
    "Listing Detail",
    "Create Listing",
    "Checkout / Booking",
    "Buyer Dashboard",
    "Seller Dashboard",
    "Reviews",
    "Dispute Resolution",
  ],
  commonModels: [
    "User",
    "BuyerProfile",
    "SellerProfile",
    "Listing",
    "Order",
    "Review",
    "Transaction",
    "Dispute",
  ],
  commonFlows: [
    "Buyer signs up and searches listings",
    "Buyer purchases or books a listing",
    "Seller signs up and creates first listing",
    "Buyer leaves a review",
    "Seller responds to an order",
    "Dispute resolution flow",
  ],
};

export const TEMPLATES: Record<StartupType, SpecTemplate> = {
  b2c: B2C_TEMPLATE,
  devtool: DEVTOOL_TEMPLATE,
  "b2b-saas": B2B_SAAS_TEMPLATE,
  marketplace: MARKETPLACE_TEMPLATE,
};

/**
 * Detect the most likely startup type from the idea description.
 * Uses keyword heuristics; falls back to "b2c" if uncertain.
 */
export function detectStartupType(idea: string): StartupType {
  const lower = idea.toLowerCase();

  const scores: Record<StartupType, number> = {
    b2c: 0,
    devtool: 0,
    "b2b-saas": 0,
    marketplace: 0,
  };

  const devtoolKeywords = [
    "api",
    "sdk",
    "cli",
    "developer",
    "infrastructure",
    "devtool",
    "dev tool",
    "open source",
    "library",
    "framework",
    "plugin",
    "integration",
    "webhook",
  ];
  const b2bKeywords = [
    "b2b",
    "saas",
    "enterprise",
    "team",
    "workspace",
    "collaboration",
    "admin",
    "dashboard",
    "analytics",
    "crm",
    "erp",
    "workflow",
    "automation",
  ];
  const marketplaceKeywords = [
    "marketplace",
    "buyer",
    "seller",
    "listing",
    "two-sided",
    "platform connecting",
    "match",
    "booking",
    "freelancer",
    "vendor",
    "supplier",
  ];
  const b2cKeywords = [
    "consumer",
    "social",
    "app",
    "mobile",
    "personal",
    "fitness",
    "health",
    "entertainment",
    "gaming",
    "dating",
    "food",
    "travel",
  ];

  for (const kw of devtoolKeywords) {
    if (lower.includes(kw)) scores.devtool += 1;
  }
  for (const kw of b2bKeywords) {
    if (lower.includes(kw)) scores["b2b-saas"] += 1;
  }
  for (const kw of marketplaceKeywords) {
    if (lower.includes(kw)) scores.marketplace += 1;
  }
  for (const kw of b2cKeywords) {
    if (lower.includes(kw)) scores.b2c += 1;
  }

  let best: StartupType = "b2c";
  let bestScore = 0;
  for (const [type, score] of Object.entries(scores) as [StartupType, number][]) {
    if (score > bestScore) {
      bestScore = score;
      best = type;
    }
  }

  return best;
}

/**
 * Get the template for a given startup type.
 */
export function getTemplate(type: StartupType): SpecTemplate {
  return TEMPLATES[type];
}
