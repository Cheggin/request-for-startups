---
name: competitor-research
description: Research competitors in a target market and produce a structured report with feature comparison and positioning gaps
category: growth
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - WebSearch
  - WebFetch
---

# Competitor Research

## Purpose

Use web search to discover and analyze competitors in the startup's target market. Produce a structured research report containing a market map, feature comparison matrix, pricing analysis, and positioning opportunities. Post findings as a GitHub Issue so the team has visibility before product planning begins.

## Steps

1. Identify the target market, keywords, and product category for the competitor search.
2. Use web search to discover 5-15 relevant competitors in the space.
3. For each competitor, extract their core feature set from their marketing site and documentation.
4. Analyze pricing models across competitors: free tiers, per-seat pricing, flat-rate, usage-based.
5. Detect technology stacks where possible (frameworks, hosting, analytics, payment providers).
6. Capture UI and design patterns: navigation style, layout conventions, onboarding flows.
7. Build a feature comparison matrix as a markdown table covering all discovered competitors.
8. Create a market map positioning competitors by segment (e.g., enterprise vs SMB, horizontal vs vertical).
9. Identify positioning opportunities where no existing competitor excels.
10. Write findings to `research-report.md` with structured, parseable sections.
11. Create a GitHub Issue with the findings, including labels and source URLs for every claim.
12. Flag the report if research is older than 30 days for staleness detection.

## Examples

Good:
- "Research competitors in the developer tools CI/CD market and produce a comparison matrix"
- "Find 10 competitors for our project management SaaS and analyze their pricing tiers"
- "Create a market map for the API monitoring space with positioning gaps"

Bad:
- "Tell me who our competitors are" (too vague; must specify a market or product category)
- "Make up some competitor names" (every competitor must have a verifiable URL)
- "Research competitors and build a product for us" (this skill produces research only, not product specs)

## Checklist

- [ ] Web search integration queries competitors by market, keywords, and product category
- [ ] Competitor discovery identifies 5-15 relevant competitors per market
- [ ] Feature extraction analyzes each competitor's feature set
- [ ] Pricing analysis extracts tiers, free plans, per-seat vs flat models
- [ ] Design pattern analysis captures UI patterns, navigation, and layout conventions
- [ ] Tech stack detection identifies frameworks, hosting, analytics, and payment providers
- [ ] Market map generated positioning competitors by segment
- [ ] Feature comparison matrix built as a markdown table across all competitors
- [ ] Positioning opportunities identified where no competitor excels
- [ ] research-report.md output with structured markdown and all findings
- [ ] GitHub Issue created with labels, assignees, and source links
- [ ] Source linking ensures every claim links back to the source URL
- [ ] Staleness detection flags research older than 30 days
