# dependency-manager

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Automated dependency management for harness-built projects. Monitors for security vulnerabilities using npm audit, auto-creates PRs for patch updates, flags breaking changes for human review, and tracks dependency freshness as part of health checks.

## Checklist

- [ ] Scheduled npm audit check — run weekly, report vulnerabilities
- [ ] Auto-create PRs for patch version updates (semver patch bumps)
- [ ] Auto-create PRs for minor version updates with passing tests
- [ ] Flag major version updates for human review — create GitHub Issue with changelog summary
- [ ] Breaking change detection — run tests after update, revert if failing
- [ ] Dependency freshness score — track how up-to-date each dependency is
- [ ] Health check integration — include dependency freshness in project health dashboard
- [ ] Lock file validation — ensure package-lock.json stays consistent
- [ ] Duplicate dependency detection — flag when multiple versions of same package are installed
- [ ] License compliance check — warn on incompatible licenses (GPL in MIT project, etc.)
- [ ] Integration with CI/CD pipeline — dependency checks run on schedule and on PR
- [ ] Unit tests for version comparison, vulnerability parsing, and PR creation

## Notes

- Patch updates are safe to auto-merge if tests pass
- Minor updates should auto-create PR but wait for CI before merging
- Major updates always require human review — too risky for full automation
- The freshness score feeds into the status-dashboard for ops visibility
- Consider supporting both npm and yarn workspaces
