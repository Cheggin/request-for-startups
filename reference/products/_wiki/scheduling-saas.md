# Scheduling SaaS — Reference Wiki

**Reference product**: [cal.com](../cal.com/) (open-source scheduling infrastructure)

---

## Common Features

### Core Scheduling
- **Event types**: configurable meeting types with duration, location, and custom fields
- **Booking flow**: public booking pages with timezone-aware slot selection
- **Availability management**: per-user schedules with working hours, date overrides, buffer times
- **Calendar sync**: bidirectional sync with Google Calendar, Outlook, Apple Calendar
- **Round-robin assignment**: distribute bookings across team members with host prioritization (`getLuckyUser.ts`)
- **Recurring events**: series bookings with configurable frequency

### Teams & Organizations
- **Team scheduling**: collective and round-robin team event types
- **Organizations**: multi-team hierarchy with shared branding, SSO, and billing
- **Managed event types**: org-level templates pushed to team members

### Payments & Billing
- **Stripe integration**: collect payments at booking time
- **Per-seat billing**: team and org subscription tiers (monthly/annual)
- **Credit system**: org-level credit allocation with overage pricing

### Integrations (App Store)
- **100+ integrations** via a plugin-based app store architecture
- **Calendar providers**: Google, Outlook/Office365, Apple, CalDAV
- **Video conferencing**: Daily.co (native), Zoom, Google Meet, Microsoft Teams
- **CRM**: Salesforce, HubSpot, Close.com, Zoho
- **Messaging**: Slack, email (SendGrid), SMS (Twilio), WhatsApp
- **Automation**: Zapier, webhooks
- **Payment**: Stripe, HitPay

### Platform & Embeds
- **Embed SDK**: JavaScript embed (inline, popup, floating button) for third-party sites
- **Platform atoms**: React components for white-label scheduling
- **API v2**: RESTful public API with versioned endpoints
- **OAuth**: platform OAuth for third-party app developers

### Workflows & Automation
- **Workflow engine**: trigger-based automations (before/after event, on cancellation)
- **Reminder system**: email/SMS/WhatsApp reminders with configurable timing
- **Webhooks**: event-driven notifications for external systems

### AI Features
- **AI scheduling agent**: email-based AI assistant for scheduling
- **AI phone agent**: Retell AI-powered phone booking

---

## Tech Stack Patterns

### Framework & Runtime
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 13+ (App Router + Pages Router coexist) |
| Language | TypeScript (strict mode) |
| Runtime | Node.js |
| Package manager | Yarn 4.12 (Berry) with workspaces |
| Build orchestrator | Turborepo 2.7 |

### Data Layer
| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL |
| ORM | Prisma 6.x with generated types |
| Cache | Upstash Redis |
| Search | N/A (database queries) |

### API & Auth
| Layer | Technology |
|-------|-----------|
| Internal API | tRPC (type-safe client-server) |
| Public API | REST (API v2 with NestJS-style controllers) |
| Auth | NextAuth.js with SAML/SSO support |
| Rate limiting | express-rate-limit + Unkey |

### Frontend
| Layer | Technology |
|-------|-----------|
| Styling | Tailwind CSS |
| UI components | Custom `@calcom/ui` library |
| i18n | next-i18next (60+ locales) |
| Forms | React Hook Form |
| State | React context + tRPC cache |

### Infrastructure
| Layer | Technology |
|-------|-----------|
| Hosting | Vercel (primary), Docker, Heroku |
| Background jobs | Trigger.dev (async task runner) |
| Email | SendGrid, Resend |
| Monitoring | Sentry, Axiom, PostHog |
| Linting/formatting | Biome |
| CI/CD | GitHub Actions |

### Key Dependencies
- `dayjs` — timezone-aware date manipulation (with performance caveats)
- `date-fns` — lightweight date utilities for non-timezone work
- `zod` — schema validation for DTOs and API payloads
- `@evyweb/ioctopus` — dependency injection container
- `@faker-js/faker` — test data generation

---

## File Structure Conventions

