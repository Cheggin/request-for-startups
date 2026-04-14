---
name: uptime-monitor
description: Continuous health check polling with failure detection, consecutive-failure thresholds, Slack alerts, incident triggering, and rolling uptime tracking.
---

# Uptime Monitor

Poll health check endpoints continuously. Detect failures, alert after consecutive misses, trigger incident response on confirmed downtime, and track rolling uptime percentages.

## Health Endpoint Requirements

1. Every deployed app must expose a `/health` endpoint returning HTTP 200 with a JSON payload that verifies actual service health (database connection, critical dependencies).
2. A hardcoded 200 without dependency checks is not acceptable.

## Polling

3. Poll each health endpoint on a configurable interval (default: 60 seconds).
4. Monitor frontend (Vercel) and backend (Railway) URLs independently.
5. Log response times on every poll to detect performance degradation before a full outage.

## Failure Detection

6. Classify failures by type: timeout, non-200 status, DNS resolution failure, or SSL error.
7. Only alert after N consecutive failures (default: 3) to avoid flapping from transient issues.
8. Suppress alerts during active deploys when brief downtime is expected.

## Alerting

9. Post to the project Slack channel on confirmed downtime with failure type and timestamp.
10. Post a recovery alert when the site comes back up, including total downtime duration.
11. Trigger the ops agent incident response protocol automatically on confirmed downtime.

## Uptime Tracking

12. Calculate and store rolling uptime percentages for 24-hour, 7-day, and 30-day windows.
13. Expose uptime data for inclusion in investor update reports.

## Anti-patterns

- Alerting on every single failed health check. Use the consecutive failure threshold.
- Monitoring only the frontend or only the backend. Both are required.
- Returning a hardcoded 200 from `/health` without checking dependencies.
- Ignoring response time trends until a full outage occurs.

## Validation

- Health endpoint returns 200 with dependency status in the JSON payload.
- A simulated 3-consecutive-failure scenario fires a Slack alert.
- Recovery after downtime posts a Slack message with the correct duration.
- Confirmed downtime triggers the incident response protocol.
- Rolling uptime percentages are accurate for 24h, 7d, and 30d windows.
- Alerts are suppressed during a flagged deploy window.
