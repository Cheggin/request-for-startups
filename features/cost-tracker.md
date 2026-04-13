# cost-tracker

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Per-agent, per-session cost tracking with configurable cost ceilings. Includes model tier optimization (use Haiku for simple tasks, Sonnet for standard, Opus for complex) and budget alerting. Cost data feeds into investor update reports.

## Checklist

- [ ] Per-agent cost tracking — record token usage and estimated cost per agent session
- [ ] Per-session cost aggregation — roll up costs by session, task, and time period
- [ ] Cost ceilings — configurable per-task budget limits in .harness/agents/*.json
- [ ] Ceiling enforcement — pause agent and escalate when approaching budget limit (80% warning, 100% stop)
- [ ] Model tier optimizer — route tasks to appropriate model based on complexity classification
- [ ] Haiku routing — trivial tasks (typos, simple edits) use cheapest model tier
- [ ] Sonnet routing — standard tasks (feature implementation, bug fixes) use mid-tier model
- [ ] Opus routing — complex tasks (architecture, multi-file refactors) use top-tier model
- [ ] Cost reporting — generate per-agent and aggregate cost summaries for investor updates
- [ ] Budget alerting — post to Slack when daily/weekly spend approaches configured limits
- [ ] Historical cost tracking — store cost data for trend analysis and budget forecasting
- [ ] Integration with commander-orchestrator for cost aggregation across all agents
- [ ] Integration with task-size-classifier for model tier selection
- [ ] Tests for ceiling enforcement, model routing, and cost calculation accuracy

## Notes

- Referenced in commander-orchestrator.md: "per-agent, per-session cost tracking with ceilings"
- Model tier optimization can dramatically reduce costs — most tasks don't need Opus
- Cost ceilings prevent runaway spending from stuck agents or infinite loops
- Investor updates should show cost-per-feature and cost trends over time
- Consider tracking cost-per-line-of-code and cost-per-task as efficiency metrics
