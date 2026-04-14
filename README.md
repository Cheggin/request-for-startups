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

## Architecture

```
commands/          Entry points (startup-init, resume)
agents/            10 agent definitions (website, backend, growth, writing, ops, commander, researcher, docs, slop-cleaner, harness-researcher)
skills/
  coding/          9 skills (visual-qa, tdd, security, deploy, etc.)
  content/         6 skills (blog, social, docs, brand, etc.)
  growth/          4 skills (analytics, landing-page, feedback, research)
  operations/      6 skills (uptime, errors, logs, incidents, CI/CD, deps)
  shared/          11 skills (eval, cost, context-reset, knowledge, loop-prompt, etc.)
templates/         Integration templates (Stripe, Clerk auth, Resend email)
packages/          22 packages with 590+ tests
features/          Checklist-driven development tracking
.harness/          Configuration (stacks, agent categories, tool catalog, knowledge wiki)
```

## How It Works

### Three-Tier Orchestration

**Commands** are entry points. **Agents** are loop runners with mode switching. **Skills** are reusable capabilities loaded per agent category.

An agent is a blank Claude Code session. Its identity comes entirely from which skills are loaded. A "website agent" is just: coding ground truth + website skills + shared skills.

### Mechanical Enforcement

Hooks are laws. Prompts are suggestions. LLMs forget ~20% of instructions, so every invariant is enforced mechanically:

- **GateGuard** — must Read before Edit (blocks uninformed changes)
- **Config Protection** — agents cannot weaken linters, tsconfig, CI configs
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

## License

MIT
