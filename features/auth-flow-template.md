# auth-flow-template

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Authentication template for harness-built startups: login, signup, password reset, email verification, and session management. Deferred during initial build (per plan) and enabled before the first real user. Supports multiple providers (email, OAuth) and uses the canonical stack (Next.js + Convex).

## Checklist

- [ ] Login page — email/password form with validation and error handling
- [ ] Signup page — registration form with password strength requirements
- [ ] Password reset flow — request reset email, verify token, set new password
- [ ] Email verification — send verification email on signup, verify token on click
- [ ] Session management — JWT or Convex auth sessions with configurable expiry
- [ ] OAuth provider support — Google, GitHub as initial providers
- [ ] Convex auth integration — user table schema, auth functions, session tokens
- [ ] Protected route middleware — Next.js middleware to guard authenticated pages
- [ ] Auth context provider — React context for current user state across the app
- [ ] Logout — clear session, redirect to login
- [ ] Rate limiting on auth endpoints — prevent brute force attacks
- [ ] Activation toggle — feature flag to enable auth when ready (deferred by default)
- [ ] Responsive auth pages — mobile-friendly login/signup forms
- [ ] Unit tests for auth flows, token validation, and session management

## Notes

- Auth is deliberately deferred during initial startup build — focus on product first
- Enable auth before first real user, not before demo/prototype stage
- The canonical stack is Next.js + Convex, so auth should use Convex's built-in auth support
- OAuth providers are additive — start with email/password, add OAuth as needed
- Session expiry defaults: 7 days for remember-me, 24 hours otherwise
