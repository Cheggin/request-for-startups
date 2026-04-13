# incident-response

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** ops
**Created:** 2026-04-13

## Description

Automated incident response protocol. Detect (uptime monitor or error spike) → Diagnose (ops agent reads logs) → Fix (ops agent or backend agent) → Deploy (ops agent) → Verify (health check) → Post-mortem (written to GitHub Issue). Escalate to Slack if can't fix within budget.

## Checklist

- [ ] Incident trigger — accept triggers from uptime-monitor (downtime) and error-tracking (error spike)
- [ ] Incident record — create a GitHub Issue labeled `incident` with timestamp, trigger source, and initial symptoms
- [ ] Diagnose phase — ops agent queries log-aggregation for recent errors, checks error-tracking for stack traces
- [ ] Root cause identification — agent summarizes probable cause in the incident Issue comment
- [ ] Fix routing — route fix to appropriate agent: frontend issues → website agent, backend/API issues → backend agent, infra issues → ops agent
- [ ] Fix implementation — agent creates a branch, applies fix, runs tests
- [ ] Deploy fix — trigger deploy-pipeline for the fix branch with expedited checks
- [ ] Verify phase — after deploy, run health check and confirm error rate returns to baseline
- [ ] Rollback on failed verify — if fix doesn't resolve the issue, rollback via deploy-pipeline and escalate
- [ ] Budget guard — if fix attempts exceed a configurable turn/cost budget, stop and escalate to Slack
- [ ] Slack escalation — post to Slack with incident summary, what was tried, and request for human intervention
- [ ] Post-mortem — write structured post-mortem to the incident GitHub Issue: timeline, root cause, fix applied, prevention recommendations
- [ ] Incident metrics — track: time to detect, time to fix, total downtime, cost of fix
- [ ] Incident history — maintain a log of all incidents for pattern detection across projects
- [ ] Unit tests for incident lifecycle, escalation logic, and budget enforcement

## Notes

- The full lifecycle is: Detect → Diagnose → Fix → Deploy → Verify → Post-mortem
- Budget guard is critical — don't let an agent burn unlimited tokens trying to fix an issue it can't solve
- Rollback is the safe default if a fix doesn't work — better to serve the old version than a broken new one
- Post-mortems feed back into the system — recurring root causes should trigger preventive improvements