```
calcom-monorepo/
├── apps/
│   ├── web/                    # Main Next.js application
│   │   ├── app/                # App Router routes
│   │   └── modules/            # Web-specific tRPC hooks and components
│   ├── api/
│   │   └── v2/                 # Public REST API (NestJS-style)
│   └── docs/                   # Documentation site
├── packages/
│   ├── prisma/                 # Database schema, migrations, seeds
│   ├── trpc/                   # tRPC routers (server/routers/)
│   ├── features/               # Domain vertical slices (core architecture)
│   │   ├── bookings/           # services/, repositories/, components/, tests/
│   │   ├── availability/
│   │   ├── calendars/
│   │   ├── ee/                 # Enterprise features (workflows, billing)
│   │   └── calendar-cache-sql/
│   ├── ui/                     # Shared UI component library
│   ├── lib/                    # Shared utilities (lowest dependency level)
│   │   └── dto/                # Data transfer objects
│   ├── app-store/              # 100+ integration plugins
│   │   └── {provider}/         # Each with config.json, api/, lib/, components/
│   ├── embeds/                 # Embed SDK (core, snippet, react)
│   ├── platform/               # Platform SDK and atoms
│   ├── i18n/                   # Translations (locales/en/common.json)
│   ├── emails/                 # Email templates
│   ├── types/                  # Shared type definitions
│   └── tsconfig/               # Shared TypeScript configs
├── turbo.json                  # Turborepo task pipeline
├── playwright.config.ts        # E2E test configuration
├── vitest.config.mts           # Unit test configuration
└── biome.json                  # Linting and formatting
```

### Naming Conventions
- **Repository files**: `Prisma{Entity}Repository.ts` (PascalCase, technology prefix)
- **Service files**: `{Entity}Service.ts` (PascalCase)
- **Components**: `{Name}.tsx` (PascalCase)
- **Utilities**: `{name}.ts` (kebab-case)
- **Types**: `{Entity}.types.ts`
- **Tests**: `{source}.test.ts` or `{source}.spec.ts`
- **E2E tests**: `{feature}.e2e.ts`
- **Generated files**: `*.generated.ts` (never edit manually)

### Architecture Rules
- **Vertical slices**: code organized by domain (`packages/features/{domain}/`) not technical layer
- **Dependency hierarchy**: `lib` → `app-store` → `features` → `trpc` → `apps/web` (no circular deps)
- **Repository pattern**: all database access behind repository classes (isolate Prisma)
- **DTO boundaries**: database types never leak to frontend; Zod-validated DTOs at every boundary
- **Feature boundaries**: cross-feature imports only through public API, never internal files
- **Thin controllers**: HTTP handlers only do request/response; business logic in services
- **Factory pattern**: push conditionals to entry points, keep services focused

---

## Testing Patterns

### Test Framework
| Type | Framework | Count |
|------|-----------|-------|
| Unit/Integration | Vitest 4.x | ~661 test files |
| E2E | Playwright 1.57 | ~100 e2e files |
| Embed E2E | Playwright (separate project) | Included above |
| Mocking | vitest-mock-extended, prismock | — |
| Component | @testing-library/react 16 | — |

### Test Commands
```bash
TZ=UTC yarn test              # All unit tests (timezone-normalized)
TZ=UTC yarn vitest run <path> # Single test file
yarn e2e                      # E2E tests (seeds DB first)
yarn test-e2e                 # Seed + E2E combined
yarn tdd                      # Watch mode for TDD
```

### Testing Conventions
- **TZ=UTC always**: prevents timezone-related flaky tests
- **Incremental fixing**: fix one file at a time, type errors before test failures
- **80%+ coverage**: enforced for new code via CI
- **Table-driven tests**: not emphasized (Go pattern, not as common here)
- **Mock Prisma, not the database**: use `prismock` for unit tests, real DB for integration
- **Fixtures over factories**: JSON fixtures for API responses

### CI Testing Pipeline
- `yarn type-check:ci --force` runs before tests
- `yarn biome check` for lint/format verification
- E2E tests gated behind `ready-for-e2e` label on PRs
- Flaky E2E tests are a known issue — focus on code-related failures only
- Pre-commit hooks via Husky + lint-staged

### Testing Anti-Patterns (from their rules)
- Don't run full E2E suite locally — target specific files
- Don't ignore type errors hoping tests will catch them
- Don't mock calendar services with `mockDeep` — use simpler interface implementations
- Don't push until local tests pass
