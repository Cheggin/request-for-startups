# scope-enforcement

**Status:** 🟡 In progress
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Each agent can only modify files within its declared fileScope (defined in .harness/agents/*.json). Implemented as a PreToolUse hook on Edit, Write, and Bash commands. Prevents cross-boundary modifications — website agent cannot touch backend files, writing agent cannot touch code, ops agent cannot touch app code.

## Checklist

- [ ] Read fileScope from .harness/agents/*.json for the active agent
- [ ] PreToolUse hook on Edit — validate target file path against agent fileScope
- [ ] PreToolUse hook on Write — validate target file path against agent fileScope
- [ ] PreToolUse hook on Bash — parse command for file-modifying operations (mv, cp, rm, sed, tee, etc.)
- [ ] Glob pattern matching for fileScope rules (e.g., "src/frontend/**", "content/**/*.md")
- [ ] Deny-by-default — if file path is not within any allowed scope, block the operation
- [ ] Clear error message on scope violation — tell agent which files it can modify
- [ ] Scope violation logging — record all blocked attempts in trajectory log
- [ ] Escape hatch — commander can temporarily grant expanded scope for specific tasks
- [ ] Unit tests for glob matching, hook interception, and edge cases (symlinks, relative paths)

## Notes

- This is a critical safety feature — without it, agents can accidentally overwrite each other's work
- Website agent scope: src/app/**, public/**, src/components/**
- Writing agent scope: content/**, copy/**, marketing/**
- Ops agent scope: .github/**, Taskfile.yml, infrastructure/**
- The hook must handle both absolute and relative paths correctly
- Bash command parsing is the hardest part — need to detect file writes in piped commands
