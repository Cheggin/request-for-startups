---
name: github-state-manager
description: Track all task state via GitHub Issues and Project boards with automated column transitions and audit trail comments.
---

# GitHub State Manager

Manage task tracking through GitHub Issues and a Project board. Parse specs into Issues, move cards between columns, and post structured comments as an audit trail.

## Steps

1. Create a GitHub Project board with columns: **Backlog**, **In Progress**, **In Review**, **Done**.
2. Parse product specs and feature checklists into individual GitHub Issues. Each Issue gets a standardized body with acceptance criteria, related file paths, and agent context.
3. Apply labels for agent assignment (`website`, `backend`, `ops`, `research`, `spec`) and category (`feature`, `bug`, `chore`, `spike`).
4. On task pickup: move card to In Progress, post a comment with agent ID and start time. Enforce single-agent assignment -- check labels before allowing pickup.
5. On task completion: move card to In Review, post a comment summarizing files changed and tests written.
6. On verification pass: move card to Done, post a comment with test results and deploy status.
7. On context reset: read all open Issues and recent comments to reconstruct project state. Do not re-read the entire repository.
8. Detect stale Issues stuck In Progress beyond a configurable threshold and flag them for review.

## Anti-Patterns

- Creating Issues with no acceptance criteria, leaving agents without context to start work
- Card stays In Progress after agent finishes because no transition was triggered
- Two agents pick up the same Issue because label-based assignment was not enforced
- Context reset re-reads the full repo instead of targeting open Issues for state reconstruction

## Validation

- Every spec item has a corresponding Issue with acceptance criteria and file references
- Column transitions fire on every agent state change with audit trail comments
- No two agents are assigned to the same Issue simultaneously
- Context rebuild completes in under 30 seconds using Issues, not full repo reads
