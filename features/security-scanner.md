# security-scanner

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Multi-layered security scanning for every startup the harness builds. Covers dependency vulnerability scanning (npm audit), secret detection in code to prevent committing API keys, and OWASP top 10 checks on API routes. Runs as a quality gate on backend features and as a pre-commit hook for secret detection.

## Checklist

- [ ] Dependency vulnerability scanning — npm audit or equivalent (e.g., Snyk, Socket)
- [ ] Severity threshold in stacks.yml — block on critical/high, warn on moderate
- [ ] Secret detection — scan for API keys, tokens, passwords in code
- [ ] Secret detection pre-commit hook — prevent secrets from ever entering git history
- [ ] Secret pattern library — regex patterns for common providers (AWS, Stripe, OpenAI, etc.)
- [ ] OWASP top 10 audit on API routes — injection, auth flaws, misconfig, etc.
- [ ] SQL/NoSQL injection detection in query construction
- [ ] Authentication/authorization check — verify all API routes have proper auth guards
- [ ] Rate limiting verification — confirm API routes have rate limits configured
- [ ] CORS configuration audit — flag overly permissive origins
- [ ] Environment variable validation — ensure secrets come from env, not hardcoded
- [ ] Quality gate integration — block feature completion on critical findings
- [ ] CI integration — run on every PR and deploy
- [ ] Vulnerability report — severity, package/file, remediation steps

## Notes

- Secret detection must run as pre-commit hook — once a secret is in git history, it's compromised
- npm audit has false positives; consider Socket for supply chain analysis
- OWASP checks should be stack-aware (Convex has different patterns than Express)
- Dependency scanning should run on lockfile changes, not every commit
- Consider SAST tools like Semgrep for deeper code analysis in future iterations
