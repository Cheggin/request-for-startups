---
name: eval-framework
description: Evaluation framework using pass@k metrics to measure agent reliability with diff-based eval selection.
category: shared
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Eval Framework

## Purpose

Measure agent reliability using pass@k metrics. New capabilities must achieve pass@3 >= 90% (agent succeeds at least once in 3 attempts). Regressions must achieve pass^3 = 100% (agent must succeed all 3 attempts with no flakiness on previously solved tasks). Includes diff-based eval selection to only run tests the current diff touches, and tracks runtime, tokens, error rates, and calling patterns.

## Steps

1. Define eval tasks as structured test cases with inputs, expected outputs, and pass criteria.
2. Implement pass@k metric calculation: run the agent k times on the same task, check if at least one attempt passes.
3. Implement pass^k metric calculation: run the agent k times, require all k attempts to pass.
4. Set capability threshold: pass@3 >= 90% for new feature evals.
5. Set regression threshold: pass^3 = 100% for previously passing evals.
6. Analyze the git diff to determine which evals are affected by current changes.
7. Run only the affected evals (diff-based selection) to minimize eval time.
8. Track runtime (wall-clock time), token usage (input/output), and error rates per eval run.
9. Analyze calling patterns to detect anti-patterns (reading the same file repeatedly, unnecessary tool calls).
10. Store eval results historically for trend analysis and flakiness detection.
11. Flag evals that alternate pass/fail across runs as flaky and investigate root causes.
12. Integrate eval runs into CI so they execute automatically on agent code changes.

## Examples

Good:
- New search feature eval passes 3 out of 3 times (pass@3 = 100%), exceeding the 90% threshold.
- Diff touches only the file-writing agent, so only file-writing evals run, completing in 2 minutes instead of 20.
- Flakiness detector flags an eval that passed 2 out of 5 runs, prompting investigation into non-deterministic behavior.

Bad:
- All 200 evals run on every commit regardless of what changed, taking 45 minutes per CI run.
- pass@k and pass^k are confused: a flaky regression eval shows pass@3 = 100% but pass^3 = 33%, and the wrong metric is checked.
- Token usage is not tracked, so a refactor that doubles agent token consumption goes undetected.

## Checklist

- [ ] pass@k metric implementation calculates pass@1, pass@3, pass@5
- [ ] pass^k metric implementation requires all k attempts to pass
- [ ] Capability threshold enforces pass@3 >= 90% for new feature evals
- [ ] Regression threshold enforces pass^3 = 100% for previously solved tasks
- [ ] Diff-based eval selection analyzes git diff to determine which evals to run
- [ ] Runtime tracking measures wall-clock time per eval task
- [ ] Token usage tracking records input and output tokens per eval run
- [ ] Error rate tracking categorizes failures by type (timeout, wrong output, crash)
- [ ] Calling pattern analysis detects anti-patterns in agent tool usage
- [ ] Flakiness detection flags evals that alternate pass and fail across runs
- [ ] CI integration runs evals automatically on agent code changes
