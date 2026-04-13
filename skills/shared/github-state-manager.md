---
name: github-state-manager
description: Track all task state via GitHub Issues and Project boards with automated column transitions and audit trail comments.
category: shared
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# GitHub State Manager

## Purpose

Manage all task tracking through GitHub Issues and a Project board. Parse product specs and feature checklists into individual Issues, move cards between columns (Backlog, In Progress, In Review, Done), and post structured comments as an audit trail. On context reset, read open Issues and recent comments to rebuild agent understanding. Use labels for agent assignment and task categorization.

## Steps

1. Create a GitHub Project board with columns: Backlog, In Progress, In Review, Done.
2. Parse the product spec and feature checklist files to extract individual tasks.
3. Create a GitHub Issue for each task with a standardized body template containing acceptance criteria, related files, and agent context.
4. Apply labels for agent assignment (website, backend, ops, research, spec) and category (feature, bug, chore, spike).
5. When an agent picks up a task, move the card from Backlog to In Progress and post a comment noting the agent ID and start time.
6. When an agent completes work, move the card from In Progress to In Review and post a comment summarizing changes made, files touched, and tests written.
7. When verification passes, move the card from In Review to Done and post a comment with test results and deploy status.
8. On context reset, read all open Issues plus recent comments to reconstruct current project state and agent assignments.
9. Link each Issue to its parent feature checklist file so progress can be traced back to the spec.
10. When a feature checklist item is completed, update the corresponding Issue status to reflect completion.
11. Enforce single-agent assignment: prevent two agents from working the same Issue by checking labels before assignment.
12. Detect stale Issues that have been In Progress without activity beyond a configurable threshold and flag them for review.

## Examples

Good:
- Product spec with 12 features is parsed into 12 Issues, each with acceptance criteria, related file paths, and the correct agent label.
- Agent picks up Issue #5, card moves to In Progress, comment posted with agent ID; agent finishes, card moves to In Review with a summary of 3 files changed and 2 tests added.
- After context reset, new session reads 4 open Issues and reconstructs the exact state of work in under 30 seconds.

Bad:
- Issues created with no acceptance criteria or related files, so agents lack context to start work.
- Card stays in In Progress after agent finishes because no transition was triggered.
- Two agents pick up the same Issue because label-based assignment was not enforced.
- Context reset re-reads the entire repository instead of targeting open Issues for state reconstruction.

## Checklist

- [ ] GitHub Project board creation auto-creates board with columns: Backlog, In Progress, In Review, Done
- [ ] Issue creation from spec parses product spec and feature checklists into individual GitHub Issues
- [ ] Issue labels apply agent assignment labels and category labels to every Issue
- [ ] Column transitions move cards between columns based on agent actions and verification results
- [ ] Audit trail comments post structured comments on Issues for every state change
- [ ] Context rebuild reads all open Issues and recent comments to reconstruct state on agent reset
- [ ] Issue-to-feature linking references parent feature checklist file from each Issue
- [ ] Checklist sync updates corresponding Issue when a feature checklist item is completed
- [ ] Agent assignment enforces single-agent ownership via labels to prevent conflicts
- [ ] Stale Issue detection flags Issues stuck In Progress beyond a configurable time threshold
- [ ] Issue templates provide standardized body format with acceptance criteria, related files, and agent context
- [ ] Batch operations create or update multiple Issues in a single operation to avoid API rate limits
