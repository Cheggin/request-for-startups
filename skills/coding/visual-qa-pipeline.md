---
name: visual-qa-pipeline
description: Playwright screenshot capture compared against Figma designs using pixel diff to catch visual regressions
category: coding
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - WebFetch
---

# Visual QA Pipeline

## Purpose

Capture Playwright screenshots of built pages and compare them against Figma design screenshots using pixel diff with configurable thresholds. Catches visual regressions and design drift automatically after every UI feature implementation. Screenshots are stored in the repo for audit trail. Integrates into the quality gate pipeline alongside accessibility checks and performance benchmarks.

## Steps

1. Identify all pages and components affected by the current UI feature implementation.
2. Fetch reference screenshots from Figma via the Figma API or MCP for each target page and component.
3. Launch headless Playwright and navigate to each target page or render each target component.
4. Capture full-page screenshots at each configured viewport (desktop, tablet, mobile breakpoints).
5. Capture component-level screenshots for isolated component visual testing.
6. Run pixel diff comparison (e.g., pixelmatch) between captured screenshots and Figma reference screenshots.
7. Apply the diff threshold configured in stacks.yml (per-page, per-component, or global).
8. For any diff exceeding the threshold, generate a diff image highlighting the changed regions.
9. Output a structured diff report with page name, viewport, diff percentage, and diff image path per comparison.
10. Block feature completion if any diff exceeds the configured threshold.
11. Store captured screenshots in `.harness/screenshots/` as git-tracked baselines.
12. Provide a baseline update workflow: when design intentionally changes, accept new screenshots as the updated baseline.
13. Integrate into CI via GitHub Actions with headless Playwright for automated runs on every PR.

## Examples

Good:
- "Run visual QA on the landing page and pricing page at desktop and mobile viewports, compare against Figma references, and flag any diffs above 2%."
- "Update visual baselines for the dashboard after the redesign was approved in Figma."

Bad:
- "Check if the site looks right." (No specific pages, no reference screenshots, no threshold defined.)
- "Compare all pages." (No viewport specified, no threshold, no Figma reference source identified.)

## Checklist

- [ ] Playwright screenshot capture supports full-page and component-level modes
- [ ] Figma reference screenshots fetched via API or MCP
- [ ] Pixel diff engine integrated with configurable threshold (e.g., pixelmatch)
- [ ] Diff threshold configurable in stacks.yml per-page, per-component, or globally
- [ ] Screenshots stored in .harness/screenshots/ with git-tracked baselines
- [ ] Diff report generated with changed regions highlighted in diff image
- [ ] Quality gate blocks feature completion when diff exceeds threshold
- [ ] Pipeline runs automatically after every UI feature implementation
- [ ] Viewport matrix covers desktop, tablet, and mobile breakpoints
- [ ] Baseline update workflow accepts new screenshots when design intentionally changes
- [ ] CI integration runs in GitHub Actions with headless Playwright
- [ ] Audit trail maintained through commit history of screenshots
- [ ] Large screenshot files evaluated for git-lfs to manage repo size
