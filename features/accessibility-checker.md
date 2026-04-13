# accessibility-checker

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Automated accessibility audits using axe-core via Playwright. Enforces WCAG 2.1 AA compliance as a minimum standard on every UI feature. Runs as part of the quality gate pipeline alongside visual QA and performance benchmarks. Reports violations with actionable fix suggestions so the coding agent can remediate immediately.

## Checklist

- [ ] axe-core integration via @axe-core/playwright
- [ ] Run axe scans on every page/component after UI feature implementation
- [ ] WCAG 2.1 AA as minimum compliance level (configurable in stacks.yml)
- [ ] Violation report — severity, element, rule, and fix suggestion per issue
- [ ] Quality gate integration — block feature completion on critical/serious violations
- [ ] Warning-level violations logged but not blocking
- [ ] Page-level and component-level scan modes
- [ ] Color contrast checker for custom theme colors
- [ ] Keyboard navigation audit — tab order, focus management, skip links
- [ ] Screen reader landmark validation (header, main, nav, footer)
- [ ] Alt text presence check on all images
- [ ] ARIA attribute correctness validation
- [ ] CI integration — run in GitHub Actions with headless Playwright
- [ ] Fix suggestion generator — provide code-level remediation for each violation

## Notes

- WCAG 2.1 AA is the floor, not the ceiling — AAA where feasible
- axe-core catches ~57% of WCAG issues automatically; manual review still needed for complex flows
- Common startup violations: missing alt text, poor color contrast, no focus indicators
- Pairs with visual-qa-pipeline — both use Playwright, share browser context where possible
- Violations should create checklist items on the feature that introduced them
