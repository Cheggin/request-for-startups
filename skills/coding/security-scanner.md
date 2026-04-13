---
name: security-scanner
description: Multi-layered security scanning for dependencies, secrets, and OWASP top 10 compliance
category: coding
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Security Scanner

## Purpose

Provide multi-layered security scanning covering dependency vulnerabilities, secret detection in code, and OWASP top 10 checks on API routes. Run as a quality gate on backend features and as a pre-commit hook for secret detection. Prevent secrets from entering git history and catch vulnerabilities before they reach production.

## Steps

1. Run dependency vulnerability scanning via `npm audit` or equivalent (Snyk, Socket) against the lockfile.
2. Compare findings against the severity threshold in stacks.yml; block on critical/high, warn on moderate.
3. Scan the codebase for hardcoded secrets (API keys, tokens, passwords) using regex patterns for common providers (AWS, Stripe, OpenAI, etc.).
4. Install and configure a pre-commit hook for secret detection so secrets never enter git history.
5. Validate that all secrets are loaded from environment variables, not hardcoded in source.
6. Audit API routes for OWASP top 10 vulnerabilities: injection, authentication flaws, misconfigurations.
7. Check query construction for SQL/NoSQL injection patterns.
8. Verify all API routes have proper authentication and authorization guards.
9. Confirm rate limiting is configured on API routes.
10. Audit CORS configuration and flag overly permissive origins.
11. Generate a vulnerability report with severity, affected package or file, and remediation steps.
12. Block feature completion on critical findings via quality gate integration.
13. Run scans on every PR and deploy via CI integration.

## Examples

Good:
- "Scan all dependencies for known vulnerabilities, block the PR if any critical CVEs are found, and generate remediation steps for each."
- "Run secret detection across the repo and install a pre-commit hook to prevent future secret commits."

Bad:
- "Check for security issues." (No specific scan type, no severity threshold, no tooling.)
- "Make sure the API is secure." (No OWASP checklist, no specific routes, no actionable checks.)

## Checklist

- [ ] Dependency vulnerability scanning via npm audit or equivalent
- [ ] Severity threshold configured in stacks.yml (block critical/high, warn moderate)
- [ ] Secret detection scans for API keys, tokens, and passwords in code
- [ ] Pre-commit hook installed for secret detection
- [ ] Secret pattern library covers common providers (AWS, Stripe, OpenAI, etc.)
- [ ] OWASP top 10 audit runs on all API routes
- [ ] SQL/NoSQL injection detection in query construction
- [ ] Authentication and authorization guards verified on all API routes
- [ ] Rate limiting verified on API routes
- [ ] CORS configuration audited for overly permissive origins
- [ ] Environment variable validation ensures secrets come from env, not hardcoded
- [ ] Quality gate blocks feature completion on critical findings
- [ ] CI integration runs on every PR and deploy
- [ ] Vulnerability report includes severity, location, and remediation steps
