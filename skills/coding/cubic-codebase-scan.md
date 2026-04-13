# cubic-codebase-scan

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Periodic full-codebase security and quality scan via Cubic (not just PR-level reviews). Scheduled as nightly or weekly to catch issues that slip through incremental PR reviews — architectural drift, accumulated tech debt, cross-cutting security vulnerabilities. Results automatically create GitHub Issues for each finding, and agents pick up and fix those issues.

## Checklist

- [ ] Cubic full-codebase scan configuration — scan entire repo, not just diffs
- [ ] Schedule setup — nightly or weekly cron via GitHub Actions
- [ ] Scan scope configuration — include/exclude paths in stacks.yml
- [ ] GitHub Issue creation — one issue per finding with severity, location, and remediation
- [ ] Issue labeling — auto-label with severity (critical, high, medium, low) and category
- [ ] Issue assignment — route to appropriate agent category based on finding type
- [ ] Agent pickup — agents monitor for Cubic-created issues and auto-assign
- [ ] Fix verification — re-scan after fix to confirm issue is resolved
- [ ] Deduplication — don't create duplicate issues for known/existing findings
- [ ] Suppression list — allow intentional suppressions with justification
- [ ] Scan history tracking — store results over time for trend analysis
- [ ] Severity threshold — only create issues above configurable severity level
- [ ] Notification on critical findings — alert immediately, don't wait for agent pickup
- [ ] Dashboard integration — scan results visible in project health overview

## Notes

- PR reviews catch ~70% of issues; full-codebase scans catch the remaining cross-cutting concerns
- Nightly scans for active development, weekly for maintenance mode
- Issue creation should be idempotent — re-scanning shouldn't flood the issue tracker
- Cubic findings should reference specific files and lines for agent actionability
- Suppression list prevents noise from intentional patterns (e.g., test fixtures with weak passwords)
