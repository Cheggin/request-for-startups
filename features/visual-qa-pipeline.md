# visual-qa-pipeline

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

Playwright screenshot capture of built pages compared against Figma design screenshots. Uses pixel diff with configurable threshold to catch visual regressions and design drift. Screenshots stored in the repo for audit trail. Runs automatically after every UI feature implementation as part of the quality gate pipeline.

## Checklist

- [ ] Playwright screenshot capture script — full-page and component-level captures
- [ ] Figma screenshot fetcher — pull reference screenshots from Figma via MCP or API
- [ ] Pixel diff engine with configurable threshold (e.g., pixelmatch or similar)
- [ ] Threshold configuration in stacks.yml (per-page or global)
- [ ] Screenshot storage in repo (e.g., .harness/screenshots/) with git-tracked baselines
- [ ] Diff report generation — highlight changed regions, output diff image
- [ ] Quality gate integration — block feature completion if diff exceeds threshold
- [ ] Run trigger after every UI feature implementation (hook or CI step)
- [ ] Viewport matrix — capture at desktop, tablet, mobile breakpoints
- [ ] Baseline update workflow — accept new screenshots when design intentionally changes
- [ ] CI integration — run in GitHub Actions with headless Playwright
- [ ] Audit trail — commit history of screenshots shows visual evolution

## Notes

- Pixel diff threshold should be tunable per-component (hero sections tolerate less drift than footers)
- Figma screenshots are the source of truth — if Figma changes, baselines update
- Large screenshot files may need git-lfs; evaluate repo size impact
- Pairs with accessibility-checker and performance-benchmark as part of the full quality gate
