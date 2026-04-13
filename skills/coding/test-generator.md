---
name: test-generator
description: Auto-generate Vitest unit tests and Playwright e2e tests from product spec acceptance criteria using TDD
category: coding
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Test Generator

## Purpose

Auto-generate tests from product spec acceptance criteria. Uses Vitest for unit tests and Playwright for e2e tests. Tests are written BEFORE implementation (TDD) -- the generator creates failing tests that define what success looks like, then the coding agent implements until tests pass. Includes a test quality evaluator to catch tests that are too brittle or too loose.

## Steps

1. Parse the product spec or feature checklist to extract testable acceptance criteria.
2. Classify each criterion as unit-testable (logic, data transforms, validation) or e2e-testable (user flows, page interactions, navigation).
3. For unit-testable criteria, generate Vitest test files with descriptive test names derived from the acceptance criteria text.
4. For e2e-testable criteria, generate Playwright test files with user story flows covering happy path and key error paths.
5. Generate mock fixtures and test doubles for external dependencies (APIs, databases, third-party services).
6. Verify all generated tests fail before implementation begins (TDD red phase). Block implementation if any test already passes.
7. Hand off to the coding agent for implementation. Coding agent iterates until all tests pass (TDD green phase).
8. Run the test quality evaluator to detect brittle tests: flag tests that assert on DOM structure, exact string matches, or timing-dependent values.
9. Run the test quality evaluator to detect loose tests: flag tests that only check truthy values, lack meaningful assertions, or have no edge case coverage.
10. Measure code coverage (line, branch, function) and compare against thresholds defined in stacks.yml.
11. Block feature completion if coverage drops below the configured minimum threshold.
12. Generate a test report summarizing pass/fail/skip counts with links back to the originating acceptance criteria.
13. Update the feature checklist to auto-check test items when their corresponding tests pass.

## Examples

Good:
- "Generate Vitest tests for the checkout flow validation: cart total calculation, discount code application, tax computation, and empty cart error handling."
- "Create Playwright e2e tests for the onboarding wizard: step navigation, form validation on each step, skip-to-end shortcut, and completion redirect."

Bad:
- "Write some tests." (No acceptance criteria specified, no scope, no test type identified.)
- "Test everything in the app." (No specific criteria, unmaintainable scope, no TDD enforcement.)

## Checklist

- [ ] Acceptance criteria parser extracts testable conditions from product spec
- [ ] Vitest unit test generator creates test files from parsed criteria
- [ ] Playwright e2e test generator creates flows from user stories
- [ ] TDD enforced: tests must exist and fail before implementation begins
- [ ] Test quality evaluator detects brittle tests (DOM structure, exact strings, timing)
- [ ] Test quality evaluator detects loose tests (truthy-only checks, missing assertions)
- [ ] Coverage tracking measures line, branch, and function coverage
- [ ] Coverage thresholds configured in stacks.yml and enforced as quality gate
- [ ] Test naming conventions use descriptive names derived from acceptance criteria
- [ ] Mock and fixture generation handles external dependencies
- [ ] Feature checklist integration auto-checks test items when tests pass
- [ ] Test report outputs pass/fail/skip summary with links to specs
- [ ] Stack-aware generation produces idiomatic tests for the project framework
