---
name: slack-course-correction
description: Detect user feedback in Slack threads, classify intent, and propagate direction changes to specs, Issues, and agents.
---

# Slack Course Correction

When a user replies to an investor update in Slack, detect the reply, classify intent, propagate changes atomically across specs and Issues, and confirm back in the thread.

## Steps

1. Listen for replies to investor update messages in Slack via the Slack plugin or webhook.
2. Classify intent into one of: **pivot**, **feature request**, **bug report**, **priority change**, **general feedback**. If ambiguous, post a clarifying question before acting.
3. Handle each intent type:
   - **Pivot**: require explicit user confirmation, then rewrite the spec and reprioritize all Issues.
   - **Feature request**: create a new feature checklist in `features/` and corresponding GitHub Issues with labels.
   - **Bug report**: create a GitHub Issue with the `bug` label and route to the appropriate agent.
   - **Priority change**: reorder the Project board and update agent task queues.
   - **General feedback**: append context to the relevant spec sections or feature files.
4. Sync GitHub Issues to match the new direction: create new Issues, close obsolete ones, reprioritize remaining ones.
5. Notify active agents whose task context changed so they can adapt or restart with updated information.
6. Post a confirmation message back to the Slack thread summarizing what was understood and what actions were taken.
7. Log every course correction with before/after state as a GitHub Issue comment for audit.

## Anti-Patterns

- Executing a full pivot on vague feedback like "maybe we should rethink the approach" without asking for clarification
- Updating the spec but not reconciling GitHub Issues, leaving stale Issues on the board
- Not notifying agents of priority changes, so they continue working on deprioritized tasks
- No confirmation posted to Slack, leaving the user unsure if feedback was received

## Validation

- Every user reply is classified and acted on or clarified within the thread
- Spec changes and Issue changes are atomic -- neither happens without the other
- Active agents are notified when their task context changes
- Confirmation message in the Slack thread matches the actions actually taken
