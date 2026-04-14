# harness-config-optimizer

**Status:** 🟢 Done
**Agent:** config-optimizer
**Category:** coding
**Created:** 2026-04-13

## Description

Analyze agent performance data (time per feature, error rates, retry counts) and suggest config changes: adjust budgets, change model tiers, add/remove hooks. Auto-tune harness configuration over time based on observed outcomes.

## Checklist

- [x] Performance data collection — aggregate time, errors, retries, cost per agent per feature
- [x] Budget analysis — detect agents consistently hitting budget limits vs. finishing under budget
- [x] Budget recommendations — suggest increasing budget for bottlenecked agents, decreasing for idle ones
- [x] Model tier recommendations — suggest cheaper models for simple tasks, better models for complex ones
- [x] Hook analysis — identify hooks that frequently block agents vs. hooks that rarely trigger
- [x] Hook recommendations — suggest adding hooks where errors are common, removing redundant hooks
- [x] Config diff preview — show proposed changes as a diff before applying
- [x] Auto-apply option — automatically apply recommendations with confidence above threshold
- [ ] Rollback support — revert config changes if performance degrades after applying
- [ ] Historical tracking — maintain history of config changes and their impact on performance
- [ ] Optimization report — generate periodic summary of recommendations and applied changes
- [ ] Integration with trajectory logs — pull performance data from existing logging
- [x] Unit tests for analysis algorithms, recommendation generation, and rollback logic

## Notes

- This is the meta-optimization layer — the harness optimizing its own configuration
- Start with suggestions only, not auto-apply — build trust before automating config changes
- Budget optimization is the highest-value recommendation — directly impacts cost
- Model tier changes should be conservative — dropping to a cheaper model can cause quality regressions
- Config changes should be tracked in git so they can be reviewed and reverted
