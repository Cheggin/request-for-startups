# slack-course-correction

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** communication
**Created:** 2026-04-13

## Description

When user replies to an investor update in Slack with feedback or a direction change, the system detects it via Slack plugin, classifies the intent (pivot, feature request, bug report, priority change), and routes to the appropriate agent. The correction propagates: update spec, update GitHub Issues, notify active agents.

## Checklist

- [ ] Slack thread listener — detect replies to investor update messages via Slack plugin/webhook
- [ ] Intent classifier — categorize user reply as: pivot, feature request, bug report, priority change, general feedback
- [ ] Pivot handling — major direction change triggers spec rewrite and Issue reprioritization
- [ ] Feature request handling — create new feature checklist in features/, create corresponding GitHub Issues
- [ ] Bug report handling — create GitHub Issue with bug label, route to appropriate agent based on description
- [ ] Priority change handling — reorder GitHub Project board, update agent task queues
- [ ] General feedback handling — append context to relevant spec sections or feature files
- [ ] Spec update propagation — when spec changes, diff against current Issues and reconcile
- [ ] GitHub Issues sync — create, close, or reprioritize Issues to match the new direction
- [ ] Active agent notification — interrupt or redirect running agents when their task context changes
- [ ] Confirmation message — post back to Slack thread confirming what was understood and what actions were taken
- [ ] Ambiguity handling — if intent is unclear, ask clarifying question in Slack thread before acting
- [ ] Audit trail — log every course correction with before/after state in a GitHub Issue comment
- [ ] Unit tests for intent classification, propagation logic, and Issue reconciliation

## Notes

- This is the user's primary control mechanism — it must feel responsive and accurate
- Intent classification should err on the side of asking for clarification rather than guessing wrong
- A pivot is expensive (may discard work), so pivots should require explicit confirmation before executing
- Propagation must be atomic — don't leave the system in a half-updated state
