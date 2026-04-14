---
title: "AI Design Anti-Patterns: Common Bad Patterns in Vibe-Coded UIs"
source: Design analysis article (2026)
type: article
ingested: 2026-04-14
confidence: 1.0
---

# AI Design Anti-Patterns

## Color: Homogenous Goo
AI models generate colors mushed together — cyan icon in sky blue box in blue card with minty blue border. Everything same hue, no contrast.
**Fix**: 70/20/10 rule. 70% neutral, 20% complementary, 10% accent that pops. No borders needed if background colors separate elements naturally. See: Cursor website (dark gray + lighter gray + orange accent).

## Simple Icons in Rounded Squares
Font awesome icon or emoji in a small colored box. Box background in similar hue. Bad because: communicates no information, shows lack of care, doesn't distinguish your site.
**Fix**: Drop the icon completely in many cases. Icons are for action-driven components (buttons), not informational UI. Training data over-indexes on website templates which lack polish.

## Overuse of Emojis
AI loves emojis as visual assets. Almost always bad.
**Fix**: Just don't. Use icons with NO rounded square box. Use Lucide or similar icon library. Generate stylistic custom icons with AI if needed.

## Typography: Excessive Serif Font
Instrument Serif became trendy, then overused. Claude particularly loves serif hero sections — Claude's perception of "elegant." Goes stale once overused.
**Fix**: Avoid serif unless you specifically know what you're doing. Other AI models don't overindex on serif as much — likely Anthropic training data/reward model specific.

## Glassmorphism Everywhere
Semi-transparent frosted glass/noise texture. Becoming the NEW purple gradient. Paired with gradient background + 1px light border = obvious AI. Kills readability. Apple took multiple betas to make liquid glass readable.
**Fix**: Glassmorphism is not bad in general, but overuse makes it go out of fashion fast. Do not default to it.

## Green Left Border (Vibe Coding Signal)
Shows up when both border-left and border-radius are applied. Viral signal of vibe coding.
**Fix**: Remove the border entirely.

## Gradients and Shadows: Out of Place
Linear gradients highlighting words and buttons everywhere. Shadow backdrops behind buttons making things muddy. Linear gradients are abused so much they don't make sense anymore.
**Fix**: Simple accent color as button background. No special border or shadow. White buttons on Cursor website = simple yet effective.

## Visual Hierarchy: Excessive Nested Layers
Cards within cards. Unnecessary containers. AI can't do visual hierarchy well — doesn't understand glanceability (within a split second, user knows where to look).
**Fix**: Remove extra containers. Tone down secondary text to make it visually "quieter." Clear hierarchy = glanceable.

## Animations: Unnecessary or Broken
AI creates animations excessively. Hover animations in multiple directions (card moves up, image grows bigger — feels random). Appear animations that are slow and distracting. Gets buggy when scrolling.
**Fix**: Animations should serve a purpose. Don't add animation just because you can. If animation doesn't communicate state change or guide attention, remove it.

## Summary Anti-Pattern Themes
1. Unnecessary details — can add ≠ should add
2. No balance — font too big/small, spacing off, colors not harmonious
3. Flashy over tasteful — glassmorphism, gradients, animations everywhere
4. Training data artifacts — templates lack polish, models reproduce template patterns
5. No design intention — generated for free = abundance of noise

## Key Principle
"Clear messages beat noise. Intention beats carelessness."
