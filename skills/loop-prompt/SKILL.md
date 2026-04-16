---
name: loop-prompt
description: Generate optimized loop prompts for agents that run continuously. Use when spawning persistent agents (harness-researcher, slop-cleaner, growth monitor, ops monitor) or any agent that should NEVER STOP until manually interrupted. Encodes patterns from autoresearch, ui-loop, ralph, and Karpathy.
user-invocable: true
group: orchestration
prerequisites: []
next: [post-deploy-loop, research]
workflows: [continuous-improvement]
---

# Loop Prompt Generator

Generate a loop prompt for a continuous agent. Takes an agent name, task description, and loop type. Outputs a complete prompt with iteration tracking, stop conditions, and context reset protocol.

## Usage

Invoke when spawning any persistent agent. Choose the loop type that matches the work pattern.

## Loop Types

### 1. Improvement Loop
`research → change → eval → keep/discard`

Best for: harness-researcher, self-improvement, skill optimization.

```
[IMPROVEMENT LOOP — ITERATION {{N}}/∞]

You are running an autonomous improvement loop. Each iteration:

1. READ the current state. What's the weakest area?
2. RESEARCH one improvement (web search, reference repos, knowledge wiki).
   - One variable at a time. Never change two things.
3. IMPLEMENT the change.
4. EVAL against the existing test suite / eval framework.
5. DECIDE:
   - Improved → KEEP. Commit. Log to ledger. Advance.
   - Equal perf + simpler → KEEP. Simplicity is a real win.
   - Worse or more complex → DISCARD. Git reset. Log why.
6. LOG the result to .harness/knowledge/{category}/log.md.
7. NEXT iteration. Do not pause. Do not ask.

STOP CONDITIONS:
- Plateau: <3% improvement for 4 consecutive iterations → escalate to Slack
- Budget: cost exceeds ${BUDGET} or ${MAX_TURNS} turns → stop gracefully
- Repetition: same change attempted 3 times → move to different area

CONTEXT RESET: When context fills >50%, commit all work, write handoff to GitHub Issue, start fresh session reading the Issue.

NEVER STOP. The human may be asleep. Run until interrupted.
```

### 2. Monitoring Loop
`check → alert → fix → verify`

Best for: ops agent, uptime monitor, error response, security scanning.

```
[MONITOR LOOP — TICK {{N}}]

You are running a continuous monitoring loop. Each tick:

1. CHECK all monitored systems:
   - Sentry MCP: new errors since last tick?
   - Uptime: all endpoints responding?
   - Performance: Core Web Vitals within budget?
   - Dependencies: new vulnerabilities?
2. If CLEAN: log "tick {{N}} clean" and sleep until next tick.
3. If ISSUE DETECTED:
   a. CLASSIFY: FATAL (stop everything) / TRANSIENT (retry) / UNKNOWN (investigate)
   b. ALERT: post to Slack with severity + details
   c. FIX: if within scope, diagnose → fix → deploy → verify
   d. VERIFY: confirm fix resolved the issue
   e. POST-MORTEM: log what happened, root cause, fix applied

STOP CONDITIONS:
- FATAL error requiring human input → alert Slack, pause
- Budget exceeded → stop gracefully
- Manual cancellation

NEVER STOP. Monitoring is 24/7.
```

### 3. Growth Loop
`measure → hypothesize → experiment → measure`

Best for: growth agent, landing page optimizer, A/B testing.

```
[GROWTH LOOP — EXPERIMENT {{N}}]

You are running a continuous growth optimization loop. Each experiment:

1. MEASURE current metrics (PostHog: traffic, conversion, retention).
2. HYPOTHESIZE one change that should improve the target metric.
   - State the hypothesis explicitly: "Changing X to Y should improve Z by ~W%"
   - One variable. Never test two changes at once.
3. IMPLEMENT the change (feature flag or A/B test if possible).
4. WAIT for sufficient data (minimum 100 events or 24 hours).
5. MEASURE again. Compare against baseline.
6. DECIDE:
   - Statistically significant improvement → KEEP. Ship to 100%.
   - No significant difference → DISCARD. Revert.
   - Worse → DISCARD. Revert immediately.
7. REPORT in investor update with actual numbers.

STOP CONDITIONS:
- Target metric achieved → report success
- 5 consecutive experiments with no improvement → escalate, try different strategy
- Budget exceeded

NEVER STOP. Growth compounds.
```

### 4. Maintenance Loop
`scan → prioritize → fix → verify`

Best for: slop-cleaner, dependency updater, tech debt reducer.

```
[MAINTENANCE LOOP — PASS {{N}}]

You are running a continuous maintenance loop. Each pass:

1. SCAN the codebase for the target smell:
   - Dead code, unused imports, unreachable branches
   - Duplication (copy-paste, redundant helpers)
   - Unnecessary abstractions (wrappers used once)
   - Outdated dependencies, security vulnerabilities
   - Weak or missing tests
2. PRIORITIZE: highest-impact, lowest-risk fixes first.
3. LOCK behavior: run existing tests, note what must not change.
4. FIX one smell per pass. Keep diffs small and reversible.
5. VERIFY: all tests still pass, no behavior change.
6. COMMIT with clear message describing what was removed/simplified.
7. MEASURE: lines deleted > lines added? Complexity reduced?

STOP CONDITIONS:
- No more smells found → report clean codebase
- Plateau: 3 passes with nothing found → stop
- Budget exceeded
- Test failures that can't be resolved → escalate

Prefer DELETION over REFACTORING. Simpler is always better.
NEVER STOP. Entropy is constant.
```

## Generating a Custom Loop Prompt

When none of the templates fit exactly, compose a custom loop from these building blocks:

1. **Iteration header**: `[LOOP_NAME — ITERATION {{N}}/{{MAX}}]`
2. **State check**: read current state before doing anything
3. **One action per iteration**: never change two things
4. **Eval against fixed criteria**: the scorer is frozen
5. **Binary decision**: keep or discard, no "maybe"
6. **Log everything**: append to ledger/log, never modify history
7. **Stop conditions**: plateau + budget + repetition + manual cancel
8. **Context reset protocol**: commit → write handoff → start fresh
9. **NEVER STOP directive**: the agent runs until interrupted

## Anti-Patterns

- Pausing to ask "should I continue?" — NEVER. The human set this loop running intentionally.
- Changing multiple variables per iteration — makes it impossible to know what worked.
- Skipping the eval step — "it looks better" is not evidence.
- Modifying the eval criteria mid-loop — the scorer is frozen (from autoresearch).
- Letting context fill without resetting — quality degrades past 50% context usage.
