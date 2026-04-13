# brand-guidelines

**Status:** 🔴 Not started
**Agent:** design
**Category:** design
**Created:** 2026-04-13

## Description

Generate brand guidelines from the Figma design. Extracts color palette, typography, component usage rules, and voice/tone. Stored as .harness/brand.yml. All content agents reference this file for visual and verbal consistency.

## Checklist

- [ ] Extract color palette from Figma design tokens (primary, secondary, neutral, semantic)
- [ ] Extract typography rules — font families, sizes, weights, line heights
- [ ] Extract spacing and layout conventions
- [ ] Component usage rules — when to use each component, do's and don'ts
- [ ] Voice and tone guidelines derived from SOUL.md
- [ ] Logo usage rules — minimum size, clear space, color variants
- [ ] Store all guidelines in .harness/brand.yml
- [ ] Content agents read brand.yml before generating any content
- [ ] Website-dev agent references brand.yml for CSS variables and design tokens
- [ ] Brand guidelines updated when Figma design changes
- [ ] Validation — flag any content or code that violates brand guidelines

## Notes

- brand.yml is the single source of truth for all brand-related decisions
- Figma design tokens can be exported via the Figma API or Variables REST API
- Voice/tone from SOUL.md and visual identity from Figma should feel cohesive
