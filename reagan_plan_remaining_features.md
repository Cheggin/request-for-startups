# Plan: Build Remaining Features

## 1. agents/docs.md — Documentation Agent
- OMC XML format matching commander.md/researcher.md pattern
- model: sonnet, level: 2
- Karpathy principles adapted for docs
- Only for devtool/api/sdk/cli projects
- disallowedTools: [] (needs everything)

## 2. packages/figma-integration/
- src/generator.ts — generateDesigns() calls Figma MCP
- src/screenshots.ts — captureDesignScreenshots()
- src/design-system.ts — extractDesignSystem()
- src/index.ts — barrel exports
- package.json, tsconfig.json
- Tests for each module

## 3. packages/status-dashboard/
- src/dashboard.ts — renderStatus() with ANSI terminal output
- src/index.ts — barrel exports
- Simple terminal print, not full TUI
- package.json, tsconfig.json
- Tests

## 4. .harness/multi-project.md
- Design doc only (Phase 4)
- Independent repos, shared learnings, CLI switching
