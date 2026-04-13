# sprint-contracts

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Before each implementation sprint, the generator agent and evaluator agent negotiate explicit success criteria in a structured contract. The criteria language directly shapes generator behavior — vague criteria produce vague code. The evaluator checks against the contract, not subjective quality judgments. Maximum 5 iterations per contract before escalation.

## Checklist

- [ ] Contract schema — structured format for success criteria (inputs, outputs, invariants)
- [ ] Negotiation protocol — generator proposes, evaluator refines, both agree
- [ ] Criteria language spec — precise, testable conditions (not "should work well")
- [ ] Contract-to-test generation — automatically create test stubs from contract criteria
- [ ] Generator behavior shaping — contract criteria injected into generator system prompt
- [ ] Evaluator contract enforcement — check implementation against each criterion
- [ ] Pass/fail per criterion — granular feedback, not just overall pass/fail
- [ ] Max 5 iterations per contract — escalate to human or commander after 5 failures
- [ ] Iteration feedback loop — evaluator explains which criteria failed and why
- [ ] Contract versioning — track contract evolution across iterations
- [ ] Contract storage — persist contracts in .harness/contracts/ for audit trail
- [ ] Escalation protocol — what happens when 5 iterations are exhausted
- [ ] Contract metrics — track iteration counts, common failure patterns

## Notes

- Key insight: the contract is the interface between generator and evaluator — ambiguity here cascades into bad code
- Criteria must be machine-verifiable where possible (test passes, type checks, lint clean)
- Human-judgment criteria (design quality, UX) should reference specific measurable proxies
- 5-iteration max prevents infinite loops — if the agent can't do it in 5 tries, the task needs decomposition
- Contracts should reference feature checklist items to maintain traceability
