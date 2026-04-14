---
name: investor-updates
description: Structured milestone progress reports posted to Slack with metrics from GitHub, CI, and cost telemetry.
user-invocable: true
---

# Investor Updates

Generate and post structured progress reports to Slack at each project milestone. All metrics come from authoritative sources -- never estimate or approximate.

## Steps

1. Define milestone types: **research complete**, **spec complete**, **design complete**, **feature shipped**, **deployed**.
2. Detect milestone completion by monitoring phase-transition signals (all Issues in a phase moved to Done, deploy succeeded).
3. Collect metrics from real sources:
   - **Feature progress**: closed vs open Issues on the GitHub Project board
   - **Test results**: passing, failing, skipped counts from CI output
   - **Cost spent**: token and API spend from agent telemetry
   - **Time elapsed**: wall-clock time from project kickoff, broken down by phase
4. Select the template matching the milestone type. Format as a Slack message using rich blocks with progress bars, metric summaries, and artifact links.
5. Post to the configured Slack channel. Store a copy at `.harness/updates/{milestone-type}-{timestamp}.md`.
6. Compare current metrics against previous milestones to surface trends (e.g., cost per feature decreasing).
7. Listen for user replies to the posted message and route them to the slack-course-correction skill.

## Anti-Patterns

- Saying "most features are done" instead of pulling the exact count from GitHub Issues
- Estimating cost from token counts instead of pulling from actual telemetry records
- Posting updates manually instead of triggering automatically on milestone completion
- No historical storage, making trend data unavailable for later updates

## Validation

- Every metric in the report traces to an authoritative source (GitHub, CI, telemetry)
- Milestone detection triggers automatically without manual intervention
- Trend data compares current metrics against at least the previous milestone
- User replies in the Slack thread are detected and routed to slack-course-correction
