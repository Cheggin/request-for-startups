# /startup-init — Autonomous Startup Builder

You take a startup idea and ship it. Research, design, build, deploy. The user is CEO, not engineer. They get Slack investor updates, not questions.

Read `.harness/stacks.yml` for stack. Read `.harness/agent-categories.yml` for rules. Both are law.

## Execution Rules

- Steps run sequentially. Post Slack update after each.
- Track ALL work in GitHub Issues + Project board (Backlog | In Progress | In Review | Done).
- On context reset: `gh issue list --state open --json number,title,body,comments` to rebuild state.
- Coding steps: feature branches + PRs + Cubic review. Never push to main.
- Content steps: drafts first, check against SOUL.md.
- Never use Inter font, sparkles icon, `!important`, or left outlines.
- Constants in dedicated files. Reusable styles in global CSS. Fuzzy search for search features.
- Never run `yarn dev` or `npm run dev`. Use npm (not yarn, not pnpm).
- Auth is deferred. TDD always. Tests and implementation committed separately.

---

## STEP 0 — Service Connections

Walk through each service. Validate before proceeding. Only interactive step.

### 0.1 GitHub
```
Prompt: "Let's connect services. First — run `gh auth login` if needed."
Validate: gh auth status
Extract: username, org
Fail: "Run `! gh auth login` in your terminal."
```

### 0.2 Webhook Secret
```
Generate: openssl rand -hex 32
Store: GITHUB_WEBHOOK_SECRET -> .harness/secrets.env
Note: webhook configured during scaffold step
```

### 0.3 Vercel
```
Validate: vercel whoami
Fail: "Run `! vercel login`"
```

### 0.4 Railway
```
Validate: railway whoami
Fail: "Run `! railway login`"
```

### 0.5 Convex
```
Validate: ls ~/.convex/credentials 2>/dev/null || npx convex auth check
Fail: "Run `! npx convex login`"
```

### 0.6 Cubic
```
Prompt: "Confirm Cubic GitHub App is installed on your account (cubic.dev)"
No API key needed. Runs automatically on PRs via GitHub App.
```

### 0.7 Slack
```
Prompt: "Where should investor updates go? (1) DM (2) #channel (3) group DM"
Validate: send test message via slack plugin
Store: slack_destination + slack_target -> .harness/config.yml
```

### 0.8 Figma
```
Validate: mcp__figma__whoami
Fail: "Reconnect via Figma plugin"
```

### 0.9 Stripe
Skip. Deferred until product spec includes billing.

### 0.10 Persist
Write `.harness/secrets.env` (gitignored) with webhook secret.
Write `.harness/config.yml` with: github_user, vercel_team, railway_team, convex_team, slack_destination, slack_target, cubic_github_app, figma_configured, onboarding_complete.
Print connection summary table. Post Slack: "Harness initialized. All services connected. Awaiting idea."

---

## STEP 1 — Intake

Ask ONE question: **"What's your startup idea?"**

Accept as-is. No clarifying questions. No technical preferences. Save to `.harness/idea.md`.

---

## STEP 2 — Research

Use `WebSearch` tool. Search for:
- `"<keywords>" startup` / `"<keywords>" app` / `"<keywords>" SaaS`
- Competitors on Product Hunt, HN, Reddit
- Target audience pain points, market size, pricing models
- Design patterns competitors use

Per competitor: name, URL, features, pricing, strengths, weaknesses, design quality.

Synthesize: what's missing? Where's the opening?

**Output:** Write `research-report.md` — executive summary, competitor table, audience profile, differentiation strategy, design notes.
Create GitHub Issue: "Research: Competitive Landscape" with executive summary.

**Slack:** "Market Research Complete. Found {N} competitors. Key insight: {one-liner}. Target audience: {description}."

---

## STEP 3 — Spec

Read `research-report.md` + `.harness/stacks.yml`.

Generate `product-spec.md` with:
- Product overview + value prop + persona
- Pages/routes (URL, purpose, components)
- Features grouped by page with acceptance criteria. Priority: P0 (MVP), P1 (important), P2 (nice-to-have)
- Convex schema (tables, fields, indexes, relationships)
- API routes (method, path, request/response, auth)
- Component inventory (name, props, variants, usage)

Create GitHub Issues for every P0/P1: `[Feature] {name}`, body = description + acceptance criteria, labels = `priority:P0`/`priority:P1` + `status:backlog`.

```bash
gh project create --title "{Startup Name}" --owner @me
```
Add all issues. Columns: Backlog, In Progress, In Review, Done.

**Slack:** "Product Spec Complete. {N} features ({P0} P0, {P1} P1). Building: {top 5}."

---

## STEP 4 — Design

Read `product-spec.md` + `research-report.md`. Check `.harness/stacks.yml` `design.inspiration_dir`.

For each page:
1. Use `mcp__figma__generate_figma_design` — all components, desktop + mobile
2. Save screenshot to `.harness/design-screenshots/{page-name}.png`

Write `.harness/design-system.md` — colors, typography, spacing, component decisions.

**Slack:** "Designs Complete. {N} pages in Figma. {Figma URL}."

---

## STEP 5 — Scaffold

Deterministic. No creative decisions. Initialize repo with full stack.

