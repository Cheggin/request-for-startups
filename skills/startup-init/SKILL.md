---
name: startup-init
description: Autonomous startup builder — idea to running company in 11 phases
user-invocable: true
group: orchestration
prerequisites: []
next: []
workflows: [full-startup]
---

# /startup-init — Autonomous Startup Builder

Take a startup idea from zero to running company. Research, design, build, deploy, grow. The user is CEO, not engineer. They get Slack investor updates, not questions.

Read `.harness/stacks.yml` for stack. Read `.harness/agent-categories.yml` for rules. Read `.harness/tool-catalog.yml` for integrations. All are law.

---

## Execution Rules

- Phases run sequentially. Post Slack update after each phase.
- Track ALL work in GitHub Issues + Project board (Backlog | In Progress | In Review | Done).
- On context reset: `gh issue list --state open --json number,title,body,comments` to rebuild state.
- Coding phases: feature branches + PRs + Cubic review. Never push to main.
- Content phases: drafts first, check against SOUL.md.
- Never use Inter font, sparkles icon, `!important`, or left outlines.
- Constants in dedicated files. Reusable styles in global CSS. Fuzzy search for search features.
- Never run `yarn dev` or `npm run dev`. Use npm (not yarn, not pnpm).
- Auth is deferred until product spec confirms it. TDD always.
- Questions asked ONE AT A TIME. Never batch.

---

## PHASE 0 — Deep Founder Interview

**This is not "what's your idea?" It is a comprehensive diagnostic.** Ask each question one at a time. Wait for the answer before asking the next. Adapt follow-ups based on prior answers. Skip questions already answered.

### Interview Questions (sequential, one at a time)

**Q1: The Idea**
"What's your startup idea? One sentence to one paragraph."
Save raw answer to `.harness/idea.md`.

**Q2: Company Type**
"What type of company is this?"
Options: B2C consumer app | B2B SaaS | DevTool (CLI/SDK/API) | Infrastructure | Marketplace (two-sided) | Hardware + Software | E-commerce | Fintech | Healthcare/Biotech | AI/ML product | Content/Media platform | Other
Store as `startup_type` in `.harness/config.yml`.

**Q3: Target Users**
"Who are the target users? Be specific — a job title at a company type, not a category."
Push if vague. "Developers" is not specific. "Frontend engineers at mid-size SaaS companies frustrated with CSS-in-JS performance" is specific.

**Q4: Business Model**
"How does this make money?"
Options: Subscription (monthly/annual) | Usage-based (pay per API call, etc.) | Freemium (free tier + paid) | Marketplace commission | One-time purchase | Ad-supported | Open-core (open source + paid features) | Enterprise licensing | Not sure yet
Store as `business_model`.

**Q5: Budget & Funding**
"What's your budget situation?"
Options: Bootstrapped (minimal spend) | Pre-seed/angels ($0-$500K) | Seed ($500K-$2M) | Series A+ ($2M+) | Enterprise-backed (internal project)
Determines: infra choices, monitoring tier, tool selection.

**Q6: Technical Level**
"What's your technical background?"
Options: Non-technical (no coding) | Technical but not coding daily | Full-stack developer | Specialized (backend only, frontend only, ML/AI, etc.)
Determines: how much to explain, how autonomous to be, Slack update detail level.

**Q7: Existing Tools**
"What tools and services do you already use?"
Probe for: GitHub account? Vercel? Domain registrar? Figma? Slack workspace? Stripe? AWS/GCP? Any existing codebase?
Pre-populates Phase 1 service connections.

**Q8: Compliance Requirements**
"Any regulatory or compliance requirements?"
Probe based on startup_type:
- Healthcare → HIPAA, PHI handling, BAAs
- Fintech → PCI DSS, KYC/AML, state licensing
- Enterprise SaaS → SOC 2, GDPR, data residency
- E-commerce → PCI (if handling cards), sales tax
- Children/education → COPPA
- None identified → confirm "no special compliance needed"
Store as `compliance[]`.

**Q9: Hardware Component**
Only ask if startup_type includes hardware or if Q1 answer mentions physical products.
"Tell me about the hardware. What does the device do? What connectivity? What sensors/actuators?"
Probe: BOM estimate? Manufacturing partner? Firmware platform (ESP32, nRF, STM32, Raspberry Pi)?

