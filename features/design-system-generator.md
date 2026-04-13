# design-system-generator

**Status:** 🔴 Not started
**Agent:** designer
**Category:** coding
**Created:** 2026-04-13

## Description

Auto-generate a design system from the product spec and brand direction. Defines color tokens, typography scale, spacing system, and a component library (Button, Input, Card, Modal, etc.). Stored as a Tailwind config + React component files. All UI code produced by the harness must use the design system — no ad-hoc styles.

## Checklist

- [ ] Brand input parser — accept brand colors, font preferences, and mood (minimal, bold, playful, etc.)
- [ ] Color token generation — primary, secondary, accent, neutral, success, warning, error palettes with shades
- [ ] Typography scale — font families, sizes, weights, line heights (heading 1-6, body, caption, label)
- [ ] Spacing system — consistent spacing scale (4px base: 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64)
- [ ] Border radius tokens — none, sm, md, lg, full
- [ ] Shadow tokens — sm, md, lg, xl for elevation hierarchy
- [ ] Tailwind config generation — extend tailwind.config.ts with all tokens
- [ ] CSS variables output — tokens as CSS custom properties for runtime theming
- [ ] Button component — variants (primary, secondary, outline, ghost), sizes (sm, md, lg), states
- [ ] Input component — text, email, password, textarea with validation states
- [ ] Card component — with header, body, footer slots
- [ ] Modal component — with overlay, close button, responsive sizing
- [ ] Badge component — status indicators with color variants
- [ ] Avatar component — image, initials, fallback with sizes
- [ ] Navigation component — responsive nav with mobile menu
- [ ] Design system documentation — component usage examples in a Storybook-style page
- [ ] Lint rule — flag any Tailwind classes that bypass the design system tokens

## Notes

- The design system is generated BEFORE any Figma designs or UI implementation
- Tailwind config is the single source of truth — components reference tokens, not raw values
- Components are React + Tailwind, compatible with Next.js and shadcn/ui patterns
- No hardcoded colors, font sizes, or spacing in any component — everything goes through tokens
- The lint rule is critical — it prevents style drift as agents add features
- Design system can be regenerated if brand direction changes, but all downstream code must update
