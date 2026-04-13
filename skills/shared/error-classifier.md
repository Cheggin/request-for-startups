---
name: error-classifier
description: Classify errors as FATAL, TRANSIENT, or UNKNOWN and transform raw stack traces into actionable agent instructions.
category: shared
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
---

# Error Classifier

## Purpose

Classify errors into three categories (FATAL, TRANSIENT, UNKNOWN) and handle each appropriately. Transform raw stack traces into actionable, structured instructions before passing them to agents. Agents should never see raw error output. This prevents agents from wasting tokens parsing stack traces and ensures consistent error handling across the system.

## Steps

1. Intercept raw error output from agent tool calls and CI processes.
2. Match the error against the known error pattern registry to determine classification.
3. Classify the error into one of three categories:
   - FATAL: unrecoverable errors (auth failures, missing API keys, disk full, permission denied). Stop agent immediately and escalate.
   - TRANSIENT: temporary errors (rate limits, network timeouts, service unavailability). Retry with exponential backoff.
   - UNKNOWN: unrecognized errors. Retry once, then escalate if retry fails.
4. Transform the raw stack trace into a structured, actionable instruction for the agent:
   - Replace raw error text with a plain-language description of what went wrong.
   - Include the specific file and location if available.
   - Suggest a concrete remediation action.
5. For FATAL errors, post a formatted error summary to Slack with full context and stop the agent.
6. For TRANSIENT errors, retry with exponential backoff (configurable max retries and base delay).
7. For UNKNOWN errors, retry once. If the retry fails, escalate to Slack.
8. Detect repeated identical errors and escalate instead of retrying indefinitely.
9. Score classification confidence and flag low-confidence classifications for human review.
10. Update the error pattern registry when new error patterns are identified.

## Examples

Good:
- Raw error "TypeError: Cannot read property 'x' of undefined at line 42" is transformed to "Variable is undefined at usage point in file.ts:42. Check the initialization path for this variable."
- Rate limit error (HTTP 429) is classified as TRANSIENT, retried 3 times with backoff, succeeds on second retry.
- Unknown error is retried once, fails again, and is escalated to Slack with both the actionable summary and the original trace attached.

Bad:
- Agent receives raw stack trace with 50 lines of noise and wastes 500 tokens trying to parse it.
- Auth failure (missing API key) is classified as TRANSIENT and retried 5 times, wasting time and tokens.
- Same network timeout error is retried 100 times with no escalation because deduplication is missing.

## Checklist

- [ ] Error taxonomy defines FATAL, TRANSIENT, and UNKNOWN classification rules
- [ ] FATAL handler stops agent immediately and posts formatted error to Slack
- [ ] TRANSIENT handler retries with exponential backoff using configurable max retries and base delay
- [ ] UNKNOWN handler retries once then escalates to Slack if retry fails
- [ ] Stack trace transformer converts raw traces into structured actionable instructions
- [ ] Error pattern registry maintains a map of known error patterns to classifications
- [ ] Raw error suppression ensures agents never receive unprocessed stack traces
- [ ] Classification confidence scoring flags low-confidence classifications for human review
- [ ] Error deduplication detects repeated identical errors and escalates instead of retrying forever
