# github-state-manager

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

All task tracking via GitHub Issues + Project board. Create Issues from spec, move cards between columns (Backlog → In Progress → In Review → Done), post comments as audit trail. Context resets read Issues to rebuild understanding. Labels for agent assignment and category.

## Checklist

- [ ] GitHub Project board creation — auto-create project board with columns: Backlog, In Progress, In Review, Done
- [ ] Issue creation from spec — parse product spec and feature checklists into individual GitHub Issues
- [ ] Issue labels — agent assignment labels (website, backend, ops, research, spec) and category labels (feature, bug, chore, spike)
- [ ] Column transitions — move cards: Backlog → In Progress (agent picks up), In Progress → In Review (agent completes), In Review → Done (verification passes)
- [ ] Audit trail comments — post structured comments on Issues when: agent starts work, agent completes work, tests pass/fail, deploy succeeds/fails
- [ ] Context rebuild — on agent context reset, read all open Issues + recent comments to reconstruct current state
- [ ] Issue-to-feature linking — each Issue references its parent feature checklist file
- [ ] Checklist sync — when a feature checklist item is completed, update the corresponding Issue
- [ ] Agent assignment — assign Issues to agents via labels, prevent two agents from working the same Issue
- [ ] Stale Issue detection — flag Issues that have been In Progress for too long without activity
- [ ] Issue templates — standardized body format with acceptance criteria, related files, and agent context
- [ ] Batch operations — create/update multiple Issues in a single operation to avoid API rate limits
- [ ] Unit tests for Issue creation, column transitions, context rebuild, and label management

## Notes

- GitHub Issues are the single source of truth for what needs to be done and what state it's in
- Context rebuild is critical — agents lose context on every session, so Issues must contain enough detail to resume
- Audit trail comments make the entire build process inspectable and debuggable
- Labels are the primary mechanism for routing work to the right agent
