# eval-framework

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Evaluation framework using pass@k metrics to measure agent reliability. pass@3 >= 90% for new capabilities (agent succeeds at least once in 3 attempts), pass^3 = 100% for regressions (agent must succeed all 3 attempts — no flakiness on previously solved tasks). Includes diff-based eval selection to only run tests the current diff touches, and tracks runtime, tokens, error rates, and calling patterns.

## Checklist

- [ ] pass@k metric implementation — calculate pass@1, pass@3, pass@5
- [ ] Capability threshold — pass@3 >= 90% for new feature evals
- [ ] Regression threshold — pass^3 = 100% (all k attempts must pass)
- [ ] Multi-step complex eval tasks — end-to-end flows, not just unit operations
- [ ] Diff-based eval selection — analyze git diff to determine which evals to run
- [ ] Eval task library — curated set of representative tasks per agent type
- [ ] Runtime tracking — measure wall-clock time per eval task
- [ ] Token usage tracking — input/output tokens per eval run
- [ ] Error rate tracking — categorize failures (timeout, wrong output, crash, etc.)
- [ ] Calling pattern analysis — which tools does the agent call, in what order
- [ ] Eval results dashboard — historical pass rates, trends, regressions
- [ ] CI integration — run evals on agent code changes
- [ ] Eval task difficulty scoring — easy/medium/hard categorization
- [ ] Flakiness detection — flag evals that alternate pass/fail across runs

## Notes

- pass@k vs pass^k distinction is critical: pass@k = "at least one success in k tries", pass^k = "all k tries succeed"
- Diff-based selection dramatically reduces eval time — only run what the change could affect
- Token tracking enables cost optimization — find agents that waste tokens on unnecessary tool calls
- Calling pattern analysis reveals anti-patterns (e.g., reading the same file repeatedly)
- Eval tasks should be version-controlled alongside agent code
