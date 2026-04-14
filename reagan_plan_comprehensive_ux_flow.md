# Comprehensive Startup Harness UX Flow

**This is not a website builder. This is a full company operating system.**

The harness handles everything a founder needs — from idea to running company. For ANY type of startup: B2C app, devtool, infra company, hardware+software, marketplace, SaaS, anything.

---

## Phase 0: Onboarding (one-time)

### 0.1 Account Connections
Walk the user through connecting every service they'll need:
- GitHub (repo hosting, CI/CD, issues)
- Vercel (frontend deploy)
- Railway (backend deploy)
- Convex (database)
- Slack (communication)
- Figma (design)
- Stripe (payments)
- Sentry (error tracking — via MCP)
- PostHog (analytics)
- Domain registrar (Namecheap, Cloudflare, etc.)
- Email provider (Resend, Sendgrid)
- Cloud provider (AWS, GCP — if infra startup)

### 0.2 Founder Profile
- What's your background? (technical, non-technical, domain expert)
- What's your budget? (bootstrapped, funded, enterprise)
- What's your timeline? (hackathon speed, methodical, enterprise)
- Solo founder or team?

---

## Phase 1: Ideation & Research

### 1.1 Intake
- "What's your startup idea?" (one sentence to one paragraph)
- "What type of startup is this?" (auto-detect or ask):
  - B2C consumer app
  - B2B SaaS
  - DevTool (CLI, SDK, API, library)
  - Infrastructure company
  - Marketplace (two-sided)
  - Hardware + software
  - Content/media platform
  - E-commerce
  - Fintech
  - Healthcare/biotech
  - AI/ML product

### 1.2 Market Research
- Competitor analysis (web search)
- Market sizing
- Target audience identification
- Pricing research
- Feature gap analysis
- Regulatory/compliance check (HIPAA for health, PCI for fintech, SOC2 for enterprise)

### 1.3 Product Spec
- Feature list with priorities (P0/P1/P2)
- User flows / user stories
- Data models
- API routes
- Third-party integrations needed
- Compliance requirements
- Acceptance criteria per feature (machine-verifiable)

### 1.4 Business Model
- Revenue model (subscription, usage-based, freemium, marketplace commission, one-time, ad-supported)
- Pricing tiers
- Unit economics (CAC, LTV projections)

**Investor Update:** "Research complete. [X] competitors found. Key differentiator: [Y]. Target market: [Z]."

---

## Phase 2: Design

### 2.1 Brand Identity
- Name validation (domain availability, trademark check)
- Color palette
- Typography
- Logo (Figma generation or placeholder)
- Voice/tone guidelines (stored in .harness/brand.yml)

### 2.2 UI/UX Design
- Wireframes (Figma)
- High-fidelity designs (Figma)
- Design system (Tailwind tokens, component library)
- Mobile responsive breakpoints
- Accessibility considerations (WCAG 2.1 AA)
- Dark mode

### 2.3 Domain & Email Setup
- Purchase/configure domain
- Set up DNS
- Configure email (custom domain with Resend or similar)
- SSL certificate (auto via Vercel/Cloudflare)

**Investor Update:** "Designs complete. Brand identity established. Domain configured."

---

## Phase 3: Infrastructure Setup

### 3.1 Repository Setup
- Create GitHub repo
- Scaffold from template (adaptive by startup type)
- Configure Taskfile
- Set up .harness/ configs
- Register hooks (GateGuard, config-protection, budget-enforcer)
- Set up .mcp.json (Cubic channel, Sentry MCP)

### 3.2 CI/CD Pipeline
- GitHub Actions (lint, typecheck, test on push)
- Staging environment (auto-deploy on PR merge)
- Production environment (deploy on release tag)
- Rollback mechanism

### 3.3 Deploy Infrastructure
- Vercel project (frontend)
- Railway project (backend, if needed)
- Convex project (database)
- Edge functions / serverless (if needed)
- CDN configuration

### 3.4 DevTool-Specific Infrastructure
- npm/PyPI package publishing pipeline
- Documentation site (Docusaurus, Mintlify, Nextra)
- API playground / sandbox
- SDK generation
- CLI distribution (Homebrew, npm global, curl installer)

