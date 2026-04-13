# Startup Harness — Phase 1: Onboarding & Website Implementation Plan

## Vision

A multi-agent orchestration system (Claude Code skill) that takes a startup idea as input and autonomously researches, designs, builds, deploys, and maintains a startup — reporting progress via Slack "investor updates" and accepting course corrections via Slack replies.

## Architecture Overview

```
User (Slack) <──> Slack Channel MCP <──> Claude Code Session
                                             │
                                    ┌────────┴────────┐
                                    │  Harness Core    │
                                    │  (Orchestrator)  │
                                    └────────┬────────┘
                                             │
                    ┌────────┬───────┬───────┼───────┬───────┬────────┐
                    │        │       │       │       │       │        │
                Researcher Planner Designer Builder  QA    Cubic   Deployer
                (web search)(spec) (Figma)  (code) (Playwright)(review)(infra)
                                             │
                                     GitHub Issues + 
                                     Project Board
                                     (state store)
```

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Entry point | Claude Code skill (`/startup-init`) | Keeps everything in the agent ecosystem |
| User input | Startup idea only | Maximum autonomy — system figures out everything |
| Approval model | Full autopilot + investor updates via Slack | User is CEO, not engineer. Reports, not gates. |
| Course correction | Slack two-way channel | User replies in Slack, system picks it up |
| Idea → Spec | Research-first | Study competitors/market before generating spec |
| Design | Generate in Figma first | Figma = source of truth, visual QA compares against it |
| State persistence | GitHub Issues + Project board | Single source of truth, user-visible, `gh` CLI friendly |
| Quality gates | Cubic + TDD + Playwright visual QA | Three independent evaluation layers |
| Stack config | `.harness/stacks.yml` | Structured, validatable, separate from agent instructions |
| Deploy target | Vercel (frontend) + Railway (backend) | Defined in `.harness/stacks.yml` |
| Website stack | Next.js + Turbopack + TanStack Query + Zustand + Tailwind v4 | Canonical stack for all projects |
| Database | Convex | Serverless, real-time, TypeScript-native |
| Testing | Vitest (unit) + Playwright (e2e) | TDD strategy: tests first, implement second |
| Auth | Deferred until harness complete | Skip auth screens during testing for easier Playwright/local dev |
| Cubic integration | Poll-based via MCP tools (no webhooks) | Cubic has MCP server + Claude Code plugin, not webhook push |

## Phase 1: Onboarding Skill (`/startup-init`)

### What it does

Takes a startup idea (one sentence to one paragraph) and produces:
1. A researched competitive landscape
2. A differentiated product spec
3. A Figma design
4. A deployed website with passing tests and clean Cubic review
5. A GitHub repo with Issues + Project board tracking all work

### Step-by-step flow

#### Step 0: Service Connection Wizard
- User runs `/startup-init` in Claude Code
- Skill walks user through connecting all required services, one at a time:

| # | Service | What's needed | How to connect | Required? |
|---|---------|--------------|----------------|-----------|
| 1 | **GitHub** | Personal access token (repo, webhook, project scopes) | `gh auth login` or provide token | Yes |
| 2 | **GitHub Webhook Secret** | Secret token for webhook payload verification | User generates in repo settings, provides to skill | Yes |
| 3 | **Vercel** | Account + CLI auth | `vercel login` | Yes |
| 4 | **Railway** | Account + CLI auth | `railway login` | Yes |
| 5 | **Convex** | Account + CLI auth | `npx convex login` | Yes |
| 6 | **Cubic** | API key (`cbk_` prefix) + GitHub App installed | User generates at cubic.dev dashboard | Yes |
| 7 | **Slack** | Workspace + channel for updates | Already connected via Slack plugin; skill asks which channel | Yes |
| 8 | **Figma** | Account access | Already connected via Figma plugin; skill confirms access | Yes |
| 9 | **Stripe** | API keys (publishable + secret) | User creates Stripe account, provides keys | Deferred (when billing feature needed) |