**Q10: Integrations Needed**
"What third-party services need to connect?"
Probe based on startup_type:
- Payments → Stripe (default), alternatives?
- Maps/location → Google Maps, Mapbox?
- Messaging → Twilio, SendGrid, Resend?
- Search → Algolia, Typesense?
- AI/ML → OpenAI, Anthropic, Replicate?
- CRM → HubSpot, Salesforce?
- Calendar → Google Calendar, Cal.com?
Cross-reference answers against `.harness/tool-catalog.yml`.

**Q11: Timeline**
"What's your timeline?"
Options: Weekend hack (2-3 days) | Sprint (1-2 weeks) | Month | Quarter | Ongoing (no deadline)
Determines: P0 scope aggressiveness, whether to skip P1/P2 features initially.

**Q12: Existing Designs**
"Do you have any designs already?"
Probe: Figma file URL? Screenshots? Wireframes? Napkin sketches? Inspiration sites?
If Figma URL: use `mcp__figma__get_design_context` to extract immediately.
If screenshots: save to `.harness/design-inputs/`.
If inspiration: save URLs to `.harness/config.yml` under `design.inspirations[]`.

**Q13: Domain Name**
"Do you have a domain name? Or a name for the startup?"
If yes: validate availability via web search. Store in config.
If no: note "domain TBD" — will be resolved in Phase 4.

### Interview Output

Write `.harness/founder-profile.yml`:
```yaml
idea: <raw idea>
startup_type: <type>
target_users: <specific description>
business_model: <model>
budget: <tier>
technical_level: <level>
existing_tools: [<list>]
compliance: [<list>]
hardware: <null or description>
integrations: [<list>]
timeline: <timeline>
designs: <null, figma_url, or path>
domain: <name or TBD>
interview_date: <date>
```

**Slack:** "Founder interview complete. Building: {idea}. Type: {type}. Timeline: {timeline}. Starting service connections."

---

## PHASE 1 — Service Connections

Walk through each service. Validate before proceeding. Skip services the founder already confirmed in Q7.

**Agent:** Commander (orchestrates)

### 1.1 GitHub
```
Validate: gh auth status
Extract: username, org
Fail: "Run `gh auth login` in your terminal."
```

### 1.2 Vercel
```
Validate: vercel whoami
Fail: "Run `vercel login`"
```

### 1.3 Railway
```
Validate: railway whoami
Fail: "Run `railway login`"
```

### 1.4 Convex
```
Validate: ls ~/.convex/credentials 2>/dev/null || npx convex auth check
Fail: "Run `npx convex login`"
```

### 1.5 Cubic
```
Prompt: "Confirm Cubic GitHub App is installed on your account (cubic.dev)"
```

### 1.6 Slack
```
Prompt: "Where should investor updates go? (1) DM (2) #channel (3) group DM"
Validate: send test message via slack plugin
Store: slack_destination + slack_target -> .harness/config.yml
```

### 1.7 Figma
```
Validate: mcp__figma__whoami
Fail: "Reconnect via Figma plugin"
```

### 1.8 Stripe
Skip unless `business_model` requires payments. If needed:
```
Validate: stripe config --list 2>/dev/null
Fail: "Run `stripe login`"
```

### 1.9 Sentry
```
Prompt: "Create a Sentry project at sentry.io. We'll connect via MCP."
Store: SENTRY_DSN -> .harness/secrets.env
```

### 1.10 PostHog
```
Prompt: "Create a PostHog project at posthog.com (free tier is fine)."
Store: NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST -> .harness/secrets.env
```

### 1.11 Domain Registrar
Only if domain is confirmed from Q13.
```
Prompt: "Point your domain DNS to Vercel. Add these records: ..."
```

### 1.12 Persist
Write `.harness/secrets.env` (gitignored). Write `.harness/config.yml` with all connections.
Print connection summary table.

**Slack:** "All services connected. {N}/{M} configured. Starting market research."

---

## PHASE 2 — Research & Strategy

**Agent:** Commander + WebSearch | **Supporting:** Writing (reports)

### 2.1 Competitor Research
Use `WebSearch`. Search for:
- `"{keywords}" startup` / `"{keywords}" app` / `"{keywords}" SaaS`
- Competitors on Product Hunt, HN, Reddit, G2
- Design patterns competitors use

