---
name: tiered-memory
description: Three-tier memory system (hot, warm, cold) to prevent context pollution with stale state and preserve knowledge across resets.
user-invocable: true
group: orchestration
prerequisites: []
next: []
workflows: []
---

# Tiered Memory

Implement a three-tier memory system stored on disk at `.harness/memory/{hot,warm,cold}/` that prevents context pollution and survives context resets.

## Steps

1. **Hot tier** (always loaded, max 2K tokens): inject into every agent session via PostStart hook. Contains current task description, active feature checklist, and immediate blockers. Auto-summarize if the tier exceeds its cap.
2. **Warm tier** (7-day TTL, loaded on demand): agent retrieves via explicit tool call. Contains recent architectural decisions, recent GitHub Issues, and recent error patterns. Automatically expire and clean up entries older than 7 days.
3. **Cold tier** (permanent, explicitly loaded): agent retrieves only when specifically needed. Contains completed feature summaries, historical decisions, and post-mortems.
4. Implement promotion and demotion between tiers as relevance changes. When a feature reactivates, promote its cold context to hot. When a task completes, demote its hot context to warm or cold.
5. Integrate with context-reset-handler to ensure all tiers persist across resets. The PostStart hook loads hot memory and provides tool access for warm and cold retrieval.

## Anti-Patterns

- Hot memory containing full text of 5 feature specs, exceeding the 2K cap and crowding out useful context
- Warm memory entries never expired, accumulating stale decisions that mislead the agent
- All memory stored in conversation context instead of on disk, lost on context reset
- No promotion mechanism, so a reactivated feature's context stays in cold storage and is never surfaced

## Validation

- Hot memory stays under 2K tokens and contains only current-task information
- Warm entries older than 7 days are automatically cleaned up
- All memory tiers survive a context reset with no data loss
- Promotion/demotion moves items between tiers when relevance changes
