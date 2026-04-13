# cubic-webhook-channel

**Status:** 🟡 In progress
**Agent:** harness-dev
**Category:** coding
**Created:** 2026-04-13

## Description

Real-time bridge between Cubic code reviews and Claude Code sessions. GitHub webhook → Railway receiver → Convex queue → local MCP channel → Claude Code session.

## Checklist

- [x] Convex schema (cubicEvents table, indexes, mutations)
- [x] Railway webhook receiver (signature verification, Cubic filtering, Convex write)
- [x] Local MCP channel server (polls Convex, pushes `<channel>` events)
- [x] Unit tests — receiver (22 tests)
- [x] Unit tests — channel (8 tests)
- [x] README with setup instructions
- [x] Railway config (railway.json)
- [x] .mcp.json registration
- [x] Convex deployment (fantastic-partridge-818.convex.cloud)
- [ ] End-to-end test with real Cubic review
- [ ] GitHub webhook configured on repo
- [ ] Verify events flow: Cubic → GitHub → Railway → Convex → Claude Code

## Notes

- Receiver refactored for DI/testability by harness-dev
- Convex schema has by_commentId index for deduplication
- Channel polls every 5s, deduplicates by event _id
