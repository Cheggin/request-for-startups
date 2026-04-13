# deploy-pipeline

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** ops
**Created:** 2026-04-13

## Description

Automated deploy to Vercel (frontend) + Railway (backend) + Convex (database). Pre-deploy checks: tests pass, build succeeds, no security vulnerabilities. Post-deploy: health check, e2e tests against production URL. Rollback mechanism if post-deploy checks fail.

## Checklist

- [ ] Vercel deploy — trigger frontend deployment via Vercel CLI or git push to production branch
- [ ] Railway deploy — trigger backend deployment via Railway CLI
- [ ] Convex deploy — push Convex schema and functions via `npx convex deploy`
- [ ] Deploy ordering — deploy database (Convex) first, then backend (Railway), then frontend (Vercel) to respect dependencies
- [ ] Pre-deploy: test suite — run full test suite; abort deploy if tests fail
- [ ] Pre-deploy: build check — run production build locally; abort deploy if build fails
- [ ] Pre-deploy: security audit — run `npm audit` or equivalent; abort on critical vulnerabilities
- [ ] Pre-deploy: snapshot — record current deployed versions of all services for rollback reference
- [ ] Post-deploy: health check — hit /health endpoint on both frontend and backend; confirm 200 response
- [ ] Post-deploy: e2e tests — run e2e test suite against production URL to verify critical user flows
- [ ] Post-deploy: error rate check — monitor error-tracking for 5 minutes post-deploy; flag if error rate spikes
- [ ] Rollback mechanism — revert all services to pre-deploy snapshot versions if post-deploy checks fail
- [ ] Rollback ordering — rollback in reverse order: frontend first, then backend, then database (if safe)
- [ ] Deploy lock — prevent concurrent deploys; queue subsequent deploy requests
- [ ] Downtime window signal — notify uptime-monitor of expected downtime during deploy to suppress false alerts
- [ ] Deploy log — record every deploy with: timestamp, commit SHA, services deployed, pre/post check results, success/rollback
- [ ] Slack notification — post deploy result (success or rollback) to project Slack channel
- [ ] Unit tests for deploy ordering, rollback logic, pre/post check gates, and deploy lock

## Notes

- Deploy ordering matters — deploying frontend before backend can cause API mismatches
- Rollback is the safety net — every deploy must be reversible
- Database rollbacks (Convex) are tricky if schema migrations are involved — only rollback Convex if the migration is backward-compatible
- The 5-minute error rate window after deploy catches regressions that pass tests but fail in production
