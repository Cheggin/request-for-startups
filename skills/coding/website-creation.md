---
name: website-creation
description: Build production-quality SaaS websites with opinionated design presets. Use when creating any startup website. Enforces shadcn/ui components, specific layout patterns, and anti-AI-writing. Must be loaded alongside anti-ai-writing and brand-guidelines skills.
---

# Website Creation

Build SaaS websites that look like they were designed by a senior designer, not vibe-coded by AI.

## Design System: shadcn/ui + Tailwind v4

Every website uses shadcn/ui components. No custom CSS for standard elements. Run `npx shadcn@latest init` and add components as needed.

Required components for every SaaS: Button, Card, Badge, Input, Separator, Sheet (mobile nav), Tabs.

## Style Presets

The user picks ONE preset. Do not mix. Do not freestyle.

### Preset 1: Minimal (like Linear, Vercel)
- Background: white (#ffffff) / dark (#09090b)
- Text: near-black (#18181b) / near-white (#fafafa)
- Accent: one single color (blue-600 or custom brand color)
- Typography: system-ui, -apple-system. Large headings (text-5xl+), tight tracking (-0.02em)
- Spacing: generous (py-24 between sections, px-6 content)
- No gradients. No decorative elements. No background patterns.
- Hero: headline + one-line subtitle + CTA button + product screenshot. Nothing else.

### Preset 2: Bold (like Stripe, Clerk)
- Background: deep navy (#0a0a23) or rich dark
- Accent: vibrant gradient on CTA only (not background)
- Typography: bold headings (font-bold text-6xl), normal body
- Cards with subtle borders and hover states
- Hero: headline + animated product demo or code snippet
- Grid-based feature sections (2x2 or 3x3)

### Preset 3: Warm (like Notion, Figma)
- Background: warm white (#fefce8) or cream
- Text: warm gray (#44403c)
- Accent: warm color (amber, orange, or terracotta)
- Rounded corners everywhere (rounded-2xl)
- Illustrations or icons (Lucide) over screenshots
- Hero: conversational headline + illustration + CTA
- Soft shadows (shadow-sm), no hard borders

### Preset 4: Clean SaaS (like Stripe Dashboard)
- Background: gray-50 (#f9fafb)
- Cards on white with border
- Accent: indigo-600
- Dashboard-forward: hero shows the actual product UI
- Feature sections use bento grid layout
- Data-heavy: show numbers, metrics, social proof

## Layout Rules (all presets)

1. **Navigation**: Logo left, links center, CTA right. Mobile: Sheet sidebar. Max 5 nav links.
2. **Hero**: Above the fold. One headline (max 10 words), one subtitle (max 20 words), one CTA. No paragraph text in hero.
3. **Social proof**: Logos, testimonials, or metrics. Below hero. Not optional.
4. **Features**: 3-4 max. Each: icon + heading + one sentence. No feature walls.
5. **Pricing**: 2-3 tiers max. Highlight recommended. Annual/monthly toggle.
6. **CTA**: Repeated at bottom. Same as hero CTA.
7. **Footer**: Links organized in columns. Legal links. No newsletter form in footer.

## Content Rules

Load the anti-ai-writing skill. Additionally:
- Headlines: 5-10 words. State what the product does, not what it is.
  - Good: "Convert images in your browser"
  - Bad: "The ultimate image conversion platform"
- Subtitles: state the key benefit in one sentence
  - Good: "Drag, drop, download. No upload needed — everything runs locally."
  - Bad: "Our powerful platform leverages cutting-edge technology to deliver seamless image conversion."
- CTAs: action verbs. "Start converting" not "Get started" not "Learn more"
- No "trusted by" without actual logos. No fake social proof.

## Technical Rules

- Install shadcn/ui: `npx shadcn@latest init`
- Add components individually: `npx shadcn@latest add button card badge`
- Use CSS variables from shadcn for all colors (--background, --foreground, --primary, etc.)
- Responsive: mobile-first. Test at 375px, 768px, 1280px.
- No Inter font. Use system-ui or the preset's specified font.
- Images: use next/image with proper width/height. No layout shift.
- Performance: Lighthouse score > 90.

## Anti-Patterns

- Generic hero with gradient background and sparkles
- "Trusted by 10,000+ users" without any proof
- Feature walls with 8+ features in a grid
- Testimonials that sound AI-generated ("This tool has been invaluable...")
- "In today's fast-paced world..." anywhere
- Stock photos of people at laptops
- Centered everything with no visual hierarchy
