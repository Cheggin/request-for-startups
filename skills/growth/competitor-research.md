# competitor-research

**Status:** 🔴 Not started
**Agent:** research
**Category:** operations
**Created:** 2026-04-13

## Description

Research agent uses web search to find competitors in the startup's target market, analyze their features, pricing, design patterns, and tech stack. Outputs a structured research-report.md with a market map, feature comparison matrix, and positioning opportunities. Creates a GitHub Issue with findings so the team has full visibility before planning begins.

## Checklist

- [ ] Web search integration — query competitors by market, keywords, and product category
- [ ] Competitor discovery — identify 5-15 relevant competitors per market
- [ ] Feature extraction — scrape/analyze each competitor's feature set
- [ ] Pricing analysis — extract pricing tiers, free plans, per-seat vs flat models
- [ ] Design pattern analysis — capture UI patterns, navigation, layout conventions
- [ ] Tech stack detection — identify frameworks, hosting, analytics, payment providers
- [ ] Market map generation — visual positioning of competitors by segment
- [ ] Feature comparison matrix — table of features across all competitors
- [ ] Positioning opportunities — gaps in the market where no competitor excels
- [ ] research-report.md output — structured markdown with all findings
- [ ] GitHub Issue creation — post findings as an issue with labels and assignees
- [ ] Source linking — every claim links back to the source URL
- [ ] Staleness detection — flag if research is older than 30 days

## Notes

- Research runs as Step 1 before any product spec or design work begins
- The research report is an input to the product-spec-generator — it needs structured, parseable sections
- Market map should be a simple 2x2 or list, not a complex visualization
- Feature comparison matrix should use markdown tables for easy diffing
- Competitors with public changelogs or blogs are higher signal — prioritize those
- Research agent should not hallucinate competitors — every company must have a verifiable URL
