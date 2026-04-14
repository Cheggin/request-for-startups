---
name: analytics-integration
description: Integrate PostHog product analytics into a Next.js application with page views, event tracking, conversion funnels, A/B testing via feature flags, and API access for programmatic dashboard queries. Use when setting up product analytics, tracking user actions, defining conversion funnels, or enabling A/B experiments.
user-invocable: true
---

# Analytics Integration

Set up PostHog product analytics in a Next.js app to track user behavior, measure conversion, and run experiments.

## Setup

1. Install `posthog-js` and initialize in the Next.js app layout or provider with the project API key from environment variables.
2. Configure the PostHog React provider to auto-capture page views on all routes via Next.js router events.
3. Link user identification to the auth system so events are attributed to authenticated users.
4. Respect Do Not Track headers and implement cookie consent before tracking.

## Event Tracking

Define intentional custom events for key user actions rather than tracking everything:

- **Sign-up**: Capture method (email, OAuth), referral source
- **Onboarding completion**: Track each step and overall completion rate
- **Feature usage**: Record which features are used and frequency per user
- **Conversion**: Track the full funnel: visit -> sign up -> activate -> pay

## Dashboards and API Access

1. Create a PostHog dashboard with key metrics: DAU, conversion rate, feature adoption, retention.
2. Configure read-only API access so agents can query PostHog dashboards programmatically for reporting.
3. Feed dashboard metrics into investor updates with actual numbers, never estimates.

## A/B Testing

1. Use PostHog feature flags to create experiment variants.
2. Assign users to control/variant groups consistently via user ID.
3. Run experiments until sample size reaches statistical significance before drawing conclusions.
4. Report experiment results with the format: "Changed X from A to B -- metric improved from N% to M% (+P%)".
