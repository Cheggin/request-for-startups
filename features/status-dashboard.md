# status-dashboard

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Terminal UI or web dashboard showing: active agents and their current task, feature progress (checklist completion), cost per agent, recent investor updates, and GitHub Issues backlog. Provides real-time updates on harness operations.

## Checklist

- [ ] Agent status panel — show each agent's name, state (running/idle/stopped), current task
- [ ] Feature progress panel — list all features with checklist completion bars
- [ ] Cost panel — running total per agent, per feature, and overall project spend
- [ ] Investor updates panel — show recent updates with dates and status
- [ ] GitHub Issues panel — display open issues sorted by priority/label
- [ ] Real-time updates — refresh data automatically (polling or event-driven)
- [ ] Terminal UI option — TUI using a library like blessed or ink for terminal rendering
- [ ] Web dashboard option — lightweight web page served locally for browser viewing
- [ ] Filtering and sorting — filter features by status, sort agents by cost
- [ ] Historical trends — show cost and progress over time
- [ ] Alert indicators — highlight agents that are stuck, over budget, or erroring
- [ ] Integration with trajectory logs — pull live data from agent execution logs
- [ ] Unit tests for data aggregation and display rendering

## Notes

- Start with terminal UI — it fits the CLI-first workflow better
- Web dashboard is a nice-to-have for when you want to check status from a browser
- Real-time updates should not be too frequent — every 10-30 seconds is sufficient
- Cost data comes from trajectory-logging feature
- Feature progress is calculated by parsing checklist markdown files in features/
- The dashboard is read-only — use cli-harness-manager for taking actions
