---
name: cost-tracker
description: Per-agent per-session cost tracking with configurable ceilings and model tier optimization.
user-invocable: true
group: operate
prerequisites: []
next: [investor-updates]
workflows: [continuous-improvement]
---

# Cost Tracker

Track token usage and estimated cost per agent session. Enforce budget ceilings and optimize costs by routing tasks to the appropriate model tier.

## Steps

1. Record input and output token counts for every LLM invocation and tool call. Calculate cost using the model's pricing table.
2. Aggregate costs by agent session, task, and time period (daily, weekly). Store in `.harness/costs/`.
3. Load per-task budget ceilings from `.harness/agents/*.json`. Post a warning at 80% of budget. Hard-stop the agent at 100% and escalate to Slack with a spend summary.
4. Route tasks to the appropriate model tier based on complexity:
   - **Haiku**: trivial tasks (typos, formatting, simple edits)
   - **Sonnet**: standard tasks (feature implementation, bug fixes)
   - **Opus**: complex tasks (architecture decisions, multi-file refactors)
5. Generate per-agent and aggregate cost summaries for investor update reports.
6. Store historical cost data for trend analysis and budget forecasting.

## Anti-Patterns

- Running Opus for 200 turns on a simple formatting task with no ceiling enforcement
- Tracking only output tokens and ignoring input tokens, underreporting actual spend
- No alerting configured -- team discovers overspend only at end of month
- Estimating costs instead of calculating from actual token counts and pricing tables

## Validation

- Every LLM call has a recorded cost entry with both input and output tokens
- Budget ceiling triggers warning at 80% and hard-stops at 100%
- Trivial tasks route to Haiku, not Opus
- Cost reports show per-agent, per-task, and aggregate breakdowns with exact numbers
