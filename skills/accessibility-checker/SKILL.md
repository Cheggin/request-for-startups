---
name: accessibility-checker
description: Run automated WCAG 2.1 AA accessibility audits using axe-core via Playwright. Use when implementing or reviewing UI features to enforce accessibility compliance, catch color contrast failures, validate keyboard navigation, check screen reader landmarks, verify alt text and ARIA attributes, or gate feature completion on accessibility standards.
user-invocable: true
group: quality
prerequisites: [website-creation, adapt]
next: [audit]
workflows: [design-review, full-startup]
---

# Accessibility Checker

## Setup

Install `@axe-core/playwright` as a devDependency if not already present.

## Audit Workflow

1. Identify all pages and components in scope for the current UI feature.
2. Launch headless Playwright and navigate to each target page or render each component.
3. Run axe-core with the WCAG 2.1 AA ruleset on each target.
4. Categorize violations by severity: critical, serious, moderate, minor.
5. For each violation, output the element selector, rule violated, and a remediation code snippet.
6. Block feature completion on any critical or serious violations.
7. Log moderate and minor violations as warnings without blocking.

## Additional Checks

- **Color contrast**: Validate all custom theme colors against WCAG AA thresholds (4.5:1 normal text, 3:1 large text).
- **Keyboard navigation**: Verify logical tab order, focus management, and skip links.
- **Screen reader landmarks**: Confirm presence of header, main, nav, and footer landmarks.
- **Images**: Check all images for meaningful alt text.
- **ARIA**: Validate ARIA roles, states, and properties for correctness.

## Output

Generate a structured violation report per page/component:

```
Page/Component | Severity | Element | Rule | Fix
```

Integrate into CI via GitHub Actions with headless Playwright for automated runs on every PR.
