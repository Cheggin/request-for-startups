# test-generator

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Auto-generate tests from product spec acceptance criteria. Uses Vitest for unit tests and Playwright for e2e tests. Tests are written BEFORE implementation (TDD) — the generator creates failing tests that define what success looks like, then the coding agent implements until tests pass. Includes a test quality evaluator to catch tests that are too brittle or too loose.

## Checklist

- [ ] Acceptance criteria parser — extract testable conditions from product spec
- [ ] Vitest unit test generator — create test files from parsed criteria
- [ ] Playwright e2e test generator — create e2e flows from user stories
- [ ] TDD enforcement — tests must exist and fail before implementation begins
- [ ] Test quality evaluator — detect brittle tests (too implementation-coupled)
- [ ] Test quality evaluator — detect loose tests (pass on broken code)
- [ ] Coverage tracking — measure line, branch, and function coverage
- [ ] Coverage thresholds in stacks.yml — block if coverage drops below minimum
- [ ] Test naming conventions — descriptive names derived from acceptance criteria
- [ ] Mock/fixture generation for external dependencies
- [ ] Integration with feature checklist — auto-check test items when tests pass
- [ ] Test report output — summary of pass/fail/skip with links to specs

## Notes

- TDD is non-negotiable — the coding agent must not write implementation before tests exist
- Brittle test detection: flag tests that assert on DOM structure, exact strings, or timing
- Loose test detection: flag tests that only check for truthy values or lack assertions
- Coverage is a signal, not a goal — 80% meaningful coverage beats 100% shallow coverage
- Test generator should understand the stack (React, Convex, etc.) to produce idiomatic tests
