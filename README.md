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

The harness is a **Claude Code plugin**. Inside any Claude Code session:

```
/plugin marketplace add Cheggin/request-for-startups
/plugin install startup-harness@harness
```

The first command registers this repo as a marketplace named `harness`. The second installs the `startup-harness` plugin from it. All 121 skills become available as `/startup-harness:<skill-name>` and 32 agents become available as `@startup-harness:<agent-name>` in any Claude Code session on this machine.

Once installed, kick off an autonomous build with:

```
/startup-harness:startup-init
```

This walks you through the founder interview, validates your service connections, and then builds the startup end-to-end.

To update to the latest version later:

```
/plugin marketplace update harness
```

To uninstall:

```
/plugin uninstall startup-harness@harness
/plugin marketplace remove harness
```

## Architecture

```
commands/          Entry points (startup-init, resume)
agents/            32 agent definitions (website, backend, growth, writing, ops, deploy, commander, researcher, docs, slop-cleaner, harness-researcher, alignment, paper-reader, plus OMC-merged roles like architect, critic, executor, planner, analyst, debugger, tracer, verifier, designer, qa-tester, git-master, security-reviewer, code-reviewer, code-simplifier, test-engineer, scientist, document-specialist, writer)
skills/            121 skills as Claude Code plugin format (skills/<name>/SKILL.md)
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

The harness is a **Claude Code plugin**. Install it and all 121 skills are available as `/startup-harness:<skill-name>` in any Claude Code session. Skills auto-update when the repo is pushed.

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

## How you use it — slash commands, not a CLI

There is no `harness` binary. The entire surface is Claude Code skills + agents, reachable as:

```
/startup-harness:startup-init          # Full startup lifecycle (12 phases)
/startup-harness:autopilot             # Autonomous idea → working code
/startup-harness:ralph                 # Self-referential loop until completion
/startup-harness:team                  # Multi-agent tmux coordination
/startup-harness:plan                  # Strategic planning with optional interview
/startup-harness:deep-interview        # Socratic ambiguity-gated requirements
/startup-harness:review                # Third-party review of finished sessions
/startup-harness:website-creation      # Enforced skill chain for website builds
/startup-harness:deploy-pipeline       # Vercel / Railway / Convex deploy
...120 skills total across orchestration, design, build, quality, ship, grow, ops, comms
```

And 32 agents reachable as `@startup-harness:<name>`:

```
@startup-harness:website       @startup-harness:backend       @startup-harness:deploy
@startup-harness:architect     @startup-harness:critic        @startup-harness:designer
@startup-harness:executor      @startup-harness:planner       @startup-harness:qa-tester
...32 total
```

Plus deterministic enforcement hooks that ship with the plugin:

- `keyword-detector` — UserPromptSubmit hook that detects magic keywords (`ralph`, `autopilot`, `ultrawork`, `ccg`, `ralplan`, `deep-interview`, `ai-slop`, `wiki`, `tdd`, `code review`, `security review`, `ultrathink`, `deepsearch`, `cancelharness`) and injects the matching skill content before the agent responds
- `skill-chain-enforcer` — blocks Edit/Write until the current flow's required phase skills have fired. Flows defined in `chains/skill-chains.json`: `website-end-to-end` (6 phases, triggered by `website-creation`) and `startup-end-to-end` (9 phases, triggered by `startup-init`)
- `context-guard-stop` — Stop hook that blocks with a `/compact` prompt when context usage crosses `HARNESS_CONTEXT_GUARD_THRESHOLD` (default 75%), so long autonomous runs never hit a hard context limit mid-iteration
- `completion-signal` — writes a session-done signal on every Stop so `/startup-harness:review` can pick it up
- `gateguard` — Read-before-Edit gate to prevent uninformed changes

Load-test the plugin with `npm run validate` (node-native, no bun). It parses `.claude-plugin/plugin.json`, `marketplace.json`, every `hooks/*.mjs` via `node --check`, every `SKILL.md` / agent `.md` frontmatter, and `chains/skill-chains.json` — including that every skill referenced in a chain exists in `skills/`.

## Skills (121)

Every skill has frontmatter: `group`, `prerequisites`, `next`, `workflows`. Three skills are always-load guards: `anti-ai-writing`, `verify`, `avoid-feature-creep`.

### Orchestration (20)

| Skill | Purpose | Prerequisites | Next |
|-------|---------|---------------|------|
| startup-init | 11-phase autonomous startup builder | — | — |
| autopilot | Full autonomous execution: idea to code | deep-interview, plan | verify, ultraqa |
| ralph | Self-referential loop until task complete | plan, sprint-contracts | verify, slop-cleaner |
| team | N coordinated agents on shared task list | plan | verify |
| ultrawork | Parallel execution engine | plan | verify |
| ultraqa | QA cycling: test/verify/fix/repeat | test-generator | verify |
| deep-dive | Trace + interview pipeline for investigation | — | plan, autopilot |
| debug | Diagnose failures via logs, traces, state | — | trace |
| trace | Competing hypothesis investigation | — | plan |
| tmux-spawn | Reliable agent spawning in tmux | — | — |
| loop-prompt | Generate loop prompts for continuous agents | — | post-deploy-loop, research |
| cancel | Cancel any active mode | — | — |
| issue-creator | One-liner to schema-compliant GitHub Issue | — | github-state-manager |
| github-state-manager | Task state via GitHub Issues + Projects | plan | ci-cd-pipeline, investor-updates |
| agent-creator | Create new agent definitions | — | tmux-spawn |
| self-improve | Autonomous evolutionary code improvement | eval-framework | verify |
| context-reset-handler | Clean context resets with handoff docs | — | — |
| tiered-memory | Hot/warm/cold memory across resets | — | — |
| trajectory-logging | ATIF trajectory serialization | — | eval-framework |
| error-classifier | Classify errors: FATAL/TRANSIENT/UNKNOWN | error-tracking | incident-response |

### Strategy (9)

| Skill | Purpose | Prerequisites | Next |
|-------|---------|---------------|------|
| plan | Strategic planning with interview workflow | — | ralph, team, autopilot, sprint-contracts |
| deep-interview | Socratic interview for spec crystallization | — | plan, autopilot |
| competitor-research | Browser-based competitive analysis | — | shape, plan, website-creation |
| research | Persistent research wiki with experiments | — | plan, competitor-research |
| gap-analysis | Compare product against reference in same category | competitor-research | plan, shape |
| shape | UX/UI discovery interview producing design brief | impeccable | website-creation, impeccable |
| sprint-contracts | Success criteria between generator/evaluator | plan, shape | ralph, team |
| brand-guidelines | Extract and codify brand identity | competitor-research | website-creation, social-media |
| avoid-feature-creep | Scope discipline enforcement (always-load) | — | sprint-contracts |

### Design (17)

| Skill | Purpose | Prerequisites | Next |
|-------|---------|---------------|------|
| impeccable | Production-grade frontend interfaces | — | shape, layout, typeset, colorize, animate, adapt, critique, audit |
| website-creation | SaaS websites with design presets | shape, brand-guidelines, anti-ai-writing | seo-setup, audit, polish |
| layout | Spacing, hierarchy, visual rhythm | impeccable | polish |
| typeset | Typography hierarchy, sizing, readability | impeccable | polish |
| colorize | Strategic color application | impeccable | polish |
| animate | Motion, micro-interactions, transitions | impeccable | delight, polish |
| adapt | Responsive design across devices | impeccable | accessibility-checker, polish |
| bolder | Amplify safe designs for more impact | impeccable | quieter, polish |
| quieter | Tone down overstimulating designs | impeccable | polish |
| delight | Moments of joy and personality | impeccable, animate | overdrive, polish |
| distill | Strip to essence, remove complexity | impeccable | polish |
| overdrive | Technically ambitious: shaders, physics | impeccable, delight | polish |
| clarify | UX copy, labels, error messages | impeccable | anti-ai-writing, polish |
| polish | Final pass: alignment, spacing, consistency | impeccable | visual-qa-pipeline, deploy-pipeline |
| critique | Multi-perspective design evaluation | impeccable | layout, typeset, colorize, clarify, distill |
| asset-generation | Hero images and visual assets | brand-guidelines, shape | website-creation |
| optimize | UI performance: loading, rendering, bundle | — | performance-benchmark |

### Build (15)

| Skill | Purpose | Prerequisites | Next |
|-------|---------|---------------|------|
| convex | Umbrella router to Convex sub-skills | plan | convex-schema-validator, convex-functions |
| convex-schema-validator | Schema, typing, indexes | plan | convex-functions, convex-migrations |
| convex-functions | Queries, mutations, actions | convex-schema-validator | convex-realtime, convex-http-actions, convex-cron-jobs, convex-file-storage, convex-agents |
| convex-realtime | Reactive subscriptions, optimistic updates | convex-functions | convex-security-check |
| convex-http-actions | Webhooks, external API integration | convex-functions | convex-security-check |
| convex-file-storage | Upload, serving, metadata | convex-functions | convex-security-check |
| convex-cron-jobs | Scheduled background tasks | convex-functions | convex-security-check |
| convex-agents | AI agents with threads, tools, RAG | convex-functions | convex-security-audit |
| convex-migrations | Zero-downtime schema evolution | convex-schema-validator | convex-functions |
| convex-best-practices | Production-ready Convex patterns | convex | convex-component-authoring |
| convex-component-authoring | Reusable isolated components | convex-best-practices | convex-security-audit |
| convex-security-check | Quick security audit checklist | convex-functions | convex-security-audit |
| convex-security-audit | Deep RBAC, rate limiting review | convex-security-check | deploy-pipeline |
| test-generator | Auto-generate Vitest + Playwright tests | sprint-contracts | verify, ultraqa, ci-cd-pipeline |
| stack-extend | Add new tools to stack at runtime | plan | post-deploy-loop |

### Quality (9)

| Skill | Purpose | Prerequisites | Next |
|-------|---------|---------------|------|
| verify | Verify changes work before claiming done (always-load) | — | deploy-pipeline |
| audit | Technical quality checks, P0-P3 scoring | impeccable | layout, typeset, colorize, clarify, adapt |
| slop-cleaner | Remove dead code, duplication, weak tests | — | verify |
| visual-qa-pipeline | Screenshot pages, evaluate against preset | website-creation | polish |
| accessibility-checker | WCAG 2.1 AA audits via axe-core | website-creation, adapt | audit |
| performance-benchmark | Core Web Vitals via Lighthouse CI | website-creation | deploy-pipeline |
| security-scanner | Dependency vulns, secrets, OWASP top 10 | — | deploy-pipeline, ci-cd-pipeline |
| cubic-codebase-scan | Full-codebase security/quality scans | — | github-state-manager |
| eval-framework | pass@k metrics for agent reliability | agent-creator, test-generator | self-improve |

### Ship (5)

| Skill | Purpose | Prerequisites | Next |
|-------|---------|---------------|------|
| deploy-pipeline | Automated deploy: Vercel + Railway + Convex | security-scanner, verify, ci-cd-pipeline | post-deploy-loop, uptime-monitor |
| ci-cd-pipeline | GitHub Actions with parallel jobs | test-generator | deploy-pipeline |
| seo-setup | Sitemap, robots.txt, meta tags, JSON-LD | website-creation | seo-chat, programmatic-seo |
| legal-generator | ToS, Privacy Policy, Cookie Policy | plan | website-creation |
| dependency-manager | Automated dependency audits and updates | — | security-scanner |

### Grow (9)

| Skill | Purpose | Prerequisites | Next |
|-------|---------|---------------|------|
| analytics-integration | PostHog: page views, funnels, A/B tests | website-creation | landing-page-optimizer, post-deploy-loop |
| landing-page-optimizer | A/B tests via PostHog feature flags | analytics-integration, website-creation | post-deploy-loop |
| programmatic-seo | Hundreds of pages from data matrices | seo-chat, analytics-integration | seo-setup, landing-page-optimizer |
| seo-chat | Query SEO API for strategy and audits | seo-setup | programmatic-seo, blog-scaffolder |
| blog-scaffolder | SEO-optimized blog system with MDX | seo-chat, brand-guidelines | data-driven-blog |
| data-driven-blog | Blog posts with proprietary data | blog-scaffolder, analytics-integration | social-media |
| social-media | Platform-adapted social posts | brand-guidelines, anti-ai-writing | social-intelligence |
| social-intelligence | Monitor social platforms for mentions | social-media | slack-course-correction |
| user-feedback-collector | In-app feedback widget with routing | website-creation | github-state-manager |

### Operate (6)

| Skill | Purpose | Prerequisites | Next |
|-------|---------|---------------|------|
| post-deploy-loop | 24/7 monitoring + growth loop | deploy-pipeline | uptime-monitor, landing-page-optimizer, investor-updates |
| uptime-monitor | Health check polling with Slack alerts | deploy-pipeline | incident-response |
| error-tracking | Sentry integration with spike detection | website-creation, convex-functions | incident-response, error-classifier |
| incident-response | Full incident lifecycle with escalation | uptime-monitor, error-tracking | deploy-pipeline, github-state-manager |
| log-aggregation | Unified logs from Vercel/Railway | deploy-pipeline | debug, incident-response |
| cost-tracker | Per-agent cost tracking with budgets | — | investor-updates |

### Comms (6)

| Skill | Purpose | Prerequisites | Next |
|-------|---------|---------------|------|
| anti-ai-writing | Eliminate AI writing tells (always-load) | — | — |
| investor-updates | Milestone reports to Slack with metrics | github-state-manager, analytics-integration | slack-course-correction |
| slack-course-correction | Detect Slack feedback, propagate changes | investor-updates | plan, issue-creator |
| documentation-generator | API reference, user guides, changelog | — | readme-generator |
| readme-generator | Auto-generate README.md | — | documentation-generator, contributing-guide |
| contributing-guide | Auto-generate CONTRIBUTING.md | readme-generator | — |

### Workflows

Skills chain into 8 standard workflows:

| Workflow | Chain |
|----------|-------|
| **full-startup** | deep-interview -> plan -> shape -> website-creation -> test-generator -> deploy-pipeline -> post-deploy-loop |
| **build-lander** | impeccable -> shape -> website-creation -> polish -> seo-setup -> deploy-pipeline -> landing-page-optimizer |
| **build-saas** | deep-interview -> plan -> convex-schema-validator -> convex-functions -> website-creation -> deploy-pipeline |
| **ship-feature** | deep-interview -> plan -> sprint-contracts -> test-generator -> autopilot -> verify -> deploy-pipeline |
| **design-review** | impeccable -> critique -> audit -> [layout, typeset, colorize, clarify] -> polish -> visual-qa-pipeline |
| **bug-fix** | debug -> trace -> deep-dive -> plan -> verify -> slop-cleaner -> ultraqa |
| **seo-content-growth** | seo-setup -> seo-chat -> blog-scaffolder -> data-driven-blog -> social-media -> social-intelligence |
| **incident-response** | uptime-monitor -> error-tracking -> error-classifier -> incident-response -> deploy-pipeline -> verify |
| **continuous-improvement** | self-improve -> research -> plan -> ultrawork -> eval-framework -> slop-cleaner -> verify |

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

Plugin-distributed functionality lives at the repo root (`skills/`, `agents/`, `hooks/`, `chains/`, `commands/`, `.claude-plugin/`). The `packages/` directory holds ancillary infrastructure plus a few test-build artifacts — see `packages/README.md` for the full classification ledger with retirement timestamps.

| Package | What |
|---------|------|
| hooks | TS sources for plugin hooks + the project-local hook set (gateguard, skill-chain-enforcer, completion-signal, config-protection, scope-enforcer, branch-enforcer, metrics-gate, deploy-gate, validate-commit-msg, validate-issue-create, inter-agent-signal) |
| harness-dashboard | Next.js dashboard — agent monitoring, growth intel, deploy health (visx) |
| eval-framework | 3-tier eval (static, E2E, LLM judge) |
| cubic-channel | Cubic → Convex → Claude Code code-review channel |
| webhook-receiver | Universal multi-source webhook receiver |
| repo-setup | Scaffold repos, configure services, install hooks |
| service-validator | Validate all service connections |
| fixed-boundary | Frozen paths enforcement |
| website-template | Canonical Next.js scaffold template |
| tab-commander-site | Test startup build (active dev) |

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
├── agents/                    32 agent definitions across 6 categories (core 13 listed below; the remaining 19 are OMC-merged roles — architect, critic, executor, planner, analyst, debugger, designer, qa-tester, etc.)
│   ├── website.md             Frontend dev (sonnet, level 2) → coding category
│   ├── backend.md             Backend/API dev (sonnet, level 2) → coding category
│   ├── growth.md              Growth/analytics (sonnet, level 2) → growth category
│   ├── writing.md             Content creation (haiku, level 1) → content category
│   ├── docs.md                Devtool documentation (sonnet, level 2) → content category
│   ├── ops.md                 Operations/infra (sonnet, level 3) → operations category
│   ├── deploy.md              Production deploys/rollbacks (sonnet, level 2) → operations category
│   ├── commander.md           Orchestrator (opus, level 4) → orchestration category
│   ├── researcher.md          Knowledge wiki maintainer (opus, level 3) → orchestration category
│   ├── harness-researcher.md  Self-improvement researcher (opus, level 3) → orchestration category
│   ├── alignment.md           Repo structure auditor (opus, level 2) → orchestration category
│   ├── paper-reader.md        Academic paper reader (sonnet, level 2) → orchestration category
│   └── slop-cleaner.md        AI slop detection/removal (sonnet, level 2) → quality category
│
├── skills/                    121 skills in Claude Code plugin format (skills/<name>/SKILL.md)
│   │                          Organized by lifecycle group with frontmatter metadata:
│   │                          group, prerequisites, next, workflows
│   │
│   ├── Orchestration (20)     startup-init, autopilot, ralph, team, ultrawork, ultraqa, deep-dive, debug, trace, tmux-spawn, loop-prompt, cancel, issue-creator, github-state-manager, agent-creator, self-improve, context-reset-handler, tiered-memory, trajectory-logging, error-classifier
│   ├── Strategy (9)           plan, deep-interview, competitor-research, research, gap-analysis, shape, sprint-contracts, brand-guidelines, avoid-feature-creep
│   ├── Design (17)            impeccable, website-creation, layout, typeset, colorize, animate, adapt, bolder, quieter, delight, distill, overdrive, clarify, polish, critique, asset-generation, optimize
│   ├── Build (15)             convex, convex-schema-validator, convex-functions, convex-realtime, convex-http-actions, convex-file-storage, convex-cron-jobs, convex-agents, convex-migrations, convex-best-practices, convex-component-authoring, convex-security-check, convex-security-audit, test-generator, stack-extend
│   ├── Quality (9)            verify, audit, slop-cleaner, visual-qa-pipeline, accessibility-checker, performance-benchmark, security-scanner, cubic-codebase-scan, eval-framework
│   ├── Ship (5)               deploy-pipeline, ci-cd-pipeline, seo-setup, legal-generator, dependency-manager
│   ├── Grow (9)               analytics-integration, landing-page-optimizer, programmatic-seo, seo-chat, blog-scaffolder, data-driven-blog, social-media, social-intelligence, user-feedback-collector
│   ├── Operate (6)            post-deploy-loop, uptime-monitor, error-tracking, incident-response, log-aggregation, cost-tracker
│   └── Comms (6)              anti-ai-writing, investor-updates, slack-course-correction, documentation-generator, readme-generator, contributing-guide
│
├── packages/                  Ancillary infrastructure (see packages/README.md for the ledger)
│   ├── hooks/                 TS sources for plugin + project hooks
│   ├── harness-dashboard/     Next.js dashboard — agent monitoring, growth intel, deploy health (visx)
│   ├── eval-framework/        3-tier eval (static, E2E, LLM judge)
│   ├── cubic-channel/         Cubic → Convex → Claude Code code-review channel
│   ├── webhook-receiver/      Universal multi-source webhook receiver
│   ├── repo-setup/            Scaffold repos, configure services, install hooks
│   ├── service-validator/     Validate all service connections
│   ├── fixed-boundary/        Frozen paths enforcement
│   ├── tab-commander-site/    Test startup build (active)
│   └── website-template/      Canonical Next.js scaffold template
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
