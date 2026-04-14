# Plan: Harness Dashboard + Growth Intelligence + Multi-Startup

## Current State

| Area | Status | What Exists |
|------|--------|-------------|
| Growth Skills | 50% | PostHog + SEO Chat + competitor research. Missing: social platform analysis, content performance |
| Dashboard | Terminal-only | ANSI status command. No web UI, no charts |
| Multi-Startup | Design doc only | `.harness/multi-project.md` architecture planned, nothing built |
| Data Aggregation | 40% | PostHog + Slack investor updates. No warehouse, no time-series |
| Charts | 0% | Zero charting. Terminal ASCII bars only |

## What We're Building

A **web dashboard** that serves as the founder's command center across all their startups. Minimal, beautiful, navigable. Stores data from competitor analysis, social media monitoring, agent activity, costs, and deployment health — all in one place.

---

## Architecture

```
harness-dashboard/                 # Next.js 15 app (separate from generated startups)
├── app/
│   ├── layout.tsx                 # Minimal sidebar: startup switcher + nav
│   ├── page.tsx                   # Overview: all startups at a glance
│   ├── [startup]/
│   │   ├── page.tsx               # Single startup overview
│   │   ├── growth/
│   │   │   ├── page.tsx           # Growth dashboard (traffic, conversions, trends)
│   │   │   ├── competitors/       # Competitor intelligence
│   │   │   └── social/            # Social media analysis per platform
│   │   ├── agents/
│   │   │   └── page.tsx           # Agent activity, costs, performance
│   │   ├── deploy/
│   │   │   └── page.tsx           # Deployment health, uptime, errors
│   │   └── content/
│   │       └── page.tsx           # Blog/SEO content performance
│   └── settings/
│       └── page.tsx               # API keys, startup management
├── lib/
│   ├── db.ts                      # Convex client for dashboard data
│   ├── charts.ts                  # Custom chart components (NO recharts)
│   └── aggregators/               # Data aggregation per source
│       ├── posthog.ts
│       ├── google.ts
│       ├── reddit.ts
│       ├── twitter.ts
│       ├── github.ts
│       ├── sentry.ts
│       └── costs.ts
└── convex/
    ├── schema.ts                  # Dashboard data models
    ├── startups.ts                # CRUD for startup registry
    ├── metrics.ts                 # Time-series metrics storage
    ├── competitors.ts             # Competitor tracking data
    └── social.ts                  # Social media metrics
```

### Data Store: Convex

Already in the canonical stack. Dashboard gets its own Convex project (separate from generated startups):

```
startups         → { id, name, type, url, createdAt, status }
metrics          → { startupId, source, metric, value, timestamp }
competitors      → { startupId, name, url, features, pricing, lastUpdated }
social_mentions  → { startupId, platform, content, sentiment, url, timestamp }
agent_sessions   → { startupId, agent, turns, cost, duration, timestamp }
deployments      → { startupId, url, status, lastCheck, uptimePercent }
```

### Charts: visx (Airbnb) + Framer Motion

The Stripe approach: D3's math + React's rendering. visx gives low-level primitives (~15KB modular imports), we control every pixel.

Source code cloned to `reference/visx/` for direct study of patterns.

Why visx:
- Stripe built charts on Raphaël → D3. visx is the modern equivalent: D3 primitives as React components
- ~15KB modular (only import what you use) vs recharts 400KB
- Full control over visual output — charts look like YOUR brand, not a library's defaults
- React-native rendering model (no DOM conflicts like raw D3)
- Framer Motion for smooth animated transitions between data states

Key visx packages we'll use:
- `@visx/xychart` — high-level line/bar/area charts with built-in tooltips
- `@visx/shape` — low-level SVG primitives (Line, Bar, Pie, Arc)
- `@visx/scale` — D3 scales (linear, time, band, ordinal)
- `@visx/axis` — axis rendering
- `@visx/grid` — background gridlines
- `@visx/tooltip` — tooltip positioning
- `@visx/responsive` — responsive container (ParentSize)
- `@visx/gradient` — SVG gradient fills for visual polish

Chart types needed:
1. **Line chart** (visx LinePath + AreaClosed) — traffic trends, conversion rates, cost over time
2. **Bar chart** (visx Bar + Group) — competitor feature comparison, content performance
3. **Sparkline** (visx LinePath, no axes) — inline metrics in cards (tiny trend indicators)
4. **Donut chart** (visx Pie + Arc) — traffic sources, agent cost breakdown
5. **Heatmap** (visx HeatmapRect) — social mention volume by platform/day
6. **Gauge** (visx Arc + custom) — uptime percentage, health scores

