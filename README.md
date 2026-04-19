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

The harness is **runtime-agnostic** -- it works with both **Claude Code** and **OpenAI Codex CLI**.

### Claude Code

```
/plugin marketplace add Cheggin/request-for-startups
/plugin install startup-harness@harness
```

All 121 skills become available as `/startup-harness:<skill-name>` and 32 agents as `@startup-harness:<agent-name>`.

```
/startup-harness:startup-init
```

### Codex CLI

Install Codex CLI if you haven't already:

```bash
npm install -g @openai/codex
```

Then clone this repo and run the setup script:

```bash
git clone https://github.com/Cheggin/request-for-startups
cd request-for-startups
node .harness/hooks/setup.mjs --runtime codex
```

This generates:

| File | Purpose |
|------|---------|
| `.codex/config.toml` | Feature flags, skill paths, MCP server config |
| `.codex/hooks.json` | All 10 enforcement hooks wired to Codex lifecycle events |
| `.agents/skills/` | Symlink to `skills/` for Codex skill discovery |
| `AGENTS.md` | Agent coordination contract (Codex equivalent of CLAUDE.md) |

After setup, launch Codex in the repo:

```bash
codex
```

Skills are available as `$<skill-name>` (e.g., `$startup-init`, `$plan`, `$team`). All hooks (scope enforcement, config protection, deploy gates, commit validation) work identically to Claude Code.

### Existing Repo (Claude Code or Codex)

To add harness governance to any existing project:

```bash
# Copy .harness/ and skills/ into your repo, then:
node .harness/hooks/setup.mjs              # auto-detects installed runtime
node .harness/hooks/setup.mjs --runtime codex   # Codex only
node .harness/hooks/setup.mjs --runtime claude  # Claude Code only
node .harness/hooks/setup.mjs --runtime both    # both runtimes
```

The setup script auto-detects which CLI tools are on your PATH and generates the right config. No npm package or external dependencies required -- the hooks are vanilla Node.js.

### Update / Uninstall (Claude Code)

```
/plugin marketplace update harness
/plugin uninstall startup-harness@harness
/plugin marketplace remove harness
```

## Advanced install (full runtime)

Marketplace install is enough for skills, agents, hooks, and deterministic
skill-chain enforcement. If you also want the bundled MCP server (`state_*`,
`notepad_*`, `wiki_*`, `lsp_*`, `ast_grep_*`, `python_repl`) and the `omc`
CLI binary, clone the repo and link it:

```bash
git clone https://github.com/Cheggin/request-for-startups
cd request-for-startups
npm install          # pulls ajv, ajv-formats, better-sqlite3
npm link             # registers the `omc` binary on PATH
npm run test:hooks   # 55 node:test assertions across all hooks
```

After `npm install`, `bridge/mcp-server.cjs` becomes registered as the `t`
MCP server (see `.mcp.json`) and provides the full OMC tool surface to any
session with this plugin installed. After `npm link`, skills that invoke
`omc team start`, `omc teleport`, `omc ask codex`, etc. resolve to this
plugin's `bridge/cli.cjs` rather than a separately-installed OMC plugin.

## Architecture

```
commands/          Entry points (startup-init, resume)
agents/            32 agent definitions (website, backend, growth, writing, ops, deploy, commander, researcher, docs, slop-cleaner, harness-researcher, alignment, paper-reader, plus OMC-merged roles like architect, critic, executor, planner, analyst, debugger, tracer, verifier, designer, qa-tester, git-master, security-reviewer, code-reviewer, code-simplifier, test-engineer, scientist, document-specialist, writer)
skills/            121 skills as Claude Code plugin format (skills/<name>/SKILL.md)
templates/         Integration templates (Stripe, Clerk auth, Resend email)
hooks/             Plugin hooks (node .mjs/.cjs) + hooks.json wiring every hook event type
bridge/            OMC CLI + MCP server + tmux team-bridge daemons (direct-merged from OMC)
dist/              Vendored OMC compiled runtime (476 .js files)
chains/            Deterministic skill-chain flows (website, startup-e2e, deploy-loop, debug-loop)
features/          Checklist-driven development tracking
.harness/          Configuration + runtime-agnostic hooks
.harness/hooks/    Canonical hook location — works with both Claude Code and Codex CLI
.codex/            Generated Codex CLI config (config.toml, hooks.json)
.agents/skills/    Symlink to skills/ for Codex skill discovery
.claude-plugin/    Plugin manifest — registers as Claude Code marketplace plugin
.github/           Issue templates (feature, bug) with normalized fields
```