Per competitor: name, URL, features, pricing, strengths, weaknesses.

### 2.2 Market Sizing
- TAM/SAM/SOM estimates with sources
- Growth rate of the sector
- Adjacent markets

### 2.3 Target Audience Validation
- Validate the target users from Q3 against competitor user bases
- Identify underserved segments
- Pain points from Reddit, HN, Twitter discussions

### 2.4 Positioning Strategy
- Key differentiator (what competitors miss)
- Positioning statement (for {target}, who {need}, {product} is a {category} that {benefit})
- Pricing strategy benchmarked against competitors

### 2.5 Business Model Validation
- Unit economics projections (CAC, LTV) based on comparable companies
- Pricing tiers recommendation
- Revenue model viability assessment

### 2.6 Compliance Research
If `compliance[]` is non-empty:
- Specific requirements for each compliance framework
- Technical implications (encryption, audit logs, data residency)
- Timeline/cost estimates for certification

**Output:** Write `research-report.md` — executive summary, competitor table, market sizing, audience profile, positioning, compliance notes.
Create GitHub Issue: "Research: Market Analysis" with executive summary.

**Slack:** "Research complete. {N} competitors analyzed. Key differentiator: {one-liner}. Market size: {TAM}. Target: {audience}."

---

## PHASE 3 — Product Spec

**Agent:** Commander | **Reads:** `research-report.md`, `founder-profile.yml`, `.harness/stacks.yml`

### 3.1 Core Spec
Generate `product-spec.md` with:
- Product overview + value prop + persona
- Pages/routes (URL, purpose, components)
- Features grouped by page with acceptance criteria (machine-verifiable)
- Priority: P0 (MVP, must ship), P1 (important, next sprint), P2 (nice-to-have)

### 3.2 Data Model
- Convex schema (tables, fields, indexes, relationships)
- Data flow diagrams

### 3.3 API Design
- API routes (method, path, request/response, auth requirements)
- Third-party integration points from Q10
- Webhook endpoints (if receiving external events)

### 3.4 Component Inventory
- Component list (name, props, variants, usage)
- Shared vs page-specific components

### 3.5 Startup-Type Adaptations

**DevTool additions:**
- CLI command structure
- SDK interface design (TypeScript, Python, Go)
- OpenAPI spec outline
- Documentation site structure (getting started, API reference, examples)

**Hardware additions:**
- Firmware architecture
- Communication protocol (BLE, WiFi, LoRa, Zigbee)
- OTA update mechanism
- Device provisioning flow

**Marketplace additions:**
- Supply-side onboarding flow
- Demand-side onboarding flow
- Trust & safety requirements
- Payment escrow / split payment design
- Review/rating system

**Fintech additions:**
- Transaction flow with reconciliation
- Audit logging requirements
- KYC/AML integration points

**Healthcare additions:**
- PHI data flow mapping
- Consent management
- Audit trail design
- BAA requirements per vendor

### 3.6 Compliance Spec
If compliance requirements exist: map each requirement to specific technical implementation (encryption at rest, field-level encryption, audit tables, consent flows).

### 3.7 GitHub Issues
Create GitHub Issues for every P0/P1 feature with acceptance criteria and labels.
```bash
gh project create --title "{Startup Name}" --owner @me
```
Add all issues. Columns: Backlog, In Progress, In Review, Done.

**Slack:** "Product spec complete. {N} features ({P0} critical, {P1} important). Top priorities: {top 5 P0 features}."

---

## PHASE 4 — Design

**Agent:** Website (Figma) | **Supporting:** Writing (brand voice)

### 4.1 Brand Identity
- Name validation (domain availability check if not done)
- Color palette (saved as Tailwind tokens)
- Typography selection (NOT Inter)
- Logo placeholder
- Voice/tone guidelines (saved in SOUL.md or `.harness/brand.yml`)

### 4.2 UI/UX Design
If founder provided Figma designs (Q12): use those as source of truth.
If not: generate designs.

For each page in product spec:
1. Use `mcp__figma__generate_figma_design` — all components, desktop + mobile
2. Save screenshot to `.harness/design-screenshots/{page-name}.png`

Requirements:
- Mobile responsive breakpoints
- Accessibility (WCAG 2.1 AA)
- Dark mode (if applicable)
- Empty states, loading states, error states

