# Commander Orchestrator Plan

## Architecture: 2-level hierarchy (commander -> agents)
Research shows 28% improvement over flat, 3 levels only adds 7% with 40% more latency.

## Files to Build
1. `packages/commander/src/constants.ts` - Agent routing rules, keywords, file path patterns
2. `packages/commander/src/types.ts` - Shared types (Task, AgentAssignment, RunningAgent, etc.)
3. `packages/commander/src/dispatcher.ts` - Classify + dispatch tasks to agents
4. `packages/commander/src/monitor.ts` - Poll agents, detect stuck/failed, reassign
5. `packages/commander/src/handoff.ts` - Dependency chain triggers on agent completion
6. `packages/commander/src/investor-update.ts` - Synthesize progress into Slack update
7. `packages/commander/src/index.ts` - Main loop: backlog -> dispatch -> monitor -> handoff -> report

## Tests (written first)
- `packages/commander/test/dispatcher.test.ts`
- `packages/commander/test/monitor.test.ts`
- `packages/commander/test/handoff.test.ts`
- `packages/commander/test/investor-update.test.ts`
- `packages/commander/test/index.test.ts`

## Key Design Decisions
- Reuse `@harness/agent-loop` runLoop() for spawning agents
- Reuse `@startup-harness/github-state` for issue tracking + board management
- Dispatcher classifies by: file paths, labels, keywords (fuzzy match)
- Monitor polls on interval, uses STALE_THRESHOLD_HOURS from github-state
- Handoff uses dependency map defined in issue metadata
- Investor update formats structured Slack blocks
