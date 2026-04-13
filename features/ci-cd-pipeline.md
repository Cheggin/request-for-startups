# ci-cd-pipeline

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

GitHub Actions CI/CD pipeline: lint + typecheck + test on every push, deploy to staging on PR merge, deploy to production on release tag, rollback on failed health check. Status badges displayed in README.

## Checklist

- [ ] CI workflow — lint, typecheck, and test on every push and PR
- [ ] Staging deployment — auto-deploy to staging environment on merge to main
- [ ] Production deployment — deploy to production on release tag (vX.Y.Z)
- [ ] Health check after deploy — verify the deployment is healthy before marking as complete
- [ ] Automatic rollback — revert to previous version if health check fails post-deploy
- [ ] Vercel deployment integration — trigger Vercel builds for frontend
- [ ] Railway deployment integration — trigger Railway deploys for backend services
- [ ] Convex deployment — push Convex functions on deploy
- [ ] Environment-specific configs — separate env vars for staging vs. production
- [ ] Status badges — add CI/CD status badges to README.md
- [ ] Caching — cache node_modules and build artifacts between runs for speed
- [ ] Parallelization — run lint, typecheck, and test in parallel jobs
- [ ] Notification on failure — alert via Slack or GitHub notification when pipeline fails
- [ ] Branch protection — require CI pass before merge to main
- [ ] Unit tests for deployment scripts and health check logic

## Notes

- The CI workflow should be fast — target under 3 minutes for the full check suite
- Staging deploys happen on every merge to main, giving continuous preview
- Production deploys are intentionally gated behind release tags for safety
- Rollback is critical — a failed deploy should never leave production broken
- Health checks should verify: HTTP 200 on main routes, database connectivity, core API endpoints
- Status badges give instant visibility into project health from the README