Each chart is a React component in `lib/charts/`:
```
lib/charts/
├── line-chart.tsx       # visx LinePath + AreaClosed + Framer Motion
├── bar-chart.tsx        # visx Bar + Group
├── sparkline.tsx        # visx LinePath (tiny, no axes)
├── donut-chart.tsx      # visx Pie + Arc
├── heatmap.tsx
├── gauge.tsx
└── shared.ts          # Axis, tooltip, legend primitives
```

---

## Growth Intelligence System

### Phase 1: Data Collection Skills

#### 1.1 Competitor Monitor (`skills/growth/competitor-monitor.md`)
- **Beyond initial research** — ongoing monitoring, not one-shot
- Track competitor websites for changes (pricing, features, messaging)
- Use Firecrawl to scrape competitor pages on a schedule
- Diff detection: alert when a competitor launches a new feature or changes pricing
- Store snapshots in Convex `competitors` table
- Weekly digest posted to Slack

#### 1.2 Social Media Intelligence (`skills/growth/social-intelligence.md`)

Per-platform analysis, aggregated into a unified view:

**Google Search Console** (via API)
- Search queries driving traffic
- Click-through rates by keyword
- Position tracking for target keywords
- Indexed page count

**Reddit** (via Reddit API / Exa search)
- Monitor subreddits relevant to the startup's niche
- Track mentions of the startup name and competitors
- Sentiment analysis on comments
- Identify high-engagement threads for organic participation
- Weekly: top threads, sentiment trend, competitor mentions

**Twitter/X** (via API or Exa search)
- Track mentions of startup, competitors, industry keywords
- Engagement metrics (likes, retweets, replies)
- Identify influencers talking about the space
- Sentiment over time
- Best posting times based on engagement data

**LinkedIn** (via Exa search — no official API for monitoring)
- Track company page mentions
- Industry thought leadership content performance
- Competitor company page activity

**Hacker News** (via Algolia HN API — free)
- Track mentions of the startup and competitors
- Identify trending topics in the space
- Comment sentiment on relevant posts