- Skill validates each connection before moving to next (e.g., `gh auth status`, `vercel whoami`, etc.)
- Credentials stored in `.harness/secrets.env` (gitignored) and/or environment variables
- **This step is generalizable**: any user, any repo — the wizard gets them connected
- Once all services are connected, skill proceeds to intake

#### Step 1: Intake
- Skill asks for one thing: "What's your startup idea?"
- User provides idea (free text)

#### Step 2: Research
- **Agent**: Researcher (web search)
- **Input**: The startup idea
- **Actions**:
  - Search for existing competitors and similar products
  - Identify market positioning opportunities
  - Analyze competitor feature sets, pricing, design patterns
  - Find the user's target audience and their pain points
- **Output**: `research-report.md` saved to repo, GitHub Issue created with findings
- **Investor update**: Posts to Slack — "Completed market research. Found X competitors. Key differentiator: Y."

#### Step 3: Spec Generation
- **Agent**: Planner (Opus-level)
- **Input**: Research report + startup idea
- **Actions**:
  - Generate product spec: pages, features, data models, API routes
  - Determine which components this specific idea needs (auth? billing? dashboard? etc.)
  - Define acceptance criteria for each feature (testable, concrete)
  - Read `.harness/stacks.yml` for tech stack constraints
- **Output**: `product-spec.md` saved to repo, GitHub Issues created for each feature
- **Investor update**: Posts to Slack — "Product spec complete. X features identified. Building: [feature list]."

#### Step 4: Design
- **Agent**: Designer (Figma MCP)
- **Input**: Product spec + research report (competitor design patterns)
- **Actions**:
  - Generate Figma design for each page/screen in the spec
  - Apply design system from `.harness/stacks.yml` (component library, colors, typography)
  - Use inspiration references from `reagan_inspirations_directory` for quality benchmarks
- **Output**: Figma file URL, screenshots saved to repo for visual QA reference
- **Investor update**: Posts to Slack — "Designs complete. [Figma link]. X pages designed."

#### Step 5: Scaffold
- **Agent**: Builder
- **Input**: Product spec + stacks.yml
- **Actions**:
  - Initialize repo with tech stack from stacks.yml
  - Set up project structure, config files, CI/CD
  - Create `.harness/` directory with state files
  - Set up GitHub Project board (columns: Backlog, In Progress, In Review, Done)
  - Configure Vercel project (`vercel link`, `vercel env`)
  - **Set up Cubic review pipeline (non-negotiable — see below)**:
    1. Install Cubic GitHub App on the repo
    2. Install Cubic plugin (`npx @cubic-plugin/cubic-plugin install --to claude`)
    3. Deploy Convex project for the cubic-channel event queue (`npx convex deploy`)
    4. Deploy cubic-channel webhook receiver to Railway (`railway up`)
    5. Configure GitHub webhook on the repo pointing at the Railway URL (events: `pull_request_review`, `pull_request_review_comment`, `issue_comment`)
    6. Register cubic-channel MCP server in `.mcp.json` with the Convex URL and repo name
    7. Verify end-to-end: push a test commit, confirm Cubic reviews, confirm events flow through to Convex
  - Configure Railway project for app backend (`railway link`)
  - Set up Convex for app data (`npx convex dev` for local, `npx convex deploy` for prod)
- **Output**: Clean repo with CI/CD, Cubic review pipeline, Vercel, Railway, and Convex configured
- **Ground truth**: Every agent session in this repo will have the cubic-channel MCP server running. All work goes through PRs. No PR merges without a clean Cubic review. Agents check `/cubic-comments` and fix until clean.

#### Step 6: TDD — Write Tests First
- **Agent**: Builder (test-writing mode)
- **Input**: Product spec + acceptance criteria
- **Actions**:
  - Write comprehensive tests for each feature BEFORE implementation
  - Unit tests, integration tests, e2e tests (Playwright)
  - Tests should initially ALL FAIL (red phase)
  - Commit tests separately — never in the same commit as implementation
- **Output**: Test suite committed, all tests red, GitHub Issues updated

