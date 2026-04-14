/**
 * Classifies a startup idea into a startup type based on keyword analysis.
 * Analyzes both the idea description and optional product spec for signals.
 */

export type StartupType =
  | "b2c"
  | "devtool"
  | "b2b-saas"
  | "marketplace"
  | "hardware"
  | "fintech"
  | "healthcare"
  | "ecommerce"
  | "content-platform";

const KEYWORD_MAP: Record<StartupType, string[]> = {
  b2c: [
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
    "photo",
    "video",
    "music",
    "lifestyle",
    "habit",
    "tracker",
    "wellness",
    "meditation",
  ],
  devtool: [
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
    "debugging",
    "monitoring",
    "deployment",
    "ci/cd",
    "testing framework",
    "linter",
    "package manager",
  ],
  "b2b-saas": [
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
    "productivity",
    "project management",
    "hr platform",
    "recruiting",
    "invoicing",
  ],
  marketplace: [
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
    "auction",
    "rental",
    "gig economy",
    "peer-to-peer",
  ],
  hardware: [
    "hardware",
    "device",
    "iot",
    "sensor",
    "wearable",
    "robot",
    "drone",
    "embedded",
    "firmware",
    "3d print",
    "manufacturing",
    "chip",
    "circuit",
    "arduino",
    "raspberry pi",
    "bluetooth",
    "rfid",
  ],
  fintech: [
    "fintech",
    "payment",
    "banking",
    "lending",
    "insurance",
    "trading",
    "crypto",
    "blockchain",
    "wallet",
    "transaction",
    "financial",
    "investment",
    "stock",
    "defi",
    "neobank",
    "credit",
    "remittance",
    "accounting",
  ],
  healthcare: [
    "healthcare",
    "medical",
    "patient",
    "doctor",
    "clinic",
    "hospital",
    "diagnosis",
    "telemedicine",
    "ehr",
    "hipaa",
    "pharma",
    "clinical trial",
    "mental health",
    "therapy",
    "prescription",
    "lab results",
    "health record",
  ],
  ecommerce: [
    "ecommerce",
    "e-commerce",
    "shop",
    "store",
    "cart",
    "checkout",
    "product catalog",
    "inventory",
    "shipping",
    "fulfillment",
    "dropshipping",
    "retail",
    "order management",
    "sku",
    "wholesale",
  ],
  "content-platform": [
    "content",
    "publish",
    "subscribe",
    "feed",
    "blog",
    "newsletter",
    "podcast",
    "streaming",
    "cms",
    "editorial",
    "creator",
    "audience",
    "paywall",
    "membership",
    "media platform",
    "articles",
  ],
};

/**
 * Classify a startup idea into one of the recognized startup types.
 * Uses keyword frequency analysis across the idea and optional spec text.
 * Falls back to "b2c" if no clear signal is found.
 */
export function classifyStartupType(
  idea: string,
  spec?: string
): StartupType {
  const text = spec ? `${idea} ${spec}`.toLowerCase() : idea.toLowerCase();

  const scores: Record<StartupType, number> = {
    b2c: 0,
    devtool: 0,
    "b2b-saas": 0,
    marketplace: 0,
    hardware: 0,
    fintech: 0,
    healthcare: 0,
    ecommerce: 0,
    "content-platform": 0,
  };

  for (const [type, keywords] of Object.entries(KEYWORD_MAP) as [StartupType, string[]][]) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        scores[type] += 1;
      }
    }
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
