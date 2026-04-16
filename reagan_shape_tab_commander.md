# Tab-Commander Landing Page — Design Brief

## 1. Feature Summary
A single-page landing site for Tab-Commander, a tmux-based agent orchestration Chrome extension that lets developers spawn, monitor, and manage multiple AI agents in a visual 2x4 grid. The page sells the tool to developers already using Claude Code who are drowning in terminal tabs. One hero image, one install command, done.

## 2. Primary User Action
Click "Add to Chrome" — links to Chrome Web Store (mocked link for now).

## 3. Design Direction

**Aesthetic: "Classical Command"** — The hero image sets the tone: grand, serene, almost mythological. Tall cypress pillars framing a vast sky. This maps directly to the product metaphor — you're standing in a command garden, each pillar is an agent working under your direction. The page should feel like that image: **spacious, elevated, unhurried confidence.**

- **Not** a typical developer tool page (dark bg, terminal screenshots, neon accents)
- **Not** a SaaS marketing page (gradient blobs, floating cards, testimonial carousels)
- **Instead**: A single-scroll editorial page. The image dominates. Typography is large, confident, sparse. Warm light palette pulled from the image itself (sky blues, stone warm grays, garden greens as accents). Feels like opening a beautifully typeset book about something powerful.

**Typography**: A serif or semi-serif display font for headings (e.g., Instrument Serif, Playfair Display, or Fraunces) paired with a clean geometric sans for body (e.g., Geist, DM Sans, or Satoshi). No Inter. The serif anchors the classical tone; the sans keeps it technical.

**Color palette** (derived from hero image):
- Background: `#F5F2ED` (warm parchment)
- Text primary: `#1A1A1A` (near-black)
- Text secondary: `#6B6459` (warm stone)
- Accent: `#3A6B8C` (sky blue from image)
- Accent secondary: `#4A7C59` (garden green from image)
- Code/mono background: `#EDE9E3` (slightly darker parchment)

## 4. Layout Strategy

**Single scroll, 5 sections, generous vertical rhythm:**

1. **Hero** — Full-width. The pixel art image bleeds edge-to-edge (or with slim margins). Overlaid or below: the headline, one-line description, and the `npm install` command in a copyable code block. No navigation bar — the page is short enough to not need one.

2. **The Problem** — 2-3 sentences max. "You're running 6 agents. You can't see any of them." Short, punchy, relatable pain. Left-aligned text block with ample whitespace.

3. **The Grid** — Visual feature showcase. Either a stylized illustration or a clean screenshot/mockup of the 2x4 tmux grid. Show what it looks like to have 8 agents running simultaneously. This is the "aha" moment. Centered, with feature callouts as small labels around it (not a feature card grid).

4. **Features** — 4 features max, presented as a simple vertical list with icons or small illustrations. Not cards. Think: icon + bold title + one sentence. Features: Visual Agent Grid, Real-time Output, One-Command Dispatch, Session Persistence.

5. **Install** — Repeat the CTA. "Add to Chrome" button linking to Chrome Web Store (mocked). Maybe a one-liner below: "Works with Claude Code. That's it." Footer-minimal: just a GitHub link.

## 5. Key States

This is a static landing page — minimal states:
- **Default**: The full page as designed
- **Mobile**: Stack everything vertically. Hero image becomes contained (not bleeding). Code block stays full-width for easy copy.
- **Hover on CTA/code block**: Subtle shift — the copy button appears or highlights

## 6. Interaction Model

Minimal interaction by design:
- **Code block**: Click-to-copy with a brief "Copied!" confirmation
- **Scroll**: Smooth, natural. No scroll-jacking, no parallax, no reveal animations. Content is just there.
- **Links**: GitHub link in footer, nothing else external
- One exception: the hero image could have a very subtle, slow Ken Burns drift (2-3% zoom over 30s) to give it life without being distracting. Optional.

## 7. Content Requirements

### Copy needed:
- **Headline**: "Command your agents." (or similar — short, imperative, classical)
- **Subhead**: One sentence explaining what it is. "A tmux-based grid for orchestrating AI agents from your terminal."
- **Problem statement**: 2-3 sentences about the pain of managing multiple agent sessions
- **Feature titles + descriptions**: 4 items, one sentence each
- **CTA button**: "Add to Chrome" linking to mocked Chrome Web Store URL
- **Closing line**: Something confident and minimal. "Works with Claude Code. That's it."

### Dynamic content: None. Fully static.

## 8. Recommended References

For implementation with /impeccable:
- `spatial-design.md` — for the generous whitespace rhythm
- `typography.md` — for the serif/sans pairing execution
- `color-system.md` — for the warm palette implementation
- `interaction-design.md` — for the copy-to-clipboard pattern

## 9. Open Questions

- **Screenshot/mockup**: No actual screenshot of the tmux grid available — will create a stylized CSS illustration of the 2x4 grid.
- **GitHub URL**: Need the actual repo link for the footer. Using placeholder for now.

---

**Key constraint reminders**: Light mode only. No Inter. No dark mode toggle. Site at `packages/tab-commander-site/`.
