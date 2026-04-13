---
name: cost-tracker
description: Per-agent per-session cost tracking with configurable ceilings and model tier optimization.
category: shared
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Cost Tracker

## Purpose

Track token usage and estimated cost per agent and per session. Enforce configurable cost ceilings to prevent runaway spending. Optimize costs by routing tasks to the appropriate model tier based on complexity (Haiku for trivial, Sonnet for standard, Opus for complex). Feed cost data into investor update reports for transparency.

## Steps

1. Record token usage (input and output) for every agent tool call and LLM invocation.
2. Calculate estimated cost per invocation using the model's pricing table.
3. Aggregate costs by agent session, task, and time period (daily, weekly).
4. Load cost ceiling configuration from `.harness/agents/*.json` for per-task budget limits.
5. Monitor cumulative spend against ceiling: post warning at 80% of budget, hard stop at 100%.
6. When ceiling is hit, pause the agent and escalate to Slack with spend summary.
7. Classify task complexity using the task description and route to the appropriate model tier:
   - Haiku: trivial tasks (typos, simple edits, formatting)
   - Sonnet: standard tasks (feature implementation, bug fixes)
   - Opus: complex tasks (architecture decisions, multi-file refactors)
8. Generate per-agent and aggregate cost summaries for investor update reports.
9. Store historical cost data for trend analysis and budget forecasting.
10. Post to Slack when daily or weekly spend approaches configured alert thresholds.

## Examples

Good:
- Agent completes a feature using Sonnet, cost is tracked at $0.42, well under the $2.00 ceiling for that task.
- Trivial typo fix is routed to Haiku instead of Opus, saving 95% on that invocation.
- Weekly cost report shows $12.50 spent across 8 agents with per-feature cost breakdown.

Bad:
- Agent runs with Opus for 200 turns on a simple formatting task, burning $15 with no ceiling enforcement.
- Cost tracking only records output tokens and ignores input tokens, underreporting actual spend.
- No alerting is configured, so the team discovers overspend only at end of month.

## Checklist

- [ ] Per-agent cost tracking records token usage and estimated cost per agent session
- [ ] Per-session cost aggregation rolls up costs by session, task, and time period
- [ ] Cost ceilings are configurable per-task in .harness/agents/*.json
- [ ] Ceiling enforcement pauses agent and escalates when approaching budget limit
- [ ] Model tier optimizer routes tasks to appropriate model based on complexity
- [ ] Cost reporting generates per-agent and aggregate summaries for investor updates
- [ ] Budget alerting posts to Slack when spend approaches configured limits
- [ ] Historical cost tracking stores data for trend analysis and forecasting
