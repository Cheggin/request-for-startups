---
name: sprint-contracts
description: Negotiate structured success criteria contracts between generator and evaluator agents before each implementation sprint
category: coding
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Sprint Contracts

## Purpose

Before each implementation sprint, the generator agent and evaluator agent negotiate explicit success criteria in a structured contract. The criteria language directly shapes generator behavior -- vague criteria produce vague code. The evaluator checks against the contract, not subjective quality judgments. Maximum 5 iterations per contract before escalation. Contracts are stored in `.harness/contracts/` for audit trail and traceability back to feature checklist items.

## Steps

1. Parse the current feature scope from the product spec or feature checklist to identify what needs a contract.
2. Generate a draft contract with structured success criteria: inputs, expected outputs, and invariants for each criterion.
3. Validate each criterion is machine-verifiable where possible (test passes, type checks, lint clean) rather than subjective.
4. For human-judgment criteria (design quality, UX), define measurable proxies (e.g., Lighthouse score above threshold, axe-core zero critical violations).
5. Present the draft contract to the evaluator agent for refinement. Evaluator tightens ambiguous criteria and adds edge cases.
6. Finalize the contract once both generator and evaluator agree on all criteria.
7. Auto-generate test stubs from contract criteria so each criterion maps to at least one test.
8. Inject finalized contract criteria into the generator agent system prompt to shape implementation behavior.
9. After implementation, evaluator checks each criterion individually and reports pass/fail per criterion with explanations.
10. If any criteria fail, feed specific failure reasons back to the generator for the next iteration.
11. Track iteration count. If 5 iterations are exhausted without full pass, escalate to human or commander agent.
12. Persist the contract and iteration history in `.harness/contracts/` with versioning for audit trail.
13. Log contract metrics: iteration counts, common failure patterns, and criteria categories that fail most often.

## Examples

Good:
- "Create a sprint contract for the user signup feature with criteria covering form validation, error states, successful submission redirect, and password strength enforcement."
- "Negotiate contract criteria for the dashboard API: response schema matches OpenAPI spec, latency under 200ms at p95, and all error codes return structured JSON."

Bad:
- "Make sure the code works." (Not a contract -- no structured criteria, no specific conditions.)
- "The feature should be good quality." (Subjective, not machine-verifiable, no measurable proxy defined.)

## Checklist

- [ ] Contract schema defined with structured format for inputs, outputs, and invariants
- [ ] Negotiation protocol implemented: generator proposes, evaluator refines, both agree
- [ ] Criteria language enforces precise, testable conditions (not subjective judgments)
- [ ] Contract-to-test generation automatically creates test stubs from contract criteria
- [ ] Generator behavior shaped by injecting contract criteria into system prompt
- [ ] Evaluator checks implementation against each criterion individually
- [ ] Pass/fail reported per criterion with specific failure explanations
- [ ] Maximum 5 iterations enforced per contract before escalation
- [ ] Iteration feedback loop returns which criteria failed and why to the generator
- [ ] Contract versioning tracks evolution across iterations
- [ ] Contracts persisted in .harness/contracts/ for audit trail
- [ ] Escalation protocol defined for when 5 iterations are exhausted
- [ ] Contract metrics tracked: iteration counts, failure patterns, criteria categories