#### 1.3 Content Performance (`skills/growth/content-performance.md`)
- Per-page analytics: views, time on page, bounce rate, conversions
- Blog post performance ranking
- SEO keyword position tracking per page
- Content gap analysis (what competitors rank for that we don't)
- Cannibalization detection (multiple pages competing for same keyword)

#### 1.4 Aggregation Pipeline (`skills/growth/growth-aggregator.md`)
- Scheduled job (via cron or harness loop) that pulls from all sources
- Normalizes data into Convex `metrics` table
- Computes derived metrics: MoM growth, trend direction, anomaly detection
- Triggers alerts for significant changes (traffic spike, competitor launch, viral mention)
- Feeds the dashboard

### Phase 2: Scraping Infrastructure — Browser Use API

**All social media scraping goes through Browser Use** (`BROWSER_USE_API_KEY`). One API key, one tool, all platforms. No per-platform API keys needed (Reddit API, Twitter API, etc.) — Browser Use handles authenticated scraping via persistent browser profiles.

How it works:
1. During `harness init`, collect `BROWSER_USE_API_KEY` (already in tool-catalog.yml)
2. Create Browser Use profiles per platform: `reddit-monitor`, `twitter-monitor`, `linkedin-monitor`
3. User logs into each platform once via Browser Use live view — sessions persist
4. Scraping tasks use `bu-mini` model (cheapest) with `maxCostUsd` caps
5. HN is the exception — free Algolia API, no browser needed

Cost: ~$8-12/month for daily Reddit/Twitter + weekly LinkedIn + weekly competitor monitoring.

Already added to tool-catalog.yml under `browser-automation.browser-use`.
Skill created: `skills/growth/social-intelligence.md`.

---

## Dashboard Design

### Design Principles
- **Minimal** — no clutter. Every pixel earns its place
- **Startup switcher** — left sidebar or top dropdown, one click to switch context
- **Cards + sparklines** — key metrics in cards with inline trend indicators
- **Drill-down** — click any metric to see the full chart
- **Dark data, light UI** — light mode, dark chart fills for contrast
- **No recharts** — custom SVG charts that match the design system
- Use the website-creation skill's design preset system (likely "minimal" or "clean-saas")

### Pages

#### Overview (all startups)
```
┌─────────────────────────────────────────────────┐
│  [Startup Switcher ▼]              [Settings]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ ImageConvert │  │ json2ts     │  │ Pulse   │ │
│  │ ~~~ 1.2k    │  │ ~~~ 890     │  │ ~~~ 340 │ │
│  │ visitors/wk  │  │ visitors/wk │  │ users   │ │
│  │ ↑12%        │  │ ↑5%         │  │ ↑28%    │ │
│  └─────────────┘  └─────────────┘  └─────────┘ │
│                                                 │
│  Total cost this month: $24.50                  │
│  Agents active: 3/10                            │
│  Deploys today: 2                               │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Growth Dashboard (per startup)
- Top row: traffic, conversion rate, MRR (if payments), active users
- Charts: traffic trend (30d), conversion funnel, top pages
- Social: mention volume by platform, sentiment gauge
- Competitors: feature comparison table, pricing comparison

#### Agent Activity (per startup)
- Agent session history with cost per session
- Total cost trend (line chart)
- Turns per agent (bar chart)
- Current running agents (live status)

#### Deployment Health (per startup)
- Uptime gauge (99.9%?)
- Response time trend
- Error rate from Sentry
- Last deploy info
- Lighthouse scores

---

## Multi-Startup Support

### Data Model
```typescript
// ~/.harness/projects.json (global registry)
interface ProjectRegistry {
  projects: {
    id: string;
    name: string;
    path: string;         // local project directory
    type: string;         // b2c, b2b-saas, devtool, etc.
    url?: string;         // deployed URL
    convexUrl?: string;   // Convex deployment URL
    createdAt: string;
    status: "active" | "archived";
  }[];
  activeProject: string;  // current project ID
}
```

### CLI Commands
```bash
harness project list              # Show all startups
harness project switch <name>     # Switch active context
harness project new               # Run init for a new startup
harness project archive <name>    # Archive (don't delete)
harness dashboard                 # Open web dashboard in browser
```

### Navigation
- Sidebar shows all startups with status indicators
- One-click switching — loads that startup's data
- Settings page manages API keys per startup
- Archived startups grayed out but still viewable

---

## Implementation Order

### Batch 1: Foundation (dashboard scaffold + multi-project)
1. Scaffold `harness-dashboard/` as a Next.js 15 app with Convex
2. Build project registry (`~/.harness/projects.json`)
3. Add `harness project` CLI commands
4. Build the startup switcher sidebar
5. Build the overview page with cards + sparklines

### Batch 2: Charts + Agent Data
6. Build custom SVG chart components (line, bar, sparkline, donut, gauge)
7. Wire agent session data → Convex → dashboard
8. Build agent activity page
9. Build cost tracking charts

### Batch 3: Growth Intelligence
10. Build competitor monitor skill + Convex storage
11. Build social intelligence skill (Reddit, Twitter, HN via Exa)
12. Build Google Search Console integration
13. Build content performance tracking
14. Build growth aggregator pipeline
15. Build growth dashboard page

### Batch 4: Deployment Health
16. Wire Sentry error data → dashboard
17. Wire uptime monitoring → dashboard
18. Build deployment health page
19. Build Lighthouse score tracking

### Batch 5: Polish
20. Apply design preset (minimal) across all pages
21. Add Framer Motion transitions to charts
22. Mobile responsive layout
23. Export: CSV/JSON for investor decks
24. Deploy dashboard to Vercel

---

## Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Charts | visx (Airbnb) + Framer Motion | Stripe approach: D3 math + React rendering. ~15KB modular, full visual control |
| Scraping | Browser Use API | One API key for all platforms. Persistent profiles for authenticated scraping |
| Data store | Convex (separate project) | Already in stack, real-time updates, no new dependency |
| Social APIs | Exa search as fallback | Not all platforms have good APIs. Exa searches Reddit/Twitter/HN |
| Multi-project | File-based registry + Convex | Simple. Local registry for CLI, Convex for dashboard data |
| Auth | None initially | This is a personal founder tool, not a multi-tenant SaaS |
| Hosting | Vercel | Same as everything else in the stack |

## New Tool Catalog Entries Needed

```yaml
social-monitoring:
  google-search-console:
    env_vars: [GOOGLE_SEARCH_CONSOLE_KEY]
    when: "Every startup with SEO"
  reddit:
    env_vars: [REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET]
    when: "Community-driven startups"
  twitter:
    env_vars: [TWITTER_BEARER_TOKEN]
    when: "Startups with social presence"
  hn-algolia:
    env_vars: []
    when: "Devtools, tech startups"
```

All wired into credential collection at `harness init`.
