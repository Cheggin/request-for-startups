---
name: ci-cd-pipeline
description: Set up and maintain a GitHub Actions CI/CD pipeline with parallel lint/typecheck/test jobs, staging deploys on merge to main, production deploys on release tags, health checks, and automatic rollback on failure. Use when configuring CI/CD, adding deployment workflows, setting up branch protection, or implementing automatic rollback.
user-invocable: true
group: ship
prerequisites: [test-generator]
next: [deploy-pipeline]
workflows: [full-startup, ship-feature]
---

# CI/CD Pipeline

Set up a GitHub Actions CI/CD pipeline that gates merges on passing checks, deploys to staging and production, and auto-rolls back on failure.

## CI Workflow (`.github/workflows/ci.yml`)

1. Run lint, typecheck, and test jobs **in parallel** on every push and PR.
2. Cache `node_modules` and build artifacts to keep CI runs under 3 minutes.
3. Configure branch protection rules requiring CI to pass before merging to main.

## Deployment

### Staging
Trigger on merge to `main`. Deploy to Vercel (frontend), Railway (backend), and Convex (functions).

### Production
Trigger on release tags matching `vX.Y.Z`. Use GitHub Actions environments for environment-specific variables.

### Health Check and Rollback
After each deployment:
1. Verify HTTP 200 on main routes, database connectivity, and core API endpoints.
2. If health check fails, automatically revert to the previous deployment version.
3. Notify via Slack or GitHub notification on pipeline failure.

## Status Badges
Add CI/CD status badges to the project README.

## Constraints

- Production deploys must be gated behind release tags -- never deploy directly to production on push to main.
- All checks (lint, typecheck, test) must pass before deploy -- never skip tests for speed.
- Rollback is a safety requirement -- never remove the rollback step.
