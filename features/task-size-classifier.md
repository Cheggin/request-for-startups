# task-size-classifier

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Before dispatching tasks to agents, classify them by complexity: trivial (skip orchestration, just do it), moderate (single agent with mode switching), complex (multi-agent with justified coordination). Prevents over-orchestration on simple tasks and ensures complex tasks get proper multi-agent treatment.

## Checklist

- [ ] Classification engine — analyze task description, file count, dependency graph to determine size
- [ ] Trivial path — skip orchestration entirely, execute directly in commander context
- [ ] Moderate path — dispatch to single agent with full mode-switching loop (Research → Plan → Build → Verify)
- [ ] Complex path — dispatch to multiple agents with dependency ordering and handoff protocol
- [ ] Classification heuristics — file count, cross-domain dependencies, estimated turn count
- [ ] Override mechanism — allow manual classification via GitHub Issue labels (size:trivial, size:moderate, size:complex)
- [ ] Classification logging — record classification decision and reasoning for later tuning
- [ ] Misclassification detection — if a trivial task exceeds expected budget, escalate to moderate
- [ ] Integration with commander-orchestrator task dispatcher
- [ ] Unit tests for each classification tier with representative task examples

## Notes

- The goal is to prevent over-orchestration — spinning up a multi-agent pipeline for a one-line fix wastes time and tokens
- Trivial examples: fix a typo, update a version number, add an import
- Moderate examples: implement a new component, add an API endpoint, write tests for a module
- Complex examples: add a new domain (e.g., payments), refactor authentication, multi-service feature
- commander-orchestrator.md references this: "task-size classification before dispatching (trivial/moderate/complex)"
