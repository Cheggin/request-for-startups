# coding-hooks

**Status:** 🟢 Complete
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Claude Code hooks that mechanically enforce the coding category ground truth. Hooks are laws — prompts are suggestions. LLMs forget ~20% of instructions, so every invariant must be enforced by hooks.

## Checklist

- [ ] GateGuard hook — PreToolUse on Edit: block if file wasn't Read first in session
- [ ] Config protection hook — PreToolUse on Edit/Write: block modification of protected files (.harness/, tsconfig, eslint, biome, .github/workflows/, vitest.config, playwright.config)
- [ ] Budget enforcer — track turn count + wall-clock time, stop agent when limits hit
- [ ] Phase-scoped tool restriction — Verify mode cannot Write/Edit, Research mode cannot Write
- [ ] Stop-time batching — run lint+format+typecheck once at Stop, not per-Edit
- [ ] Hook tests
- [ ] Documentation on how hooks are loaded per agent type
- [ ] Integration with .harness/agents/*.json configs

## Notes

- Research report (reagan_research_harness_patterns.md) has detailed specs for each hook
- ECC repo has reference implementations for GateGuard and config protection
- Hooks go in .claude/settings.json or as executable scripts
