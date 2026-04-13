---
name: slack-course-correction
description: Detect user feedback in Slack threads, classify intent, and propagate direction changes to specs, Issues, and agents.
category: shared
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Slack Course Correction

## Purpose

When a user replies to an investor update in Slack with feedback or a direction change, detect the reply, classify the intent (pivot, feature request, bug report, priority change, general feedback), and route to the appropriate handler. Propagate changes atomically: update the spec, reconcile GitHub Issues, and notify active agents. Confirm back to the user in the Slack thread what was understood and what actions were taken.

## Steps

1. Listen for replies to investor update messages in Slack via the Slack plugin or webhook integration.
2. Extract the user's reply text and any attached context (screenshots, links, quoted text).
3. Classify the intent into one of: pivot, feature request, bug report, priority change, general feedback.
4. If intent is ambiguous, post a clarifying question in the Slack thread before taking action.
5. For a pivot: require explicit user confirmation, then trigger a spec rewrite and full Issue reprioritization.
6. For a feature request: create a new feature checklist in features/, create corresponding GitHub Issues with appropriate labels.
7. For a bug report: create a GitHub Issue with the bug label and route to the appropriate agent based on the description.
8. For a priority change: reorder the GitHub Project board and update agent task queues accordingly.
9. For general feedback: append context to the relevant spec sections or feature files.
10. Sync GitHub Issues to match the new direction: create new Issues, close obsolete ones, reprioritize remaining ones.
11. Notify active agents whose task context has changed so they can adapt or restart with updated information.
12. Post a confirmation message back to the Slack thread summarizing what was understood and what actions were taken.
13. Log every course correction with before and after state as a GitHub Issue comment for audit purposes.

## Examples

Good:
- User replies "drop the blog feature and focus on the dashboard" -- classified as pivot, confirmation requested, then spec rewritten, 3 blog Issues closed, 2 new dashboard Issues created, agents notified.
- User replies "the login page has a typo in the header" -- classified as bug report, Issue created with bug label and assigned to the website agent.
- User replies "ship notifications before settings" -- classified as priority change, Project board reordered, active agent redirected.

Bad:
- User says "maybe we should rethink the approach" and the system executes a full pivot without asking for clarification.
- Spec is updated but GitHub Issues are not reconciled, leaving stale Issues on the board.
- Agent is not notified of a priority change and continues working on a deprioritized task.
- No confirmation posted to Slack, so the user does not know if their feedback was received or acted on.

## Checklist

- [ ] Slack thread listener detects replies to investor update messages via Slack plugin or webhook
- [ ] Intent classifier categorizes user reply as pivot, feature request, bug report, priority change, or general feedback
- [ ] Pivot handling triggers spec rewrite and Issue reprioritization after explicit user confirmation
- [ ] Feature request handling creates new feature checklist and corresponding GitHub Issues
- [ ] Bug report handling creates GitHub Issue with bug label and routes to appropriate agent
- [ ] Priority change handling reorders GitHub Project board and updates agent task queues
- [ ] General feedback handling appends context to relevant spec sections or feature files
- [ ] Spec update propagation diffs against current Issues and reconciles differences
- [ ] GitHub Issues sync creates, closes, or reprioritizes Issues to match the new direction
- [ ] Active agent notification interrupts or redirects running agents when their task context changes
- [ ] Confirmation message posts back to Slack thread confirming understanding and actions taken
- [ ] Ambiguity handling asks clarifying question in Slack thread before acting on unclear intent
- [ ] Audit trail logs every course correction with before and after state in a GitHub Issue comment
