---
name: log-aggregation
description: Aggregate and search logs from Vercel and Railway with structured format, ring buffer storage, and agent-queryable search interface.
---

# Log Aggregation

Unify logs from Vercel (frontend) and Railway (backend) into a structured, searchable format with bounded storage.

## Ingestion

1. Pull logs from Vercel deployments using `vercel logs` on a configurable polling interval (default: 5 minutes).
2. Pull logs from Railway services using `railway logs` on the same interval.
3. Normalize all logs into a consistent schema: `timestamp`, `level`, `source`, `message`, `metadata`.

## Storage

4. Store normalized logs in a ring buffer with a configurable retention window (default: 7 days).
5. Enforce a hard storage size cap. Evict oldest entries when the cap is reached.
6. Index logs by timestamp and level for fast search during debugging.

## Search Interface

7. Expose a log search tool that agents can call with parameters: time range, log level (debug/info/warn/error), source (frontend/backend), and keyword or regex.
8. Correlate frontend and backend logs for the same request using request IDs or timestamps when available.

## Proactive Surfacing

9. Surface error-level logs automatically to the ops agent without requiring a manual query.
10. When creating GitHub Issues from errors, attach the surrounding log lines as context.

## Anti-patterns

- Storing logs forever without retention limits. The ring buffer must enforce bounded storage.
- Ingesting from only one source. Both Vercel and Railway are required.
- Requiring agents to SSH into servers to read logs. Logs must be queryable via the search tool.
- Logging without structured fields. Every log entry needs timestamp, level, source, and message.

## Validation

- Logs from both Vercel and Railway appear in the unified store with correct schema fields.
- A search query by time range and level returns matching results.
- The ring buffer evicts old entries when the storage cap is hit.
- Error-level logs trigger proactive notification to the ops agent.
- A GitHub Issue created from an error includes surrounding log context.
