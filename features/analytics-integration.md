# analytics-integration

**Status:** 🔴 Not started
**Agent:** website-dev
**Category:** coding
**Created:** 2026-04-13

## Description

PostHog integration for product analytics. Tracks page views, user actions, feature usage, and conversion funnels. The growth agent monitors dashboards and reports trends in investor updates. Supports A/B testing for landing page and feature experiments.

## Checklist

- [ ] PostHog SDK installed and initialized in the Next.js app
- [ ] Page view tracking on all routes
- [ ] Custom event tracking for key user actions (sign up, onboard, convert)
- [ ] Feature usage tracking — which features are used and how often
- [ ] Conversion funnel defined (visit -> sign up -> activate -> pay)
- [ ] PostHog dashboard created with key metrics
- [ ] Growth agent reads PostHog dashboards via API
- [ ] Weekly metrics summary included in investor updates
- [ ] A/B testing support via PostHog feature flags
- [ ] Experiment results tracked and reported with statistical significance
- [ ] User identification linked to auth system
- [ ] Privacy-compliant — respect Do Not Track, cookie consent

## Notes

- PostHog is self-hostable but the managed cloud version is fine for early stage
- Growth agent should have read-only API access to PostHog
- A/B test results feed into the landing-page-optimizer feature
