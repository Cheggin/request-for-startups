# Startup Harness

An autonomous multi-agent system that takes a startup idea and builds the entire company — research, design, code, deploy, and grow.

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-yellow?logo=buymeacoffee)](https://buymeacoffee.com/reaganhsu1b)

## What This Does

You give it one sentence — a startup idea. It does everything else:

1. **Interviews you** about your vision, audience, and constraints
2. **Researches** competitors, market, and positioning
3. **Generates a product spec** with features, data models, and API routes
4. **Designs** UI in Figma using the Figma MCP
5. **Scaffolds** the repo with the canonical stack (Next.js, Turbopack, Tailwind v4, TanStack Query, Zustand, Convex)
6. **Builds** every feature with TDD (tests first, implement second, never simultaneously)
7. **Reviews** code automatically via Cubic
8. **Deploys** to Vercel (frontend) + Railway (backend) + Convex (database)
9. **Grows** with analytics (PostHog), SEO, content marketing, A/B testing
10. **Monitors** 24/7 with Sentry MCP for errors, uptime checks, and incident response
11. **Iterates** based on user feedback, continuously shipping improvements

Works for any startup type: B2C, B2B SaaS, devtool, marketplace, hardware+software, fintech, healthcare, e-commerce.

## Quick Start

```bash
# Clone
git clone https://github.com/Cheggin/request-for-startups.git
cd request-for-startups

# Install
bun install

# Run
bun run harness init
```

The `harness init` command walks you through a founder interview, validates your service connections, and then autonomously builds your startup.

## Install as Plugin

The harness is a **Claude Code plugin**. Install it in any project:

```bash
claude plugins add Cheggin/request-for-startups
```

All 93 skills become available as `/startup-harness:<skill-name>` in any Claude Code session. Skills auto-update when the repo is pushed.

## Architecture

```
commands/          Entry points (startup-init, resume)
agents/            12 agent definitions (website, backend, growth, writing, ops, commander, researcher, docs, slop-cleaner, harness-researcher, alignment, paper-reader)
skills/            93 skills as Claude Code plugin format (skills/<name>/SKILL.md)
templates/         Integration templates (Stripe, Clerk auth, Resend email)
packages/          27 packages with 590+ tests (includes harness-dashboard)
features/          Checklist-driven development tracking
.harness/          Configuration (stacks, agent categories, tool catalog, knowledge wiki, commit schema, issue schema)
.claude-plugin/    Plugin manifest — registers as Claude Code marketplace plugin
.github/           Issue templates (feature, bug) with normalized fields
```

## How It Works

### Three-Tier Orchestration

**Commands** are entry points. **Agents** are loop runners with mode switching. **Skills** are reusable capabilities loaded per agent category.

An agent is a blank Claude Code session. Its identity comes entirely from which skills are loaded. A "website agent" is just: coding ground truth + design skills + coding skills + convex skills. Agent-to-skill mapping is defined in `.harness/agent-categories.yml`.

The harness is a **Claude Code plugin**. Install it and all 93 skills are available as `/startup-harness:<skill-name>` in any Claude Code session. Skills auto-update when the repo is pushed.

### Mechanical Enforcement

Hooks are laws. Prompts are suggestions. LLMs forget ~20% of instructions, so every invariant is enforced mechanically:

- **GateGuard** — must Read before Edit (blocks uninformed changes)
- **Config Protection** — agents cannot weaken linters, tsconfig, CI configs
- **CommitLint** — validates all commit messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- **Budget Enforcer** — turn limits and wall-clock timeouts per agent
- **Fixed Boundary** — harness code is frozen to agents

### Quality Gates (per feature)

```
Implementation → Tests Pass? → Cubic Clean? → Visual QA Pass? → Ship
```

Three gates, every feature, no exceptions. Max 5 retries per gate. If still failing, escalate to Slack.

### Knowledge System

Karpathy-style LLM wiki per agent category. Knowledge compounds across sessions:

- **Ingest** — new sources go in, LLM compiles into wiki pages
- **Query** — agents check the wiki before building
- **Lint** — health checks for contradictions and staleness

### Self-Improvement

Every agent runs a pre/post learning loop:
- Before task: query knowledge wiki for prior learnings
- After task: ingest what worked/failed back into the wiki
- Track performance in a ledger (keep/discard decisions)

## CLI Commands

```bash
harness init              # Full startup lifecycle (12 phases)
harness resume            # Continue from where you left off
harness status            # Comprehensive overview

harness agent list        # All agents with model, level, status
harness agent spawn <n>   # Spawn an agent in tmux
harness agent kill <n>    # Kill a running agent

harness team start <n>    # Coordinated multi-agent execution
harness feature list      # Feature progress (--done, --todo, --progress)
harness skill list        # Browse skills by category
harness stack extend <t>  # Add a tool from the catalog

harness eval static       # Tier 1: parse validation
harness eval e2e          # Tier 2: behavioral tests
harness eval judge        # Tier 3: LLM quality scoring

harness deploy staging    # Deploy to staging
harness deploy production # Deploy to production (requires rollback plan)
harness update post       # Post investor update to Slack
```

## Canonical Stack

Defined in `.harness/stacks.yml`:

| Layer | Tool |
|-------|------|
| Framework | Next.js 15 + Turbopack |
| Styling | Tailwind CSS v4 |
| State (server) | TanStack Query |
| State (client) | Zustand |
| Database | Convex |
| Auth | Clerk (deferred until needed) |
| Payments | Stripe (deferred until needed) |
| Email | Resend + React Email |
| Frontend deploy | Vercel |
| Backend deploy | Railway |
| Code review | Cubic |
| Error tracking | Sentry (via MCP) |
| Analytics | PostHog |
| Testing | Vitest (unit) + Playwright (e2e) |

## Tool Access Pattern

| Need | Mechanism |
|------|-----------|
| One-shot commands | CLI (`gh`, `vercel`, `railway`) |
| Real-time alerts | MCP or webhook → Convex → local channel |
| Rich bidirectional | MCP (Figma, Sentry) |

## Packages

| Package | Tests | What |
|---------|-------|------|
| agent-loop | 108 | Core runtime: mode switching, hooks, plateau detection, self-improvement |
| cli | 33 | `harness` command with 12 command groups |
| commander | 48 | Dispatcher, monitor, handoff, investor updates |
| hooks | 28 | GateGuard, config-protection, budget-enforcer |
| github-state | 41 | Issues, project board, audit trail, context rebuild |
| eval-framework | 59 | 3-tier eval (static, E2E, LLM judge) |
| implementation-loop | 24 | TDD → Cubic → Visual QA → Ship cycle |
| spec-generator | 23 | Idea → product spec with startup type detection |
| feature-decomposer | 39 | Spec → features with dependency graph |
| knowledge | 56 | Karpathy wiki: ingest, query, lint |
| repo-setup | 29 | Scaffold repos, configure services, install hooks |
| service-validator | 24 | Validate all service connections |
| webhook-receiver | 33 | Universal multi-source webhook receiver |
| secret-manager | 30 | Credential storage, sync, detection, rotation |
| sentry-integration | 18 | Error routing, agent-friendly formatting |
| config-optimizer | 33 | Auto-tune agent configs from performance data |
| task-classifier | 25 | Trivial/moderate/complex task routing |
| fixed-boundary | 25 | Frozen paths enforcement |
| cubic-channel | 30 | Cubic → Convex → Claude Code channel |
| adaptive-loadout | — | Startup type → skill selection |
| figma-integration | — | Spec → Figma designs |
| status-dashboard | — | Terminal status overview |

## Research Foundation

Built by analyzing 15+ reference repos and 3 Anthropic engineering articles. Every architectural decision traces to evidence. See `reagan_analytical_reference_review.md` for the full adopt/adapt/reject analysis.

Key influences: autoagent (fixed boundary, keep/discard), autoresearch (time-budgeted experiments), ui-loop (plateau detection), gstack (3-tier eval pyramid), pi-mono (hook architecture), oh-my-claudecode (agent definitions), Archon (DAG workflows), get-shit-done (advance guard), everything-claude-code (GateGuard), Karpathy skills (4 principles).

## Conventions

### Commit Messages

All commits follow [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). Enforced by a PreToolUse hook — non-conforming commits are blocked before execution.

```
<type>(<scope>): <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Full spec in `.harness/commit-schema.md`.

### Issue Creation

All GitHub Issues follow a normalized schema with required fields: type, severity (P0-P3), description, acceptance criteria, and verification steps. Templates enforced via `.github/ISSUE_TEMPLATE/`. Full spec in `.harness/issue-schema.md`.

## License

MIT

## Step-by-Step: How a Startup Gets Built

When you run `harness init`, here's exactly what happens:

### Phase 0: Founder Interview
The harness asks 6 questions, one at a time:
- What's your startup idea?
- What type of company? (B2C, B2B SaaS, devtool, marketplace, hardware, fintech, healthcare, ecommerce)
- Who are the target users?
- Business model? (subscription, freemium, commission, etc.)
- Budget? (bootstrapped, seed-funded, enterprise)
- Timeline? (weekend, month, quarter)

Saves to `.harness/founder-profile.yml`. This is the only interactive step.

### Phase 1: Service Validation
Checks that GitHub (`gh auth status`), Vercel (`vercel whoami`), Railway (`railway whoami`), and other services are connected. Blocks if critical services are missing.

### Phase 2: Market Research
Uses web search to find competitors, market size, target audience pain points, pricing models, and design patterns. Saves `research-report.md`.

### Phase 3: Product Spec
Generates a comprehensive spec from the idea + research: pages with routes, features with P0/P1/P2 priorities and testable acceptance criteria, data models, API routes, component inventory. Creates GitHub Issues for every feature. Saves `product-spec.md`.

### Phase 4: Design
Generates Figma designs for each page using the Figma MCP. Saves screenshots for visual QA baseline.

### Phase 5: Repo Setup
Scaffolds a Next.js 15 project with the canonical stack. Configures CI/CD, hooks (GateGuard, config-protection), Cubic code review pipeline, and the Taskfile. Creates GitHub Project board.

### Phase 6: Feature Decomposition
Breaks the product spec into individual features ordered by dependency. Each feature becomes a `features/*.md` checklist and a GitHub Issue with acceptance criteria.

### Phase 7: Build (TDD Loop)
For each feature in dependency order:
1. Write tests first (Vitest unit + Playwright e2e)
2. Implement the feature
3. Run tests until green (max 10 iterations)
4. Cubic code review until clean (max 5 iterations)
5. Visual QA against Figma screenshots (max 5 iterations)
6. All gates pass → merge PR, move Issue to Done
7. Post investor update to Slack

### Phase 8: Launch Prep
Legal pages (ToS, Privacy Policy), SEO setup (sitemap, meta tags, structured data), analytics (PostHog), error tracking (Sentry MCP), pre-launch checklist verification.

### Phase 9: Deploy
`vercel --prod` (frontend) + `npx convex deploy` (database) + `railway up` (backend if needed). Health checks and e2e tests against production URL.

### Phase 10+: Growth & Maintenance (ongoing)
- **Growth**: SEO content, programmatic pages, blog posts with unique data, A/B testing
- **Monitoring**: Sentry MCP for errors, uptime checks, performance benchmarks
- **Maintenance**: Dependency updates, security scans, Cubic codebase scans
- **Iteration**: User feedback → new features → back to Phase 7
- **Updates**: Weekly investor updates synthesizing progress across all agents

## File Structure

```
├── agents/                    12 agent definitions across 6 categories
│   ├── website.md             Frontend dev (sonnet, level 2) → coding category
│   ├── backend.md             Backend/API dev (sonnet, level 2) → coding category
│   ├── growth.md              Growth/analytics (sonnet, level 2) → growth category
│   ├── writing.md             Content creation (haiku, level 1) → content category
│   ├── docs.md                Devtool documentation (sonnet, level 2) → content category
│   ├── ops.md                 Operations/deploy (sonnet, level 3) → operations category
│   ├── commander.md           Orchestrator (opus, level 4) → orchestration category
│   ├── researcher.md          Knowledge wiki maintainer (opus, level 3) → orchestration category
│   ├── harness-researcher.md  Self-improvement researcher (opus, level 3) → orchestration category
│   ├── alignment.md           Repo structure auditor (sonnet, level 2) → orchestration category
│   └── slop-cleaner.md        AI slop detection/removal (sonnet, level 2) → quality category
│
├── skills/                    93 skills in Claude Code plugin format (skills/<name>/SKILL.md)
│   │                          Each agent category loads specific skills:
│   │                          coding agents → design + coding + convex skills
│   │                          content agents → content skills
│   │                          growth agents → growth skills
│   │                          operations agents → operations + coding skills
│   │                          orchestration agents → agent skills
│   │                          quality agents → coding + design skills
│   │
│   ├── Init (1)               startup-init
│   ├── Design (17)            impeccable, polish, layout, typeset, animate, colorize, bolder, critique, adapt, audit, clarify, delight, distill, optimize, overdrive, quieter, shape
│   ├── Coding (12)            website-creation, visual-qa-pipeline, test-generator, deploy-pipeline, security-scanner, accessibility-checker, performance-benchmark, seo-setup, slop-cleaner, cubic-codebase-scan, sprint-contracts, asset-generation
│   ├── Convex (13)            convex, convex-functions, convex-realtime, convex-agents, convex-schema-validator, convex-best-practices, convex-security-audit, convex-security-check, convex-component-authoring, convex-cron-jobs, convex-file-storage, convex-http-actions, convex-migrations
│   ├── Content (9)            anti-ai-writing, blog-scaffolder, brand-guidelines, contributing-guide, data-driven-blog, documentation-generator, legal-generator, readme-generator, social-media
│   ├── Growth (7)             analytics-integration, competitor-research, landing-page-optimizer, programmatic-seo, seo-chat, social-intelligence, user-feedback-collector
│   ├── Operations (6)         ci-cd-pipeline, dependency-manager, error-tracking, incident-response, log-aggregation, uptime-monitor
│   ├── Orchestration (14)     autopilot, ralph, team, ultrawork, ultraqa, plan, deep-interview, deep-dive, cancel, trace, debug, self-improve, verify, agent-creator
│   └── Agent (14)             loop-prompt, context-reset-handler, cost-tracker, error-classifier, eval-framework, trajectory-logging, tiered-memory, investor-updates, github-state-manager, slack-course-correction, stack-extend, post-deploy-loop, research, avoid-feature-creep
│
├── packages/                  27 packages with 590+ tests
│   ├── cli/                   Harness CLI (12 command groups)
│   ├── harness-dashboard/     Web dashboard — agent monitoring, growth intel, deploy health (Next.js + visx)
│   ├── commander/             Orchestrator (dispatcher, monitor, handoff, investor updates)
│   ├── agent-loop/            Core runtime (mode switching, hooks, plateau detection, self-improvement)
│   ├── hooks/                 GateGuard (read before edit), config-protection
│   ├── knowledge/             Karpathy wiki (ingest, query, lint)
│   ├── eval-framework/        3-tier eval (static, E2E, LLM judge)
│   ├── implementation-loop/   TDD → Cubic → Visual QA → Ship cycle
│   ├── spec-generator/        Idea → product spec with startup type detection
│   ├── feature-decomposer/    Spec → features with dependency graph
│   ├── repo-setup/            Scaffold repos, configure services, install hooks
│   ├── service-validator/     Validate all service connections
│   ├── github-state/          Issues + Project board + audit trail + context rebuild
│   ├── webhook-receiver/      Universal multi-source webhook receiver
│   ├── cubic-channel/         Cubic → Convex → Claude Code channel
│   ├── secret-manager/        Credential storage, sync, detection, rotation
│   ├── sentry-integration/    Error routing, agent-friendly formatting
│   ├── config-optimizer/      Auto-tune agent configs from performance data
│   ├── task-classifier/       Trivial/moderate/complex task routing
│   ├── fixed-boundary/        Frozen paths enforcement
│   ├── adaptive-loadout/      Startup type → skill selection
│   ├── schema-generator/      Spec → Convex schema
│   ├── api-generator/         Spec → API routes
│   ├── figma-integration/     Spec → Figma designs
│   ├── status-dashboard/      Terminal status overview
│   └── website-template/      Canonical Next.js scaffold
│
├── templates/                 Integration templates
│   ├── stripe/                Embedded Checkout, webhooks, subscription state
│   ├── auth/                  Clerk middleware, sign-in/up, user management
│   └── email/                 Resend + React Email (welcome, password reset)
│
├── features/                  Checklist-driven development tracking
├── commands/                  User-facing entry points (startup-init, resume)
├── test-runs/                 E2E test results
│   ├── level-1-smoke/         Spec generation test
│   ├── level-2-scaffold/      Scaffold + build test (counter app)
│   └── level-5-image-converter/  Full SaaS test (image converter)
│
├── .harness/                  Configuration
│   ├── stacks.yml             Canonical tech stack
│   ├── agent-categories.yml   Ground truth rules per category
│   ├── tool-catalog.yml       18 pre-built integration configs
│   ├── commit-schema.md       Conventional Commits specification
│   ├── issue-schema.md        Normalized issue creation format
│   └── knowledge/             Karpathy wiki per category
│
├── .github/                   Issue templates (feature, bug) with normalized fields
├── .claude/                   Claude Code settings + hooks
├── .claude-plugin/            Plugin manifest for marketplace
├── SOUL.md                    Project identity, principles, architecture
├── Taskfile.yml               Task runner (dev, test, build, deploy, features)
└── README.md                  This file
```

## Validated Results

The harness has been tested end-to-end across 5 levels:

| Level | Test | Result |
|-------|------|--------|
| 1 | Spec generation from idea | **PASS** — 116 lines |
| 2 | Scaffold + `next build` | **PASS** — 0 errors |
| 3 | TDD (write test, implement, pass) | **PASS** — 4 tests |
| 4 | Feature build via agent | **PASS** — component + test + wired |
| 5 | Full SaaS from one sentence | **PASS** — 24 files, 25 tests, 9 pages |

The Level 5 image converter includes: drag-and-drop upload, format picker, quality slider, conversion engine (Canvas API), pricing page, 6 programmatic SEO pages, and a blog post with 0 AI slop words detected.
