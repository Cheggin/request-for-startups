---
name: competitor-research
description: Research competitors in a target market using web search and produce a structured report with feature comparison matrix, pricing analysis, market map, and positioning gaps. Use when analyzing a competitive landscape, comparing features across competitors, or identifying market opportunities before product planning.
user-invocable: true
---

# Competitor Research

Discover and analyze competitors in a target market. Produce a structured research report and post findings as a GitHub Issue for team visibility.

## Research Process

1. Identify the target market, keywords, and product category from the user's request.
2. Use web search to discover 5-15 relevant competitors with verifiable URLs.
3. For each competitor, extract from their marketing site and docs:
   - Core feature set and differentiators
   - Pricing model (free tier, per-seat, flat-rate, usage-based)
   - Technology stack where detectable (frameworks, hosting, analytics, payments)
   - UI and design patterns (navigation, layout, onboarding flows)

## Output Artifacts

### Feature Comparison Matrix
Build a markdown table covering all discovered competitors with features as rows and competitors as columns.

### Market Map
Position competitors by segment (enterprise vs SMB, horizontal vs vertical) to visualize coverage gaps.

### Positioning Opportunities
Identify gaps where no existing competitor excels -- these are potential differentiation angles.

### Research Report
Write findings to `research-report.md` with structured, parseable sections. Every claim must link back to its source URL.

## Distribution

1. Create a GitHub Issue with the findings, including labels and source URLs.
2. Flag the report if research is older than 30 days for staleness detection.

## Constraints

- Every competitor must have a verifiable URL -- never fabricate names.
- Specify a concrete market or product category -- "who are our competitors" is too vague.
- This skill produces research only, not product specs or implementation plans.
