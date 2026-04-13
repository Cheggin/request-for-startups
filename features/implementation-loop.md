# implementation-loop

**Status:** 🔴 Not started
**Agent:** commander
**Category:** coding
**Created:** 2026-04-13

## Description

The core build loop that drives feature implementation. For each feature: implement code, run tests, check Cubic, run visual QA, and verify all gates pass. If any gate fails, the agent fixes the issue and retries (max 5 iterations per gate). On success, the agent marks feature checklist items as complete and moves the GitHub Issue to Done. This is the engine that turns specs into shipped software.

## Checklist

- [ ] Feature queue reader — pull next feature from dependency-ordered backlog
- [ ] Implementation step — coding agent writes code for the feature
- [ ] Test gate — run `task test` and verify all tests pass (retry up to 5x on failure)
- [ ] Cubic gate — check Cubic channel for any violations or warnings (retry up to 5x)
- [ ] Visual QA gate — compare screenshots against Figma baseline (retry up to 5x)
- [ ] Lint/typecheck gate — run `task lint` and `task typecheck` with zero errors
- [ ] Build gate — run `task build` to verify production build succeeds
- [ ] Retry logic — on gate failure, agent reads error output, fixes code, re-runs gate
- [ ] Max retry enforcement — after 5 failed attempts on a single gate, escalate to human
- [ ] Checklist updater — mark features/*.md items as [x] when corresponding work passes
- [ ] GitHub Issue closer — move issue to Done column when all checklist items complete
- [ ] Progress reporting — post status updates to Slack after each feature completes
- [ ] Feature isolation — each feature implemented on its own branch, merged via PR
- [ ] Rollback on catastrophic failure — revert branch if all retries exhausted

## Notes

- The loop is the heart of the harness — everything else feeds into or validates this
- Gate order matters: tests first (fastest feedback), then Cubic, then visual QA (slowest)
- 5 retries is the ceiling, not the target — most gates should pass in 1-2 attempts
- Escalation to human means posting to Slack with full context (error, attempts, diffs)
- Each feature gets its own branch to prevent cross-feature contamination
- The commander agent orchestrates the loop but delegates implementation to the coding agent
- Feature queue respects dependency order — never implement a feature before its dependencies ship
