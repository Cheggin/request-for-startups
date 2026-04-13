---
name: analytics-integration
description: Integrate PostHog product analytics with page views, event tracking, funnels, and A/B testing
category: growth
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - WebFetch
---

# Analytics Integration

## Purpose

Set up PostHog product analytics in a Next.js application to track page views, user actions, feature usage, and conversion funnels. Enable A/B testing via feature flags and provide the growth agent with API access to dashboards for reporting trends in investor updates.

## Steps

1. Install the PostHog SDK (`posthog-js`) and initialize it in the Next.js app layout or provider.
2. Configure page view tracking on all routes using the Next.js router events or the PostHog React provider.
3. Add custom event tracking for key user actions: sign-up, onboarding completion, and conversion.
4. Implement feature usage tracking to record which features are used and how frequently.
5. Define a conversion funnel in PostHog: visit -> sign up -> activate -> pay.
6. Create a PostHog dashboard with key metrics (DAU, conversion rate, feature adoption).
7. Set up read-only API access so the growth agent can query PostHog dashboards programmatically.
8. Integrate A/B testing support using PostHog feature flags for landing page and feature experiments.
9. Link user identification to the auth system so events are attributed to authenticated users.
10. Ensure privacy compliance by respecting Do Not Track headers and implementing cookie consent.

## Examples

Good:
- "Integrate PostHog into the Next.js app with page view tracking and a sign-up conversion funnel"
- "Set up PostHog feature flags for A/B testing the landing page CTA"
- "Add custom event tracking for the onboarding flow completion"

Bad:
- "Add Google Analytics" (this skill is specifically for PostHog integration)
- "Track everything the user does" (too vague; events must be intentional and privacy-compliant)
- "Build a custom analytics dashboard from scratch" (use PostHog's built-in dashboards)

## Checklist

- [ ] PostHog SDK installed and initialized in the Next.js app
- [ ] Page view tracking on all routes
- [ ] Custom event tracking for key user actions (sign up, onboard, convert)
- [ ] Feature usage tracking for which features are used and how often
- [ ] Conversion funnel defined (visit -> sign up -> activate -> pay)
- [ ] PostHog dashboard created with key metrics
- [ ] Growth agent reads PostHog dashboards via API
- [ ] Weekly metrics summary included in investor updates
- [ ] A/B testing support via PostHog feature flags
- [ ] Experiment results tracked and reported with statistical significance
- [ ] User identification linked to auth system
- [ ] Privacy-compliant with Do Not Track and cookie consent support
