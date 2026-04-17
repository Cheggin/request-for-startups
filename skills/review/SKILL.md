---
name: review
description: Third-party review of finished Claude sessions. Reads completion signals written by the plugin's Stop hook, analyzes each session's transcript for patterns (skill-heavy/code-light loops, duplicate skill invocations, context compaction thrash), writes verdicts to .harness/metrics/, and appends learnings to .harness/learnings/knowledge.md. Use this when you want to audit what happened in recent sessions and feed learnings back into chain config.
---

# review

Runs the bundled reviewer against all pending completion signals, or a specific signal file.

## How it works

The Stop hook (`hooks/completion-signal.mjs`) writes `.harness/signals/done-<sessionId>.json` whenever a Claude session ends. Those signals sit until a reviewer processes them.

The reviewer is intentionally out-of-process from the session that produced the transcript — self-review is biased. It reads the transcript JSONL from the signal payload, computes metrics, and emits a verdict (`clean` / `warn` / `fail`).

## Run it

Review every pending signal:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/review.mjs --all-pending
```

Review a specific signal:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/review.mjs .harness/signals/done-<sessionId>.json
```

After review:
- Metrics land at `.harness/metrics/<sessionId>.json`
- Findings append to `.harness/learnings/knowledge.md`
- Signal moves to `.harness/signals/processed/` (won't be re-reviewed)

## When to invoke

After a long autonomous run, a dispatched tmux agent, or at end of day when you want to look at what patterns emerged. Findings are informational by default; risky patterns (duplicate skill calls, plan-only runs with no code output, repeated compactions) are flagged explicitly so the next chain iteration can address them.
