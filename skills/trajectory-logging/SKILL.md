---
name: trajectory-logging
description: ATIF trajectory serialization with ring buffer for post-hoc debugging, eval dataset construction, and regression detection.
---

# Trajectory Logging

Log every agent action as structured JSON using the ATIF (Agent Trajectory and Interaction Format) schema. Use a ring buffer to prevent disk exhaustion. Trajectory logs enable post-hoc debugging, eval dataset construction, and regression detection.

## Steps

1. Define the trajectory entry schema: structured JSON with fields for tool name, parameters, result, decision rationale, timestamp, agent ID, and session ID.
2. Capture every tool invocation and result via a PostToolUse hook. Write entries to `.harness/trajectories/{agent-id}-{session-id}.jsonl`.
3. Implement a ring buffer capped at 50K entries per file. When full, overwrite the oldest entries.
4. Record session metadata at the start of each file: agent ID, task ID, mode, start time. Update with end time and summary statistics on session completion.
5. Provide an eval dataset export tool that extracts trajectories into a format compatible with the eval-framework skill.
6. Implement regression detection: compare trajectories across runs for the same task. Flag behavioral changes (e.g., deploy task now takes 15 tool calls instead of 8).
7. Provide a trajectory search tool to query for specific actions, errors, or patterns across logs.
8. Automatically prune trajectory files older than a configurable retention period.

## Anti-Patterns

- Unstructured text logs with no consistent schema, making them impossible to query or compare
- No ring buffer -- a long-running agent fills 2GB of disk before anyone notices
- Trajectories written but never queried, providing no debugging value
- Regression detection comparing unrelated sessions, producing false positives

## Validation

- Every tool invocation produces a valid JSON trajectory entry with all schema fields
- Ring buffer caps at 50K entries and file size stays bounded
- Regression detection flags significant changes in tool call count or sequence for the same task
- Trajectory search returns results for known actions and error patterns
