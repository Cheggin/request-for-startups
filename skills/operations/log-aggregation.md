---
name: log-aggregation
description: Aggregate and search logs from Vercel and Railway with structured format and ring buffer storage
category: operations
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

## Purpose

Aggregate logs from Vercel (frontend) and Railway (backend) into a unified, structured format. Provide a search interface for agents to query logs by time range, level, source, and keyword. Use ring buffer storage with a configurable retention window to prevent unbounded disk usage.

## Steps

1. Pull logs from Vercel deployments using the `vercel logs` CLI command on a configurable polling interval (default: every 5 minutes).
2. Pull logs from Railway services using the `railway logs` CLI command on the same interval.
3. Normalize logs from both sources into a consistent schema: timestamp, level, source, message, and metadata.
4. Store normalized logs in a ring buffer with a configurable retention window (default: 7 days).
5. Enforce a hard storage size cap and evict the oldest entries when the cap is reached.
6. Expose a log search tool that agents can call to query by time range, log level (debug, info, warn, error), source (frontend/backend), and keyword or regex.
7. Correlate frontend and backend logs for the same user request when possible using request IDs or timestamps.
8. Surface error-level logs proactively to the ops agent without requiring a manual query.
9. When creating GitHub Issues from errors, attach relevant log lines as context.
10. Index logs by timestamp and level for fast real-time search during debugging.

## Examples

Good:
- "Pull the last hour of Railway logs and search for database connection errors."
- "Show all error-level logs from the frontend in the last 24 hours."
- "Attach the 10 log lines surrounding the crash to the GitHub Issue."

Bad:
- "Store all logs forever without any retention limit." (Ring buffer with retention window is required.)
- "Only ingest logs from Vercel and ignore Railway." (Both sources must be aggregated.)
- "Require agents to SSH into servers to read logs manually." (Logs must be queryable via the search tool.)

## Checklist

- [ ] Vercel logs are ingested via CLI on a configurable polling interval
- [ ] Railway logs are ingested via CLI on a configurable polling interval
- [ ] Logs are normalized into a consistent schema (timestamp, level, source, message, metadata)
- [ ] Ring buffer storage retains logs for a configurable window (default: 7 days)
- [ ] Hard storage size cap evicts oldest entries when reached
- [ ] Log search tool supports queries by time range, level, source, and keyword/regex
- [ ] Frontend and backend logs are correlated for the same request when possible
- [ ] Error-level logs are surfaced proactively to the ops agent
- [ ] Relevant log lines are attached as context when creating GitHub Issues
- [ ] Logs are indexed by timestamp and level for fast search
