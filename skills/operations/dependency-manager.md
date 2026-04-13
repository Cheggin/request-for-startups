---
name: dependency-manager
description: Automated dependency monitoring, security audits, patch updates, and freshness tracking
category: operations
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

## Purpose

Automate dependency management for projects by running security audits, auto-creating PRs for safe updates, flagging breaking changes for human review, and tracking dependency freshness as part of project health checks.

## Steps

1. Run `npm audit` on a weekly schedule to detect known vulnerabilities and report findings.
2. For patch version bumps (e.g., 1.2.3 to 1.2.4), auto-create a PR with the update and run the full test suite.
3. For minor version bumps (e.g., 1.2.0 to 1.3.0), auto-create a PR and wait for CI to pass before flagging for merge.
4. For major version bumps (e.g., 1.x to 2.x), create a GitHub Issue with changelog summary and flag for human review.
5. After any update, run the full test suite. If tests fail, revert the update and report the failure.
6. Calculate a dependency freshness score for each package based on how many versions behind it is.
7. Integrate the freshness score into the project health dashboard.
8. Validate that `package-lock.json` stays consistent with `package.json` after updates.
9. Detect duplicate dependencies where multiple versions of the same package are installed.
10. Check licenses of all dependencies and warn on incompatible licenses (e.g., GPL in an MIT project).

## Examples

Good:
- "Run npm audit and create PRs for all patch-level security fixes."
- "Flag the lodash major version update for human review with a changelog summary."
- "Report that 3 dependencies are more than 10 minor versions behind."

Bad:
- "Auto-merge a major version bump without human review." (Major updates always require human review.)
- "Skip running tests after updating a dependency." (Tests must pass before any update is merged.)
- "Ignore GPL-licensed dependencies in an MIT project." (License compliance must be checked.)

## Checklist

- [ ] Scheduled npm audit runs weekly and reports vulnerabilities
- [ ] Patch version updates auto-create PRs with passing tests
- [ ] Minor version updates auto-create PRs and wait for CI
- [ ] Major version updates create a GitHub Issue for human review with changelog summary
- [ ] Tests run after every update; failing updates are reverted
- [ ] Dependency freshness score is calculated and tracked
- [ ] Freshness score is integrated into the project health dashboard
- [ ] Lock file consistency is validated after updates
- [ ] Duplicate dependencies are detected and flagged
- [ ] License compliance is checked for incompatible licenses
- [ ] Integration with CI/CD pipeline for scheduled and PR-triggered checks
