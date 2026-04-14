---
name: dependency-manager
description: Automate dependency management with scheduled security audits, auto-created PRs for safe updates, human review for breaking changes, freshness scoring, and license compliance checks. Use when running npm audit, updating dependencies, checking for vulnerabilities, or tracking dependency freshness.
user-invocable: true
---

# Dependency Manager

Automate dependency monitoring, updates, and compliance for Node.js projects.

## Security Audits

Run `npm audit` on a weekly schedule. Report findings with severity levels and affected packages.

## Update Strategy by Version Bump

| Bump Type | Action | Gating |
|-----------|--------|--------|
| **Patch** (1.2.3 -> 1.2.4) | Auto-create PR, run full test suite | Merge if tests pass |
| **Minor** (1.2.0 -> 1.3.0) | Auto-create PR, run full test suite | Wait for CI, flag for merge |
| **Major** (1.x -> 2.x) | Create GitHub Issue with changelog summary | Require human review |

After any update, run the full test suite. If tests fail, revert the update and report the failure.

## Health Tracking

1. Calculate a dependency freshness score per package based on how many versions behind it is.
2. Integrate the freshness score into the project health dashboard.
3. Detect duplicate dependencies where multiple versions of the same package are installed.

## Compliance

1. Validate that `package-lock.json` stays consistent with `package.json` after updates.
2. Check licenses of all dependencies and warn on incompatible licenses (e.g., GPL in an MIT project).

## Constraints

- Major version bumps always require human review -- never auto-merge.
- Tests must pass before any update is merged -- no exceptions.
- License incompatibilities must be flagged, not ignored.
