# investor-updates

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** communication
**Created:** 2026-04-13

## Description

Structured progress reports posted to Slack at each milestone. Templates per phase (research complete, spec complete, design complete, feature shipped, deployed). Include metrics: features done/total, tests passing, cost spent, time elapsed. Course correction: user replies in Slack, system picks it up and adjusts.

## Checklist

- [ ] Define milestone types — research complete, spec complete, design complete, feature shipped, deployed
- [ ] Template per milestone type — structured Slack message with consistent format and sections
- [ ] Metrics collection — features done/total from GitHub Issues, tests passing from CI, cost spent from agent telemetry, time elapsed from project start
- [ ] Slack message formatting — rich blocks with progress bars, metric summaries, and links to artifacts
- [ ] Milestone detection — trigger update automatically when a phase completes (not manually)
- [ ] Cost tracking integration — pull token/API spend from agent loop telemetry and aggregate per milestone
- [ ] Test results integration — parse CI output to report passing/failing/skipped test counts
- [ ] Feature progress integration — count closed vs open Issues on the GitHub Project board
- [ ] Time elapsed calculation — wall-clock time from project kickoff, broken down by phase
- [ ] Course correction listener — detect user replies to investor update messages in Slack
- [ ] Route correction to slack-course-correction feature for intent classification and propagation
- [ ] Update history — store all investor updates so agents can reference past reports for trend data
- [ ] Unit tests for template rendering, metrics aggregation, and milestone detection

## Notes

- Investor updates are the primary communication channel between the harness and the user
- Templates should be opinionated but not verbose — users want a quick status scan, not a novel
- Course correction via Slack reply is handled by the slack-course-correction feature
- Metrics must be pulled from real sources (GitHub, CI, telemetry) — never estimated or approximated