```bash
# 1. Init Next.js
npx create-next-app@latest {project-dir} --typescript --tailwind --eslint --app --turbopack --import-alias "@/*"
cd {project-dir}

# 2. Install deps (from stacks.yml)
npm install @tanstack/react-query zustand convex
npm install -D vitest @vitejs/plugin-react playwright @playwright/test

# 3. Init Convex — set up schema from product-spec data models
npx convex init

# 4. Link services
vercel link
railway link

# 5. Git + GitHub
git init && git add . && git commit -m "Scaffold: {name} with Next.js + Convex + Tailwind v4"
gh repo create {repo-name} --private --source=. --push

# 6. Configure webhook (using secret from step 0.2)
gh api repos/{owner}/{repo}/hooks --method POST \
  -f 'config[url]={railway-receiver-url}' \
  -f 'config[secret]={webhook-secret}' \
  -f 'config[content_type]=json' \
  -f 'events[]=pull_request_review' -f 'events[]=issue_comment'

# 7. Cubic
npx @cubic-plugin/cubic-plugin install --to claude
```

Write `.github/workflows/ci.yml`: vitest + playwright on push, Cubic scan on PR.

Project structure:
```
app/              # routes from spec
components/ui/    # reusable components
convex/           # schema + functions
lib/              # constants.ts, utils.ts
tests/unit/       # vitest
tests/e2e/        # playwright
.harness/         # stacks.yml, config.yml, secrets.env, design-screenshots/
```

Configure Tailwind v4 with design tokens from Step 4. Global CSS with reusable styles.

**Slack:** "Repo Scaffolded. {GitHub URL}. Stack: Next.js + Convex + Tailwind v4. CI + Cubic configured."

---

## STEP 6 — TDD Red Phase

Write tests BEFORE implementation for every P0 feature. All must fail.

- **Unit** (Vitest) — `tests/unit/{feature}.test.ts`: acceptance criteria, edge cases, error states
- **E2E** (Playwright) — `tests/e2e/{feature}.spec.ts`: user flows, navigation, forms, visual comparison vs `.harness/design-screenshots/`

```bash
npx vitest run --reporter=verbose   # expect ALL red
npx playwright test --reporter=list  # expect ALL red
```

Commit tests separately: `git commit -m "Tests: failing tests for {feature list}"`
Update GitHub Issues: comment "Tests written (red)" on each.

**Slack:** "Test Suite Written. {N} unit, {M} e2e — all red. Ready to implement."

---

## STEP 7 — Build Loop

For each P0 feature in priority order. Move Issue to In Progress.

### 7.1 Implement
Read acceptance criteria from Issue. Read Figma via `mcp__figma__get_design_context`. Build it. Follow `.harness/design-system.md`.

### 7.2 Gate 1 — Tests
```bash
npx vitest run --reporter=verbose
npx playwright test --reporter=list
```
Fail? Fix, re-run. Max 10 iterations. Still failing? Slack + investigate.

### 7.3 Gate 2 — Cubic
```bash
git checkout -b feature/{name}
git add . && git commit -m "Implement: {feature}"
git push -u origin feature/{name}
gh pr create --title "{feature}" --body "Implements: {description}"
```
Check with `get_pr_issues` MCP tool or `/cubic-comments`. Issues? Fix, re-test, push, re-review. Max 5 Cubic loops. Still failing? Slack with details, proceed.

### 7.4 Gate 3 — Visual QA
```bash
npx playwright test --grep @visual
```
Compare vs `.harness/design-screenshots/`. Diff > 2%? Fix, re-test, re-check. Max 5 loops.

### 7.5 Ship
All gates green:
```bash
gh pr merge --squash
```
Move Issue to Done.

**Slack:** "Feature Shipped: {name}. Tests: {N} passing. Cubic: clean. Visual QA: matched. Progress: {done}/{total}."

### Context Reset
Context filling? Commit everything. Update all Issues with status. Next session reads Issues to resume:
```bash
gh issue list --state open --label "priority:P0" --json number,title,body,comments
gh project item-list --owner @me --format json
```

---

## STEP 8 — Deploy

```bash
# Frontend
vercel --prod

# Database
npx convex deploy

# Backend services (if any)
railway up

# Verify
curl -s -o /dev/null -w "%{http_code}" {prod-url}  # expect 200
PLAYWRIGHT_BASE_URL={prod-url} npx playwright test   # e2e against prod
```

Fail? Read logs (`vercel logs`, `railway logs`), fix, retry. Max 5 attempts. Still failing? Slack full error log.

**Slack:**
> **DEPLOYED — {Name} is LIVE**
> URL: {url}
> Features: {N} shipped. Tests: all passing. Cubic: approved. Visual QA: matched.
> Tech: Next.js + Tailwind v4 + Convex on Vercel + Railway
> Next: {P1_count} features in backlog. Reply here for changes.

---

## Slack Templates

**Milestone:** `{Name} — {Title}` + 2-3 sentences + key metrics + next.
**Feature:** `{Name} — Feature Shipped: {feature}` + tests/cubic/visual status + progress fraction.
**Blocker:** `{Name} — Attention Needed` + issue + impact + plan. "Reply if you want a different approach."
**Daily:** `{Name} — Daily Update` + completed + in progress + blockers + ETA.

---

## Error Recovery

| Scenario | Action |
|----------|--------|
| Auth expired | Slack user, pause |
| Tests loop >10 | Slack details, skip feature |
| Cubic >20 issues | Break PR smaller |
| Figma MCP down | Build from spec, note in Slack |
| Deploy fails x5 | Slack full error log |
| Context filling | Commit, update Issues, reset |
| Rate limited | Exponential backoff + retry |

---

## Course Correction

User replies in Slack? Pick it up via `/slack:find-discussions`.
- Feature change -> update spec + Issues
- Design change -> update Figma + re-run visual QA
- Priority change -> reorder queue
- Stop -> halt, post status
- New feature -> add to spec + Issue + queue

Acknowledge: "Got it. {change}. Adjusting."
