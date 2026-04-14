---
name: brand-guidelines
description: Extract and codify brand guidelines from design assets into a reusable brand configuration. Use when the user needs to establish brand consistency, extract color palettes and typography from design tokens or CSS, document voice and tone guidelines, create a brand configuration file for other agents to reference, or audit existing content for brand compliance.
---

# Brand Guidelines Generator

Extract color palette, typography, spacing, component usage rules, and voice/tone from design assets and project configuration into a structured brand file that all content and development agents reference.

## Workflow

### 1. Extract Visual Identity

Read existing design tokens, Figma exports, or CSS variable definitions to identify:

- **Color palette**: Primary, secondary, neutral, and semantic colors with hex values and documented accessible contrast ratios
- **Typography**: Font families, sizes, weights, and line heights for each text level (H1-H6, body, caption, etc.)
- **Spacing and layout**: Grid system, spacing scale, breakpoints, and layout conventions

### 2. Document Component Usage

For each major component, document:
- Intended use cases (do's)
- Misuse patterns (don'ts)
- Required variants (sizes, states, themes)

### 3. Capture Voice and Tone

Read SOUL.md or equivalent voice/tone documentation to capture:
- Writing style (active/passive voice, person, sentence length)
- Vocabulary preferences and words to avoid
- Tone variations by context (marketing, support, documentation)

### 4. Document Logo Usage

Capture logo rules including minimum size, clear space requirements, approved color variants, and prohibited modifications.

### 5. Write Brand Configuration

Write all guidelines to a structured YAML file (e.g., `.harness/brand.yml`):

```yaml
colors:
  primary: "#1A73E8"
  secondary: "#..."
  neutral:
    100: "#..."
    900: "#..."
  semantic:
    success: "#..."
    error: "#..."

typography:
  heading:
    family: "Font Name"
    weight: 600
  body:
    family: "Font Name"
    size: "16px"
    lineHeight: 1.5

voice:
  style: "active voice, second person"
  sentenceLength: "under 20 words"
  tone: "confident but approachable"
```

### 6. Validate Compliance

Audit existing content and code against the documented brand guidelines. Flag violations including:
- Colors not in the approved palette
- Typography deviations from the type scale
- Content that doesn't match the documented voice/tone

## Anti-Patterns

- Listing colors as "blue" and "red" without hex values or usage context
- Typography section missing font weights or line heights
- No voice/tone section, leaving content agents to guess the writing style
- Brand file that exists but is never referenced by other agents
