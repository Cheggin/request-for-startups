---
name: competitor-research
description: Deep competitor research using browser agents to visit actual competitor sites. Captures screenshots, extracts real pricing, scores UX friction, evaluates API/agent experience, and produces a comparison matrix. Use when analyzing a competitive landscape before product planning.
user-invocable: true
---

# Competitor Research

Deep competitor analysis using browser agents to visit real websites. Every data point comes from observed behavior, not search result summaries.

## Inputs

The user must provide:
- **Target market** — specific product category (e.g. "AI coding assistants", "developer analytics platforms")
- **Our product** (optional) — what we're building, so the report can identify where we win/lose
- **Moat axes** (optional, defaults to: user experience, agent experience, pricing)

## Phase 1: Discovery

1. Use web search to find 5-15 competitors with verifiable URLs.
2. For each competitor, record: name, URL, one-line description, funding stage if findable.
3. Prioritize direct competitors over tangential ones. Cut anything that doesn't actually compete.

## Phase 2: Browser Deep-Dive

For EACH competitor, spawn a browser agent (use Firecrawl or Playwright) to visit their actual site. The agent must visit and capture:

### Pages to visit:
- **Homepage** — first impression, value prop clarity, CTA placement
- **Pricing page** — exact tiers, prices, feature gating, free tier limits, enterprise contact-us gates
- **Docs/API page** — SDK quality, getting-started friction, API design patterns
- **Signup flow** — how many steps, what info required, time-to-first-value

### Data to extract per competitor:
- **Screenshots** of each page visited (save to `screenshots/{competitor-slug}/`)
- **Pricing tiers** — exact dollar amounts, feature lists per tier, billing model
- **UX friction score** (1-10) — clicks to value, signup complexity, onboarding clarity. Justify the score with specific observations.
- **Agent/API experience score** (1-10, or N/A) — SDK docs quality, API ergonomics, CLI UX, webhook support. Justify with specifics.
- **Design quality notes** — patterns worth adopting, patterns to avoid, visual polish level
- **Tech stack signals** — frameworks, infrastructure, analytics, payments (from page source, headers, public info)

## Phase 3: Analysis

### Comparison Matrix
Markdown table with competitors as columns and rows for:
- Pricing (lowest tier, mid tier, enterprise)
- Free tier limits
- UX friction score (with one-line justification)
- Agent/API experience score (with one-line justification)
- Key differentiator
- Biggest weakness

### Pricing Breakdown
Detailed pricing comparison — exact numbers, not ranges. Note which competitors gate critical features behind enterprise tiers.

### Moat Analysis
For each moat axis (UX, agent experience, pricing):
- Where we win
- Where we lose
- What to steal (specific patterns, not generic advice)

### Positioning Gaps
Identify segments where no competitor excels. These are differentiation opportunities.

## Phase 4: Report

1. Write findings to `research-report.md` with structured, parseable sections.
2. Every claim must link back to its source URL.
3. Every score must have a specific justification — no generic praise or criticism.
4. Run the report through `/startup-harness:anti-ai-writing` to strip AI slop before publishing.
5. Create a GitHub Issue with the findings, including labels and source URLs.

## Constraints

- Every competitor must have a verifiable URL — never fabricate names or URLs.
- Every pricing figure must come from the actual pricing page — never guess or approximate.
- Every UX score must cite specific observed behavior — "clean design" is not a score justification.
- Screenshots are mandatory proof. If a page couldn't be captured, say so explicitly.
- This skill produces research only, not product specs or implementation plans.
- Flag the report if research is older than 30 days for staleness detection.