### 4.3 Design System
Write `.harness/design-system.md` — colors, typography, spacing, component tokens.
Configure Tailwind v4 with these tokens.

### 4.4 Domain & Email Setup
If domain confirmed:
- Configure DNS
- Set up email (Resend with custom domain)
- SSL (auto via Vercel/Cloudflare)

**Slack:** "Designs complete. {N} pages in Figma. Brand identity established. {Figma URL if available}."

---

## PHASE 5 — Infrastructure Setup

**Agent:** Ops | **Supporting:** Backend

### 5.1 Repository Scaffold
```bash
npx create-next-app@latest {project-dir} --typescript --tailwind --eslint --app --turbopack --import-alias "@/*"
cd {project-dir}
npm install @tanstack/react-query zustand convex
npm install -D vitest @vitejs/plugin-react playwright @playwright/test
npx convex init
git init && git add . && git commit -m "Scaffold: {name} with Next.js + Convex + Tailwind v4"
gh repo create {repo-name} --private --source=. --push
```

### 5.2 CI/CD Pipeline
Write `.github/workflows/ci.yml`: vitest + playwright on push, Cubic scan on PR.
Configure: staging (auto-deploy on PR merge), production (deploy on release tag).

### 5.3 Deploy Infrastructure
- `vercel link` (frontend)
- `railway link` (backend, if needed)
- Convex project setup
- Environment variables in all services

### 5.4 Monitoring & Observability
- Sentry integration (via MCP + `@sentry/nextjs`)
- PostHog analytics setup
- Uptime monitoring (BetterUptime or OpenStatus)
- Lighthouse CI (performance baselines)

### 5.5 Startup-Type Infrastructure

**DevTool additions:**
- npm/PyPI publishing pipeline in CI
- Documentation site scaffold (Nextra, Mintlify, or Docusaurus)
- API playground / sandbox
- CLI distribution (Homebrew formula, npm global, curl installer)

**Hardware additions:**
- Firmware CI/CD pipeline (PlatformIO, Arduino CLI)
- OTA update server endpoint
- Device provisioning / fleet management dashboard
- BOM tracking spreadsheet or database table

**Marketplace additions:**
- Separate onboarding flows for supply + demand sides
- Stripe Connect for split payments

**Fintech additions:**
- PCI-compliant infrastructure configuration
- Encryption at rest for sensitive fields
- Audit log table + write-only API

**Healthcare additions:**
- HIPAA-compliant hosting configuration
- BAA tracking per vendor
- PHI encryption + access logging

### 5.6 Harness Configuration
- Set up `.harness/` configs
- Register hooks (GateGuard, config-protection)
- Set up `.mcp.json` (Cubic, Sentry)
- Configure Taskfile

**Slack:** "Infrastructure ready. Repo: {GitHub URL}. CI/CD configured. Monitoring active. Ready to build."

---

## PHASE 6 — Build (TDD Loop)

**Agents:** Website + Backend | **Supporting:** Ops (CI), Growth (analytics hooks)

### 6.1 Test Suite (Red Phase)
Write tests BEFORE implementation for every P0 feature:
- **Unit** (Vitest): acceptance criteria, edge cases, error states
- **E2E** (Playwright): user flows, navigation, forms, visual comparison vs design screenshots

```bash
npx vitest run --reporter=verbose   # ALL red
npx playwright test --reporter=list  # ALL red
```

Commit tests separately: `git commit -m "Tests: failing tests for {feature list}"`

### 6.2 Per-Feature Build Cycle
For each P0 feature in dependency order:

1. **Implement** — Read acceptance criteria from Issue. Read Figma via `mcp__figma__get_design_context`. Build it. Follow `.harness/design-system.md`.
2. **Gate 1: Tests** — `npx vitest run && npx playwright test`. Fix until green. Max 10 iterations.
3. **Gate 2: Cubic** — Create PR, push, get Cubic review. Fix issues. Max 5 loops.
4. **Gate 3: Visual QA** — `npx playwright test --grep @visual`. Compare vs design screenshots. Diff > 2%? Fix. Max 5 loops.
5. **Ship** — All gates green: `gh pr merge --squash`. Move Issue to Done.

**Slack per feature:** "Feature shipped: {name}. Tests: {N} passing. Cubic: clean. Progress: {done}/{total}."

