# Plan: Slop Cleaner Agent + Self-Improving Agent Loop

## Thing 1: Slop Cleaner

### Agent: agents/slop-cleaner.md
- Model: sonnet, Level: 2
- Deletion-first, regression-safe, smell-focused
- Proactive scanning of changed files
- --review mode for report-only
- Karpathy principles
- Success: lines deleted > lines added, tests pass, no behavior changes

### Skill: skills/coding/slop-cleaner.md
- 8-step workflow matching OMC pattern
- Anti-patterns documented
- Smell categories: dead code, duplication, needless abstraction, boundary violations, weak tests, unnecessary dependencies

## Thing 2: Self-Improving Agent Loop

### Update: packages/agent-loop/src/loop.ts
- Add preTaskLearning() - queries knowledge wiki before execution
- Add postTaskLearning() - ingests learnings after execution
- Wire into runLoop()

### New: packages/agent-loop/src/self-improve.ts
- extractLearnings(transcript) - pattern extraction
- proposeSkillUpdate(skillPath, improvement) - propose changes
- shouldUpdateSkill(currentSkill, proposedChange, confidence) - 0.7 threshold, simplification bias

### Tests
- packages/agent-loop/tests/self-improve.test.ts
- packages/agent-loop/tests/loop-learning.test.ts
