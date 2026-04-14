# self-improvement-engine

**Status:** 🟡 In progress
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

After each completed feature, extract what worked and what didn't. Save successful patterns as reusable skills with confidence scoring (0.3-0.9). Promote to global at confidence >= 0.8 across 2+ projects. Failed patterns become anti-patterns to avoid. The harness gets better at building startups over time.

## Checklist

- [ ] Post-feature retrospective — automatically analyze completed features for patterns
- [ ] Pattern extraction — identify reusable strategies from successful feature builds
- [ ] Confidence scoring — assign initial confidence 0.3 to new patterns, adjust based on outcomes
- [ ] Confidence promotion — increase confidence when pattern succeeds in subsequent uses
- [ ] Confidence demotion — decrease confidence when pattern fails or causes regressions
- [ ] Global promotion — promote pattern to global skill when confidence >= 0.8 across 2+ projects
- [ ] Anti-pattern detection — flag approaches that consistently fail or cause problems
- [ ] Anti-pattern library — maintain list of what not to do, loaded into agent system prompts
- [ ] Skill storage — save extracted skills in .harness/skills/ with metadata (confidence, origin, usage count)
- [ ] Cross-project learning — aggregate patterns across multiple harness-managed projects
- [ ] Feedback loop — track whether applied skills actually improve outcomes
- [ ] Metrics — time-to-complete, error rate, retry count before and after skill application
- [ ] Unit tests for confidence scoring, promotion logic, and pattern extraction

## Notes

- This is what makes the harness a learning system, not just an automation tool
- Initial confidence of 0.3 means the pattern is tentative — needs more evidence
- Confidence >= 0.8 across 2+ projects is a high bar intentionally — only proven patterns become global
- Anti-patterns are just as valuable as positive patterns — knowing what to avoid saves time
- Skills are stored as structured markdown with metadata, not executable code
- The improvement engine runs asynchronously after feature completion, not during builds
