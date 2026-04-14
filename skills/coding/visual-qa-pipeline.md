---
name: visual-qa-pipeline
description: Capture Playwright screenshots and compare against Figma designs using pixel diff to catch visual regressions. Use when verifying UI implementation matches Figma designs, setting up visual regression testing, configuring pixel diff thresholds, updating visual baselines after approved redesigns, or gating features on visual fidelity.
---

# Visual QA Pipeline

## Reference Setup

1. Fetch reference screenshots from Figma via the Figma API or MCP for each target page and component.
2. Store baseline screenshots in `.harness/screenshots/` as git-tracked files.

## Capture Workflow

1. Identify all pages and components affected by the current UI feature.
2. Launch headless Playwright and navigate to each target page or render each component.
3. Capture full-page screenshots at configured viewports: desktop, tablet, mobile.
4. Capture component-level screenshots for isolated visual testing.

## Pixel Diff Comparison

1. Run pixel diff (pixelmatch or equivalent) between captured screenshots and Figma references.
2. Apply diff threshold from `stacks.yml` (per-page, per-component, or global).
3. For diffs exceeding threshold, generate a diff image highlighting changed regions.
4. Block feature completion if any diff exceeds the configured threshold.

## Output

Generate a structured diff report per comparison:

```
Page | Viewport | Diff % | Status | Diff Image Path
```

## Baseline Management

Provide a baseline update workflow: when design intentionally changes, accept new screenshots as the updated baseline.

Integrate into CI via GitHub Actions with headless Playwright. Evaluate large screenshot files for git-lfs to manage repo size.
