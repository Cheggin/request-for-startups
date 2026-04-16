---
name: performance-benchmark
description: Monitor Core Web Vitals (LCP, INP, CLS) using Lighthouse CI with budget thresholds and deploy gating. Use when setting up performance monitoring, defining performance budgets, tracking bundle sizes, gating deploys on performance regressions, or auditing route-level performance over time.
user-invocable: true
group: quality
prerequisites: [website-creation]
next: [deploy-pipeline]
workflows: [build-lander, full-startup]
---

# Performance Benchmark

## Setup

1. Configure Lighthouse CI to run in headless Chrome within the CI pipeline.
2. Define performance budget thresholds in `stacks.yml`: LCP < 2.5s, INP < 200ms, CLS < 0.1 as defaults.
3. Capture a baseline on first deploy for future comparison.

## Audit Workflow

1. Run Lighthouse audits on critical user paths: homepage, authentication flow, dashboard.
2. Execute each audit 3 times; use the median to reduce noise.
3. Run with both desktop and mobile throttling profiles.
4. Compare current metrics against baseline or previous deploy to detect regressions.
5. Block the deploy if any metric regresses beyond the configured threshold.

## Bundle and Asset Tracking

- Track JS and CSS bundle sizes over time; flag bundles exceeding size budgets.
- Flag unoptimized images above the configured size threshold.

## Output

Generate a performance report per route:

```
Route | Metric | Value | Delta | Pass/Fail
```

Store results for historical trend analysis. Send notifications on performance regression.
