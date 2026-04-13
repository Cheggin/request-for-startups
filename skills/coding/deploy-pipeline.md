---
name: deploy-pipeline
description: Automated deploy pipeline for Vercel, Railway, and Convex with pre/post checks and rollback
category: coding
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Deploy Pipeline

## Purpose

Automate deployment to Vercel (frontend), Railway (backend), and Convex (database) with proper ordering, pre-deploy validation, post-deploy health checks, and automatic rollback on failure. Ensure every deploy is safe, verified, and reversible.

## Steps

1. Acquire a deploy lock to prevent concurrent deployments; queue any subsequent requests.
2. Record current deployed versions of all services as a rollback snapshot.
3. Run the full test suite; abort the deploy if any tests fail.
4. Run a production build locally; abort the deploy if the build fails.
5. Run `npm audit` or equivalent security audit; abort on critical vulnerabilities.
6. Deploy Convex schema and functions first via `npx convex deploy` (database must be ready before backend).
7. Deploy backend to Railway via Railway CLI.
8. Deploy frontend to Vercel via Vercel CLI or git push to production branch.
9. Hit the /health endpoint on both frontend and backend; confirm 200 responses.
10. Run the e2e test suite against the production URL to verify critical user flows.
11. Monitor error tracking for 5 minutes post-deploy; flag if error rate spikes.
12. If any post-deploy check fails, rollback in reverse order: frontend first, then backend, then database (only if migration is backward-compatible).
13. Post deploy result (success or rollback) to the project Slack channel.
14. Record the deploy in the deploy log with timestamp, commit SHA, services deployed, check results, and outcome.
15. Release the deploy lock.

## Examples

Good:
- "Deploy all services to production: run tests, build, audit, then deploy Convex, Railway, Vercel in order. Health check and e2e after. Rollback if anything fails."
- "Rollback frontend and backend to the previous deploy snapshot after post-deploy e2e failures."

Bad:
- "Deploy to production." (No pre-checks, no ordering, no rollback plan.)
- "Push to Vercel." (Only deploys frontend, ignores backend and database dependencies.)

## Checklist

- [ ] Deploy lock prevents concurrent deploys
- [ ] Pre-deploy snapshot records current service versions for rollback
- [ ] Pre-deploy test suite runs and gates the deploy
- [ ] Pre-deploy production build check passes
- [ ] Pre-deploy security audit passes with no critical vulnerabilities
- [ ] Deploy order: Convex first, then Railway, then Vercel
- [ ] Post-deploy health check confirms 200 on /health endpoints
- [ ] Post-deploy e2e tests verify critical user flows against production
- [ ] Post-deploy error rate monitoring for 5 minutes
- [ ] Rollback triggers automatically on post-deploy check failure
- [ ] Rollback order: frontend, backend, database (if safe)
- [ ] Deploy log records timestamp, SHA, services, results, and outcome
- [ ] Slack notification posted on deploy success or rollback
