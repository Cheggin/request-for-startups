---
name: tiered-memory
description: Three-tier memory system (hot, warm, cold) to prevent context fill with stale state and preserve knowledge across resets.
category: shared
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Tiered Memory

## Purpose

Implement a three-tier memory system that prevents context pollution from stale state. Hot memory (always loaded, capped at approximately 2K tokens) holds the current task and active feature context. Warm memory (7-day TTL, loaded on demand) holds recent decisions and recent Issues. Cold memory (permanent, explicitly loaded) holds completed feature summaries and historical decisions. Memory tiers are stored on disk and survive context resets.

## Steps

1. Create the memory storage directory structure at `.harness/memory/{hot,warm,cold}/`.
2. Define the hot memory tier: always injected into agent context, strict size cap of approximately 2K tokens.
3. Populate hot memory with current task description, active feature checklist, and immediate blockers.
4. Define the warm memory tier: entries have a 7-day TTL and are loaded on demand via an explicit tool call.
5. Populate warm memory with recent architectural decisions, recent GitHub Issues, and recent error patterns.
6. Define the cold memory tier: permanent storage, loaded only when explicitly requested by the agent.
7. Populate cold memory with completed feature summaries, historical decisions, and post-mortems.
8. Implement TTL enforcement that automatically expires and cleans up warm memory entries older than 7 days.
9. Implement memory promotion and demotion to move items between tiers as relevance changes (e.g., a warm decision becomes hot when its feature is active).
10. Use a PostStart hook to inject hot memory into every new agent session and provide tool access for warm and cold retrieval.
11. Monitor hot memory size and auto-summarize entries if the tier exceeds its cap.
12. Integrate with the context-reset-handler skill to ensure all memory tiers are preserved across resets.

## Examples

Good:
- Hot memory contains: "Current task: implement auth flow. Active feature: user-login. Blocker: OAuth redirect URL not configured." -- concise, actionable, under 2K tokens.
- Agent needs a past architecture decision, calls the warm memory tool, retrieves "2026-04-10: chose JWT over sessions for stateless auth" without polluting hot context.
- Cold memory stores "Feature: blog-engine completed 2026-04-08, 4 Issues closed, key decision: markdown over rich text" for future reference.

Bad:
- Hot memory contains the full text of 5 feature specs, exceeding the 2K cap and crowding out useful context.
- Warm memory entries are never expired, accumulating stale decisions that mislead the agent.
- All memory is stored in conversation context instead of on disk, so it is lost on context reset.
- No promotion mechanism, so a reactivated feature's context stays in cold storage and is never surfaced.

## Checklist

- [ ] Hot memory tier is always injected into agent context with a strict size cap of approximately 2K tokens
- [ ] Hot memory contents include current task description, active feature checklist, and immediate blockers
- [ ] Warm memory tier has 7-day TTL and is loaded on demand via explicit tool call
- [ ] Warm memory contents include recent architectural decisions, recent GitHub Issues, and recent error patterns
- [ ] Cold memory tier is permanent storage loaded only when explicitly requested
- [ ] Cold memory contents include completed feature summaries, historical decisions, and post-mortems
- [ ] TTL enforcement automatically expires and cleans up warm memory entries past 7 days
- [ ] Memory promotion and demotion moves items between tiers as relevance changes
- [ ] Memory storage format uses structured markdown or JSON in .harness/memory/{hot,warm,cold}/
- [ ] Memory injection hook via PostStart loads hot memory and provides tool access for warm and cold retrieval
- [ ] Memory size monitoring alerts if hot memory exceeds cap and auto-summarizes to fit
- [ ] Integration with context-reset-handler preserves memory tiers across resets
