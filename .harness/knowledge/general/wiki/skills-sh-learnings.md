# Skills.sh Learnings - Key Takeaways for Startup Harness
> Synthesized from top 10 skills on skills.sh (2026-04-13)
> Source: `.harness/knowledge/general/raw/skills-sh-top-skills.md`

---

## Per-Skill Best Ideas to Steal

### 1. Web Design Guidelines (Vercel) - Remote-Fetched Living Ruleset
- **Best idea:** Fetch guidelines from a remote URL before every audit so rules stay current without updating the skill itself.
- **Novel technique:** `file:line` output format makes findings instantly actionable in editors and CI.
- **Harness application:** Our generated apps should ship with a lint-like design audit that pulls from a living checklist. Bake the Vercel Web Interface Guidelines as our baseline UI quality gate.

### 2. Composition Patterns (Vercel) - Kill Boolean Props
- **Best idea:** Replace boolean prop proliferation with explicit variant components and compound component patterns.
- **Novel technique:** Categorized rules with priority tiers (HIGH/MEDIUM) and prefix-based naming (`architecture-`, `state-`, `patterns-`, `react19-`) so agents can selectively apply subsets.
- **Harness application:** Our React templates should default to compound component patterns. Add a linter rule that flags `<Component isX isY isZ />` anti-patterns.

### 3. Next.js Best Practices (Vercel) - Exhaustive Framework Coverage
- **Best idea:** Cover every Next.js footgun in one place: async params, hydration errors, RSC boundaries, runtime selection, parallel routes, self-hosting with Docker.
- **Novel technique:** Organized by framework concept rather than by severity, making it a reference doc and a teaching tool simultaneously.
- **Harness application:** Our Next.js template should embed these patterns as AGENTS.md guidance. Critical: async params migration for Next 15+, data fetching waterfall prevention with Promise.all/Suspense/preload.

### 4. Polish (Impeccable) - Systematic Pre-Ship Checklist
- **Best idea:** Never polish before functional completion. Polish is the final step with a fixed sequence: design system discovery -> pre-assessment -> systematic pass across 11 dimensions.
- **Novel technique:** The 11-dimension polish checklist (alignment, typography, color/contrast, interaction states, micro-interactions, content consistency, forms, edge cases, responsiveness, performance, code quality) is exhaustive enough to be automated.
- **Harness application:** Add a `/polish` phase to our deployment pipeline. Every generated app gets a pre-ship checklist that walks through these 11 dimensions before marking complete.

### 5. Critique (Impeccable) - Dual Assessment Anti-Slop Detection
- **Best idea:** Run two independent assessments (LLM subjective review + automated pattern detector) and combine into a single report. This catches what each misses alone.
- **Novel technique:** Explicit "AI slop" detection - flagging telltale signs of AI-generated design (generic gradients, glassmorphism overuse, stock color palettes). Nielsen's Heuristics scoring gives a quantitative baseline.
- **Harness application:** Build an AI-slop detector into our design review. Every generated UI should pass through a critique that specifically checks for generic AI design tells. This is table-stakes differentiation.

### 6. Bolder (Impeccable) - Intentional Drama Over Safety
- **Best idea:** Pair extreme font weights (900 with 200), let one color dominate 60%, use 3-5x scale jumps. Bold means distinctive, not chaotic.
- **Novel technique:** "Risk budget" concept - explicitly deciding how much visual risk to take before amplifying, so boldness is strategic rather than random.
- **Harness application:** Our templates tend toward safe defaults. Add a "bolder" pass option that injects personality: asymmetric layouts, dramatic type scale, full-bleed hero moments. Include guardrails (never sacrifice readability, never ignore accessibility).

### 7. SEO Audit (Marketing Skills) - Structured Priority Cascade
- **Best idea:** Audit in strict priority order: Crawlability -> Technical -> On-Page -> Content -> Authority. Never skip levels.
- **Novel technique:** E-E-A-T signals checklist (Experience, Expertise, Authoritativeness, Trustworthiness) applied to generated content. Site-type-specific issue lists (SaaS vs e-commerce vs blog vs local).
- **Harness application:** Every generated landing page should pass a lightweight SEO audit before deploy. Minimum: unique title tags (50-60 chars), meta descriptions (150-160 chars), one H1, keyword in first 100 words, image alt text, proper heading hierarchy.

