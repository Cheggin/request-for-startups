---
name: brand-guidelines
description: Extract and codify brand guidelines from design assets into a reusable brand configuration
category: content
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

## Purpose

Generate a comprehensive brand guidelines file from design assets and project configuration. Extracts color palette, typography, spacing, component usage rules, and voice/tone into a structured format that all content and development agents reference for visual and verbal consistency.

## Steps

1. Read existing design tokens, Figma exports, or CSS variable definitions to identify the color palette (primary, secondary, neutral, semantic colors).
2. Extract typography rules including font families, sizes, weights, and line heights.
3. Extract spacing and layout conventions from the design system.
4. Document component usage rules with do's and don'ts for each major component.
5. Read SOUL.md or equivalent voice/tone documentation to capture verbal brand identity.
6. Document logo usage rules including minimum size, clear space, and color variants.
7. Write all guidelines to a structured YAML file (e.g., .harness/brand.yml).
8. Validate that existing content and code conform to the documented brand guidelines.
9. Flag any violations found during validation.

## Examples

Good:
- "brand.yml defines primary color as #1A73E8 with documented accessible contrast ratios against white and dark backgrounds."
- "Typography section specifies Inter 16px/1.5 for body text and Inter 600 24px/1.3 for H2 headings."
- "Voice guidelines state: use active voice, second person, and short sentences under 20 words."

Bad:
- "Brand file lists colors as 'blue' and 'red' without hex values or usage context."
- "Typography section missing font weights or line heights."
- "No voice/tone section, leaving content agents to guess the writing style."

## Checklist

- [ ] Color palette extracted with hex values for primary, secondary, neutral, and semantic colors
- [ ] Typography rules documented with font families, sizes, weights, and line heights
- [ ] Spacing and layout conventions captured
- [ ] Component usage rules with do's and don'ts
- [ ] Voice and tone guidelines derived from SOUL.md or equivalent
- [ ] Logo usage rules including minimum size, clear space, and color variants
- [ ] All guidelines stored in a structured file (e.g., .harness/brand.yml)
- [ ] Content agents reference the brand file before generating content
- [ ] Development agents reference the brand file for CSS variables and design tokens
- [ ] Validation flags content or code that violates brand guidelines
