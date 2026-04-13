---
name: error-tracking
description: Integrate error tracking with Sentry for frontend and backend, with routing, deduplication, and spike detection
category: operations
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

## Purpose

Integrate error tracking (Sentry or similar) into deployed applications to capture frontend and backend errors, route them to the appropriate agent for resolution, deduplicate error reports into GitHub Issues, and detect error rate spikes that may indicate regressions.

## Steps

1. Create a Sentry project during repository setup and configure the DSN in environment variables.
2. Install and configure the Sentry SDK in the frontend app with source map uploads and release tracking.
3. Install and configure the Sentry SDK in the backend/API layer for server-side error capture.
4. Classify errors by source: frontend (React errors, network failures) vs. backend (API errors, database errors, unhandled exceptions).
5. Route frontend errors to the website agent and backend errors to the backend agent for resolution.
6. On each new error group, create a GitHub Issue with the stack trace, error context, breadcrumbs, and affected URL.
7. Deduplicate similar errors into a single Issue, updating the count and last-seen timestamp.
8. Classify error severity as critical (app crash, data loss), warning (degraded functionality), or info (handled error logged for visibility).
9. Post to Slack immediately for critical errors and trigger incident response if the error rate spikes.
10. Track errors per minute and alert when the rate exceeds 3x the baseline within a 5-minute window.
11. Tag errors with the deploy version to identify regressions introduced by specific releases.

## Examples

Good:
- "Set up Sentry for the frontend with source maps so stack traces are readable in production."
- "Create a GitHub Issue for the new TypeError group with stack trace and breadcrumbs attached."
- "Alert on error rate spike: 45 errors/min vs. 12 errors/min baseline in the last 5 minutes."

Bad:
- "Create a separate GitHub Issue for every single occurrence of the same error." (Errors must be deduplicated.)
- "Ignore backend errors and only track frontend crashes." (Both frontend and backend must be tracked.)
- "Wait until someone checks the dashboard to notice a spike." (Spikes must trigger automatic alerts.)

## Checklist

- [ ] Sentry project is created and DSN is configured in environment variables
- [ ] Frontend Sentry SDK is installed with source map uploads and release tracking
- [ ] Backend Sentry SDK is installed for server-side error capture
- [ ] Errors are classified by source (frontend vs. backend)
- [ ] Errors are routed to the appropriate agent (website or backend)
- [ ] New error groups create a GitHub Issue with stack trace, context, and breadcrumbs
- [ ] Similar errors are deduplicated into a single Issue with count and last-seen updates
- [ ] Errors are classified by severity (critical, warning, info)
- [ ] Critical errors trigger immediate Slack notification
- [ ] Error rate monitoring alerts on spikes exceeding 3x baseline in 5 minutes
- [ ] Errors are tagged with deploy version for regression identification
