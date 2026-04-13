# trajectory-logging

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

ATIF trajectory serialization — log every agent action (tool calls, results, decisions) as structured JSON. Uses a ring buffer capped at 50K entries to prevent disk exhaustion. Enables post-hoc debugging, eval dataset construction, and regression detection across agent runs.

## Checklist

- [ ] Trajectory schema — define structured JSON format for tool calls, results, decisions, timestamps
- [ ] PostToolUse hook — capture every tool invocation and result as a trajectory entry
- [ ] Ring buffer implementation — cap at 50K entries, overwrite oldest when full
- [ ] Disk exhaustion protection — enforce max file size, alert if approaching limit
- [ ] Per-agent trajectory files — separate log per agent session in .harness/trajectories/
- [ ] Session metadata — record agent ID, task ID, mode, start/end time per trajectory
- [ ] Eval dataset export — tool to extract trajectories into eval-compatible format
- [ ] Regression detection — compare trajectories across runs to detect behavioral regressions
- [ ] Trajectory search — query tool to find specific actions, errors, or patterns in logs
- [ ] Trajectory pruning — automatic cleanup of trajectories older than configurable retention period
- [ ] Integration tests for ring buffer overflow and concurrent writes

## Notes

- ATIF = Agent Trajectory and Interaction Format — a structured way to serialize agent behavior
- Ring buffer is critical — without it, long-running agents will fill disk
- 50K entries at ~1KB each = ~50MB per agent, reasonable for persistent logging
- Trajectories are the foundation for building eval datasets and tuning agent behavior over time
- Useful for debugging: "why did the agent do X?" — search the trajectory log