### 8. Copywriting (Marketing Skills) - Anti-Vagueness Framework
- **Best idea:** CTA formula: `[Action Verb] + [What They Get] + [Qualifier]`. Kill weak CTAs ("Submit", "Learn More") everywhere.
- **Novel technique:** Six writing rules as a lint checklist: simple > complex, specific > vague, active > passive, confident > qualified, show > tell, honest > sensational. The "Quality Check" questions are instantly applicable.
- **Harness application:** Our landing page templates need copy guidelines baked in. Default section order: Social Proof -> Problem/Pain -> Solution/Benefits -> How It Works (3-4 steps) -> Objections -> Final CTA. Flag any CTA that uses "Submit" or "Click Here".

### 9. shadcn/ui - Registry-First Component Management
- **Best idea:** Always check installed components before adding new ones. Use existing primitives before building custom UI. Preview with `--dry-run` before installing.
- **Novel technique:** Multi-registry search across @shadcn, @magicui, @tailark, and community presets. Intelligent merge that preserves local customizations when updating upstream.
- **Harness application:** Our component strategy should be registry-first. Enforce: semantic colors (no raw hex), gap spacing (no margin hacks), built-in variants before custom styling. The shadcn workflow (context -> check installed -> fetch docs -> preview -> install -> verify) is the model for any component addition.

### 10. UI/UX Pro Max - Priority-Ranked UX Guidelines
- **Best idea:** Rank all UX guidelines by priority tier (CRITICAL/HIGH/MEDIUM/LOW) so agents address the most impactful issues first.
- **Novel technique:** Massive pre-built design system database (161 color palettes, 57 font pairings, 50+ styles) that can be queried by domain. Stack-specific guidelines for 10 different tech stacks.
- **Harness application:** Our accessibility guidelines should be CRITICAL priority, not optional. Touch & Interaction is CRITICAL for any mobile-facing product. Performance is HIGH. Charts & Data visualization is LOW priority - do last.

---

## Cross-Cutting Patterns

### Pattern 1: Layered Quality Gates
The best skills stack multiple quality passes in sequence:
1. **Functional completeness** (does it work?)
2. **Standards compliance** (accessibility, SEO, performance)
3. **Design critique** (hierarchy, slop detection, heuristics)
4. **Polish** (alignment, spacing, micro-interactions)
5. **Boldness** (distinctive personality, memorable moments)

Our harness should enforce this order. Never polish something that does not work. Never make something bolder before it is polished.

### Pattern 2: Fetch-Then-Audit
Vercel's web-design-guidelines fetches rules from a remote URL on every run. This means:
- Rules update without updating the skill
- A single source of truth for standards
- No drift between what the skill checks and what the team expects

Our harness should store quality checklists as fetchable living documents, not embedded constants.

### Pattern 3: Anti-Slop as a First-Class Concern
The Impeccable suite explicitly detects and fights AI-generated design mediocrity. This is the most novel pattern across all skills. Key anti-slop signals:
- Generic cyan/purple gradients
- Glassmorphism everywhere
- Stock color palettes with no brand connection
- Uniform spacing with no hierarchy
- Safe, predictable layouts

Our harness must treat anti-slop detection as a core quality gate, not an afterthought.

### Pattern 4: Compound Components Over Boolean Props
The composition patterns skill is the strongest argument for how React code should be structured in generated templates. Replace:
```jsx
<Button primary large disabled loading />
```
With:
```jsx
<Button variant="primary" size="lg">
  <Button.Spinner />
  <Button.Label>Loading...</Button.Label>
</Button>
```

### Pattern 5: Copy Quality is Code Quality
The copywriting skill treats marketing copy with the same rigor as code: linting rules, anti-patterns, structured checklists. Our templates should ship with copy guidelines, not just code guidelines. Default section order, CTA formulas, and quality checks should be part of every landing page template.

---

## Priority Actions for Harness

1. **Embed Vercel Web Interface Guidelines** as baseline UI quality gate in all frontend templates
2. **Build anti-slop detection** into design review (AI design tells, glassmorphism flags, generic gradient detection)
3. **Add layered quality gates** to deployment pipeline: functional -> standards -> critique -> polish -> bold
4. **Ship copy guidelines** with every landing page template (section order, CTA formula, anti-vagueness rules)
5. **Default to compound component patterns** in React templates, flag boolean prop proliferation
6. **Lightweight SEO audit** on every generated landing page before deploy
7. **Priority-rank all UX guidelines** (CRITICAL: accessibility + touch; HIGH: performance + layout; MEDIUM: animation + forms)
8. **Store quality checklists as living documents** fetchable at audit time, not hardcoded