### 3.5 Hardware-Specific Infrastructure
- Firmware CI/CD pipeline
- OTA update system
- Device provisioning / fleet management
- Hardware BOM tracking
- Manufacturing partner integration (PCBWay, JLCPCB APIs if available)
- Order management system

### 3.6 Monitoring & Observability
- Sentry (error tracking — via MCP)
- Uptime monitor (webhook → channel)
- Performance monitoring (Lighthouse CI)
- Log aggregation (Vercel + Railway logs via CLI)

**Investor Update:** "Infrastructure ready. CI/CD configured. Monitoring active."

---

## Phase 4: Build (TDD Loop)

### 4.1 Feature Decomposition
- Product spec → individual features
- Each feature → GitHub Issue with acceptance criteria
- Dependency graph (build order)
- Features → features/*.md checklists

### 4.2 Per-Feature Build Cycle
For each feature (one at a time, dependency order):
1. Write tests first (Vitest unit, Playwright e2e)
2. Implement feature
3. Run tests until green
4. Cubic review (via Cubic MCP or /cubic-run-review)
5. Visual QA (Playwright screenshots vs Figma)
6. Accessibility check (axe-core)
7. Performance check (Lighthouse)
8. Commit + push
9. Move GitHub Issue to Done
10. **Investor Update:** "Feature [X] complete. [Y/Z] features done."

### 4.3 Backend Build (if applicable)
- Database schema (Convex)
- API routes (Next.js API or standalone)
- Authentication (Clerk/Better Auth via stack-extend)
- Authorization / roles
- Rate limiting
- Webhooks (if the product receives them)

### 4.4 Integrations
- Payment processing (Stripe)
- Email sending (Resend)
- File uploads (Uploadthing)
- Search (Algolia, Typesense)
- Maps (if needed)
- Any domain-specific APIs

### 4.5 DevTool-Specific Build
- CLI implementation
- SDK client libraries (TypeScript, Python, Go, etc.)
- API documentation (OpenAPI spec → docs site)
- Getting started guide
- Code examples
- Migration guides

---

## Phase 5: Launch Preparation

### 5.1 Pre-Launch Checklist
- All P0 features complete
- All tests passing
- Cubic codebase scan clean
- Performance benchmarks within budget
- Accessibility audit passed
- Security scan clean
- Legal: Terms of Service, Privacy Policy (generated or template)
- Legal: Cookie consent (if EU users)
- Legal: GDPR data export/deletion (if EU)
- Analytics configured and verified
- Error tracking verified (trigger test error, confirm Sentry sees it)
- Uptime monitoring verified
- Backup strategy configured
- Rate limiting enabled
- SEO: sitemap, robots.txt, meta tags, OG images
- Social media accounts created (if content strategy)
- Support channel set up (email, Intercom, Discord)

### 5.2 Staging Validation
- Full e2e test suite on staging
- Manual smoke test (Playwright walks through core flows)
- Load test (if applicable)
- Payment flow test (Stripe test mode)

### 5.3 Production Deploy
- Deploy all services
- Health check all endpoints
- Run e2e tests against production
- Verify monitoring catches errors
- DNS propagation confirmed

**Investor Update:** "Launched. Live at [URL]. All systems green."

---

## Phase 6: Growth (ongoing, never stops)

### 6.1 Analytics & Metrics
- Daily/weekly metrics digest (PostHog → Slack)
- Funnel analysis
- Retention tracking
- Feature usage tracking

### 6.2 SEO & Content
- Blog posts (writing agent, weekly/biweekly)
- Social media (writing agent, scheduled posts)
- SEO optimization (growth agent monitors rankings)
- Landing page A/B testing

### 6.3 User Acquisition
- Product Hunt launch (writing agent drafts, human reviews)
- Hacker News "Show HN" (writing agent drafts)
- Reddit posts in relevant subreddits
- Twitter/X threads
- LinkedIn posts
- Dev.to / Hashnode articles (if devtool)
- YouTube demos / tutorials

### 6.4 User Feedback Loop
- In-app feedback widget
- User interviews (agent drafts questions, human conducts)
- NPS surveys
- Feature request tracking (→ GitHub Issues)
- Bug reports (→ GitHub Issues → ops agent)

### 6.5 Payments & Revenue
- Monitor Stripe dashboard
- Churn analysis
- Upgrade/downgrade tracking
- Invoice management
- Tax compliance (Stripe Tax)

**Investor Update (weekly):** "Week [N]: [X] users, [Y] revenue, [Z] features shipped. Top metric: [A]. Top issue: [B]."

---

## Phase 7: Maintenance (ongoing, reactive)

### 7.1 Error Response
- Sentry MCP detects error → ops agent investigates → fix → deploy → verify
- Escalate to Slack if can't fix within budget

### 7.2 Uptime
- Monitor goes down → webhook → ops agent → diagnose → fix → verify
- Status page updated automatically

### 7.3 Dependencies
- Weekly dependency audit (npm audit)
- Auto-update patches
- Flag breaking changes for human review

### 7.4 Performance
- Weekly Lighthouse CI run
- Alert on Core Web Vitals regression
- Database query performance monitoring

### 7.5 Security
- Monthly Cubic codebase scan
- Dependency vulnerability scanning
- Secret rotation reminders
- SSL certificate monitoring

### 7.6 Scaling
- Monitor resource usage (Railway, Vercel)
- Alert when approaching limits
- Scaling recommendations in investor updates

---

## Phase 8: Iteration (ongoing, proactive)

### 8.1 Feature Iteration
- User feedback → prioritize → spec → build (back to Phase 4)
- Growth experiments → measure → keep/discard
- Competitor feature tracking → respond

### 8.2 Platform Expansion
- Mobile app (React Native, Expo)
- Desktop app (Electron, Tauri)
- Browser extension
- API public release (if devtool)
- Marketplace integrations (Zapier, Make)

### 8.3 Team Scaling
- When to hire (agent suggests based on workload metrics)
- Job descriptions (writing agent drafts)
- Onboarding docs for new hires
- CONTRIBUTING.md maintained

### 8.4 Fundraising Support
- Pitch deck draft (writing agent)
- Metrics dashboard for investors
- Due diligence document preparation
- Cap table management recommendations

---

## Startup Type Adaptations

The flow above is the universal base. Each startup type adds or modifies steps:

### DevTool Additions
- Phase 3: npm/PyPI publishing, docs site, API playground, CLI distribution
- Phase 4: SDK client libraries, OpenAPI spec, code examples
- Phase 6: Developer advocacy, Stack Overflow presence, GitHub stars tracking
- Phase 7: Backward compatibility monitoring, deprecation management

### Hardware + Software Additions
- Phase 1: BOM research, manufacturing partner research
- Phase 3: Firmware CI/CD, OTA updates, device provisioning
- Phase 4: Hardware-software integration testing, power management
- Phase 5: FCC/CE certification tracking, manufacturing order placement
- Phase 7: Fleet monitoring, firmware rollback

### Marketplace Additions
- Phase 1: Supply/demand analysis, trust & safety requirements
- Phase 4: Two-sided onboarding, payment escrow, review system, dispute resolution
- Phase 6: Supply growth strategies, demand growth strategies separately
- Phase 7: Fraud detection, content moderation

### Fintech Additions
- Phase 1: Regulatory landscape (state-by-state, international)
- Phase 3: PCI compliance setup, encryption at rest
- Phase 4: Transaction reconciliation, audit logging, KYC/AML integration
- Phase 5: Compliance audit, penetration testing
- Phase 7: Transaction monitoring, regulatory reporting

### Healthcare Additions
- Phase 1: HIPAA requirements analysis
- Phase 3: HIPAA-compliant infrastructure (BAAs with providers)
- Phase 4: PHI handling, audit trails, consent management
- Phase 5: HIPAA compliance audit
- Phase 7: Breach notification procedures

---

## Agent Assignments

| Phase | Primary Agent | Supporting Agents |
|-------|--------------|-------------------|
| 0 (Onboarding) | Commander | — |
| 1 (Research) | Commander + web search | Writing (for reports) |
| 2 (Design) | Website agent (Figma) | Writing (brand voice) |
| 3 (Infrastructure) | Ops agent | Backend agent (if backend needed) |
| 4 (Build) | Website + Backend agents | Ops (CI/CD), Growth (analytics hooks) |
| 5 (Launch Prep) | Commander | All agents verify their domain |
| 6 (Growth) | Growth agent | Writing agent, Website agent (A/B tests) |
| 7 (Maintenance) | Ops agent | Website/Backend (fixes), Commander (escalation) |
| 8 (Iteration) | Commander (prioritization) | All agents (execution) |
