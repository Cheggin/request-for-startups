# fixed-editable-boundary

**Status:** 🟡 In progress
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Enforce which files agents can and cannot modify. Harness code (.harness/, hooks, configs) is frozen and cannot be edited by any agent. Each agent can only modify files within its fileScope defined in .harness/agents/*.json. Implemented as a PreToolUse hook on Edit/Write tools.

## Checklist

- [ ] PreToolUse hook on Edit — check target file path against agent's fileScope before allowing
- [ ] PreToolUse hook on Write — same boundary check for new file creation
- [ ] Frozen paths — hardcoded deny list for harness infrastructure (.harness/, .claude/settings.json, hooks/)
- [ ] fileScope loading — read allowed paths from .harness/agents/*.json at session start
- [ ] Glob pattern support — fileScope should support glob patterns (e.g., "src/website/**")
- [ ] Clear rejection messages — when blocked, tell agent exactly which paths it can modify
- [ ] Escape hatch — commander-orchestrator can temporarily widen scope with explicit justification
- [ ] Audit log — log every blocked attempt with agent ID, target path, and timestamp
- [ ] Integration tests — verify agents cannot modify files outside their scope
- [ ] Test frozen path enforcement — verify no agent can modify harness infrastructure

## Notes

- This is a hard security boundary, not a suggestion — hooks are laws, prompts are suggestions
- fileScope in agent config example: {"fileScope": ["src/website/**", "public/**", "package.json"]}
- The frozen list should be maintained centrally and never overridable by individual agents
- Related to coding-hooks feature — this is one of the critical hooks described there
