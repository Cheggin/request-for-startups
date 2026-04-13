---
name: incident-response
description: Automated incident lifecycle from detection through diagnosis, fix, deploy, verification, and post-mortem
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

Automate the full incident response lifecycle: detect incidents from uptime monitors or error spikes, diagnose by querying logs and error traces, route fixes to the appropriate agent, deploy the fix, verify recovery, and write a structured post-mortem. Escalate to Slack if the fix exceeds the configured budget.

## Steps

1. Accept incident triggers from uptime monitoring (downtime detected) or error tracking (error rate spike).
2. Create a GitHub Issue labeled `incident` with the timestamp, trigger source, and initial symptoms.
3. Query log aggregation for recent errors and check error tracking for relevant stack traces to diagnose the issue.
4. Summarize the probable root cause in a comment on the incident Issue.
5. Route the fix to the appropriate agent: frontend issues to the website agent, backend/API issues to the backend agent, infrastructure issues to the ops agent.
6. The assigned agent creates a branch, applies the fix, and runs tests.
7. Trigger the deploy pipeline for the fix branch with expedited checks.
8. After deployment, run a health check and confirm the error rate returns to baseline.
9. If the fix does not resolve the issue, rollback via the deploy pipeline and escalate.
10. If fix attempts exceed the configured turn/cost budget, stop and escalate to Slack with a summary of what was tried.
11. Write a structured post-mortem to the incident Issue: timeline, root cause, fix applied, and prevention recommendations.
12. Record incident metrics: time to detect, time to fix, total downtime, and cost of fix.

## Examples

Good:
- "Uptime monitor detected 3 consecutive failures. Created incident Issue, queried logs, found a database connection timeout, and routed fix to backend agent."
- "Fix deployed and error rate returned to baseline within 2 minutes. Post-mortem written with prevention recommendations."
- "Fix attempt exceeded budget after 3 tries. Rolled back and escalated to Slack with incident summary."

Bad:
- "Keep retrying the fix indefinitely without a budget limit." (Budget guard must stop and escalate.)
- "Deploy the fix without running health checks afterward." (Verification is mandatory after every fix deploy.)
- "Skip the post-mortem because the fix worked." (Post-mortems are always required for learning.)

## Checklist

- [ ] Incident triggers are accepted from uptime monitor and error tracking
- [ ] GitHub Issue labeled `incident` is created with timestamp, trigger, and symptoms
- [ ] Logs and error traces are queried to diagnose the issue
- [ ] Root cause summary is posted as a comment on the incident Issue
- [ ] Fix is routed to the appropriate agent (website, backend, or ops)
- [ ] Agent creates a branch, applies fix, and runs tests
- [ ] Deploy pipeline is triggered for the fix with expedited checks
- [ ] Health check verifies recovery and error rate returns to baseline
- [ ] Rollback is triggered if the fix does not resolve the issue
- [ ] Budget guard stops and escalates to Slack when turn/cost limit is exceeded
- [ ] Structured post-mortem is written with timeline, root cause, fix, and prevention
- [ ] Incident metrics (time to detect, time to fix, downtime, cost) are recorded
