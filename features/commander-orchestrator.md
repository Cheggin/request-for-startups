# commander-orchestrator

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

The top-level orchestrator that manages domain-specific agent panes, assigns work, handles handoffs between agents, and synthesizes investor updates. This is the "brain" that coordinates website-agent, backend-agent, growth-agent, writing-agent, and ops-agent.

## Checklist

- [ ] Task dispatcher — read GitHub Issues, assign to appropriate agent pane by category
- [ ] Pane manager — spin up/kill tmux panes as needed via smux/tmux-bridge
- [ ] Agent health monitor — check if agents are stuck, idle, or erroring
- [ ] Handoff protocol — when one agent finishes, trigger dependent agents
- [ ] Investor update synthesizer — aggregate progress across all agents into Slack reports
- [ ] Context reset handler — detect when an agent hits context limits, restart with handoff doc
- [ ] Cost tracker — per-agent, per-session cost tracking with ceilings
- [ ] Error escalation — FATAL errors escalate to Slack, TRANSIENT retries, UNKNOWN retries once
- [ ] GitHub Project board sync — move cards as agents complete work

## Notes

- Commander runs as the main Claude Code session (like the current conversation)
- Uses tmux-bridge to read/type/send to agent panes
- Each agent pane runs its own Claude Code session with agent-specific .mcp.json
- Research report recommends: task-size classification before dispatching (trivial/moderate/complex)
