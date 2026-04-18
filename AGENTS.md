# AGENTS.md — Runtime-Agnostic Agent Coordination Contract

## Operating Principles

- Solve tasks directly when safe; delegate only when it materially improves quality or speed.
- Verify before claiming completion.
- Never skip phases in multi-phase skill workflows.

## Skill Invocation

Skills are invoked via their registered command:
- **Claude Code**: `/startup-harness:<skill-name>`
- **Codex CLI**: `$<skill-name>`

Never interpret a skill name as a description and freestyle the implementation.
Every phase defined in the skill must execute in order.

## Agent Categories & Scope Enforcement

Agent scopes are enforced by `.harness/hooks/scope-enforcer.mjs`.
Agent definitions live in `.harness/agents/<name>.json`.
Categories: coding, content, growth, operations, orchestration, quality.

## Hook Governance

All hooks live in `.harness/hooks/` and work with both Claude Code and Codex CLI.
Tool name normalization handles the mapping (Edit/file_edit, Bash/shell, etc.).

### Active Hooks
- **scope-enforcer**: File access control per agent category
- **config-protection**: Blocks edits to infrastructure configs
- **auto-finish**: Auto-commits and closes issues on session stop
- **inter-agent-signal**: Writes completion/approval state files
- **deploy-gate**: Requires rollback plan before deploys
- **branch-enforcer**: Blocks direct pushes to main/master
- **metrics-gate**: Requires hypothesis for growth agent actions
- **validate-commit-msg**: Conventional Commits format enforcement
- **validate-issue-create**: GitHub Issue schema enforcement
- **log-commands**: Command audit trail

## Inter-Agent Communication

- Signal files: `.harness/signals/<agent>.done` / `.harness/signals/<agent>.needs-approval`
- Handoff docs: `.harness/handoffs/`
- Knowledge base: `.harness/knowledge/`

## Verification

Before concluding: confirm no pending work, features function, tests pass.
If not met, continue rather than stop prematurely.

## Project Rules (from CLAUDE.md)

# Project Rules

## Skill Invocation — Slash Commands Only

Agents MUST invoke skills via their slash command (e.g., `/startup-harness:startup-init`). Never interpret a skill name as a description of what to build and improvise the implementation. The skill contains phase-by-phase instructions that get completely bypassed when an agent freestyles.

- Type the slash command and press Enter — do not paraphrase, summarize, or re-implement what the skill does.
- Every phase defined in the skill (interview, research, spec, design, build, deploy, growth) must execute in order. No phase may be skipped.
- If a prompt says "run startup-init" or "run competitor-research", that means invoke `/startup-harness:startup-init` or `/startup-harness:competitor-research` — not "build a startup" or "research competitors" freestyle.

