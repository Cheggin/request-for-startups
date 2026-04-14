# End-to-End Test Plan for the Harness

## Philosophy

From the research: model scores correlate poorly with agent task completion. What matters is tool use consistency, error recovery, and context management. Our test must verify these, not just "did code get generated."

## Test Levels (smallest → largest)

### Level 1: Smoke Test (5 min)
Can the harness generate a valid product spec from an idea?

**Input:** "A counter app that counts button clicks"
**Verify:**
- [ ] product-spec.md exists and is >100 lines
- [ ] Contains at least 1 page definition
- [ ] Contains at least 1 feature with acceptance criteria
- [ ] Contains at least 1 data model

### Level 2: Scaffold Test (10 min)
Can the harness create a buildable Next.js project?

**Input:** product-spec.md from Level 1
**Verify:**
- [ ] package.json exists with correct dependencies
- [ ] `npm install` succeeds
- [ ] `npm run build` succeeds with 0 errors
- [ ] Tailwind v4 is configured
- [ ] At least 1 page component exists

### Level 3: TDD Test (20 min)
Can the harness write a test, then implement code that passes it?

**Input:** A single feature from the spec
**Verify:**
- [ ] Test file exists before implementation
- [ ] Test initially fails (red phase)
- [ ] Implementation makes the test pass (green phase)
- [ ] Test is meaningful (not just `expect(true).toBe(true)`)

### Level 4: Full Feature Test (30 min)
Can the harness build one complete feature end-to-end?

**Input:** "Add a click counter that persists count in Convex"
**Verify:**
- [ ] Tests written first
- [ ] Implementation passes tests
- [ ] Code review (Cubic or manual check)
- [ ] Feature works in browser (Playwright e2e)

### Level 5: Full SaaS Test (2+ hours)
Can the harness build a complete simple SaaS?

**Input:** "An image converter that converts PNG to JPG"
**Verify:**
- [ ] Research report exists
- [ ] Product spec exists
- [ ] All P0 features built with TDD
- [ ] Deployed to Vercel
- [ ] Works at the production URL

## Current Priority: Level 1

Start with the smoke test. If that doesn't work, nothing else will.
