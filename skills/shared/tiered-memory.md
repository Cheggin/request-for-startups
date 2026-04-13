# tiered-memory

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Three-tier memory system to prevent context fill with stale state. Hot memory (always loaded, small) holds current task and active feature context. Warm memory (7-day TTL, loaded on demand) holds recent decisions and recent issues. Cold memory (permanent, explicitly loaded) holds completed features and historical decisions.

## Checklist

- [ ] Hot memory tier — always injected into agent context, strict size cap (~2K tokens)
- [ ] Hot memory contents — current task description, active feature checklist, immediate blockers
- [ ] Warm memory tier — 7-day TTL, loaded on demand via explicit tool call
- [ ] Warm memory contents — recent architectural decisions, recent GitHub Issues, recent error patterns
- [ ] Cold memory tier — permanent storage, loaded only when explicitly requested
- [ ] Cold memory contents — completed feature summaries, historical decisions, post-mortems
- [ ] TTL enforcement — automatic expiration and cleanup of warm memory entries past 7 days
- [ ] Memory promotion/demotion — move items between tiers as relevance changes
- [ ] Memory storage format — structured markdown or JSON in .harness/memory/{hot,warm,cold}/
- [ ] Memory injection hook — PostStart hook loads hot memory, provides tool for warm/cold access
- [ ] Memory size monitoring — alert if hot memory exceeds cap, auto-summarize to fit
- [ ] Integration with context-reset-handler — preserve memory tiers across resets
- [ ] Tests for TTL expiration, tier promotion/demotion, and size cap enforcement

## Notes

- The key insight: not everything needs to be in context all the time
- Hot memory is the only tier that costs tokens every turn — keep it tiny
- Warm memory avoids re-reading recent Issues and re-making recent decisions
- Cold memory is the institutional knowledge base — prevents repeating past mistakes
- Memory tiers should survive context resets (stored on disk, not just in conversation)
