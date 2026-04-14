# Skills.sh Top Skills - Raw Research
> Fetched 2026-04-13 from skills.sh skill registry pages

---

## 1. vercel-labs/agent-skills/web-design-guidelines

**What it does:** Audits UI code against Vercel's Web Interface Guidelines for design and accessibility compliance.

**How it works:**
1. Fetches latest guidelines from remote source before each review
2. Reads specified files (or prompts user for file paths)
3. Checks against all rules in fetched guidelines
4. Outputs findings in terse `file:line` format for quick scanning

**Guidelines source:** https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

**Full guidelines content (from command.md):**

- **Accessibility:** Icon buttons require `aria-label`; form controls need labels or aria-labels; interactive elements need keyboard handlers; semantic HTML preferred over ARIA; images need alt text; decorative icons need `aria-hidden="true"`; async updates need `aria-live="polite"`.
- **Focus States:** Interactive elements need visible focus indicators using `focus-visible:ring-*`; avoid `outline-none` without replacement; use `:focus-visible` over `:focus`; group focus with `:focus-within`.
- **Forms:** Inputs need `autocomplete` and meaningful `name` attributes; correct `type` and `inputmode`; no paste-blocking; clickable labels; disable spellcheck on sensitive fields; checkboxes/radios share hit targets; submit buttons stay enabled until request starts; inline error messages; placeholders use `...` with example patterns.
- **Animation:** Honor `prefers-reduced-motion`; animate only `transform`/`opacity`; list properties explicitly instead of `transition: all`; make animations interruptible.
- **Typography:** Use curly quotes, proper ellipsis, non-breaking spaces, `tabular-nums` for number columns, `text-wrap: balance` on headings.
- **Content:** Text containers handle overflow via `truncate` or `line-clamp-*`; flex children need `min-w-0`; handle empty states; anticipate varied input lengths.
- **Images:** Require explicit `width`/`height`; use `loading="lazy"` for below-fold; `priority` for critical above-fold images.
- **Performance:** Virtualize lists >50 items; avoid layout reads in render; batch DOM operations; prefer uncontrolled inputs; add `preconnect` links; preload critical fonts.
- **Navigation & State:** URLs reflect state (filters, tabs, pagination); use `<a>`/`<Link>`; deep-link stateful UI; require confirmation for destructive actions.
- **Touch:** `touch-action: manipulation`; intentional tap highlight; `overscroll-behavior: contain` in modals; disable text selection during drag.
- **Layout:** Full-bleed designs use safe-area insets; avoid unwanted scrollbars; prefer flex/grid over JS measurement.
- **Dark Mode:** Set `color-scheme: dark` on `<html>`; match `theme-color`; explicit colors on native selects.
- **Internationalization:** Use `Intl.DateTimeFormat` and `Intl.NumberFormat`; detect language via headers; wrap identifiers with `translate="no"`.
- **Hydration:** Inputs with `value` need `onChange`; guard date/time rendering; limit `suppressHydrationWarning`.
- **Copy:** Active voice; Title Case headings; numerals for counts; specific labels; errors include next steps; second person; use `&` when space-constrained.
- **Anti-patterns to flag:** `user-scalable=no`; paste-blocking; `transition: all`; `outline-none` without replacement; inline navigation onClick; semantic violations; missing dimensions; unvirtualized large arrays; unlabeled inputs; hardcoded formats; unjustified `autoFocus`.

---

## 2. vercel-labs/agent-skills/vercel-composition-patterns

**What it does:** React composition patterns for scaling components and avoiding boolean prop proliferation. Designed for refactoring bloated components and building reusable libraries.

**Four priority categories:**

1. **Component Architecture (HIGH)** - `architecture-` prefix
   - Avoid boolean props through composition
   - Use compound components with shared context

2. **State Management (MEDIUM)** - `state-` prefix
   - Decouple implementation details
   - Define context interfaces for dependency injection
   - Lift state into provider components

3. **Implementation Patterns (MEDIUM)** - `patterns-` prefix
   - Create explicit variant components instead of boolean modes
   - Prefer children composition over render props

4. **React 19 APIs (MEDIUM)** - `react19-` prefix
   - Remove `forwardRef` usage
   - Use `use()` instead of `useContext()`

**Content:** 10+ named patterns with individual rule files containing explanations, incorrect/correct code examples, and context. A compiled full guide is available in `AGENTS.md`.

---

## 3. vercel-labs/next-skills/next-best-practices

**What it does:** Comprehensive Next.js development guidelines covering 15+ topic areas.

**Complete topic coverage:**

