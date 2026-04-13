# admin-panel-template

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Admin panel template for harness-built startups: user management, content moderation, analytics overview, feature flags, and system health. Separate from the user-facing dashboard. Protected by admin role authorization.

## Checklist

- [ ] Admin role authorization — only users with admin role can access the panel
- [ ] User management — list users, search, view details, suspend/activate accounts
- [ ] Content moderation — review flagged content, approve/reject, bulk actions
- [ ] Analytics overview — key metrics (DAU, MAU, revenue, signups) with date range selector
- [ ] Feature flags — toggle features on/off, percentage rollouts, user segment targeting
- [ ] System health — uptime, error rates, API latency, database size
- [ ] Admin layout — separate from user dashboard, distinct visual styling
- [ ] Audit log — track all admin actions (who did what, when)
- [ ] Admin route protection — Next.js middleware checking admin role before rendering
- [ ] Bulk operations — select multiple users/items for batch actions
- [ ] Export data — CSV/JSON export for user lists and analytics
- [ ] Admin notification preferences — alerts for critical system events
- [ ] Unit tests for role-based access, admin actions, and audit logging

## Notes

- The admin panel is a separate route tree (/admin/*), not part of the user dashboard
- Admin role is stored in the Convex user table and checked server-side
- Audit log is critical for compliance — every admin action must be recorded
- Feature flags are a simple key-value store in Convex, not a third-party service
- The admin panel reuses dashboard-template components but with admin-specific styling
