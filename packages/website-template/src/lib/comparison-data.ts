export interface ComparisonCriterion {
  name: string;
  ourProduct: string;
  competitor: string;
  sourceUrl: string;
  sourceDate: string;
}

export interface ComparisonRoute {
  slug: string;
  competitorName: string;
  competitorUrl: string;
  title: string;
  metaDescription: string;
  headline: string;
  summary: string;
  criteria: ComparisonCriterion[];
  ourStrengths: string[];
  competitorStrengths: string[];
  bestFor: {
    ourProduct: string;
    competitor: string;
  };
  ctaText: string;
  lastUpdated: string;
}

const COMPARISON_ROUTES: ComparisonRoute[] = [
  {
    slug: "startup-harness-vs-create-t3-app",
    competitorName: "create-t3-app",
    competitorUrl: "https://create.t3.gg",
    title: "Startup Harness vs create-t3-app — which scaffolding tool ships faster?",
    metaDescription:
      "Compare Startup Harness and create-t3-app across deployment automation, agent workflows, and stack flexibility. Evidence-sourced, updated April 2026.",
    headline: "Startup Harness vs create-t3-app",
    summary:
      "create-t3-app gives you a typesafe Next.js + tRPC + Prisma scaffold in seconds. Startup Harness starts from the same full-stack foundation but layers on agent-driven workflows, competitor research, SEO setup, and deployment pipelines so you ship a production product — not just a boilerplate.",
    criteria: [
      {
        name: "Initial scaffold",
        ourProduct: "Full-stack Next.js 15 + Convex + TailwindCSS v4 with CI/CD, SEO, and analytics pre-wired",
        competitor: "Next.js + tRPC + Prisma + NextAuth with optional Tailwind",
        sourceUrl: "https://create.t3.gg/en/introduction",
        sourceDate: "2026-03-01",
      },
      {
        name: "Deployment automation",
        ourProduct: "Vercel + Railway deploy pipelines generated automatically with environment variable setup",
        competitor: "No built-in deployment — manual Vercel/Railway/Docker setup required",
        sourceUrl: "https://create.t3.gg/en/deployment/vercel",
        sourceDate: "2026-03-01",
      },
      {
        name: "Agent workflows",
        ourProduct: "Built-in agent fleet with tmux orchestration for parallel skill execution",
        competitor: "No agent support — manual development only",
        sourceUrl: "https://create.t3.gg/en/introduction",
        sourceDate: "2026-03-01",
      },
      {
        name: "SEO and growth tooling",
        ourProduct: "Programmatic SEO, sitemap generation, comparison pages, and analytics integration included",
        competitor: "No SEO tooling — add manually or via community plugins",
        sourceUrl: "https://create.t3.gg/en/introduction",
        sourceDate: "2026-03-01",
      },
      {
        name: "Database",
        ourProduct: "Convex with real-time subscriptions and server functions out of the box",
        competitor: "Prisma ORM with any SQL database — more flexibility, more setup",
        sourceUrl: "https://create.t3.gg/en/usage/prisma",
        sourceDate: "2026-03-01",
      },
    ],
    ourStrengths: [
      "Ships a production product, not just a boilerplate",
      "Agent-driven workflows automate competitor research, SEO, and deployment",
      "Built-in growth tooling from day one",
    ],
    competitorStrengths: [
      "Mature ecosystem with strong community documentation",
      "More database flexibility through Prisma",
      "Lighter footprint if you only need a scaffold",
    ],
    bestFor: {
      ourProduct: "Teams that want to go from idea to deployed product with growth tooling, not just a starting template",
      competitor: "Developers who want a minimal, typesafe scaffold and prefer to assemble their own toolchain",
    },
    ctaText: "Get started with Startup Harness",
    lastUpdated: "2026-04-14",
  },
  {
    slug: "startup-harness-vs-vercel-v0",
    competitorName: "Vercel v0",
    competitorUrl: "https://v0.dev",
    title: "Startup Harness vs Vercel v0 — AI scaffolding compared",
    metaDescription:
      "Compare Startup Harness and Vercel v0 on full-stack generation, deployment, and growth automation. Source-linked evidence, updated April 2026.",
    headline: "Startup Harness vs Vercel v0",
    summary:
      "v0 generates UI components and pages from prompts with excellent design quality. Startup Harness generates entire product stacks — backend, deployment, SEO, growth — using coordinated agent workflows rather than single-shot generation.",
    criteria: [
      {
        name: "Generation scope",
        ourProduct: "Full product stack: frontend, backend, database, CI/CD, SEO, and growth pages",
        competitor: "UI components and page layouts from text or image prompts",
        sourceUrl: "https://v0.dev/docs",
        sourceDate: "2026-03-15",
      },
      {
        name: "Backend generation",
        ourProduct: "Convex schema, server functions, and API routes generated and deployed",
        competitor: "Frontend-only — no backend generation",
        sourceUrl: "https://v0.dev/docs",
        sourceDate: "2026-03-15",
      },
      {
        name: "Design quality",
        ourProduct: "Template-based with TailwindCSS v4 — functional but requires design iteration",
        competitor: "High-quality generative UI with shadcn/ui integration",
        sourceUrl: "https://v0.dev",
        sourceDate: "2026-03-15",
      },
      {
        name: "Post-generation workflow",
        ourProduct: "Continuous agent support for iteration, deployment, monitoring, and growth",
        competitor: "Copy generated code into your project — no ongoing workflow",
        sourceUrl: "https://v0.dev/docs",
        sourceDate: "2026-03-15",
      },
      {
        name: "Growth and SEO",
        ourProduct: "Competitor research, programmatic SEO, comparison pages, and analytics built in",
        competitor: "No growth tooling — purely a UI generation tool",
        sourceUrl: "https://v0.dev/docs",
        sourceDate: "2026-03-15",
      },
    ],
    ourStrengths: [
      "Generates full product stacks, not just UI",
      "Agent workflows provide ongoing development support after initial generation",
      "Built-in growth, SEO, and deployment automation",
    ],
    competitorStrengths: [
      "Superior UI design quality out of the box",
      "Fast single-shot component generation",
      "Deep shadcn/ui and Vercel ecosystem integration",
    ],
    bestFor: {
      ourProduct: "Founders building a complete product who need backend, deployment, and growth tooling alongside frontend",
      competitor: "Designers and developers who need high-quality UI components quickly and will build the rest themselves",
    },
    ctaText: "Get started with Startup Harness",
    lastUpdated: "2026-04-14",
  },
  {
    slug: "startup-harness-vs-wasp",
    competitorName: "Wasp",
    competitorUrl: "https://wasp-lang.dev",
    title: "Startup Harness vs Wasp — full-stack framework comparison",
    metaDescription:
      "Compare Startup Harness and Wasp on full-stack generation, auth, deployment, and developer experience. Evidence-sourced, updated April 2026.",
    headline: "Startup Harness vs Wasp",
    summary:
      "Wasp is a full-stack framework with a declarative DSL that generates React + Node.js apps with auth, jobs, and email built in. Startup Harness takes a different approach: agent-orchestrated workflows that generate and deploy a complete product with growth tooling included.",
    criteria: [
      {
        name: "Architecture approach",
        ourProduct: "Agent-orchestrated code generation with Next.js 15 + Convex",
        competitor: "Declarative DSL (.wasp files) that compiles to React + Node.js + Prisma",
        sourceUrl: "https://wasp-lang.dev/docs",
        sourceDate: "2026-02-20",
      },
      {
        name: "Authentication",
        ourProduct: "Auth setup generated during init — configurable provider support",
        competitor: "Built-in auth with email, Google, GitHub, and username/password out of the box",
        sourceUrl: "https://wasp-lang.dev/docs/auth/overview",
        sourceDate: "2026-02-20",
      },
      {
        name: "Deployment",
        ourProduct: "Automated Vercel + Railway pipelines with environment variable management",
        competitor: "One-command deploy to Fly.io via wasp deploy, or manual Docker",
        sourceUrl: "https://wasp-lang.dev/docs/advanced/deployment/manually",
        sourceDate: "2026-02-20",
      },
      {
        name: "Growth tooling",
        ourProduct: "SEO, competitor research, comparison pages, analytics — all agent-generated",
        competitor: "No growth tooling — focused on application development",
        sourceUrl: "https://wasp-lang.dev/docs",
        sourceDate: "2026-02-20",
      },
      {
        name: "Learning curve",
        ourProduct: "Standard Next.js and React — no new language to learn",
        competitor: "Custom .wasp DSL requires learning new syntax on top of React",
        sourceUrl: "https://wasp-lang.dev/docs",
        sourceDate: "2026-02-20",
      },
    ],
    ourStrengths: [
      "No proprietary DSL — standard Next.js and React throughout",
      "Agent workflows handle growth, SEO, and deployment automatically",
      "Convex provides real-time data without extra configuration",
    ],
    competitorStrengths: [
      "Mature auth system with multiple providers built in",
      "Declarative approach reduces boilerplate for CRUD apps",
      "Built-in background jobs and email sending",
    ],
    bestFor: {
      ourProduct: "Teams that want agent-assisted product development with growth tooling on a standard React stack",
      competitor: "Solo developers building CRUD apps who prefer declarative configuration over manual setup",
    },
    ctaText: "Get started with Startup Harness",
    lastUpdated: "2026-04-14",
  },
  {
    slug: "startup-harness-vs-shipfast",
    competitorName: "ShipFast",
    competitorUrl: "https://shipfa.st",
    title: "Startup Harness vs ShipFast — startup boilerplate comparison",
    metaDescription:
      "Compare Startup Harness and ShipFast on features, pricing, deployment, and growth automation. Source-linked evidence, updated April 2026.",
    headline: "Startup Harness vs ShipFast",
    summary:
      "ShipFast is a paid Next.js boilerplate with Stripe, auth, SEO, and email pre-configured. Startup Harness generates similar functionality through agent workflows and adds ongoing development support, deployment automation, and growth tooling beyond the initial scaffold.",
    criteria: [
      {
        name: "Pricing model",
        ourProduct: "Open source — free to use and modify",
        competitor: "One-time purchase ($199-$299) for boilerplate access",
        sourceUrl: "https://shipfa.st",
        sourceDate: "2026-03-10",
      },
      {
        name: "Payments integration",
        ourProduct: "Payment setup generated during init with configurable providers",
        competitor: "Stripe pre-integrated with webhook handling and pricing page",
        sourceUrl: "https://shipfa.st",
        sourceDate: "2026-03-10",
      },
      {
        name: "Customization approach",
        ourProduct: "Agent-generated code tailored to your specific product — not a fork of a template",
        competitor: "Clone a boilerplate repo and modify — shared starting point for all users",
        sourceUrl: "https://shipfa.st",
        sourceDate: "2026-03-10",
      },
      {
        name: "Ongoing development",
        ourProduct: "Agent fleet continues to assist with features, debugging, and deployment after init",
        competitor: "No ongoing tooling — you maintain the codebase yourself after purchase",
        sourceUrl: "https://shipfa.st",
        sourceDate: "2026-03-10",
      },
      {
        name: "Growth and marketing",
        ourProduct: "Competitor research, SEO pages, comparison pages, and analytics generated automatically",
        competitor: "Basic SEO tags and a blog template — no research or growth automation",
        sourceUrl: "https://shipfa.st",
        sourceDate: "2026-03-10",
      },
    ],
    ourStrengths: [
      "Free and open source vs paid boilerplate",
      "Agent-generated code is tailored to your product, not a generic template",
      "Ongoing agent support beyond initial scaffolding",
    ],
    competitorStrengths: [
      "Battle-tested Stripe integration with webhook handling",
      "Large community with tutorials and video walkthroughs",
      "Includes email templates and transactional email setup",
    ],
    bestFor: {
      ourProduct: "Founders who want a custom-generated product with ongoing agent-assisted development and growth",
      competitor: "Solo developers who want a ready-made SaaS template with Stripe and auth pre-wired and prefer to customize from there",
    },
    ctaText: "Get started with Startup Harness",
    lastUpdated: "2026-04-14",
  },
  {
    slug: "startup-harness-vs-lazy-ai",
    competitorName: "Lazy AI",
    competitorUrl: "https://www.getlazy.ai",
    title: "Startup Harness vs Lazy AI — AI app builder comparison",
    metaDescription:
      "Compare Startup Harness and Lazy AI on code generation, deployment, and developer control. Source-linked evidence, updated April 2026.",
    headline: "Startup Harness vs Lazy AI",
    summary:
      "Lazy AI is a prompt-to-app platform that generates and hosts full-stack applications from natural language. Startup Harness generates into your own repo with standard frameworks, giving you full code ownership and the ability to extend with agent workflows.",
    criteria: [
      {
        name: "Code ownership",
        ourProduct: "All code lives in your Git repo — you own and control everything",
        competitor: "Code generated and hosted on Lazy AI platform — export available but not the default workflow",
        sourceUrl: "https://www.getlazy.ai",
        sourceDate: "2026-03-20",
      },
      {
        name: "Tech stack",
        ourProduct: "Next.js 15, Convex, TailwindCSS v4, Vercel — industry-standard tools",
        competitor: "Platform-managed stack — less control over underlying frameworks",
        sourceUrl: "https://www.getlazy.ai",
        sourceDate: "2026-03-20",
      },
      {
        name: "Agent workflows",
        ourProduct: "Multi-agent orchestration with specialized roles (growth, backend, frontend, ops)",
        competitor: "Single AI agent for generation and iteration",
        sourceUrl: "https://www.getlazy.ai",
        sourceDate: "2026-03-20",
      },
      {
        name: "Deployment flexibility",
        ourProduct: "Deploy anywhere — Vercel, Railway, AWS, self-hosted",
        competitor: "Hosted on Lazy AI infrastructure — limited deployment options",
        sourceUrl: "https://www.getlazy.ai",
        sourceDate: "2026-03-20",
      },
      {
        name: "Iteration speed",
        ourProduct: "Agent fleet works in parallel across frontend, backend, and growth tasks",
        competitor: "Fast single-agent iteration with visual preview",
        sourceUrl: "https://www.getlazy.ai",
        sourceDate: "2026-03-20",
      },
    ],
    ourStrengths: [
      "Full code ownership in your own Git repository",
      "Industry-standard stack you can maintain without vendor lock-in",
      "Multi-agent parallelism for faster complex builds",
    ],
    competitorStrengths: [
      "Lower barrier to entry — no local dev environment needed",
      "Visual preview during generation for faster feedback",
      "Simpler mental model for non-technical users",
    ],
    bestFor: {
      ourProduct: "Technical founders who want full code ownership, standard frameworks, and agent-assisted development",
      competitor: "Non-technical users who want to build and host apps without managing code or infrastructure",
    },
    ctaText: "Get started with Startup Harness",
    lastUpdated: "2026-04-14",
  },
];

export function getComparisonData(slug: string): ComparisonRoute | null {
  return COMPARISON_ROUTES.find((route) => route.slug === slug) ?? null;
}

export function getAllComparisonSlugs(): string[] {
  return COMPARISON_ROUTES.map((route) => route.slug);
}

export function getAllComparisons(): ComparisonRoute[] {
  return COMPARISON_ROUTES;
}

export function getRelatedComparisons(currentSlug: string): ComparisonRoute[] {
  return COMPARISON_ROUTES.filter((route) => route.slug !== currentSlug);
}