## Runtime Adapter

Hooks live in `.harness/hooks/` and are runtime-agnostic. A shared `runtime.mjs` module normalizes tool names between runtimes:

| Claude Code | Codex CLI | Normalized |
|------------|-----------|------------|
| `Bash` | `shell` | `Bash` |
| `Edit` | `file_edit` | `Edit` |
| `Write` | `file_write` | `Write` |
| `Read` | `file_read` | `Read` |

Run `node .harness/hooks/setup.mjs` to generate the appropriate config for your runtime. It auto-detects which CLI tools are installed and wires up:

- **Claude Code**: `.claude/settings.json` with PreToolUse/Stop/PermissionRequest hooks
- **Codex CLI**: `.codex/config.toml` + `.codex/hooks.json` + `.agents/skills/` symlink + `AGENTS.md`

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

## Agents (32)

<details>
<summary><strong>View all agents</strong></summary>
<br>

| Agent | Category | Description |
|-------|----------|-------------|
| `alignment` | orchestration | Continuously monitors repo structure against reference repos. Detects drift in o |
| `analyst` | orchestration | Pre-planning consultant for requirements analysis (Opus) |
| `architect` | orchestration | Strategic Architecture & Debugging Advisor (Opus, READ-ONLY) |
| `backend` | coding | Backend agent — builds APIs, database schemas, server logic, and integrations |
| `code-reviewer` | orchestration | Expert code review specialist with severity-rated feedback, logic defect detecti |
| `code-simplifier` | coding | Simplifies and refines code for clarity, consistency, and maintainability while  |
| `commander` | orchestration | Orchestrator — dispatches work, manages agents, synthesizes updates |
| `critic` | orchestration | Work plan and code review expert — thorough, structured, multi-perspective (Opus |
| `debugger` | coding | Root-cause analysis, regression isolation, stack trace analysis, build/compilati |
| `deploy` | operations | Deploy agent — handles production deployments, rollbacks, and health verificatio |
| `designer` | coding | UI/UX Designer-Developer for stunning interfaces (Sonnet) |
| `docs` | content | Documentation agent — generates API references, SDK guides, code examples, chang |
| `document-specialist` | orchestration | External Documentation & Reference Specialist |
| `executor` | coding | Focused task executor for implementation work (Sonnet) |
| `explore` | orchestration | Codebase search specialist for finding files and code patterns |
| `git-master` | coding, operations | Git expert for atomic commits, rebasing, and history management with style detec |
| `growth` | growth | Growth agent — drives user acquisition, SEO, analytics, and conversion optimizat |
| `harness-researcher` | orchestration | Continuously researches improvements to the harness itself. Runs in background d |
| `ops` | coding, operations | Operations agent — manages infrastructure, CI/CD, monitoring, and incident respo |
| `paper-reader` | orchestration | Reads academic and technical papers, extracts key findings, and updates the know |
| `planner` | orchestration | Strategic planning consultant with interview workflow (Opus) |
| `qa-tester` | quality | Interactive CLI testing specialist using tmux for session management |
| `researcher` | orchestration | Research agent — gathers knowledge, runs experiments, produces research briefs b |
| `scientist` | orchestration | Data analysis and research execution specialist |
| `security-reviewer` | orchestration | Security vulnerability detection specialist (OWASP Top 10, secrets, unsafe patte |
| `slop-cleaner` | quality | Continuously monitors and cleans AI-generated slop from the codebase |
| `test-engineer` | quality | Test strategy, integration/e2e coverage, flaky test hardening, TDD workflows |
| `tracer` | orchestration | Evidence-driven causal tracing with competing hypotheses, evidence for/against,  |
| `verifier` | quality | Verification strategy, evidence-based completion checks, test adequacy |
| `website` | coding | Frontend agent — builds, tests, and deploys the user-facing website |
| `writer` | content | Technical documentation writer for README, API docs, and comments (Haiku) |
| `writing` | content | Content agent — creates copy, marketing pages, docs, blog posts, and social medi |

</details>

## Skills (121)

To add a skill, create `skills/<name>/SKILL.md` with YAML frontmatter. To enable/disable:

```bash
node .harness/hooks/skill-config.mjs disable <name>
node .harness/hooks/skill-config.mjs enable <name>
```

<details>
<summary><strong>Orchestration</strong> (20)</summary>
<br>

**Agents:** alignment, analyst, architect, code-reviewer, commander, critic, document-specialist, explore, harness-researcher, paper-reader, planner, researcher, scientist, security-reviewer, tracer

| Skill | Description |
|-------|-------------|
| agent-creator | Create new agent definitions with specific instruction sets, skill assignments, and beh... |
| autopilot | Full autonomous execution from idea to working code |
| cancel | Cancel any active OMC mode (autopilot, ralph, ultrawork, ultraqa, swarm, ultrapilot, pi... |
| context-reset-handler | Detect context window limits and perform clean resets with structured handoff documents... |
| debug | Diagnose the current OMC session or repo state using logs, traces, state, and focused r... |
| deep-dive | "2-stage pipeline: trace (causal investigation) -> deep-interview (requirements crystal... |
| error-classifier | Classify errors as FATAL, TRANSIENT, or UNKNOWN and transform raw stack traces into act... |
| github-state-manager | Track all task state via GitHub Issues and Project boards with automated column transit... |
| issue-creator | Turn a one-line request into a schema-compliant GitHub issue draft or creation command.... |
| loop-prompt | Generate optimized loop prompts for agents that run continuously. Use when spawning per... |
| ralph | Self-referential loop until task completion with configurable verification reviewer |
| self-improve | Autonomous evolutionary code improvement engine with tournament selection |
| startup-init | Autonomous startup builder — idea to running company in 11 phases |
| team | N coordinated agents on shared task list using Claude Code native teams |
| tiered-memory | Three-tier memory system (hot, warm, cold) to prevent context pollution with stale stat... |
| tmux-spawn | Reliable agent spawning in tmux with load-wait and verification |
| trace | Evidence-driven tracing lane that orchestrates competing tracer hypotheses in Claude bu... |
| trajectory-logging | ATIF trajectory serialization with ring buffer for post-hoc debugging, eval dataset con... |
| ultraqa | QA cycling workflow - test, verify, fix, repeat until goal met |
| ultrawork | Parallel execution engine for high-throughput task completion |

</details>

<details>
<summary><strong>Strategy</strong> (8)</summary>
<br>

**Agents:** alignment, analyst, architect, code-reviewer, commander, critic, document-specialist, explore, harness-researcher, paper-reader, planner, researcher, scientist, security-reviewer, tracer

| Skill | Description |
|-------|-------------|
| avoid-feature-creep | Prevent feature creep when building software, apps, and AI-powered products. Use this s... |
| brand-guidelines | Extract and codify brand guidelines from design assets into a reusable brand configurat... |
| competitor-research | Deep competitor research using browser agents to visit actual competitor sites. Capture... |
| deep-interview | Socratic deep interview with mathematical ambiguity gating before autonomous execution |
| plan | Strategic planning with optional interview workflow |
| research | Query, store, and loop on persistent research knowledge. Check prior experiments before... |
| shape | Plan the UX and UI for a feature before writing code. Runs a structured discovery inter... |
| sprint-contracts | Negotiate structured success criteria contracts between generator and evaluator agents ... |

</details>

<details>
<summary><strong>Design</strong> (17)</summary>
<br>

**Agents:** backend, code-simplifier, debugger, designer, executor, git-master, ops, website

| Skill | Description |
|-------|-------------|
| adapt | Adapt designs to work across different screen sizes, devices, contexts, or platforms. I... |
| animate | Review a feature and enhance it with purposeful animations, micro-interactions, and mot... |
| asset-generation | Generate hero images, illustrations, and visual assets for SaaS websites using AI image... |
| bolder | Amplify safe or boring designs to make them more visually interesting and stimulating. ... |
| clarify | Improve unclear UX copy, error messages, microcopy, labels, and instructions to make in... |
| colorize | Add strategic color to features that are too monochromatic or lack visual interest, mak... |
| critique | Evaluate design from a UX perspective, assessing visual hierarchy, information architec... |
| delight | Add moments of joy, personality, and unexpected touches that make interfaces memorable ... |
| distill | Strip designs to their essence by removing unnecessary complexity. Great design is simp... |
| impeccable | Create distinctive, production-grade frontend interfaces with high design quality. Gene... |
| layout | Improve layout, spacing, and visual rhythm. Fixes monotonous grids, inconsistent spacin... |
| optimize | Diagnoses and fixes UI performance across loading speed, rendering, animations, images,... |
| overdrive | Pushes interfaces past conventional limits with technically ambitious implementations —... |
| polish | Performs a final quality pass fixing alignment, spacing, consistency, and micro-detail ... |
| quieter | Tones down visually aggressive or overstimulating designs, reducing intensity while pre... |
| typeset | Improves typography by fixing font choices, hierarchy, sizing, weight, and readability ... |
| website-creation | Build production-quality SaaS websites with opinionated design presets. Use when creati... |

</details>

<details>
<summary><strong>Build</strong> (15)</summary>
<br>

**Agents:** backend, code-simplifier, debugger, designer, executor, git-master, ops, website

| Skill | Description |
|-------|-------------|
| convex | Umbrella skill for all Convex development patterns. Routes to specific skills like conv... |
| convex-agents | Building AI agents with the Convex Agent component including thread management, tool in... |
| convex-best-practices | Guidelines for building production-ready Convex apps covering function organization, qu... |
| convex-component-authoring | How to create, structure, and publish self-contained Convex components with proper isol... |
| convex-cron-jobs | Scheduled function patterns for background tasks including interval scheduling, cron ex... |
| convex-file-storage | Complete file handling including upload flows, serving files via URL, storing generated... |
| convex-functions | Writing queries, mutations, actions, and HTTP actions with proper argument validation, ... |
| convex-http-actions | External API integration and webhook handling including HTTP endpoint routing, request/... |
| convex-migrations | Schema migration strategies for evolving applications including adding new fields, back... |
| convex-realtime | Patterns for building reactive apps including subscription management, optimistic updat... |
| convex-schema-validator | Defining and validating database schemas with proper typing, index configuration, optio... |
| convex-security-audit | Deep security review patterns for authorization logic, data access boundaries, action i... |
| convex-security-check | Quick security audit checklist covering authentication, function exposure, argument val... |
| stack-extend | Add a new tool to the project stack at runtime. Reads the tool catalog for known config... |
| test-generator | Auto-generate Vitest unit tests and Playwright e2e tests from product spec acceptance c... |

</details>

<details>
<summary><strong>Quality</strong> (10)</summary>
<br>

**Agents:** qa-tester, slop-cleaner, test-engineer, verifier

| Skill | Description |
|-------|-------------|
| accessibility-checker | Run automated WCAG 2.1 AA accessibility audits using axe-core via Playwright. Use when ... |
| audit | Run technical quality checks across accessibility, performance, theming, responsive des... |
| cubic-codebase-scan | Run periodic full-codebase security and quality scans via Cubic with automated GitHub I... |
| eval-framework | Evaluation framework using pass@k metrics to measure agent reliability with diff-based ... |
| gap-analysis | Compare a harness-built product against a reference product in the same category. Score... |
| performance-benchmark | Monitor Core Web Vitals (LCP, INP, CLS) using Lighthouse CI with budget thresholds and ... |
| security-scanner | Multi-layered security scanning for dependency vulnerabilities, secret detection, and O... |
| slop-cleaner | Clean AI-generated code slop with a regression-safe, deletion-first workflow |
| verify | Verify that a change really works before you claim completion |
| visual-qa-pipeline | Screenshot every page with Playwright, feed to visual QA agent for design evaluation, r... |

</details>

<details>
<summary><strong>Ship</strong> (5)</summary>
<br>

**Agents:** deploy, git-master, ops

| Skill | Description |
|-------|-------------|
| ci-cd-pipeline | Set up and maintain a GitHub Actions CI/CD pipeline with parallel lint/typecheck/test j... |
| dependency-manager | Automate dependency management with scheduled security audits, auto-created PRs for saf... |
| deploy-pipeline | Automated deploy pipeline for Vercel (frontend), Railway (backend), and Convex (databas... |
| legal-generator | Generate Terms of Service, Privacy Policy, and Cookie Policy from startup type and juri... |
| seo-setup | Generate comprehensive SEO assets from the product spec including sitemap.xml, robots.t... |

</details>

<details>
<summary><strong>Grow</strong> (9)</summary>
<br>

**Agents:** growth

| Skill | Description |
|-------|-------------|
| analytics-integration | Integrate PostHog product analytics into a Next.js application with page views, event t... |
| blog-scaffolder | Scaffold SEO-optimized blog post systems derived from product specs and competitor rese... |
| data-driven-blog | Create blog posts powered by unique data the SaaS generates. Use instead of generic AI ... |
| landing-page-optimizer | Run hypothesis-driven A/B tests on the landing page, measure conversion improvements vi... |
| programmatic-seo | Generate programmatic SEO pages at scale from structured data. Use when a SaaS has a na... |
| seo-chat | Query SEO Chat API for sourced SEO answers, URL audits, and content strategy. Use when ... |
| social-intelligence | Monitor social media platforms (Reddit, Twitter/X, LinkedIn, Hacker News) for startup m... |
| social-media | Generate and schedule platform-adapted social media posts with brand-consistent voice. ... |
| user-feedback-collector | Build an in-app feedback widget that collects user feedback, categorizes it by type (bu... |

</details>

<details>
<summary><strong>Operate</strong> (6)</summary>
<br>

**Agents:** deploy, git-master, ops

| Skill | Description |
|-------|-------------|
| cost-tracker | Per-agent per-session cost tracking with configurable ceilings and model tier optimizat... |
| error-tracking | Integrate error tracking with Sentry for frontend and backend applications. Capture, cl... |
| incident-response | Automated incident lifecycle from detection through diagnosis, fix, deploy, verificatio... |
| log-aggregation | Aggregate and search logs from Vercel and Railway with structured format, ring buffer s... |
| post-deploy-loop | Continuous post-deploy monitoring and growth loop. Use after deploying a startup to kee... |
| uptime-monitor | Continuous health check polling with failure detection, consecutive-failure thresholds,... |

</details>

<details>
<summary><strong>Comms</strong> (6)</summary>
<br>

**Agents:** docs, writer, writing

| Skill | Description |
|-------|-------------|
| anti-ai-writing | Detect and eliminate signs of AI-generated writing. Use when producing any user-facing ... |
| contributing-guide | Auto-generate a CONTRIBUTING.md covering dev setup, coding standards, and PR process. U... |
| documentation-generator | Auto-generate user-facing documentation including API reference, user guides, and chang... |
| investor-updates | Structured milestone progress reports posted to Slack with metrics from GitHub, CI, and... |
| readme-generator | Auto-generate a README.md with product overview, tech stack, setup instructions, and ar... |
| slack-course-correction | Detect user feedback in Slack threads, classify intent, and propagate direction changes... |

</details>

<details>
<summary><strong>Uncategorized</strong> (25)</summary>
<br>

| Skill | Description |
|-------|-------------|
| ai-slop-cleaner | Clean AI-generated code slop with a regression-safe, deletion-first workflow and option... |
| ask | Process-first advisor routing for Claude, Codex, or Gemini via `omc ask`, with artifact... |
| ccg | Claude-Codex-Gemini tri-model orchestration via /ask codex + /ask gemini, then Claude s... |
| configure-notifications | Configure notification integrations (Telegram, Discord, Slack) via natural language |
| deepinit | Deep codebase initialization with hierarchical AGENTS.md documentation |
| external-context | Invoke parallel document-specialist agents for external web searches and documentation ... |
| hud | Configure HUD display options (layout, presets, display elements) |
| learner | Extract a learned skill from the current conversation |
| mcp-setup | Configure popular MCP servers for enhanced agent capabilities |
| omc-doctor | Diagnose and fix oh-my-claudecode installation issues |
| omc-reference | OMC agent catalog, available tools, team pipeline routing, commit protocol, and skills ... |
| omc-setup | Install or refresh oh-my-claudecode for plugin, npm, and local-dev setups from the cano... |
| omc-teams | CLI-team runtime for claude, codex, or gemini workers in tmux panes when you need proce... |
| project-session-manager | Worktree-first dev environment manager for issues, PRs, and features with optional tmux... |
| ralplan | Consensus planning entrypoint that auto-gates vague ralph/autopilot/team requests befor... |
| release | Generic release assistant — analyzes repo release rules, caches them in .omc/RELEASE_RU... |
| remember | Review reusable project knowledge and decide what belongs in project memory, notepad, o... |
| review | Third-party review of finished Claude sessions. Reads completion signals written by the... |
| sciomc | Orchestrate parallel scientist agents for comprehensive analysis with AUTO mode |
| setup | Use first for install/update routing — sends setup, doctor, or MCP requests to the corr... |
| skill | Manage local skills - list, add, remove, search, edit, setup wizard |
| skillify | Turn a repeatable workflow from the current session into a reusable OMC skill draft |
| visual-verdict | Structured visual QA verdict for screenshot-to-reference comparisons |
| wiki | LLM Wiki — persistent markdown knowledge base that compounds across sessions (Karpathy ... |
| writer-memory | Agentic memory system for writers - track characters, relationships, scenes, and themes |

</details>

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

## Plugin layout

All plugin-distributed functionality lives at the repo root — no `packages/` sub-monorepo in v1.0.0.

| Path | What |
|---------|------|
| `skills/` | 121 SKILL.md definitions (37 OMC + 84 harness-specific) |
| `agents/` | 32 agent prompts with per-agent scope configs in `.harness/agents/*.json` |
| `hooks/` | Plugin-shipped hooks (node `.mjs`/`.cjs`). Wired to every Claude Code hook event type. |
| `.claude/hooks/` | Legacy hook location (now points to `.harness/hooks/`). |
| `.harness/hooks/` | Canonical runtime-agnostic hooks — work with both Claude Code and Codex CLI. |
| `.codex/` | Generated Codex CLI configuration (`config.toml`, `hooks.json`). |
| `dist/` | Vendored OMC compiled TypeScript runtime (476 `.js` files) — powers the advanced paths of hooks that dynamic-import it. |
| `bridge/` | Bundled daemons — `mcp-server.cjs` (registered MCP server `t`), `cli.cjs` (the `omc` binary), `team-bridge.cjs` + `team-mcp.cjs` + `runtime-cli.cjs` (tmux-pane orchestration). |
| `chains/` | `skill-chains.json` — deterministic flow enforcement (website-end-to-end, startup-end-to-end, deploy-loop, debug-loop). |
| `commands/` | Slash commands (resume, startup-init). |
| `scripts/` | `run.cjs` universal hook wrapper + maintenance scripts. |
| `.claude-plugin/` | `plugin.json` + `marketplace.json`. |

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
├── hooks/                     Plugin-shipped hooks (node .mjs/.cjs) + hooks.json
├── .claude/hooks/             Repo-local dev hooks (not shipped)
├── dist/                      Vendored OMC compiled runtime (476 .js files)
├── bridge/                    mcp-server.cjs, cli.cjs (omc binary), team-bridge.cjs
├── chains/skill-chains.json   Deterministic skill-chain enforcement (4 flows)
├── scripts/run.cjs            Universal hook wrapper (cross-platform Node resolver)
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
