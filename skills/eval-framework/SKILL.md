---
name: eval-framework
description: Evaluation framework using pass@k metrics to measure agent reliability with diff-based eval selection.
user-invocable: true
group: quality
prerequisites: [agent-creator, test-generator]
next: [self-improve]
workflows: [continuous-improvement]
---

# Eval Framework

Measure agent reliability using pass@k metrics. Run only the evals affected by the current diff. Track runtime, tokens, error rates, and calling patterns.

## Steps

1. Define eval tasks as structured test cases with inputs, expected outputs, and pass criteria.
2. Calculate **pass@k**: run the agent k times on the same task, pass if at least one attempt succeeds. New capabilities must achieve pass@3 >= 90%.
3. Calculate **pass^k**: run the agent k times, require all attempts to pass. Regressions must achieve pass^3 = 100% (zero flakiness on previously solved tasks).
4. Analyze the git diff to determine which evals are affected. Run only those evals to minimize CI time.
5. Track per-eval: wall-clock runtime, input/output token usage, error rates by type (timeout, wrong output, crash).
6. Analyze calling patterns to detect anti-patterns: reading the same file repeatedly, unnecessary tool calls, excessive retries.
7. Store results historically. Flag evals that alternate pass/fail across runs as flaky and investigate root causes.
8. Integrate into CI so evals run automatically on agent code changes.

## Anti-Patterns

- Running all 200 evals on every commit regardless of what changed
- Confusing pass@k with pass^k: a flaky eval shows pass@3=100% but pass^3=33%, and the wrong metric is checked
- Not tracking token usage, so a refactor that doubles agent consumption goes undetected
- Writing evals with no clear pass criteria, making results subjective

## Validation

- New capability evals achieve pass@3 >= 90%
- Regression evals achieve pass^3 = 100%
- Diff-based selection runs only affected evals, not the full suite
- Flaky evals are detected and flagged within 5 runs
