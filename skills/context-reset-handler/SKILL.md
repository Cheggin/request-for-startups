---
name: context-reset-handler
description: Detect context window limits and perform clean resets with structured handoff documents for session continuity.
user-invocable: true
---

# Context Reset Handler

Detect when an agent approaches context window limits and perform a clean reset with a structured handoff document that preserves progress.

## Steps

1. Monitor token usage during agent execution. Trigger pre-emptive reset at 80% context capacity -- never wait for 100% failure.
2. Generate a handoff document at `.harness/handoffs/{agent-id}-{timestamp}.md` with exactly four sections:
   - **Objective**: current task and goal
   - **Completed**: files changed, tests written, PRs opened
   - **In Progress**: current work state and blockers
   - **Next Steps**: ordered list of remaining work with specific file paths and line numbers
3. Stop the current agent session gracefully after the handoff is written.
4. Start a new session with the handoff injected as initial context via a PostStart hook.
5. Read open GitHub Issues and recent PR comments to rebuild broader project context.
6. Validate handoff quality: all four sections must be non-empty and contain specific references (file paths, Issue numbers), not vague summaries.

## Anti-Patterns

- Waiting until 100% context and crashing with no handoff
- Writing "continue working on the feature" with no specifics about what was done or remains
- Re-reading every file from scratch instead of using the handoff to target only what changed
- Storing handoff state only in conversation context where it is lost on reset

## Validation

- Handoff document exists with all four sections populated with concrete references
- New session resumes from the exact stopping point without re-reading the full codebase
- No progress is lost across the reset boundary
