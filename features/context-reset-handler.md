# context-reset-handler

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Detect when an agent approaches context window limits and perform a clean reset with a structured handoff document. The handoff captures objective, completed work, current state, and next steps. On session resume, read GitHub Issues to rebuild context and use hook-based re-injection to restore agent state.

## Checklist

- [ ] Context limit detection — monitor token usage, trigger reset before hitting the wall
- [ ] Handoff document generation — structured markdown with objective, completed work, current state, next steps
- [ ] Handoff document storage — save to .harness/handoffs/{agent-id}-{timestamp}.md
- [ ] Session teardown — graceful stop of current agent session after handoff is written
- [ ] Session resume — spin up new agent session with handoff document injected as context
- [ ] GitHub Issue context rebuild — read relevant Issues/PRs to restore broader project context on resume
- [ ] Hook-based re-injection — PostStart hook that loads the latest handoff document into new session
- [ ] Handoff quality validation — ensure handoff contains enough info to continue without loss
- [ ] Continuity tracking — verify the new session picks up where the old one left off
- [ ] Integration with commander-orchestrator pane manager for session lifecycle
- [ ] Tests for handoff generation, context rebuild, and re-injection flow

## Notes

- Referenced in commander-orchestrator.md: "detect when an agent hits context limits, restart with handoff doc"
- The handoff document is the most critical piece — a bad handoff means lost progress
- GitHub Issues are the source of truth for what needs to be done, so reading them on resume is essential
- Consider a pre-emptive reset at ~80% context usage rather than waiting for failure at 100%