- **File Conventions** - Project structure, route segments (dynamic, catch-all, groups), parallel/intercepting routes, middleware updates
- **RSC Boundaries** - Detecting invalid async client components, non-serializable props, Server Action exceptions
- **Async Patterns** - Next.js 15+ API changes including async params, searchParams, cookies(), and headers()
- **Runtime Selection** - Node.js runtime defaults versus Edge runtime appropriateness
- **Directives** - Usage of 'use client', 'use server' (React), and 'use cache' (Next.js)
- **Functions** - Navigation hooks (useRouter, usePathname, useSearchParams, useParams), server functions (cookies, headers, draftMode, after), and generate functions (generateStaticParams, generateMetadata)
- **Error Handling** - error.tsx, global-error.tsx, not-found.tsx files plus redirect/permanentRedirect/notFound functions and auth error handling
- **Data Patterns** - Server Components vs Actions vs Route Handlers, avoiding waterfalls with Promise.all/Suspense/preload
- **Route Handlers** - route.ts usage, GET conflicts, environment behavior, comparison with Server Actions
- **Metadata & OG Images** - Static/dynamic metadata, generateMetadata function, next/og image generation
- **Image Optimization** - next/image usage, remote configuration, responsive sizes, blur placeholders, LCP priority
- **Font Optimization** - next/font setup, Google/local fonts, Tailwind integration, subset preloading
- **Bundling** - Server-incompatible packages, CSS imports, polyfills, ESM/CommonJS issues, bundle analysis
- **Scripts** - next/script versus native tags, inline script requirements, loading strategies, analytics integration
- **Hydration Errors** - Common causes, debugging techniques, solution patterns
- **Suspense Boundaries** - CSR bailout with useSearchParams/usePathname, hook requirements
- **Parallel & Intercepting Routes** - Modal patterns with @slot and (.) interceptors, default.tsx fallbacks
- **Self-Hosting** - Docker with 'standalone' output, cache handlers for ISR, setup requirements
- **Debug Tricks** - MCP endpoint for AI debugging, route-specific rebuilds

---

## 4. pbakaus/impeccable/polish

**What it does:** Final quality pass catching alignment, spacing, consistency, and interaction details before shipping.

**Mandatory preparation:** Invoke /impeccable for design principles and the Context Gathering Protocol. Determine quality bar (MVP vs flagship) and confirm functional completeness.

**Key phases:**

1. **Design System Discovery** - Locate design tokens, spacing scales, typography standards, and identify drift from established patterns.

2. **Pre-Polish Assessment** - Verify functional completeness and identify specific polish areas.

3. **Systematic Polish** across dimensions:
   - Visual alignment and spacing (pixel-perfect, grid-based)
   - Typography (hierarchy, line length 45-75 chars, kerning)
   - Color and contrast (WCAG compliance, token usage)
   - Interaction states (default, hover, focus, active, disabled, loading, error, success)
   - Micro-interactions (150-300ms transitions, 60fps, respects reduced-motion)
   - Content consistency (terminology, capitalization, grammar)
   - Forms and inputs (proper labeling, validation)
   - Edge cases (loading, empty, error, success states)
   - Responsiveness (all breakpoints, 44x44px touch targets minimum)
   - Performance (no layout shift, optimized images, lazy loading)
   - Code quality (no console logs, clean imports, type safety, accessibility)

**Critical rules:**
- Never polish before functional completion
- Test on real devices, not just DevTools
- Get fresh-eyes review before sign-off
- Remove orphaned code and consolidate duplicate implementations
- Replace custom solutions with design system equivalents

---

## 5. pbakaus/impeccable/critique

**What it does:** Evaluates design effectiveness across visual hierarchy, information architecture, emotional resonance, and UX quality. Identifies "AI slop" anti-patterns.

**Key capabilities:**
- Assesses interfaces against AI-generated design tells (color palettes, gradients, glassmorphism)
- Evaluates 10 dimensions including typography, color strategy, and microcopy
- Runs cognitive load assessments and Nielsen's Heuristics scoring
- Generates combined reports from two independent assessments (LLM review + automated detection)

**5-step process:**
1. Preparation with Context Gathering Protocol
2. Dual independent assessments (LLM + automated detector)
3. Combined critique report with heuristics scoring
4. User clarification questions
5. Prioritized action recommendations

---

## 6. pbakaus/impeccable/bolder

**What it does:** Amplifies safe or generic designs by introducing intentional drama, distinctive choices, and visual confidence while preserving usability.

**Core principle:** "Bolder" means distinctive and memorable - not chaotic. Requires strategic context analysis before amplification.

**Amplification dimensions:**
- **Typography:** Replace generic fonts; create 3-5x scale jumps; pair extreme weights (900 with 200)
- **Color:** Increase saturation; use bold unexpected combinations; let one color dominate 60% of design
- **Space:** Create extreme scale jumps (3-5x); break grids; use asymmetric layouts; employ 100-200px gaps
- **Effects:** Add dramatic shadows, intentional patterns, textures, and custom elements - avoid cliches (cyan gradients, glassmorphism)
- **Motion:** Staggered animations, scroll effects, micro-interactions; use ease-out transitions
- **Composition:** Create hero moments, diagonal flows, full-bleed elements, unexpected proportions

