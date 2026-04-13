# log-aggregation

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** ops
**Created:** 2026-04-13

## Description

Aggregate logs from Vercel (frontend) and Railway (backend) using their respective CLIs. Structured log search for debugging. Agents can query logs when investigating issues. Ring buffer storage (don't accumulate indefinitely).

## Checklist

- [ ] Vercel log ingestion — pull logs from Vercel deployments using `vercel logs` CLI command
- [ ] Railway log ingestion — pull logs from Railway services using `railway logs` CLI command
- [ ] Structured log format — normalize logs from both sources into a consistent schema (timestamp, level, source, message, metadata)
- [ ] Log search API — agents can query logs by time range, log level, source (frontend/backend), and keyword/regex
- [ ] Ring buffer storage — retain logs for a configurable window (default: 7 days), automatically purge older entries
- [ ] Storage size cap — hard limit on total log storage to prevent disk bloat, evict oldest entries when cap is reached
- [ ] Log level filtering — support filtering by debug, info, warn, error levels
- [ ] Request correlation — correlate frontend and backend logs for the same user request when possible
- [ ] Agent-facing log query tool — expose log search as a tool that agents can call during investigation
- [ ] Error log highlighting — surface error-level logs proactively to ops agent without requiring a query
- [ ] Log context for GitHub Issues — when creating Issues from errors, attach relevant log lines as context
- [ ] Periodic ingestion — poll for new logs on a configurable interval (default: every 5 minutes)
- [ ] Unit tests for log normalization, ring buffer eviction, search queries, and ingestion from both sources

## Notes

- Logs are the primary debugging tool for agents investigating production issues
- Ring buffer is essential — unbounded log storage will eventually eat all disk space
- Vercel and Railway have different log formats, so normalization is required for a unified search experience
- Log search should be fast enough for real-time debugging — consider indexing by timestamp and level
