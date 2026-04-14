---
name: cubic-codebase-scan
description: Run periodic full-codebase security and quality scans via Cubic with automated GitHub Issue creation. Use when setting up scheduled codebase-wide scanning, detecting architectural drift or accumulated tech debt, catching cross-cutting security vulnerabilities, or configuring automated issue triage from scan findings.
user-invocable: true
---

# Cubic Codebase Scan

## Configuration

1. Configure Cubic for full-codebase scanning (entire repo, not just diffs) with include/exclude paths in `stacks.yml`.
2. Set up a scheduled scan via GitHub Actions cron: nightly for active development, weekly for maintenance.
3. Define a suppression list for intentionally allowed patterns with documented justification.

## Scan Workflow

1. Execute the Cubic scan against the full repository.
2. Parse results and categorize findings by severity (critical, high, medium, low) and type.
3. Deduplicate findings against existing open GitHub Issues to avoid duplicates.
4. Check each finding against the suppression list.
5. Create one GitHub Issue per new finding with: severity label, file location, and remediation guidance.
6. Auto-label issues with severity and category tags for agent routing.
7. Send immediate notifications for critical findings.

## Post-Fix Verification

After an agent fixes an issue, trigger a targeted re-scan to verify the finding is resolved.

## Tracking

Store scan results for historical trend analysis and dashboard integration. Track severity distribution over time to measure codebase health trajectory.
