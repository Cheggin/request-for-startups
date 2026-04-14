---
name: sprint-contracts
description: Negotiate structured success criteria contracts between generator and evaluator agents before each implementation sprint. Use when defining acceptance criteria for a feature sprint, establishing machine-verifiable success conditions, setting up generator-evaluator negotiation loops, or tracking contract iteration history for audit.
---

# Sprint Contracts

## Contract Creation

1. Parse the current feature scope from the product spec or feature checklist.
2. Draft a contract with structured success criteria: inputs, expected outputs, and invariants per criterion.
3. Ensure each criterion is machine-verifiable where possible (test passes, type checks, lint clean).
4. For human-judgment criteria (design quality, UX), define measurable proxies (Lighthouse score threshold, axe-core zero critical violations).

## Negotiation Protocol

1. Generator agent proposes draft contract.
2. Evaluator agent refines: tightens ambiguous criteria, adds edge cases.
3. Both agree on finalized contract.
4. Auto-generate test stubs from contract criteria (each criterion maps to at least one test).
5. Inject finalized criteria into the generator agent system prompt.

## Execution Loop

1. Generator implements against contract criteria.
2. Evaluator checks each criterion individually; reports pass/fail with explanations.
3. On failure, feed specific failure reasons back to generator for next iteration.
4. Maximum 5 iterations per contract before escalation to human or commander agent.

## Storage

Persist contracts and iteration history in `.harness/contracts/` with versioning. Track metrics: iteration counts, common failure patterns, criteria categories that fail most often.
