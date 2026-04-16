---
name: post-deploy-loop
description: Continuous post-deploy monitoring and growth loop. Use after deploying a startup to keep it running, growing, and improving 24/7. Combines monitoring, growth, content, and maintenance into one persistent loop.
user-invocable: true
group: operate
prerequisites: [deploy-pipeline]
next: [uptime-monitor, landing-page-optimizer, investor-updates]
workflows: [full-startup, continuous-improvement]
---

# Post-Deploy Loop

After deploy, the harness doesn't stop. This skill runs the ongoing phases.

## The Loop

Every tick (configurable, default 1 hour):

### 1. Health check
- Fetch production URL — is it responding?
- Check Sentry MCP for new errors since last tick
- Check uptime status

If unhealthy: dispatch ops agent → diagnose → fix → deploy → verify.

### 2. Metrics check
- Query PostHog (if configured) for key metrics
- Compare against previous tick: traffic, conversion, errors
- Flag significant changes (>20% swing either direction)

### 3. Content queue
- Check if blog posts are scheduled
- Check social media queue
- If content is due: dispatch writing agent

### 4. Dependency check (weekly)
- Run npm audit
- Check for outdated packages
- Create GitHub Issues for critical vulnerabilities

### 5. Investor update (weekly)
- Aggregate: features shipped, traffic, errors, revenue (if Stripe), user count
- Post to Slack

### 6. Feature iteration
- Check GitHub Issues for user feedback / feature requests
- Prioritize by votes/impact
- If P0 feature request: add to build queue

## Tick Frequency

| Check | Frequency |
|-------|-----------|
| Health | Every tick (1h) |
| Metrics | Every tick (1h) |
| Content | Daily |
| Dependencies | Weekly |
| Investor update | Weekly |
| Feature iteration | On new feedback |

## Stop Conditions

- User says stop
- Production URL deleted/unreachable for 24h+
- Budget exceeded
