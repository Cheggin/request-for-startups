---
name: investor-updates
description: Structured milestone progress reports posted to Slack with metrics from GitHub, CI, and cost telemetry.
category: shared
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Investor Updates

## Purpose

Generate and post structured progress reports to Slack at each project milestone. Reports pull real metrics from GitHub Issues (feature progress), CI (test results), agent telemetry (cost spent), and wall-clock time. Templates are defined per milestone phase: research complete, spec complete, design complete, feature shipped, deployed. Course correction is supported by detecting user replies in Slack and routing them to the slack-course-correction skill.

## Steps

1. Define milestone types: research complete, spec complete, design complete, feature shipped, deployed.
2. Detect milestone completion automatically by monitoring phase-transition signals (all Issues in a phase moved to Done, deploy succeeded, etc.).
3. Collect metrics from real sources:
   - Feature progress: count closed vs open Issues on the GitHub Project board.
   - Test results: parse CI output for passing, failing, and skipped test counts.
   - Cost spent: pull token and API spend from agent telemetry data.
   - Time elapsed: calculate wall-clock time from project kickoff, broken down by phase.
4. Select the template matching the milestone type and populate it with collected metrics.
5. Format the Slack message using rich blocks with progress bars, metric summaries, and links to artifacts.
6. Post the formatted message to the configured Slack channel.
7. Store the update in `.harness/updates/{milestone-type}-{timestamp}.md` for historical reference.
8. Listen for user replies to the posted message and route them to the slack-course-correction skill for intent classification and action.
9. Provide trend data by comparing current metrics against previous milestone updates.
10. Never estimate or approximate metrics; all numbers must come from authoritative sources.

## Examples

Good:
- Feature shipped milestone posts to Slack: "8/10 features done, 47 tests passing, $4.20 spent, 2h 15m elapsed" with links to the PR and deploy.
- Trend line shows cost per feature decreasing from $0.80 to $0.52 over the last 3 milestones.
- User replies "prioritize mobile over desktop" and the system routes to slack-course-correction for handling.

Bad:
- Update says "most features are done" instead of pulling the exact count from GitHub Issues.
- Cost metric is estimated from token counts instead of pulled from actual telemetry records.
- Update is posted manually instead of being triggered automatically on milestone completion.
- No historical storage, so trend data is unavailable for later updates.

## Checklist

- [ ] Milestone type definitions cover research complete, spec complete, design complete, feature shipped, deployed
- [ ] Template per milestone type provides structured Slack message with consistent format and sections
- [ ] Metrics collection pulls features done/total from GitHub Issues, tests from CI, cost from telemetry, time from project start
- [ ] Slack message formatting uses rich blocks with progress bars, metric summaries, and artifact links
- [ ] Milestone detection triggers update automatically when a phase completes
- [ ] Cost tracking integration pulls token and API spend from agent loop telemetry and aggregates per milestone
- [ ] Test results integration parses CI output to report passing, failing, and skipped test counts
- [ ] Feature progress integration counts closed vs open Issues on the GitHub Project board
- [ ] Time elapsed calculation reports wall-clock time from project kickoff broken down by phase
- [ ] Course correction listener detects user replies to investor update messages in Slack
- [ ] Route correction to slack-course-correction skill for intent classification and propagation
- [ ] Update history stores all investor updates for trend analysis and past report reference