### 6.3 Backend Build (if applicable)
- Convex schema + functions
- API routes
- Authentication (Clerk/Better Auth when ready)
- Authorization / roles
- Rate limiting (Upstash)
- Webhook receivers

### 6.4 Integration Build
- Payment processing (Stripe)
- Email sending (Resend)
- File uploads (Uploadthing)
- Search, maps, messaging per Q10
- Domain-specific APIs

### 6.5 DevTool-Specific Build
- CLI implementation
- SDK client libraries
- API documentation (OpenAPI spec)
- Getting started guide + code examples

### Context Reset Protocol
Context filling? Commit everything. Update all Issues with status. Next session:
```bash
gh issue list --state open --label "priority:P0" --json number,title,body,comments
gh project item-list --owner @me --format json
```

---

## PHASE 7 — Launch Preparation

**Agent:** Commander (coordinates all agents to verify their domain)

### 7.1 Legal
- Terms of Service (generated from template, adapted to startup type)
- Privacy Policy (adapted to compliance requirements)
- Cookie consent (if EU users / GDPR)
- GDPR data export/deletion endpoints (if EU)
- Any domain-specific legal (HIPAA notices, financial disclaimers)

### 7.2 SEO
- Sitemap generation (`sitemap.xml`)
- `robots.txt`
- Meta tags on all pages (title, description, OG images)
- Structured data / JSON-LD where applicable
- Social media preview cards

### 7.3 Analytics Verification
- PostHog events firing correctly
- Key funnels configured (signup, activation, conversion)
- Feature flags ready for experiments

### 7.4 Error Tracking Verification
- Trigger test error, confirm Sentry captures it
- Source maps uploaded
- Alert rules configured

### 7.5 Pre-Launch Checklist
- [ ] All P0 features complete and tested
- [ ] Cubic codebase scan clean
- [ ] Performance: Lighthouse score > 90
- [ ] Accessibility: axe-core audit passed
- [ ] Security: no exposed secrets, rate limiting enabled
- [ ] Monitoring: Sentry + uptime + PostHog all verified
- [ ] Legal: ToS + Privacy Policy published
- [ ] SEO: sitemap + robots.txt + meta tags
- [ ] Backup strategy configured
- [ ] Support channel set up (email, Discord, or Intercom)

### 7.6 Staging Validation
- Full e2e test suite on staging
- Payment flow test (Stripe test mode, if applicable)
- Manual smoke test (Playwright walks core flows)

**Slack:** "Launch checklist complete. {N}/{M} items verified. Ready to deploy."

---

## PHASE 8 — Deploy & Go Live

**Agent:** Ops | **Supporting:** All agents verify their domain

```bash
vercel --prod                          # Frontend
npx convex deploy                      # Database
railway up                             # Backend (if any)
curl -s -o /dev/null -w "%{http_code}" {prod-url}  # Health check
PLAYWRIGHT_BASE_URL={prod-url} npx playwright test   # E2E against prod
```

Fail? Read logs, fix, retry. Max 5 attempts. Still failing? Slack full error log.

**Slack:**
> **DEPLOYED — {Name} is LIVE**
> URL: {url}
> Features: {N} shipped. Tests: all passing. Cubic: clean.
> Stack: Next.js + Tailwind v4 + Convex on Vercel + Railway
> Next: {P1_count} features in backlog.

---

## PHASE 9 — Growth (ongoing)

**Agent:** Growth | **Supporting:** Writing, Website (A/B tests)

### 9.1 Analytics & Metrics
- Daily/weekly metrics digest (PostHog data → Slack)
- Funnel analysis (signup → activation → conversion)
- Retention tracking
- Feature usage tracking

### 9.2 Content Marketing
- Blog posts (Writing agent, weekly/biweekly)
- Social media posts (Writing agent)
- SEO optimization (Growth agent monitors rankings)
- Landing page A/B testing

### 9.3 User Acquisition Channels
- Product Hunt launch (Writing agent drafts, human reviews)
- Hacker News "Show HN"
- Reddit posts in relevant subreddits
- Twitter/X threads
- LinkedIn posts
- Dev.to / Hashnode articles (if DevTool)
- YouTube demos / tutorials

