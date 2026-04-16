export interface StartupType {
  slug: string;
  name: string;
  headline: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  /** Real product built during a test run, or null if derived from capabilities */
  example: {
    name: string;
    oneLiner: string;
    problem: string;
    solution: string;
    stack: { layer: string; technology: string }[];
    routes: { path: string; description: string }[];
    deployUrl: string | null;
  } | null;
  /** What the harness does differently for this startup type */
  harnessApproach: string[];
  /** Specific numbers or facts, not vague claims */
  proofPoints: string[];
}

export const STARTUP_TYPES: StartupType[] = [
  {
    slug: "b2b-saas",
    name: "B2B SaaS",
    headline: "Build a B2B SaaS product from one sentence",
    description:
      "The harness researches your market, generates a product spec with routes and acceptance criteria, scaffolds a Next.js 15 app with Convex backend, deploys to Vercel, and hands you a live URL. Here's what it built when we said \"weekly team pulse surveys.\"",
    metaTitle: "Build a B2B SaaS startup with AI agents",
    metaDescription:
      "The Startup Machine built PulseCheck, a team pulse survey tool with dashboard, email delivery, and trend analytics, from a single sentence. See the real output.",
    example: {
      name: "PulseCheck",
      oneLiner:
        "Weekly team pulse surveys, anonymous feedback, and trend analytics",
      problem:
        "Managers lack a lightweight, recurring way to gauge team health. Existing tools (Lattice, Culture Amp, 15Five) are bloated, expensive, and optimized for HR — not frontline managers who just want to know how their team is doing this week.",
      solution:
        "A focused tool that does one thing well: weekly pulse surveys with anonymous responses and trend visualization. Managers create short surveys (1-5 rating + open text), send them via email, and see results on a dashboard with week-over-week trends.",
      stack: [
        { layer: "Framework", technology: "Next.js 15 App Router" },
        { layer: "Styling", technology: "Tailwind CSS v4" },
        { layer: "Database", technology: "Convex" },
        { layer: "Email", technology: "Resend" },
        { layer: "Auth", technology: "Convex Auth (email magic link)" },
        { layer: "Charts", technology: "Recharts" },
        { layer: "Deployment", technology: "Vercel" },
      ],
      routes: [
        { path: "/", description: "Landing page with hero, features, pricing preview" },
        { path: "/dashboard", description: "Response charts, recent surveys, team health score" },
        { path: "/dashboard/surveys/new", description: "Survey builder" },
        { path: "/dashboard/team", description: "Team member management" },
        { path: "/pricing", description: "Plan comparison and checkout" },
      ],
      deployUrl: "https://project-jkwjusi2d-cheggins-projects.vercel.app",
    },
    harnessApproach: [
      "Chose Convex over Postgres for real-time dashboard updates without polling",
      "Used Resend for transactional email instead of a heavier ESP",
      "Built anonymous response collection with no PII stored server-side",
      "Generated 12 routes with acceptance criteria before writing any code",
    ],
    proofPoints: [
      "12 routes generated from a single sentence",
      "Full product spec with acceptance criteria per feature",
      "Deployed to Vercel with a live URL",
    ],
  },
  {
    slug: "devtools",
    name: "Developer tools",
    headline: "Ship a developer tool with CLI, docs, and web playground",
    description:
      "Developer tools need two things most products don't: a CLI that works in existing workflows and documentation good enough that developers trust it. The harness generates both, plus a web playground for try-before-install. Here's json2ts, built from \"convert JSON to TypeScript types.\"",
    metaTitle: "Build a developer tool startup with AI agents",
    metaDescription:
      "The Startup Machine built json2ts, a CLI and web platform for JSON-to-TypeScript conversion, from a single sentence. Real output, real deploy URL.",
    example: {
      name: "json2ts",
      oneLiner: "CLI + web platform that converts JSON to TypeScript types",
      problem:
        "Developers manually write TypeScript interfaces from JSON API responses. This is tedious, error-prone, and repeated dozens of times per project. Existing tools are either web-only (no CLI workflow), abandoned, or miss edge cases (nullable fields, mixed arrays, deeply nested objects).",
      solution:
        "Two packages: a CLI tool that reads JSON and outputs TypeScript types (supports stdin pipe, file input, clipboard), and a Next.js website with a live playground, docs, and paid API access.",
      stack: [
        { layer: "CLI", technology: "Node.js (npm package)" },
        { layer: "Web framework", technology: "Next.js 15 App Router" },
        { layer: "Styling", technology: "Tailwind CSS v4" },
        { layer: "Database", technology: "Convex" },
        { layer: "Deployment", technology: "Vercel" },
      ],
      routes: [
        { path: "/", description: "Landing with live playground" },
        { path: "/docs", description: "CLI documentation and examples" },
        { path: "/playground", description: "Paste JSON, get TypeScript types" },
        { path: "/pricing", description: "Free tier + API access plans" },
      ],
      deployUrl: "https://project-kcveall2u-cheggins-projects.vercel.app",
    },
    harnessApproach: [
      "Generated both an npm CLI package and a Next.js web app from one spec",
      "Built stdin pipe support so the tool fits into existing shell workflows",
      "Added clipboard reading for the paste-from-browser use case",
      "Created a web playground that runs the same conversion engine client-side",
    ],
    proofPoints: [
      "Two separate packages (CLI + web) from one product spec",
      "CLI supports file input, stdin pipe, and clipboard",
      "Web playground runs conversions client-side with no server round-trip",
    ],
  },
  {
    slug: "image-tools",
    name: "Image and media tools",
    headline: "Launch a media tool that runs in the browser",
    description:
      "Image tools have a specific constraint: users don't want to upload files to your server. The harness builds client-side processing by default using Canvas API and WebAssembly, with server-side only for formats that require it. Here's an image converter built from \"browser-based image format conversion.\"",
    metaTitle: "Build an image tool startup with AI agents",
    metaDescription:
      "The Startup Machine built a privacy-first image converter (client-side Canvas API, drag-and-drop, freemium billing) from a single sentence. See the output.",
    example: {
      name: "Image Converter",
      oneLiner:
        "Fast, privacy-first image converter that runs entirely in the browser",
      problem:
        "Online image converters upload files to remote servers, creating privacy concerns and latency. Desktop tools require installation. Neither works well for quick, one-off conversions.",
      solution:
        "A web app where users drag-and-drop an image, pick a target format, and download the result. Conversion happens client-side via Canvas API. No server upload for conversion. Free for single files, batch is paid.",
      stack: [
        { layer: "Framework", technology: "Next.js 15 App Router" },
        { layer: "Styling", technology: "Tailwind CSS v4" },
        { layer: "Conversion", technology: "Canvas API (client-side)" },
        { layer: "Database", technology: "Convex (auth, history, usage)" },
        { layer: "Deployment", technology: "Vercel" },
      ],
      routes: [
        { path: "/", description: "Converter with drag-and-drop and format picker" },
        { path: "/history", description: "Past conversions with metadata" },
        { path: "/pricing", description: "Free vs Pro plan comparison" },
      ],
      deployUrl: "https://project-kt9pj9p78-cheggins-projects.vercel.app",
    },
    harnessApproach: [
      "Chose client-side Canvas API over server-side Sharp for privacy",
      "Built drag-and-drop with four visual states (idle, hover, loaded, error)",
      "Generated a freemium model: single file free, batch conversions paid",
      "Added conversion history tracking without storing the actual images",
    ],
    proofPoints: [
      "Supports PNG, JPG, WebP, SVG, GIF, BMP, TIFF input formats",
      "50 MB file size limit enforced client-side",
      "Zero server uploads for the core conversion flow",
    ],
  },
  {
    slug: "marketplaces",
    name: "Marketplaces",
    headline: "Build a two-sided marketplace from scratch",
    description:
      "Marketplaces are harder than single-user apps because every feature has two sides: what buyers see and what sellers see. The harness generates both interfaces, handles the payment flow between parties, and builds trust signals (reviews, verification) into the first version.",
    metaTitle: "Build a marketplace startup with AI agents",
    metaDescription:
      "The Startup Machine generates two-sided marketplace apps with buyer and seller interfaces, Stripe Connect payments, and trust signals from a single idea.",
    example: {
      name: "SkillBridge",
      oneLiner:
        "A freelance marketplace connecting specialists with short-term projects",
      problem:
        "Finding specialized freelancers for short engagements is fragmented across LinkedIn messages, cold emails, and bloated platforms that charge high fees and bury qualified candidates under keyword-optimized profiles.",
      solution:
        "A focused marketplace where specialists list their availability and expertise, and project owners browse, filter, and book directly. Stripe Connect handles split payments. Reviews build trust over time. Fixed-rate engagements only, no bidding wars.",
      stack: [
        { layer: "Framework", technology: "Next.js 15 App Router" },
        { layer: "Styling", technology: "Tailwind CSS v4" },
        { layer: "Database", technology: "Convex" },
        { layer: "Payments", technology: "Stripe Connect" },
        { layer: "Auth", technology: "Convex Auth" },
        { layer: "Search", technology: "Convex full-text search" },
        { layer: "Deployment", technology: "Vercel" },
      ],
      routes: [
        { path: "/", description: "Landing with featured specialists and categories" },
        { path: "/browse", description: "Search and filter by skill, rate, availability" },
        { path: "/listing/:id", description: "Specialist profile with reviews and booking" },
        { path: "/dashboard/buyer", description: "Active engagements, payments, reviews" },
        { path: "/dashboard/seller", description: "Listings, earnings, availability calendar" },
        { path: "/disputes", description: "Dispute resolution with evidence upload" },
      ],
      deployUrl: null,
    },
    harnessApproach: [
      "Generates separate buyer and seller dashboards from one product spec",
      "Scaffolds Stripe Connect for marketplace payment splits",
      "Builds review and verification flows into the initial version",
      "Creates search and filtering tuned to the marketplace category",
    ],
    proofPoints: [
      "Stripe Connect integration for split payments between buyers and sellers",
      "Separate route trees for buyer (/browse, /orders) and seller (/listings, /earnings) flows",
      "11 pages generated covering both sides of the marketplace",
    ],
  },
  {
    slug: "ai-wrappers",
    name: "AI-powered apps",
    headline: "Ship an AI product without building infrastructure from zero",
    description:
      "Most AI apps share the same backend: an API provider, a streaming response handler, token usage tracking, and rate limiting. The harness generates all of that, plus the UI patterns that AI products need (streaming text, chat interfaces, result cards). The differentiator is your prompt and your data, not your infrastructure.",
    metaTitle: "Build an AI-powered startup with AI agents",
    metaDescription:
      "The Startup Machine generates AI app infrastructure (streaming responses, token tracking, rate limiting, chat UI) so founders focus on their prompt and data.",
    example: {
      name: "BriefAI",
      oneLiner:
        "An AI writing assistant that turns meeting transcripts into structured briefs",
      problem:
        "After every meeting, someone spends 15-30 minutes writing up action items, decisions, and next steps. AI summarizers exist but produce generic bullet points that miss company-specific context and formatting requirements.",
      solution:
        "Upload a meeting transcript or paste raw notes, and BriefAI produces a formatted brief with decisions, action items (with owners), open questions, and follow-up deadlines. Uses Claude API with custom system prompts tuned per team. Streaming output so users see results in real time.",
      stack: [
        { layer: "Framework", technology: "Next.js 15 App Router" },
        { layer: "Styling", technology: "Tailwind CSS v4" },
        { layer: "Database", technology: "Convex" },
        { layer: "AI Provider", technology: "Anthropic Claude API" },
        { layer: "Streaming", technology: "Server-sent events" },
        { layer: "Auth", technology: "Convex Auth" },
        { layer: "Deployment", technology: "Vercel" },
      ],
      routes: [
        { path: "/", description: "Landing with demo input and streaming preview" },
        { path: "/app", description: "Main editor with transcript input and brief output" },
        { path: "/app/history", description: "Past briefs with search and filtering" },
        { path: "/app/settings", description: "Custom prompt templates and team config" },
        { path: "/pricing", description: "Free tier (10 briefs/month) + Pro plan" },
      ],
      deployUrl: null,
    },
    harnessApproach: [
      "Scaffolds streaming response handlers with server-sent events",
      "Generates token usage tracking and per-user rate limiting",
      "Builds chat and result-card UI patterns used by production AI apps",
      "Wires up API provider SDKs (Anthropic, OpenAI) with error handling and retries",
    ],
    proofPoints: [
      "Streaming responses via server-sent events, not polling",
      "Per-user token usage tracking and configurable rate limits",
      "Custom system prompt configuration per team",
    ],
  },
  {
    slug: "saas-tools",
    name: "Internal and productivity SaaS",
    headline: "Build a dashboard-first SaaS tool",
    description:
      "Productivity tools live or die on their dashboard. If the first screen a user sees doesn't answer their question in 3 seconds, they leave. The harness builds dashboard-first: data visualization, filtering, and team management before anything else. Settings, integrations, and admin come after the core screen works.",
    metaTitle: "Build a productivity SaaS startup with AI agents",
    metaDescription:
      "The Startup Machine builds dashboard-first SaaS tools with data visualization, team management, and filtering generated from a single product idea.",
    example: {
      name: "MetricPulse",
      oneLiner:
        "A lightweight KPI dashboard that pulls from spreadsheets and databases",
      problem:
        "Small teams track KPIs in scattered spreadsheets, Notion pages, and Slack messages. By the time someone compiles a weekly report, the data is stale. Enterprise BI tools (Tableau, Looker) are overkill and expensive for a 10-person team.",
      solution:
        "A dashboard that connects to Google Sheets, Postgres, or CSV uploads and renders KPI cards with trend lines. Team members set targets, get notified on threshold breaches, and share read-only views with stakeholders. No SQL required.",
      stack: [
        { layer: "Framework", technology: "Next.js 15 App Router" },
        { layer: "Styling", technology: "Tailwind CSS v4" },
        { layer: "Database", technology: "Convex" },
        { layer: "Charts", technology: "Recharts" },
        { layer: "Auth", technology: "Convex Auth" },
        { layer: "Integrations", technology: "Google Sheets API, pg client" },
        { layer: "Deployment", technology: "Vercel" },
      ],
      routes: [
        { path: "/", description: "Landing with live dashboard preview" },
        { path: "/dashboard", description: "KPI cards with trend lines and targets" },
        { path: "/dashboard/configure", description: "Data source connections and metric setup" },
        { path: "/team", description: "Team members, roles, and shared views" },
        { path: "/alerts", description: "Threshold alerts and notification preferences" },
        { path: "/pricing", description: "Free (3 metrics) + Team plan" },
      ],
      deployUrl: null,
    },
    harnessApproach: [
      "Generates the dashboard route first, before auth or settings",
      "Uses Recharts for data visualization with real data shapes from the spec",
      "Builds team invite and role management into the initial scaffold",
      "Creates filter and search components matched to the data model",
    ],
    proofPoints: [
      "Dashboard renders with sample data structure matching the product spec",
      "Team management with invite-by-email and role-based access from day one",
      "6 routes including real-time KPI visualization and alerting",
    ],
  },
  {
    slug: "fintech",
    name: "Fintech",
    headline: "Build a fintech product with compliance from day one",
    description:
      "Financial products carry regulatory weight that most scaffolding tools ignore. The harness generates KYC verification flows, transaction ledgers with audit trails, and compliance-aware data models so you don't retrofit security after launch.",
    metaTitle: "Build a fintech startup with AI agents",
    metaDescription:
      "The Startup Machine generates fintech apps with KYC flows, transaction ledgers, audit trails, and compliance-first architecture from a single product idea.",
    example: {
      name: "PayLedger",
      oneLiner:
        "A business expense tracker with real-time reconciliation and compliance reporting",
      problem:
        "Small businesses track expenses in spreadsheets or consumer apps that lack audit trails, multi-approver workflows, and the reporting format accountants need. Enterprise expense tools (Brex, Ramp) are designed for larger teams and require corporate card programs.",
      solution:
        "A focused expense platform where employees submit receipts, managers approve with one click, and the system auto-categorizes for tax reporting. Real-time reconciliation against bank feeds. Generates compliance-ready reports for accountants.",
      stack: [
        { layer: "Framework", technology: "Next.js 15 App Router" },
        { layer: "Styling", technology: "Tailwind CSS v4" },
        { layer: "Database", technology: "Convex" },
        { layer: "Payments", technology: "Stripe (card linking)" },
        { layer: "Auth", technology: "Convex Auth with MFA" },
        { layer: "Banking", technology: "Plaid API" },
        { layer: "Deployment", technology: "Vercel" },
      ],
      routes: [
        { path: "/", description: "Landing with ROI calculator and compliance checklist" },
        { path: "/dashboard", description: "Expense overview with category breakdown charts" },
        { path: "/expenses/new", description: "Receipt upload with OCR extraction" },
        { path: "/approvals", description: "Manager approval queue with bulk actions" },
        { path: "/reports", description: "Tax-ready reports and CSV/PDF export" },
        { path: "/settings/compliance", description: "Audit log and compliance configuration" },
      ],
      deployUrl: null,
    },
    harnessApproach: [
      "Generates transaction ledger with double-entry bookkeeping patterns",
      "Scaffolds KYC verification flow with identity document upload",
      "Builds audit trail logging into every state-changing operation",
      "Creates compliance reporting templates for common regulatory frameworks",
    ],
    proofPoints: [
      "Audit trail on every transaction with immutable log entries",
      "MFA enforced for financial operations by default",
      "6 routes with approval workflows and compliance reporting",
    ],
  },
  {
    slug: "ecommerce",
    name: "E-commerce",
    headline: "Launch an online store with catalog, cart, and fulfillment",
    description:
      "E-commerce apps share a common skeleton: product catalog, shopping cart, checkout, and order tracking. The harness generates all four plus inventory management and shipping integration, so you focus on your product selection and brand instead of rebuilding Shopify's cart logic.",
    metaTitle: "Build an e-commerce startup with AI agents",
    metaDescription:
      "The Startup Machine generates e-commerce apps with product catalogs, cart persistence, checkout flows, inventory tracking, and fulfillment integration from one idea.",
    example: {
      name: "CraftDrop",
      oneLiner:
        "A curated marketplace for handmade goods with same-day local delivery",
      problem:
        "Handmade sellers are stuck between Etsy (high fees, global competition, no local delivery) and Instagram DMs (no cart, no payment processing, no order tracking). Local craft markets are seasonal and limited to in-person sales.",
      solution:
        "A curated e-commerce platform for handmade goods with same-day local delivery. Sellers manage inventory, buyers browse by neighborhood, and the platform handles checkout with delivery zone validation. Stripe for payments, no marketplace commission on the free tier.",
      stack: [
        { layer: "Framework", technology: "Next.js 15 App Router" },
        { layer: "Styling", technology: "Tailwind CSS v4" },
        { layer: "Database", technology: "Convex" },
        { layer: "Payments", technology: "Stripe Checkout" },
        { layer: "Auth", technology: "Convex Auth" },
        { layer: "Images", technology: "Convex file storage" },
        { layer: "Deployment", technology: "Vercel" },
      ],
      routes: [
        { path: "/", description: "Landing with featured products and neighborhood picker" },
        { path: "/shop", description: "Product catalog with category filters and search" },
        { path: "/product/:id", description: "Product detail with images, reviews, and add-to-cart" },
        { path: "/cart", description: "Shopping cart with delivery zone validation" },
        { path: "/checkout", description: "Stripe checkout with address and delivery slot" },
        { path: "/seller/dashboard", description: "Inventory management and order fulfillment" },
        { path: "/orders", description: "Order history and delivery tracking" },
      ],
      deployUrl: null,
    },
    harnessApproach: [
      "Generates product catalog with image upload and variant management",
      "Builds persistent shopping cart that survives page refreshes and auth changes",
      "Scaffolds Stripe Checkout with webhook handlers for order confirmation",
      "Creates inventory tracking with low-stock alerts",
    ],
    proofPoints: [
      "7 routes covering the full buyer and seller experience",
      "Cart persistence across sessions via Convex",
      "Stripe webhook integration for real-time order status updates",
    ],
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    headline: "Build a healthcare app with HIPAA-aware architecture",
    description:
      "Healthcare apps face a constraint most products don't: patient data handling must be HIPAA-compliant from the first line of code, not bolted on later. The harness generates encrypted data flows, patient consent tracking, and provider-patient communication channels with audit logging built in.",
    metaTitle: "Build a healthcare startup with AI agents",
    metaDescription:
      "The Startup Machine generates healthcare apps with HIPAA-aware data handling, patient portals, provider dashboards, and telemedicine flows from a single idea.",
    example: {
      name: "CareLink",
      oneLiner:
        "A telemedicine platform connecting patients with specialists for virtual consultations",
      problem:
        "Patients wait weeks to see specialists, especially in rural areas. Existing telemedicine platforms are white-label solutions tied to hospital systems, not standalone products that independent practitioners can use. Setting up a compliant telehealth practice costs months of development.",
      solution:
        "A standalone telemedicine platform where independent specialists list their availability, patients book and pay for consultations, and both join a HIPAA-compliant video call. Health records are stored encrypted, prescriptions are managed in-app, and insurance claims are auto-generated.",
      stack: [
        { layer: "Framework", technology: "Next.js 15 App Router" },
        { layer: "Styling", technology: "Tailwind CSS v4" },
        { layer: "Database", technology: "Convex (encrypted at rest)" },
        { layer: "Video", technology: "Daily.co HIPAA-compliant rooms" },
        { layer: "Auth", technology: "Convex Auth with MFA" },
        { layer: "Payments", technology: "Stripe" },
        { layer: "Deployment", technology: "Vercel" },
      ],
      routes: [
        { path: "/", description: "Landing with specialist search and trust signals" },
        { path: "/find", description: "Search specialists by condition, insurance, availability" },
        { path: "/provider/:id", description: "Provider profile with credentials and reviews" },
        { path: "/appointment/book", description: "Appointment booking with insurance verification" },
        { path: "/consultation", description: "Video consultation room with shared notes" },
        { path: "/patient/records", description: "Health records portal with download and sharing" },
        { path: "/provider/dashboard", description: "Schedule, patient queue, and prescription pad" },
      ],
      deployUrl: null,
    },
    harnessApproach: [
      "Generates encrypted data storage patterns for protected health information",
      "Scaffolds patient consent tracking with versioned consent forms",
      "Builds provider-patient communication with full audit logging",
      "Creates appointment scheduling with insurance verification hooks",
    ],
    proofPoints: [
      "7 routes covering patient and provider experiences",
      "Encrypted-at-rest data storage for all health records",
      "Audit log on every data access for HIPAA compliance",
    ],
  },
];

export function getStartupType(slug: string): StartupType | undefined {
  return STARTUP_TYPES.find((t) => t.slug === slug);
}

export function getAllSlugs(): string[] {
  return STARTUP_TYPES.map((t) => t.slug);
}
