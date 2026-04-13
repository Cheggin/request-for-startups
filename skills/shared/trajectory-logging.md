---
name: trajectory-logging
description: ATIF trajectory serialization with ring buffer for post-hoc debugging, eval dataset construction, and regression detection.
category: shared
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Trajectory Logging

## Purpose

Log every agent action (tool calls, results, decisions) as structured JSON using the ATIF (Agent Trajectory and Interaction Format) schema. Use a ring buffer capped at 50K entries to prevent disk exhaustion. Trajectory logs enable post-hoc debugging ("why did the agent do X?"), eval dataset construction for tuning agent behavior, and regression detection by comparing trajectories across runs.

## Steps

1. Define the trajectory entry schema: structured JSON with fields for tool name, parameters, result, decision rationale, timestamp, agent ID, and session ID.
2. Implement a PostToolUse hook that captures every tool invocation and its result as a trajectory entry.
3. Write trajectory entries to per-agent session files at `.harness/trajectories/{agent-id}-{session-id}.jsonl`.
4. Implement a ring buffer capped at 50K entries per file; when the buffer is full, overwrite the oldest entries.
5. Record session metadata at the start of each trajectory file: agent ID, task ID, mode, start time.
6. Update session metadata with end time and summary statistics when the session completes.
7. Enforce a maximum file size limit and alert if a trajectory file approaches the limit.
8. Provide an eval dataset export tool that extracts trajectories into eval-compatible format for the eval-framework.
9. Implement regression detection that compares trajectories across runs to flag behavioral changes (different tool sequences for the same task).
10. Provide a trajectory search tool to query for specific actions, errors, or patterns across trajectory logs.
11. Implement automatic pruning of trajectory files older than a configurable retention period.

## Examples

Good:
- Agent session produces 1,200 trajectory entries; each entry contains tool name, parameters, result summary, and timestamp in valid JSON.
- Ring buffer at 50K entries overwrites oldest entry when a new one arrives, keeping file size at approximately 50MB.
- Regression detection flags that the deploy task now takes 15 tool calls instead of the previous 8, prompting investigation.

Bad:
- Trajectory entries are unstructured text logs with no consistent schema, making them impossible to query or compare.
- No ring buffer; a long-running agent fills 2GB of disk with trajectory data before anyone notices.
- Trajectories are written but never queried, providing no debugging value.
- Regression detection compares unrelated sessions, producing false positives.

## Checklist

- [ ] Trajectory schema defines structured JSON format for tool calls, results, decisions, and timestamps
- [ ] PostToolUse hook captures every tool invocation and result as a trajectory entry
- [ ] Ring buffer implementation caps entries at 50K and overwrites oldest when full
- [ ] Disk exhaustion protection enforces max file size and alerts if approaching limit
- [ ] Per-agent trajectory files store separate logs per agent session in .harness/trajectories/
- [ ] Session metadata records agent ID, task ID, mode, and start/end time per trajectory
- [ ] Eval dataset export extracts trajectories into eval-compatible format
- [ ] Regression detection compares trajectories across runs to detect behavioral changes
- [ ] Trajectory search provides query tool to find specific actions, errors, or patterns in logs
- [ ] Trajectory pruning automatically cleans up files older than configurable retention period
