# Plan: Plugin Standards & Conventions

## Context
Plugin is now working — 93 skills under `startup-harness:`. Need to standardize the development workflow with conventional commits, issue schemas, and enforce via hooks.

## Tasks

### 1. Update README
- Update skill count (78 → 93)
- Update agent count (11 → 12)
- Add plugin installation section (how others install it)
- Update file structure to reflect current state
- Add startup-init to the skill list

### 2. Commit Message Schema (Conventional Commits)
- Create `.harness/commit-schema.md` documenting the format
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Scopes: map to packages/skills/agents (e.g., `feat(hooks):`, `fix(agent-loop):`)
- Breaking changes: `!` suffix or `BREAKING CHANGE:` footer
- Enforce via pre-commit hook in `.claude/settings.json`

### 3. Issue Creation Schema
- Create `.harness/issue-schema.md` with normalized fields
- Fields: type, severity (P0-P3), description, acceptance criteria, verification steps, affected packages
- Template as GitHub issue template (`.github/ISSUE_TEMPLATE/`)

### 4. Hook Enforcement
- Add `commit-msg` hook that validates conventional commit format
- Wire into `.claude/settings.json` hooks (PreToolUse on Bash for git commit)
- The hook parses the commit message and rejects non-conforming messages

## Execution
- Tasks 2, 3, 4 can be done in parallel
- Task 1 (README) depends on knowing final state