### 9.4 Payments & Revenue (if applicable)
- Stripe dashboard monitoring
- Churn analysis
- Upgrade/downgrade tracking
- Tax compliance (Stripe Tax)

**Slack (weekly):** "Week {N}: {X} users, {Y} revenue, {Z} features shipped. Top metric: {A}. Focus: {B}."

---

## PHASE 10 — Maintenance (ongoing, reactive)

**Agent:** Ops | **Supporting:** Website/Backend (fixes), Commander (escalation)

### 10.1 Error Response
Sentry MCP detects error → Ops agent investigates → fix → deploy → verify.
Escalate to Slack if can't fix within budget.

### 10.2 Uptime Monitoring
Monitor down → webhook → Ops agent → diagnose → fix → verify.
Status page updated automatically.

### 10.3 Dependency Updates
- Weekly `npm audit`
- Auto-update patches
- Flag breaking changes for human review

### 10.4 Performance Monitoring
- Weekly Lighthouse CI run
- Core Web Vitals regression alerts
- Database query performance

### 10.5 Security Scans
- Monthly Cubic codebase scan
- Dependency vulnerability scanning
- Secret rotation reminders
- SSL certificate monitoring

---

## PHASE 11 — Iteration (ongoing, proactive)

**Agent:** Commander (prioritization) | **Supporting:** All agents

### 11.1 User Feedback Loop
- In-app feedback widget
- NPS surveys
- Feature request tracking (→ GitHub Issues)
- Bug reports (→ GitHub Issues → Ops agent)
- User feedback → prioritize → spec → build (back to Phase 6)

### 11.2 A/B Testing
- Growth experiments via PostHog feature flags
- Measure → keep/discard
- Report results with actual numbers

### 11.3 Platform Expansion
- Mobile app (React Native, Expo)
- Desktop app (Electron, Tauri)
- Browser extension
- API public release (if DevTool)
- Marketplace integrations (Zapier, Make)

### 11.4 Fundraising Support (if applicable)
- Pitch deck draft (Writing agent)
- Metrics dashboard for investors
- Due diligence document preparation

---

## Agent Assignments Summary

| Phase | Primary Agent | Supporting Agents |
|-------|--------------|-------------------|
| 0 (Interview) | Commander | — |
| 1 (Connections) | Commander | — |
| 2 (Research) | Commander + WebSearch | Writing (reports) |
| 3 (Spec) | Commander | — |
| 4 (Design) | Website (Figma) | Writing (brand voice) |
| 5 (Infrastructure) | Ops | Backend |
| 6 (Build) | Website + Backend | Ops (CI), Growth (analytics) |
| 7 (Launch Prep) | Commander | All agents verify |
| 8 (Deploy) | Ops | All agents verify |
| 9 (Growth) | Growth | Writing, Website |
| 10 (Maintenance) | Ops | Website/Backend, Commander |
| 11 (Iteration) | Commander | All agents |

---

## Slack Update Templates

**Phase complete:** `{Name} — {Phase Title}` + 2-3 sentences + key metrics + next phase.
**Feature shipped:** `{Name} — Feature: {feature}` + test/cubic/visual status + progress fraction.
**Blocker:** `{Name} — Attention Needed` + issue + impact + plan. "Reply if you want a different approach."
**Weekly:** `{Name} — Week {N}` + shipped + in progress + blockers + metrics + ETA.
**Milestone:** `{Name} — LIVE` or `{Name} — {X} Users` + celebration + metrics.

---

## Error Recovery

| Scenario | Action |
|----------|--------|
| Auth expired | Slack user, pause |
| Tests loop > 10 | Slack details, skip feature, move on |
| Cubic > 20 issues | Break PR into smaller pieces |
| Figma MCP down | Build from spec + screenshots |
| Deploy fails x5 | Slack full error log |
| Context filling | Commit, update Issues, reset |
| Rate limited | Exponential backoff + retry |
| Compliance gap found | Slack immediately, do not ship without resolution |

---

## Course Correction

User replies in Slack? Pick up via `/slack:find-discussions`.
- Feature change → update spec + Issues
- Design change → update Figma + re-run visual QA
- Priority change → reorder queue
- Stop → halt, post status
- New feature → add to spec + Issue + queue
- Pivot → restart from Phase 2 with new direction

Acknowledge: "Got it. {change}. Adjusting."
