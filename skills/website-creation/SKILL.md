---
name: website-creation
description: Build production-quality SaaS websites with opinionated design presets. Use when creating any startup website. The user MUST pick a design style before building. Enforces shadcn/ui, Figma design principles, specific CSS values per style, and anti-AI-writing. Load alongside anti-ai-writing skill. LIGHT MODE ONLY.
user-invocable: true
group: design
prerequisites: [shape, brand-guidelines, anti-ai-writing]
next: [seo-setup, audit, polish]
workflows: [build-lander, build-saas, full-startup]
---

# Website Creation

Build SaaS websites that look intentionally designed. The user picks a style. The model follows it exactly. No freestyling. No dark mode.

## Foundational Design Principles (from Figma)

These apply to EVERY style. They are not optional.

1. **Hierarchy** — the most important element is the biggest, boldest, highest-contrast thing on the page. Hero headline > subtitle > body > nav. Never make everything the same size.
2. **White space** — more space = more premium. Sections need py-20 minimum. Elements need breathing room. Crowded = cheap.
3. **Contrast** — CTAs must be the highest-contrast element. If the page is light, the CTA is dark (or saturated). If text blends into the background, fix it.
4. **Alignment** — use a grid. max-w-7xl mx-auto for content. Left-align text (never center paragraphs). Center only headlines and CTAs.
5. **Proximity** — related things are close. Unrelated things have space between them. A feature's icon, heading, and description are grouped tightly.
6. **Consistency** — one font family. One accent color. One border-radius value. One shadow style. Mixing = amateur.
7. **Movement** — guide the eye: hero → social proof → features → pricing → CTA. Z-pattern or F-pattern.

## Rules (all styles)

### LIGHT MODE ONLY
- No dark backgrounds for the page. No dark themes. No dark mode toggle.
- Cards can have subtle colored or gray backgrounds, but the page background is always light.

### Layout
- Nav: logo left, links center, CTA right. Max 5 links. Mobile: sheet sidebar.
- Hero: above fold. Max 10-word headline. Max 20-word subtitle. One CTA. One visual.
- Social proof: logo bar or metrics immediately below hero.
- Features: 3-4 max. Icon + heading + one sentence each.
- Pricing: 2-3 tiers. Highlight recommended. Annual/monthly toggle.
- CTA repeated at bottom.
- Footer: organized link columns. Legal links.

### Components: shadcn/ui
```bash
npx shadcn@latest init
npx shadcn@latest add button card badge input separator sheet tabs
```
Override CSS variables per style preset. Do not write custom CSS for standard elements.

### Typography
- No Inter. Use system-ui or the style's specified font.
- Headings: tracking-tight. Large (text-4xl to text-6xl).
- Body: text-base or text-lg. Leading-relaxed.
- Never use more than 2 font weights (medium + bold, or regular + semibold).

### Content (load anti-ai-writing skill)
- Headlines: 5-10 words. What it does, not what it is.
- Subtitles: one sentence benefit.
- CTAs: action verbs. "Start converting" not "Get started".
- No fake social proof. No "trusted by" without logos.
- Specific numbers over vague claims.

## Step 0: Pick a style

Ask the user. Do NOT proceed without a choice.

---

## Preset 1: Minimal
*Reference: Linear, Vercel, Resend*

```
Background: #ffffff
Text: #18181b
Accent: single brand color (e.g. #2563eb)
Border-radius: 0.5rem
Font: system-ui, -apple-system, sans-serif
Shadows: none or shadow-sm only
```

**Rules:**
- White background. Lots of white space (py-24+ between sections).
- Headings: text-5xl font-medium tracking-tight. Let the words do the work.
- No gradients. No decorative elements. No patterns. No illustrations.
- Hero: headline left or centered, product screenshot right or below. White bg.
- Monochrome palette. Accent color appears ONLY on CTAs and links.
- Cards: border border-gray-200 bg-white. No shadows.

---

## Preset 2: Neobrutalist
*Reference: Gumroad, indie SaaS*

```
Background: #fef3c7 (warm yellow) or #ffffff
Text: #000000
Accent: #000000
Border: 3px solid #000000
Shadow: 4px 4px 0 #000000 (hard, zero blur)
Border-radius: 0 (sharp corners)
Font: 'Space Mono', monospace (headings); system-ui (body)
```

**Rules:**
- Black borders on EVERYTHING. Cards, buttons, inputs, images.
- Hard drop shadows — `shadow-[4px_4px_0_#000]`. Never blur.
- Sharp corners. border-radius: 0.
- Flat colors only. No gradients. No transparency.
- Bold, oversized typography. Headings text-6xl+ font-black.
- Buttons: solid fill + hard shadow. On hover: `hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#000]`.
- High contrast. Playful but structured.

---

## Preset 3: Glassmorphism
*Reference: Apple Vision, premium SaaS*

```
Background: linear-gradient(135deg, #667eea, #764ba2) or rich solid color
Card bg: rgba(255, 255, 255, 0.15)
Card blur: backdrop-blur-xl
Card border: border border-white/20
Card shadow: 0 8px 32px rgba(31, 38, 135, 0.15)
Border-radius: 1rem (rounded-2xl)
Font: system-ui
```

**Rules:**
- Page background is a rich gradient or vibrant solid — NOT dark. Use saturated purple, blue, or warm tones.
- Cards: `bg-white/15 backdrop-blur-xl border border-white/20 rounded-2xl`.
- Text on glass cards must be high contrast (dark text on light glass, or white text with strong blur).
- Subtle glow on hover: `hover:bg-white/25`.
- Only use glass effect on cards, modals, nav — not on body text sections.
- Ensure text is readable over every background. Add scrim layer if needed.

