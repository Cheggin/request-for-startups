---
name: deploy-pipeline
description: Automated deploy pipeline for Vercel (frontend), Railway (backend), and Convex (database) with pre/post checks and rollback. Use when deploying services to production, configuring deploy ordering and health checks, setting up rollback procedures, or gating deploys on test and security audit results.
user-invocable: true
---

# Deploy Pipeline

## Pre-Deploy Checks

1. Acquire a deploy lock to prevent concurrent deployments.
2. Record current deployed versions of all services as a rollback snapshot.
3. Run the full test suite; abort on failure.
4. Run a production build locally; abort on failure.
5. Run `npm audit` or equivalent; abort on critical vulnerabilities.

## Deploy Order

Deploy in dependency order:

1. **Convex** (database) via `npx convex deploy` -- must be ready before backend.
2. **Railway** (backend) via Railway CLI.
3. **Vercel** (frontend) via Vercel CLI or git push to production branch.

## Post-Deploy Verification

1. Hit `/health` endpoint on frontend and backend; confirm 200 responses.
2. Run e2e test suite against the production URL for critical user flows.
3. Monitor error tracking for 5 minutes post-deploy; flag error rate spikes.

## Rollback

If any post-deploy check fails, rollback in reverse order:

1. Frontend (Vercel)
2. Backend (Railway)
3. Database (Convex) -- only if migration is backward-compatible

## Logging

- Post deploy result (success or rollback) to the project Slack channel.
- Record deploy in the deploy log: timestamp, commit SHA, services deployed, check results, outcome.
- Release the deploy lock.
