---
title: Design Style Research for SaaS Websites
source: Figma Resource Library, NN/Group, neubrutalism.com, Glass UI, CSS-Tricks
type: article
ingested: 2026-04-14
---

# Figma's 13 Graphic Design Principles
1. Alignment — layout grids, auto layout
2. Contrast — colors, sizes, textures, shapes
3. Balance — symmetrical vs asymmetrical
4. Hierarchy — size, bold, color for importance
5. Color — theory + psychology + accessibility
6. White Space — breathing room, readability
7. Proportion — relative sizing = importance
8. Repetition — consistency, design systems
9. Rhythm — regular, random, flowing, progressive
10. Movement — eye tracking (Z, F, layer cake patterns)
11. Emphasis — focal points via contrast
12. Proximity — group related, separate unrelated
13. Unity — consistent elements across composition

# Figma's 7 UI Design Principles
1. Hierarchy — visual cues for importance
2. Progressive Disclosure — sequence features to prevent overload
3. Consistency — repeating patterns, same behavior
4. Contrast — draw attention to important actions
5. Accessibility — WCAG, assistive tech
6. Proximity — group related UI elements
7. Alignment — grid systems, clean lines

# Neobrutalism CSS Tokens
- border: 3px solid #000000
- box-shadow: 4px 4px 0 #000000 (hard, no blur)
- border-radius: 0 (sharp corners)
- colors: flat, no gradients, high contrast primaries
- opacity: 1.0 (no transparency)
- typography: chunky, industrial, sometimes monospace
- hover: translate(-2px, -2px) + shadow grows

# Glassmorphism CSS Tokens
- background: rgba(255, 255, 255, 0.1-0.3)
- backdrop-filter: blur(10-20px) saturate(180%)
- border: 1px solid rgba(255, 255, 255, 0.2)
- border-radius: 16px
- box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15)
- requires vibrant/gradient background behind cards

# Neumorphism CSS Tokens
- background: same as page background (#e0e0e0 typical)
- box-shadow: 6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff
- inset: inset 6px 6px 10px #a3b1c6, inset -6px -6px 10px #ffffff
- border-radius: 12-20px
- colors: monochromatic, low contrast
- WARNING: poor accessibility, use sparingly
