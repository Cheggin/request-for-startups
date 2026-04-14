# secret-manager

**Status:** 🟢 Complete
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Centralized secret management for all harness-built startups. Uses .env files for local development (gitignored), Vercel/Railway environment variables for production. Includes secret rotation reminders, pre-commit hook detection of leaked secrets, and strict policy that secrets never pass through agent context.

## Checklist

- [ ] .env.example template generated per project with placeholder values
- [ ] .env added to .gitignore in repo-setup
- [ ] Vercel env var sync — push secrets to Vercel project via CLI
- [ ] Railway env var sync — push secrets to Railway project via CLI
- [ ] Secret rotation reminders — track secret age, warn at 90 days, alert at 180 days
- [ ] Pre-commit hook to detect secrets in code (API keys, tokens, passwords)
- [ ] Integration with coding-hooks — block commits containing secret patterns
- [ ] Agent context isolation — secrets loaded from env at runtime, never embedded in prompts
- [ ] Secret inventory — maintain list of all secrets per project with rotation dates
- [ ] Documentation — auto-generate secret setup instructions in README
- [ ] Support for multiple environments (dev, staging, production)
- [ ] Unit tests for secret detection patterns

## Notes

- Secrets must never appear in agent context, chat logs, or trajectory logs
- The pre-commit hook should catch common patterns: AWS keys, Stripe keys, database URLs, JWT secrets
- Secret rotation reminders integrate with the investor-updates feature for ops reporting
- Each environment (dev/staging/prod) has its own secret set