**Never:** Add effects randomly, sacrifice readability, make everything bold, ignore accessibility, overwhelm with motion, or copy trends blindly.

---

## 7. coreyhaines31/marketingskills/seo-audit

**What it does:** Expert SEO assessment with actionable recommendations for improving organic search performance.

**Priority audit order:**
1. Crawlability & Indexation
2. Technical Foundations
3. On-Page Optimization
4. Content Quality
5. Authority & Links

**Critical technical SEO checks:**
- Crawlability: robots.txt validation, XML sitemap, site architecture (3-click rule), crawl budget
- Indexation: site: searches, Search Console, noindex detection, canonical direction, redirect chains, soft 404s, duplicate content
- Core Web Vitals: LCP <2.5s, INP <200ms, CLS <0.1
- Mobile: responsive design, tap targets, viewport, content parity
- URL Structure: descriptive, keyword-appropriate, lowercase, hyphen-separated

**On-page checklist:**
- Title tags: unique, primary keyword near beginning, 50-60 chars
- Meta descriptions: unique, 150-160 chars, primary keyword, CTA
- Heading structure: one H1 per page, logical hierarchy, no level skipping
- Content: keyword in first 100 words, related keywords naturally, sufficient depth, search intent match
- Images: descriptive filenames, alt text, compressed, WebP, lazy loading, responsive
- Internal linking: important pages well-linked, descriptive anchors, no broken links

**E-E-A-T signals:** Experience, Expertise, Authoritativeness, Trustworthiness

**Output format:** Executive summary with top 3-5 priorities, per-finding format (Issue/Impact/Evidence/Fix/Priority), prioritized action plan

**Important limitation:** web_fetch/curl cannot detect JavaScript-injected structured data from CMS plugins

---

## 8. coreyhaines31/marketingskills/copywriting

**What it does:** Copywriting framework for landing pages and marketing content.

**Core principles:**
1. Clarity Over Cleverness
2. Benefits Over Features
3. Specificity Over Vagueness
4. Customer Language Over Company Language
5. One Idea Per Section

**Writing style rules:**
1. Simple over complex (use "help" not "facilitate")
2. Specific over vague (avoid "streamline," "optimize")
3. Active over passive voice
4. Confident over qualified (remove "almost," "very," "really")
5. Show over tell - describe outcomes
6. Honest over sensational - no fabricated statistics

**Above the fold:** Headline (value proposition), Subheadline (1-2 sentences), Primary CTA (action-oriented)

**Page sections:** Social Proof -> Problem/Pain -> Solution/Benefits -> How It Works (3-4 steps) -> Objection Handling -> Final CTA

**CTA formula:** [Action Verb] + [What They Get] + [Qualifier if needed]
- Weak: Submit, Sign Up, Learn More, Click Here
- Strong: Start Free Trial, Get [Specific Thing], Download the Guide

**Quality check:** Jargon confusion? Sentences overloaded? Passive voice? Exclamation points? Buzzwords without substance?

---

## 9. shadcn/ui/shadcn

**What it does:** Complete shadcn/ui component management for adding, searching, fixing, styling, and composing UI. 82.6K installs.

**Key capabilities:**
- Search across multiple registries (@shadcn, @magicui, @tailark, community presets)
- Add, preview, and update components with `--dry-run` and `--diff` flags
- Intelligently merge upstream changes while preserving customizations

**Critical rules enforcement:**
- Forms: FieldGroup, Field, InputGroup, validation states
- Composition: proper nesting of Groups, overlay components, Card structure
- Styling: semantic colors, gap spacing, size shortcuts, no manual dark mode
- Icons: data-icon attributes, no sizing classes on icon children

**Essential patterns:**
- Use existing components rather than building custom UI
- Compose layouts from primitives
- Leverage built-in variants before custom styling
- Check installed components first before adding new ones

**Workflow:** Get project context -> Check installed components -> Fetch docs -> Preview changes -> Install -> Review and verify

---

## 10. nextlevelbuilder/ui-ux-pro-max-skill

**What it does:** Comprehensive design intelligence for web and mobile UI/UX across 10 technology stacks. 113.8K installs.

**Scale:** 50+ design styles, 161 color palettes, 57 font pairings, 99 UX guidelines organized by 10 priority categories.

**Priority categories (1-10):**
1. Accessibility (CRITICAL)
2. Touch & Interaction (CRITICAL)
3. Performance (HIGH)
4. Style Selection (HIGH)
5. Layout & Responsive (HIGH)
6. Typography & Color (MEDIUM)
7. Animation (MEDIUM)
8. Forms & Feedback (MEDIUM)
9. Navigation Patterns (HIGH)
10. Charts & Data (LOW)

**Sub-skills:** ui-ux-pro-max, ckm:ui-styling, ckm:design-system, ckm:design, ckm:brand, ckm:slides, ckm:banner-design

**Workflow:** Analyze requirements -> Generate design systems via CLI -> Supplement with detailed searches by domain -> Apply stack-specific guidelines
