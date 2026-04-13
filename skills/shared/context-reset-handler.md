---
name: context-reset-handler
description: Detect context window limits and perform clean resets with structured handoff documents for session continuity.
category: shared
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Context Reset Handler

## Purpose

Detect when an agent approaches context window limits and perform a clean reset with a structured handoff document. The handoff captures the objective, completed work, current state, and next steps. On session resume, read GitHub Issues to rebuild context and use hook-based re-injection to restore agent state. This prevents lost progress from hard context cutoffs.

## Steps

1. Monitor token usage during agent execution and track cumulative context size.
2. Trigger a pre-emptive reset at 80% context capacity rather than waiting for failure at 100%.
3. Generate a structured handoff document containing:
   - Current objective and task description
   - Completed work (files changed, tests written, PRs opened)
   - Current state (what is in progress, blockers encountered)
   - Next steps (ordered list of remaining work)
4. Save the handoff document to `.harness/handoffs/{agent-id}-{timestamp}.md`.
5. Gracefully stop the current agent session after handoff is written.
6. Spin up a new agent session with the handoff document injected as initial context.
7. Read relevant GitHub Issues and recent PR comments to rebuild broader project context.
8. Use a PostStart hook to load the latest handoff document into the new session automatically.
9. Validate handoff quality by checking that all required sections are non-empty.
10. Verify the new session picks up where the old one left off by comparing task state before and after reset.

## Examples

Good:
- Agent at 78% context triggers handoff generation, writes structured document with 4 sections, new session resumes from exact stopping point.
- Handoff document includes specific file paths, line numbers, and remaining checklist items so the new session has no ambiguity.

Bad:
- Agent hits 100% context limit and crashes with no handoff, losing all progress.
- Handoff document says "continue working on the feature" with no specifics about what was done or what remains.
- New session re-reads every file from scratch instead of using the handoff to target only what is needed.

## Checklist

- [ ] Context limit detection monitors token usage and triggers reset before hitting the wall
- [ ] Handoff document generation produces structured markdown with objective, completed work, current state, next steps
- [ ] Handoff document storage saves to .harness/handoffs/{agent-id}-{timestamp}.md
- [ ] Session teardown gracefully stops the current agent session after handoff is written
- [ ] Session resume spins up new agent session with handoff document injected as context
- [ ] GitHub Issue context rebuild reads relevant Issues and PRs to restore broader project context on resume
- [ ] Hook-based re-injection via PostStart hook loads the latest handoff document into new session
- [ ] Handoff quality validation ensures handoff contains enough info to continue without loss
- [ ] Continuity tracking verifies the new session picks up where the old one left off
