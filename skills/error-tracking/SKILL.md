---
name: error-tracking
description: Integrate error tracking with Sentry for frontend and backend applications. Capture, classify, deduplicate, and alert on errors with deploy-version tagging.
---

# Error Tracking

Set up Sentry-based error tracking across frontend and backend. Capture errors, deduplicate into issues, detect spikes, and route to the right owner.

## Setup

1. Create a Sentry project and store the DSN in environment variables.
2. Install the Sentry SDK in the frontend app. Enable source map uploads and release tracking.
3. Install the Sentry SDK in the backend/API layer for server-side error capture.

## Classification and Routing

4. Classify every error by source: frontend (React errors, network failures) or backend (API errors, database errors, unhandled exceptions).
5. Classify severity: **critical** (app crash, data loss), **warning** (degraded functionality), **info** (handled error logged for visibility).
6. Route frontend errors to the website owner. Route backend errors to the backend owner.

## Deduplication and Issue Creation

7. On each new error group, create a GitHub Issue with: stack trace, error context, breadcrumbs, and affected URL.
8. Deduplicate similar errors into a single Issue. Update the occurrence count and last-seen timestamp on each new hit.
9. Tag every error with the deploy version to identify regressions from specific releases.

## Spike Detection and Alerting

10. Track errors per minute. Alert when the rate exceeds 3x baseline within a 5-minute window.
11. Post to Slack immediately for critical errors. Trigger incident response on confirmed spikes.

## Anti-patterns

- Creating a separate GitHub Issue for every occurrence of the same error. Deduplicate.
- Tracking only frontend or only backend. Both are required.
- Waiting for someone to check a dashboard to notice spikes. Alerts must be automatic.
- Returning generic error messages without stack traces or context.

## Validation

- Sentry DSN is configured and receiving events from both frontend and backend.
- Source maps produce readable stack traces in production.
- A triggered test error creates a GitHub Issue with full context.
- Duplicate errors update the existing Issue instead of creating a new one.
- A simulated error spike fires a Slack alert within 5 minutes.
- Errors are tagged with the correct deploy version.
