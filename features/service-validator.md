# service-validator

**Status:** 🟡 In progress
**Agent:** ops
**Category:** operations
**Created:** 2026-04-13

## Description

Validate that all connected services are working before any agent work begins. Checks GitHub auth, Vercel project existence, Railway project existence, Convex deployment reachability, Cubic GitHub App installation, Slack channel accessibility, and Figma token validity. Runs as a pre-flight check and alerts on service degradation during execution.

## Checklist

- [ ] GitHub auth check — verify token has required scopes (repo, workflow, issues)
- [ ] Vercel project check — confirm project exists and deployment API is reachable
- [ ] Railway project check — confirm project exists and API responds
- [ ] Convex deployment check — ping deployment URL and verify it returns valid response
- [ ] Cubic GitHub App check — verify app is installed on the repo with correct permissions
- [ ] Slack channel check — verify bot can post to the configured channel
- [ ] Figma token check — verify token is valid and has read/write access
- [ ] Pre-flight orchestration — run all checks in parallel, report results as a summary
- [ ] Failure blocking — if any critical service fails, halt agent work with clear error message
- [ ] Warning mode — non-critical services (Slack, Figma) warn but don't block
- [ ] Health check during execution — periodic re-validation during long agent sessions
- [ ] Service degradation alerts — post to Slack if a service becomes unreachable mid-session
- [ ] Retry with backoff — transient failures get 3 retries with exponential backoff before failing
- [ ] Diagnostic output — on failure, provide actionable steps to fix (re-auth, re-install, check URL)

## Notes

- This is the first thing that runs in any agent session — no work starts until validation passes
- Critical services: GitHub, Convex, Vercel — these block all work
- Non-critical services: Slack, Figma, Railway — these warn but allow work to continue
- Cubic is critical for the implementation loop but not for research/planning phases
- Token expiry is the most common failure — diagnostic should suggest re-authentication
- Health checks during execution should be lightweight — don't slow down the agent with heavy polling
- Service validator config lives in .harness/services.yml with URLs, tokens, and criticality levels
