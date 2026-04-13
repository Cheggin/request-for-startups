# performance-benchmark

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Lighthouse CI for Core Web Vitals monitoring. Tracks LCP, FID (INP), and CLS with budget thresholds defined in stacks.yml. Runs on every deploy and blocks deploys that regress performance beyond the configured threshold. Ensures every startup the harness builds ships with production-grade performance.

## Checklist

- [ ] Lighthouse CI setup — run audits in headless Chrome via CI
- [ ] Core Web Vitals tracking — LCP, INP (replaces FID), CLS
- [ ] Performance budget thresholds in stacks.yml (per-route or global)
- [ ] Deploy gate — block deploy if any metric regresses beyond threshold
- [ ] Baseline capture on first deploy — establish initial performance benchmarks
- [ ] Regression detection — compare current run against baseline or previous deploy
- [ ] Performance report — metric values, delta from baseline, pass/fail per metric
- [ ] Bundle size tracking — monitor JS/CSS bundle sizes over time
- [ ] Image optimization check — flag unoptimized images above size threshold
- [ ] Route-level performance — audit critical user paths (homepage, auth, dashboard)
- [ ] Mobile performance — run Lighthouse with mobile throttling profile
- [ ] Historical tracking — store results for trend analysis
- [ ] CI integration — GitHub Actions workflow step
- [ ] Slack/notification on performance regression

## Notes

- Default budgets: LCP < 2.5s, INP < 200ms, CLS < 0.1 (per Google recommendations)
- FID is deprecated in favor of INP (Interaction to Next Paint) — use INP
- Bundle size budgets should be stack-aware (Next.js vs SPA have different baselines)
- Lighthouse scores fluctuate — use median of 3 runs to reduce noise
- Performance budgets should tighten over time, not just prevent regression
