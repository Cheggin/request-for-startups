---
name: ci-cd-pipeline
description: GitHub Actions CI/CD pipeline with lint, typecheck, test, staging/production deploy, and automatic rollback
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

Set up and maintain a GitHub Actions CI/CD pipeline that runs lint, typecheck, and test on every push, deploys to staging on PR merge to main, deploys to production on release tags, and automatically rolls back on failed health checks. Status badges are displayed in the README.

## Steps

1. Create `.github/workflows/ci.yml` with jobs for lint, typecheck, and test running in parallel on every push and PR.
2. Configure caching for `node_modules` and build artifacts to keep CI runs under 3 minutes.
3. Add a staging deployment job that triggers on merge to `main`, deploying to Vercel (frontend), Railway (backend), and Convex (functions).
4. Add a production deployment job that triggers on release tags matching `vX.Y.Z`.
5. Implement a health check step after each deployment that verifies HTTP 200 on main routes, database connectivity, and core API endpoints.
6. Add an automatic rollback step that reverts to the previous deployment if the health check fails.
7. Configure environment-specific variables for staging and production using GitHub Actions environments.
8. Add branch protection rules requiring CI to pass before merging to main.
9. Set up Slack or GitHub notification on pipeline failure.
10. Add CI/CD status badges to the project README.

## Examples

Good:
- "Set up a CI pipeline that runs lint, typecheck, and tests in parallel, then deploys to staging on merge to main."
- "Add automatic rollback to the deploy workflow when the health check returns non-200."
- "Configure separate environment variables for staging and production deployments."

Bad:
- "Deploy directly to production on every push to main." (Production deploys must be gated behind release tags.)
- "Skip tests to make the pipeline faster." (All checks must pass before deploy.)
- "Remove the rollback step because deploys usually work." (Rollback is a safety requirement.)

## Checklist

- [ ] CI workflow runs lint, typecheck, and test on every push and PR
- [ ] Staging deployment triggers on merge to main
- [ ] Production deployment triggers on release tag (vX.Y.Z)
- [ ] Health check verifies HTTP 200, database connectivity, and core API endpoints after deploy
- [ ] Automatic rollback reverts to previous version if health check fails
- [ ] Vercel, Railway, and Convex deployment integrations are configured
- [ ] Environment-specific configs separate staging from production
- [ ] Status badges are added to README.md
- [ ] Node modules and build artifacts are cached between runs
- [ ] Lint, typecheck, and test jobs run in parallel
- [ ] Slack or GitHub notification fires on pipeline failure
- [ ] Branch protection requires CI pass before merge to main