#### Step 7: Implementation Loop
- **Agent**: Builder (implementation mode)
- **Input**: Failing tests + product spec + Figma designs
- **For each feature (one at a time)**:
  1. Implement the feature
  2. Run tests — iterate until green
  3. Submit to Cubic for code review
  4. If Cubic raises issues → fix and resubmit (loop until clean)
  5. Run Playwright visual QA against Figma screenshots
  6. If visual QA fails → fix and re-check (loop until passing)
  7. All three gates pass → commit, move GitHub Issue to Done
  8. **Investor update**: "Feature X complete. Tests passing. Cubic clean. Visual QA approved."
- **Never**: run tests and implementation at the same time (per TDD discipline)

#### Step 8: Deploy
- **Agent**: Deployer
- **Input**: Clean repo with all tests passing
- **Actions**:
  - Deploy to target from stacks.yml
  - Verify deployment is live (health check)
  - Run e2e tests against production URL
- **Output**: Live URL
- **Investor update**: "Website deployed. Live at [URL]. All tests passing in production."

### Quality Gate Pipeline (per feature)

```
Implementation → Tests Pass? ──No──→ Fix → (loop)
                    │
                   Yes
                    │
                    ▼
              Cubic Clean? ──No──→ Fix → (loop back to tests)
                    │
                   Yes
                    │
                    ▼
           Visual QA Pass? ──No──→ Fix → (loop back to tests)
                    │
                   Yes
                    │
                    ▼
                  SHIP ✓
```

## Components to Build

### 1. Onboarding Skill (`/startup-init`)
- **Type**: Claude Code skill (SKILL.md)
- **Location**: `.claude/skills/startup-init/`
- **Responsibilities**: Orchestrates the full onboarding flow (steps 1-8)

### 2. Slack Integration (existing plugin)
- **Type**: Already installed (`slack@claude-plugins-official`)
- **No custom MCP needed** — use existing Slack plugin skills
- **Responsibilities**:
  - Post investor updates to a designated Slack channel via `/slack:draft-announcement` or direct messaging
  - User replies in Slack; use `/slack:find-discussions` or channel monitoring to pick up corrections
  - Slack workspace/channel configured during onboarding step

### 3. Cubic Webhook Channel (two-part: Railway receiver + local MCP channel)

Channels must run locally (Claude Code spawns them as subprocesses over stdio). GitHub can't POST to localhost. So we split into two parts:

**Part A: Railway Webhook Receiver (remote, per-user)**
- **Type**: Thin HTTP server deployed to user's Railway account during onboarding
- **Responsibilities**:
  - Receive GitHub webhook payloads (`pull_request_review`, `issue_comment` events)
  - Verify webhook signature using the user's GitHub webhook secret
  - Filter for Cubic-authored comments (ignore human comments)
  - Write payload to Convex (already in the stack) as a queued event
- **Why Convex**: Already in the stack, has real-time subscriptions, no extra infra needed

**Part B: Local MCP Channel Server (spawned by Claude Code)**
- **Type**: MCP channel server (TypeScript, Bun), runs locally
- **Pattern**: Chat platform polling pattern from `reference/niche-documentation/channels-reference.md`
- **Responsibilities**:
  - Subscribe to Convex real-time updates for new Cubic review events
  - Push events into Claude Code session via `mcp.notification()` as `<channel>` tags
  - Expose reply tool so Claude can mark issues as resolved

**Architecture**:
```
Cubic reviews PR → GitHub webhook fires
    → Railway receiver (verifies signature, filters for Cubic)
    → Writes to Convex (real-time event queue)
    → Local MCP channel subscribes to Convex
    → <channel source="cubic" pr="123" file="src/app.tsx" severity="high">
        Line 42: Potential null reference...
      </channel>
    → Claude Code session fixes the issue
    → Pushes fix → Cubic re-reviews → webhook fires again → loop until clean
```

**Also use existing Cubic MCP tools** for on-demand queries:
- `get_pr_issues` — pull structured review data when needed
- `/cubic-run-review` — local pre-commit review before pushing
- `/cubic-scan` — security scans

**Generalizability**: During onboarding (Step 0), the skill:
1. Deploys the Railway webhook receiver to the user's Railway account
2. Configures the GitHub webhook on the user's repo (using their webhook secret)
3. Sets up the local MCP channel with Convex credentials
4. Registers the channel in `.mcp.json` so Claude Code spawns it automatically

