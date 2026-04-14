# figma-design-generator

**Status:** 🟡 In progress
**Agent:** designer
**Category:** coding
**Created:** 2026-04-13

## Description

Designer agent uses the Figma MCP to generate designs for each page defined in the product spec. Applies the design system (colors, typography, components) consistently across all pages. References an inspiration directory for quality benchmarks. Outputs a Figma file URL and screenshots for each page, which become the visual QA baseline for implementation.

## Checklist

- [ ] Product spec page parser — extract page definitions, layouts, and content requirements
- [ ] Figma MCP integration — connect to Figma API via MCP tools (generate_figma_design)
- [ ] Design system application — apply color tokens, typography, spacing from design-system-generator
- [ ] Page-by-page generation — create a Figma frame for each page in the spec
- [ ] Component reuse — use shared Figma components (buttons, inputs, cards, modals, nav)
- [ ] Responsive variants — generate desktop and mobile frames for each page
- [ ] Inspiration reference — load inspiration directory images as quality benchmarks
- [ ] Screenshot capture — export each frame as PNG for visual QA baseline
- [ ] Figma file URL output — return shareable link to the complete design file
- [ ] Design annotation — add notes on interactions, hover states, and edge cases
- [ ] Design-to-spec traceability — each frame links back to the spec page that defined it
- [ ] Design review checkpoint — pause for human review before implementation begins (optional)

## Notes

- Designs are generated BEFORE implementation — they are the target, not a retrofit
- Screenshots become the reference images for the visual QA pipeline
- The designer agent should not invent features — it implements exactly what the spec defines
- Responsive design is mandatory — mobile-first, then desktop adaptation
- Inspiration directory lives in the project repo at .harness/inspiration/
- If Figma MCP is unavailable, fall back to detailed wireframe descriptions in markdown
- Design system must exist before this step runs — see design-system-generator
