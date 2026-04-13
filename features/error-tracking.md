# error-tracking

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** ops
**Created:** 2026-04-13

## Description

Integrate error tracking (Sentry or similar) into deployed apps. Capture frontend and backend errors. Route errors to appropriate agent (frontend errors → website agent, API errors → backend agent). Include error context in GitHub Issues.

## Checklist

- [ ] Sentry project setup — create Sentry project during repo-setup, configure DSN in environment variables
- [ ] Frontend SDK integration — install and configure Sentry SDK in the frontend app (source maps, release tracking)
- [ ] Backend SDK integration — install and configure Sentry SDK in the backend/API layer
- [ ] Error classification — categorize errors by source: frontend (React errors, network failures), backend (API errors, database errors, unhandled exceptions)
- [ ] Error routing — frontend errors route to website agent, API/backend errors route to backend agent
- [ ] GitHub Issue creation — on new error group, create a GitHub Issue with stack trace, error context, breadcrumbs, and affected URL
- [ ] Deduplication — group similar errors into a single Issue, update count and last-seen timestamp
- [ ] Error severity — classify as critical (app crash, data loss), warning (degraded functionality), info (handled error logged for visibility)
- [ ] Critical error alert — post to Slack immediately for critical errors, trigger incident-response if error rate spikes
- [ ] Error context enrichment — include user action breadcrumbs, request/response data, environment info in Issue body
- [ ] Error rate monitoring — track errors/minute, alert on spike (3x baseline within 5-minute window)
- [ ] Release correlation — tag errors with deploy version to identify regressions introduced by specific deploys
- [ ] Unit tests for error classification, routing logic, deduplication, and spike detection

## Notes

- Sentry is the default choice but the integration should be abstract enough to swap providers
- Source maps must be uploaded on deploy so frontend stack traces are readable
- Deduplication is critical — don't create 500 Issues for the same TypeError
- Error rate spikes after a deploy are a strong signal for automatic rollback (coordinate with deploy-pipeline)
