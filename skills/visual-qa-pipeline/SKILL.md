---
name: visual-qa-pipeline
description: Screenshot every page with Playwright, feed to visual QA agent for design evaluation, report results to Slack. Use after every build phase to verify UI matches the chosen design preset. Integrates with the Playwright skill and the website-creation preset system.
user-invocable: true
group: quality
prerequisites: [website-creation]
next: [polish]
workflows: [build-lander, design-review, full-startup]
---

# Visual QA Pipeline

Capture screenshots of every page, evaluate them against the design preset, report to Slack.

## Pipeline

```
1. Start dev server (npm run dev)
2. Playwright captures full-page screenshots of every route
3. Each screenshot fed to visual QA agent (Claude vision)
4. Agent evaluates against the chosen design preset rules
5. Results posted to Slack with screenshots attached
6. PASS/FAIL verdict per page
```

## Step 1: Install and configure Playwright

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Create `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
});
```

## Step 2: Write screenshot capture tests

For every route in the app, create an e2e test that:
1. Navigates to the page
2. Waits for content to load (no skeleton/loading states)
3. Takes a full-page screenshot
4. Stores in `e2e/screenshots/`

```typescript
// e2e/screenshots.spec.ts
import { test } from '@playwright/test';

const routes = ['/', '/pricing', '/blog', '/legal/terms', '/legal/privacy'];

for (const route of routes) {
  test(`screenshot ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    const name = route === '/' ? 'home' : route.slice(1).replace(/\//g, '-');
    await page.screenshot({ 
      path: `e2e/screenshots/${name}.png`, 
      fullPage: true 
    });
  });
}
```

## Step 3: Visual QA evaluation

After screenshots are captured, the visual QA agent evaluates each one.

The agent reads the screenshot (Claude vision / multimodal) and checks against the chosen design preset from the website-creation skill:

### Evaluation checklist (per screenshot):
- [ ] **Hierarchy**: Is there a clear visual hierarchy? Can you tell what's most important in < 1 second?
- [ ] **Color**: Does it follow 70/20/10 rule? No homogenous goo?
- [ ] **Typography**: Correct font? No excessive serif? Heading sizes create clear levels?
- [ ] **Spacing**: Generous white space? Sections clearly separated? No crowding?
- [ ] **Preset compliance**: Does it match the chosen style (Minimal/Neobrutalist/etc.)?
- [ ] **Anti-patterns**: No icons in rounded squares? No emojis? No glassmorphism by default? No gradient abuse?
- [ ] **Layout**: Proper nav (logo left, links center, CTA right)? Hero above fold?
- [ ] **Mobile**: Would this work on 375px? (check for overflow indicators)
- [ ] **Content**: No AI slop words visible? Headlines short and specific?

### Scoring
Each check: PASS (1) or FAIL (0). Total score out of 9.
- 9/9: Ship
- 7-8/9: Fix flagged issues, re-screenshot, re-evaluate
- < 7/9: Major redesign needed. Load the impeccable skills (polish, critique, layout) and iterate.

## Step 4: Slack reporting

After evaluation, post to Slack:

```
Visual QA Results — [Project Name]
Route: / (home)
Score: 8/9
- PASS: Hierarchy, Color, Typography, Spacing, Preset, Anti-patterns, Layout, Content
- FAIL: Mobile (hero text may overflow on 375px)
Screenshot: [attached]
```

For failures, include specific fix instructions.

## Running the pipeline

```bash
# Capture screenshots
npx playwright test e2e/screenshots.spec.ts

# Screenshots saved to e2e/screenshots/
# Feed to visual QA agent for evaluation
```

## Integration with build pipeline

The visual QA pipeline runs AFTER:
1. Vitest unit tests pass
2. `next build` succeeds
3. Before deploy

It's Gate 3 in the quality pipeline: Tests → Build → Visual QA → Deploy

## Anti-Patterns in visual QA

- Skipping visual QA because "it looks fine to me"
- Pixel-diff only (misses semantic issues like bad hierarchy)
- Not testing mobile viewports
- Not re-running after fixes
