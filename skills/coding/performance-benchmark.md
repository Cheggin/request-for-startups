---
name: performance-benchmark
description: Lighthouse CI for Core Web Vitals monitoring with budget thresholds and deploy gating
category: coding
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Performance Benchmark

## Purpose

Monitor Core Web Vitals (LCP, INP, CLS) using Lighthouse CI with budget thresholds defined in stacks.yml. Run audits on every deploy and block deploys that regress performance beyond configured thresholds. Track bundle sizes, image optimization, and route-level performance over time.

## Steps

1. Set up Lighthouse CI to run audits in headless Chrome within the CI pipeline.
2. Define performance budget thresholds in stacks.yml: LCP < 2.5s, INP < 200ms, CLS < 0.1 as defaults.
3. On first deploy, capture a baseline of all performance metrics for future comparison.
4. Run Lighthouse audits on critical user paths: homepage, authentication flow, and dashboard.
5. Execute each audit 3 times and use the median to reduce score fluctuation noise.
6. Run audits with both desktop and mobile throttling profiles.
7. Compare current metrics against the baseline or previous deploy to detect regressions.
8. Block the deploy if any metric regresses beyond the configured threshold.
9. Track JS and CSS bundle sizes over time; flag bundles exceeding size budgets.
10. Flag unoptimized images above the configured size threshold.
11. Generate a performance report with metric values, delta from baseline, and pass/fail per metric.
12. Store results for historical trend analysis.
13. Send notifications on performance regression.

## Examples

Good:
- "Run Lighthouse CI on homepage and dashboard with mobile throttling, median of 3 runs. Block deploy if LCP exceeds 2.5s or CLS exceeds 0.1."
- "Track JS bundle size trend over the last 10 deploys and flag if current build is 15% larger than baseline."

Bad:
- "Check if the site is fast." (No metrics specified, no thresholds, no tooling.)
- "Run Lighthouse." (No routes specified, no budget thresholds, no deploy gating.)

## Checklist

- [ ] Lighthouse CI set up to run in headless Chrome via CI
- [ ] Core Web Vitals tracked: LCP, INP, CLS
- [ ] Performance budget thresholds defined in stacks.yml
- [ ] Deploy gated on metric regression beyond threshold
- [ ] Baseline captured on first deploy
- [ ] Regression detection compares current run against baseline or previous deploy
- [ ] Performance report includes metric values, delta, and pass/fail
- [ ] JS and CSS bundle sizes tracked over time
- [ ] Unoptimized images flagged above size threshold
- [ ] Critical routes audited: homepage, auth, dashboard
- [ ] Mobile throttling profile used for audits
- [ ] Median of 3 runs used to reduce noise
- [ ] Historical results stored for trend analysis
- [ ] Notification sent on performance regression
