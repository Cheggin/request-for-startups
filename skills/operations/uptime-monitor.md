---
name: uptime-monitor
description: Continuous health check polling with failure detection, Slack alerts, incident triggering, and uptime tracking
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

Continuously monitor deployed application URLs by polling health check endpoints. Detect failures (timeout, non-200, DNS, SSL), alert via Slack after consecutive failures, automatically trigger incident response on confirmed downtime, and track rolling uptime percentages for investor updates.

## Steps

1. Require every deployed app to expose a `/health` endpoint that returns HTTP 200 with a JSON status payload verifying actual service health (database connection, critical dependencies).
2. Poll the health endpoint on a configurable interval (default: every 60 seconds).
3. Classify failures by type: timeout, non-200 status code, DNS resolution failure, or SSL error.
4. Only alert after N consecutive failures (default: 3) to avoid flapping from transient network issues.
5. Post to the project Slack channel when a site goes down, including the failure type and timestamp.
6. Post a recovery alert to Slack when the site comes back up, including the total downtime duration.
7. Automatically invoke the ops agent incident response protocol on confirmed downtime.
8. Calculate and store rolling uptime percentages for 24-hour, 7-day, and 30-day windows.
9. Expose uptime data so the investor updates feature can include it in reports.
10. Monitor both frontend (Vercel) and backend (Railway) URLs independently.
11. Log response times to detect performance degradation before a full outage occurs.
12. Suppress alerts during active deploys when brief downtime is expected.

## Examples

Good:
- "Health check failed 3 consecutive times on the backend URL. Posted Slack alert and triggered incident response."
- "Site recovered after 4 minutes of downtime. Posted recovery alert with duration to Slack."
- "Rolling uptime: 99.95% (24h), 99.87% (7d), 99.92% (30d)."

Bad:
- "Alert on every single failed health check immediately." (Consecutive failure threshold prevents alert fatigue.)
- "Only check the frontend URL and ignore the backend." (Both URLs must be monitored independently.)
- "Return a hardcoded 200 from the health endpoint without checking dependencies." (Health checks must verify actual service health.)

## Checklist

- [ ] Every deployed app exposes a /health endpoint returning 200 with JSON status
- [ ] Health endpoint is polled on a configurable interval (default: 60 seconds)
- [ ] Failures are classified by type (timeout, non-200, DNS, SSL)
- [ ] Alerts fire only after N consecutive failures (default: 3)
- [ ] Slack alert is posted on confirmed downtime with failure type and timestamp
- [ ] Recovery alert is posted on site restoration with total downtime duration
- [ ] Ops agent incident response is triggered automatically on confirmed downtime
- [ ] Rolling uptime percentages are calculated for 24h, 7d, and 30d windows
- [ ] Uptime data is exposed for investor update reports
- [ ] Frontend and backend URLs are monitored independently
- [ ] Response times are logged to detect degradation before outage
- [ ] Alerts are suppressed during active deploy windows
