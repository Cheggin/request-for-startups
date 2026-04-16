---
name: test-generator
description: Auto-generate Vitest unit tests and Playwright e2e tests from product spec acceptance criteria using TDD. Use when writing tests before implementation, generating test stubs from acceptance criteria, enforcing TDD red-green workflow, evaluating test quality for brittleness or looseness, or gating features on code coverage thresholds.
user-invocable: true
group: build
prerequisites: [sprint-contracts]
next: [verify, ultraqa, ci-cd-pipeline]
workflows: [ship-feature, full-startup]
---

# Test Generator

## Criteria Extraction

1. Parse the product spec or feature checklist to extract testable acceptance criteria.
2. Classify each criterion as unit-testable (logic, data transforms, validation) or e2e-testable (user flows, page interactions, navigation).

## Test Generation

1. For unit criteria, generate Vitest test files with descriptive names derived from the acceptance criteria text.
2. For e2e criteria, generate Playwright test files covering happy path and key error paths.
3. Generate mock fixtures and test doubles for external dependencies (APIs, databases, third-party services).

## TDD Enforcement

1. Verify all generated tests fail before implementation begins (red phase). Block implementation if any test already passes.
2. Hand off to the coding agent for implementation until all tests pass (green phase).

## Test Quality Evaluation

- **Brittle tests**: Flag tests asserting on DOM structure, exact string matches, or timing-dependent values.
- **Loose tests**: Flag tests checking only truthy values, lacking meaningful assertions, or missing edge case coverage.

## Coverage and Reporting

1. Measure code coverage (line, branch, function); compare against thresholds in `stacks.yml`.
2. Block feature completion if coverage drops below the configured minimum.
3. Generate a test report: pass/fail/skip counts with links to originating acceptance criteria.
4. Update the feature checklist to auto-check items when corresponding tests pass.
