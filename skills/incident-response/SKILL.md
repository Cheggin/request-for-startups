---
name: incident-response
description: Automated incident lifecycle from detection through diagnosis, fix, deploy, verification, and post-mortem with budget-guarded escalation.
user-invocable: true
---

# Incident Response

Manage the full incident lifecycle: detect, diagnose, fix, deploy, verify, and write a post-mortem. Escalate to humans when the fix exceeds budget.

## Detection

1. Accept triggers from uptime monitoring (downtime detected) or error tracking (error rate spike).
2. Create a GitHub Issue labeled `incident` with: timestamp, trigger source, and initial symptoms.

## Diagnosis

3. Query log aggregation for recent errors around the trigger time.
4. Check error tracking for relevant stack traces and affected endpoints.
5. Post a probable root cause summary as a comment on the incident Issue.

## Fix and Deploy

6. Route the fix to the appropriate owner: frontend issues to website agent, backend/API issues to backend agent, infrastructure issues to ops agent.
7. The assigned agent creates a branch, applies the fix, and runs tests.
8. Trigger the deploy pipeline with expedited checks.

## Verification

9. Run a health check after deployment. Confirm the error rate returns to baseline.
10. If the fix does not resolve the issue, rollback via the deploy pipeline and escalate.

## Budget Guard

11. If fix attempts exceed the configured turn/cost budget, stop immediately. Post a summary to Slack of what was tried and what failed. Do not retry indefinitely.

## Post-mortem

12. Write a structured post-mortem on the incident Issue: timeline, root cause, fix applied, and prevention recommendations.
13. Record metrics: time to detect, time to fix, total downtime, and cost of fix.

## Anti-patterns

- Retrying fixes indefinitely without a budget limit. The budget guard must stop and escalate.
- Deploying a fix without running health checks afterward. Verification is mandatory.
- Skipping the post-mortem because the fix worked. Post-mortems are always required.
- Diagnosing from memory instead of querying logs and error traces.

## Validation

- A simulated downtime trigger creates an incident Issue with correct labels and context.
- Logs and error traces are queried and summarized in the Issue comments.
- The fix deploys and health checks confirm recovery.
- A failed fix triggers rollback and Slack escalation.
- Budget exhaustion stops execution and posts a summary to Slack.
- Post-mortem includes timeline, root cause, fix, and prevention recommendations.