### 4. Stack Config (`.harness/stacks.yml`)
- **Type**: YAML config file
- **Contents**: Website stack, infra stack, design system, deploy target, Cubic config
- **Location**: `.harness/stacks.yml` in every generated project

### 5. GitHub State Manager
- **Type**: Utility functions within the harness
- **Responsibilities**:
  - Create/update GitHub Issues for each task
  - Manage Project board (move cards between columns)
  - Post comments as audit trail
  - Query state for context resets (read Issues to rebuild context)

## Resolved Gaps

1. ~~**Cubic specifics**~~: Cubic has a full MCP server + Claude Code plugin. Poll-based via `get_pr_issues` and `/cubic-run-review`. No custom MCP needed.
2. ~~**stacks.yml schema**~~: Defined in `.harness/stacks.yml` — Next.js + Turbopack + TanStack Query + Zustand + Tailwind v4, Convex DB, Vercel + Railway deploy, Vitest + Playwright testing.
3. ~~**Slack workspace setup**~~: Configured during onboarding. The skill sets up the Slack channel MCP as part of Step 1.

## Remaining Gaps

1. **Context reset strategy**: When the harness hits context limits during the implementation loop, how does it hand off? Proposed: full context reset, new session reads open GitHub Issues to rebuild understanding. The harness-design article confirms resets beat compaction.
2. **Cost management**: Running Opus 24/7 with web search, Figma, Playwright, Cubic... should the harness have a cost cap per project?
3. **Multi-project support**: Does one harness instance manage one startup, or can it manage multiple?
4. **Auth implementation timing**: Auth is deferred for easier testing. Need a clear trigger for when to enable it (e.g., "before first real user" or "during Growth phase").
5. **The other phases**: Ideation (pre-onboarding brainstorming?), Growth (SEO, marketing, analytics?), Maintenance (monitoring, incident response?) — these come after Phase 1 but should inform the architecture now.

## Acceptance Criteria

- [ ] User runs `/startup-init`, provides an idea, and walks away
- [ ] System completes research, spec, design, build, and deploy without further input
- [ ] User receives investor updates in Slack at each milestone
- [ ] User can reply in Slack to course-correct and the system adjusts
- [ ] Every feature passes three quality gates: tests (TDD), Cubic (code review), Playwright (visual QA)
- [ ] All state is tracked in GitHub Issues + Project board
- [ ] Context resets don't lose progress (state rebuilt from GitHub Issues)
- [ ] Deployed website is live and functional at the end

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Figma design quality is poor | Visual QA has no good baseline | Use inspiration references as quality benchmark; evaluator agent judges aesthetics independently as fallback |
| Cubic feedback loop is infinite | Feature never ships | Max 5 Cubic iterations per feature; if still failing, flag in Slack update and move on |
| Research phase produces shallow results | Bad spec, bad product | Use multiple search queries, cross-reference sources, validate findings against existing competitor analysis |
| Context window fills during long impl loop | Lost progress, hallucination | Use GitHub Issues as handoff state; context resets with fresh session reading Issues |
| Slack channel goes down | User loses visibility | Fall back to GitHub Issue comments as backup notification path |
| Tests are too brittle / too loose | False confidence or infinite red | Evaluator agent reviews test quality alongside implementation quality |

## Next Steps

1. **Build**: Cubic Webhook Channel MCP server (receives GitHub webhooks, pushes to Claude Code session)
2. **Build**: The onboarding skill skeleton (`/startup-init` SKILL.md)
3. **Build**: The quality gate pipeline skill (TDD → Cubic review loop → Visual QA)
4. **Build**: The GitHub state manager (Issues + Project board via `gh` CLI)
5. **Build**: Investor update formatter (structured messages via existing Slack plugin)
6. **Configure**: Cubic plugin install + GitHub webhook setup as part of scaffold step
7. **Integrate**: Wire everything together — skill orchestrates agents through steps 1-8
8. **Test**: End-to-end test with a sample startup idea
