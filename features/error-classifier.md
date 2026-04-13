# error-classifier

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Classify errors into three categories: FATAL (stop + escalate to Slack), TRANSIENT (retry with exponential backoff), UNKNOWN (retry once then escalate). Transform raw stack traces into actionable instructions before passing to agents. Agents should never see raw error output.

## Checklist

- [ ] Error taxonomy — define FATAL, TRANSIENT, UNKNOWN classification rules
- [ ] FATAL handler — stop agent immediately, post formatted error to Slack with context
- [ ] TRANSIENT handler — retry with exponential backoff (configurable max retries, base delay)
- [ ] UNKNOWN handler — retry once, escalate to Slack if retry fails
- [ ] Stack trace transformer — convert raw stack traces into structured, actionable instructions for agents
- [ ] Error pattern registry — maintain a map of known error patterns to classifications
- [ ] Raw error suppression — ensure agents never receive unprocessed stack traces or error dumps
- [ ] Classification confidence scoring — flag low-confidence classifications for human review
- [ ] Error deduplication — detect repeated identical errors and escalate instead of retrying forever
- [ ] Integration with commander-orchestrator escalation flow
- [ ] Unit tests for each classification path and the stack trace transformer

## Notes

- Never show raw errors to agents — always transform into actionable instructions
- FATAL examples: auth failures, missing API keys, disk full, permission denied
- TRANSIENT examples: rate limits, network timeouts, temporary service unavailability
- The transformer is key — instead of "TypeError: Cannot read property 'x' of undefined at line 42", the agent should get "Variable is undefined at usage point. Check initialization path."
