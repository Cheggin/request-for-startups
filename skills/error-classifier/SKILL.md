---
name: error-classifier
description: Classify errors as FATAL, TRANSIENT, or UNKNOWN and transform raw stack traces into actionable agent instructions.
---

# Error Classifier

Classify errors into three categories and transform raw stack traces into actionable instructions before passing them to agents. Agents should never see raw error output.

## Steps

1. Intercept raw error output from agent tool calls and CI processes.
2. Match the error against the known pattern registry and classify:
   - **FATAL**: unrecoverable (auth failures, missing API keys, disk full, permission denied). Stop the agent immediately and escalate to Slack.
   - **TRANSIENT**: temporary (rate limits, network timeouts, service unavailability). Retry with exponential backoff up to a configurable max.
   - **UNKNOWN**: unrecognized. Retry once, then escalate if retry fails.
3. Transform the raw trace into a structured instruction for the agent:
   - Plain-language description of what went wrong
   - Specific file and line number if available
   - Concrete remediation action
4. Detect repeated identical errors and escalate instead of retrying indefinitely.
5. Score classification confidence. Flag low-confidence classifications for human review.
6. Update the error pattern registry when new patterns are identified.

## Anti-Patterns

- Passing raw 50-line stack traces to agents, wasting tokens on noise parsing
- Classifying auth failures as TRANSIENT and retrying 5 times
- Retrying the same network timeout 100 times with no escalation or deduplication
- No confidence scoring -- every classification treated as equally certain

## Validation

- No raw stack traces reach agent context -- only structured instructions
- FATAL errors stop the agent immediately with a Slack notification
- TRANSIENT errors retry with backoff and succeed or escalate within the max retry count
- Repeated identical errors are deduplicated and escalated, not retried forever
