---
name: cubic-codebase-scan
description: Periodic full-codebase security and quality scan via Cubic with automated issue creation
category: coding
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Cubic Codebase Scan

## Purpose

Run periodic full-codebase security and quality scans via Cubic to catch issues that slip through incremental PR reviews. Detect architectural drift, accumulated tech debt, and cross-cutting security vulnerabilities. Automatically create GitHub Issues for each finding so agents can pick up and fix them.

## Steps

1. Configure Cubic for full-codebase scanning (entire repo, not just diffs) with include/exclude paths defined in stacks.yml.
2. Set up a scheduled scan via GitHub Actions cron (nightly for active development, weekly for maintenance).
3. Execute the Cubic scan against the full repository.
4. Parse scan results and categorize findings by severity (critical, high, medium, low) and type.
5. Deduplicate findings against existing open GitHub Issues to avoid flooding the issue tracker.
6. Check each finding against the suppression list for intentionally allowed patterns.
7. Create one GitHub Issue per new finding with severity label, file location, and remediation guidance.
8. Auto-label issues with severity and category tags for agent routing.
9. Route issues to the appropriate agent category based on finding type.
10. Send immediate notifications for critical findings without waiting for agent pickup.
11. Store scan results for historical trend analysis and dashboard integration.
12. After an agent fixes an issue, trigger a re-scan to verify the fix resolves the finding.

## Examples

Good:
- "Run a nightly Cubic scan on the entire repo excluding test fixtures, create GitHub Issues for any new high or critical findings."
- "Configure Cubic to suppress the weak-password pattern in test fixtures and re-scan."

Bad:
- "Scan the code for bugs." (No tool specified, no severity threshold, no output action.)
- "Fix all the Cubic findings." (No scan step, no issue creation, no prioritization.)

## Checklist

- [ ] Cubic configured for full-codebase scanning, not just diffs
- [ ] Scheduled scan set up via GitHub Actions cron (nightly or weekly)
- [ ] Include/exclude paths configured in stacks.yml
- [ ] One GitHub Issue created per finding with severity, location, and remediation
- [ ] Issues auto-labeled with severity and category
- [ ] Issues routed to appropriate agent category based on finding type
- [ ] Deduplication prevents duplicate issues for known findings
- [ ] Suppression list allows intentional patterns with justification
- [ ] Fix verification re-scans after agent remediation
- [ ] Scan history stored for trend analysis
- [ ] Severity threshold configured to filter issue creation
- [ ] Critical findings trigger immediate notification
- [ ] Scan results visible in project health dashboard
