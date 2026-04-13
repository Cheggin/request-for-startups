---
name: accessibility-checker
description: Automated WCAG 2.1 AA accessibility audits using axe-core via Playwright
category: coding
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Accessibility Checker

## Purpose

Run automated accessibility audits on every UI feature using axe-core via Playwright. Enforce WCAG 2.1 AA compliance as a minimum standard. Report violations with actionable fix suggestions so the coding agent can remediate immediately. Integrates into the quality gate pipeline alongside visual QA and performance benchmarks.

## Steps

1. Install axe-core integration via `@axe-core/playwright` if not already present in devDependencies.
2. Identify all pages and components that need auditing based on the current feature scope.
3. Launch headless Playwright browser and navigate to each target page or render each target component.
4. Run axe-core scan with WCAG 2.1 AA ruleset on each page or component.
5. Collect all violations and categorize by severity (critical, serious, moderate, minor).
6. For each violation, generate a fix suggestion with the specific element selector, rule violated, and remediation code snippet.
7. Block feature completion if any critical or serious violations are found.
8. Log moderate and minor violations as warnings without blocking.
9. Validate color contrast for all custom theme colors against WCAG AA thresholds.
10. Audit keyboard navigation: verify tab order, focus management, and skip links.
11. Validate screen reader landmarks (header, main, nav, footer) are present and correct.
12. Check all images for alt text presence and ARIA attribute correctness.
13. Output a structured violation report with severity, element, rule, and fix per issue.

## Examples

Good:
- "Run accessibility audit on the signup page and dashboard, flag critical issues, and provide fix code for each violation."
- "Check color contrast for our custom brand colors against WCAG AA and report failures with suggested replacements."

Bad:
- "Make the site accessible." (Too vague, no specific scope or standard.)
- "Fix all accessibility issues." (No audit step, no severity triage, no specific pages targeted.)

## Checklist

- [ ] axe-core integration via @axe-core/playwright installed
- [ ] Axe scans run on every page and component after UI feature implementation
- [ ] WCAG 2.1 AA set as minimum compliance level
- [ ] Violation report includes severity, element, rule, and fix suggestion per issue
- [ ] Critical and serious violations block feature completion
- [ ] Warning-level violations logged but not blocking
- [ ] Page-level and component-level scan modes supported
- [ ] Color contrast checker validates custom theme colors
- [ ] Keyboard navigation audited for tab order, focus management, skip links
- [ ] Screen reader landmark validation covers header, main, nav, footer
- [ ] Alt text presence checked on all images
- [ ] ARIA attribute correctness validated
- [ ] CI integration runs in GitHub Actions with headless Playwright
- [ ] Fix suggestion generator provides code-level remediation for each violation