---

## Preset 4: Editorial
*Reference: Greptile, agency sites*

```
Background: #f5f5f0 (warm off-white / newsprint)
Text: #1a1a1a
Accent: one bold color (e.g. #16a34a green, #dc2626 red)
Border-radius: 0
Font heading: Georgia, 'Times New Roman', serif
Font body: system-ui, sans-serif
```

**Rules:**
- Serif headings, sans-serif body. Strong editorial voice.
- Asymmetric hero: text left, illustration or image right.
- Grid-based layout. Think newspaper columns.
- Monochrome + one bold accent (green like Greptile, or red, or orange).
- Illustrations should be textured, halftone, or hand-drawn style — not generic icons.
- Dense footer with 4+ columns.
- No rounded corners. Sharp, editorial feel.

---

## Preset 5: Clean SaaS
*Reference: Firecrawl, Stripe, Clerk*

```
Background: #ffffff
Text: #0f172a
Accent: #f97316 (orange) or brand color
Card bg: #f8fafc
Card border: border border-slate-200
Border-radius: 0.75rem
Font: system-ui
Shadow: shadow-sm
```

**Rules:**
- White background. Subtle gray cards with light borders.
- Interactive product demo in hero (not just a screenshot). Show the tool working.
- Dot-grid or subtle line pattern behind hero (optional, very light).
- Logo bar below hero with real company logos.
- Code snippets shown prominently for devtools.
- Feature sections: icon (Lucide) + heading + short description. Bento grid for 4+ features.
- Subtle shadows (shadow-sm). Rounded but not too round (rounded-lg).

---

## Preset 6: Warm Soft
*Reference: Notion, Cal.com, Figma marketing*

```
Background: #fffbeb (warm cream) or #fef7f0
Text: #44403c (warm gray)
Accent: #d97706 (amber) or #ea580c (orange) or warm brand color
Border-radius: 1rem (rounded-2xl)
Font: system-ui
Shadow: shadow-md with warm tint
```

**Rules:**
- Warm cream/ivory background. Never pure white.
- Everything rounded. Cards rounded-2xl, buttons rounded-full or rounded-xl.
- Soft shadows with warm tint: `shadow-md shadow-amber-100/50`.
- Illustrations or icons (Lucide) over screenshots.
- Conversational headline. Friendly tone.
- Generous padding. Feels spacious and inviting.
- Accent colors are warm: amber, orange, terracotta, coral.

---

## Visual Libraries (optional, for standout sites)

Not everything needs to be static. Use sparingly — every animation must serve a purpose:
- **Three.js / React Three Fiber** — 3D product showcases, interactive backgrounds
- **Framer Motion** — purposeful transitions, scroll-triggered reveals
- **GSAP** — complex scroll animations, text reveals
- **Lottie** — lightweight vector animations for icons
- **Spline** — embeddable 3D scenes

If it doesn't communicate state change or guide attention, remove it.

---

## Anti-Patterns (BANNED — these are vibe-coded AI slop signals)

### Color
- **Homogenous goo** — icon, box, card, border all same hue. Fix: 70/20/10 rule (70% neutral, 20% complementary, 10% accent).
- **Unnecessary borders** — if background colors separate elements, no border needed.

### Visual Assets
- **Icons in colored rounded squares** — font awesome in a colored box. Communicates nothing. Fix: bare Lucide icons, NO box. Or drop the icon entirely.
- **Emojis as visual assets** — always bad. Use Lucide icons or custom SVGs.
- **Stock photos of people at laptops** — generic, says nothing.

### Typography
- **Excessive serif hero** — Instrument Serif / DM Serif in hero. Claude's "elegant" default. Already overused, going stale. Avoid.
- **Inter font** — banned.

### Effects
- **Glassmorphism everywhere** — frosted glass + gradient + 1px border = obvious AI. The new purple gradient. Do NOT default to it.
- **Linear gradients on everything** — gradient text, gradient buttons. Abused, lost meaning. Use solid accent colors.
- **Unnecessary shadows** — shadow behind buttons making backgrounds muddy. Fix: solid accent background, no shadow.
- **Green left border with border-radius** — viral vibe coding signal. Remove the border.

### Layout
- **Cards within cards** — AI can't do hierarchy. Nested containers. Fix: remove wrappers, quiet secondary text.
- **Feature walls (8+ features)** — nobody reads. Max 3-4.
- **Centered paragraph text** — center headlines and CTAs only. Left-align body.
- **No visual hierarchy** — everything same size/weight/color. Must be glanceable.
- **Floating chat bubble** — orange circle bottom-right. Nobody enjoys this.

### Animations
- **Animations everywhere** — hover in multiple directions, slow appears, scroll everything. Buggy, random, tiring.
- **Animation without purpose** — if it doesn't communicate state or guide attention, delete.
- **Broken scroll animations** — elements not appearing on scroll. Test every animation.

### Content
- **"Revolutionary", "game-changing", "cutting-edge"** — see anti-ai-writing skill.
- **"Trusted by 10,000+"** without logos — fake social proof.

### CSS
- **!important** — banned.
- **Left outline indicators** — vibe coding signal.
- **Mixing styles** — glassmorphism on brutalist = incoherent.
- **Dark mode / dark backgrounds** — banned. Light mode only.
