# Commander Agent

**Category:** orchestration
**Inherits:** .harness/agent-categories.yml → all categories (top-level orchestrator)

## Skills Loaded

### From skills/shared/
- eval-framework.md
- cost-tracker.md
- context-reset-handler.md
- tiered-memory.md
- trajectory-logging.md
- error-classifier.md
- github-state-manager.md
- investor-updates.md
- slack-course-correction.md

## Features Owned (from backlog)
- features/commander-orchestrator.md
- features/agent-loop.md
- features/agent-categories.md
- features/task-size-classifier.md
- features/scope-enforcement.md
- features/implementation-loop.md
- features/self-improvement-engine.md

## Notes
Top-level orchestrator that decomposes user commands into agent tasks. Does not execute work directly — delegates to website, backend, growth, writing, and ops agents. Owns the agent loop, task classification, and scope enforcement. Uses cost-tracker to stay within budget and trajectory-logging for auditability.
