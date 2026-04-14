---
name: security-scanner
description: Multi-layered security scanning for dependency vulnerabilities, secret detection, and OWASP top 10 compliance. Use when auditing dependencies for CVEs, scanning code for hardcoded secrets, setting up pre-commit hooks for secret detection, reviewing API routes for injection or auth flaws, or gating PRs and deploys on security findings.
---

# Security Scanner

## Dependency Scanning

1. Run `npm audit` or equivalent (Snyk, Socket) against the lockfile.
2. Compare findings against severity threshold in `stacks.yml`: block on critical/high, warn on moderate.
3. Generate remediation steps for each vulnerable dependency.

## Secret Detection

1. Scan the codebase for hardcoded secrets (API keys, tokens, passwords) using regex patterns for common providers: AWS, Stripe, OpenAI, GitHub, etc.
2. Install and configure a pre-commit hook to prevent secrets from entering git history.
3. Validate all secrets load from environment variables, not hardcoded in source.

## OWASP Top 10 Audit

1. Check query construction for SQL/NoSQL injection patterns.
2. Verify all API routes have authentication and authorization guards.
3. Confirm rate limiting on API routes.
4. Audit CORS configuration; flag overly permissive origins.
5. Check for security misconfigurations (exposed debug endpoints, verbose error messages).

## Output

Generate a vulnerability report per finding:

```
Severity | Type | Location | Description | Remediation
```

Block feature completion on critical findings. Run scans on every PR and deploy via CI.
