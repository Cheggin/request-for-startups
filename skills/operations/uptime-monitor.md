# uptime-monitor

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** ops
**Created:** 2026-04-13

## Description

After deploy, continuously monitor the live URL. Health check endpoint. Alert to Slack if site goes down. Ops agent auto-triggered for incident response. Track uptime percentage for investor updates.

## Checklist

- [ ] Health check endpoint — require every deployed app to expose a /health endpoint returning 200 + JSON status
- [ ] Polling loop — check health endpoint on a configurable interval (default: every 60 seconds)
- [ ] Failure detection — classify failures: timeout, non-200 status, DNS resolution failure, SSL error
- [ ] Consecutive failure threshold — only alert after N consecutive failures (default: 3) to avoid flapping
- [ ] Slack alert — post to project Slack channel when site goes down, include failure type and timestamp
- [ ] Recovery alert — post to Slack when site comes back up, include total downtime duration
- [ ] Ops agent trigger — automatically invoke ops agent incident-response protocol on confirmed downtime
- [ ] Uptime percentage tracking — calculate and store rolling uptime percentage (24h, 7d, 30d windows)
- [ ] Uptime metrics for investor updates — expose uptime data so investor-updates feature can include it
- [ ] Multi-URL support — monitor both frontend (Vercel) and backend (Railway) URLs independently
- [ ] Response time tracking — log response times to detect degradation before full outage
- [ ] Graceful handling of expected downtime — don't alert during active deploys
- [ ] Unit tests for failure detection, alerting logic, and uptime calculation

## Notes

- The health check endpoint should verify actual service health (database connection, critical dependencies), not just return 200
- Consecutive failure threshold prevents alert fatigue from transient network issues
- Uptime percentage is a key metric in investor updates — it must be accurate
- During deploys, brief downtime is expected — the deploy-pipeline feature should signal expected downtime windows
