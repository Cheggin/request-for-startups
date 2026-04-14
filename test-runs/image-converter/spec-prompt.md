# Spec Generation Prompt

Generate a product spec for this startup:

**Idea:** A simple online image converter that lets users convert between PNG, JPG, WebP, and SVG formats. Drag and drop, instant conversion, no signup required. Free for single files, paid for batch.

**Type:** B2C consumer web app
**Stack:** Next.js 15 + Turbopack, Tailwind CSS v4, Convex (database), Vercel (deploy)
**Timeline:** Weekend build

## Requirements

### Pages
1. Home page — hero section, drag-and-drop converter, format selector
2. Pricing page — free tier vs paid tier comparison
3. About page — simple about/contact

### Features (P0 — must have)
- Drag and drop file upload (single file)
- Format selection (PNG, JPG, WebP, SVG)
- Client-side image conversion (no server upload for free tier)
- Download converted file
- Responsive design (mobile + desktop)

### Features (P1 — important)
- Batch file upload (paid feature)
- Conversion history (stored in Convex)
- Quality/size slider for JPG/WebP
- Before/after preview

### Features (P2 — nice to have)
- Stripe checkout for paid tier
- Image resize options
- Dark mode

### Data Models (Convex)
- conversions: { id, originalFormat, targetFormat, fileSize, createdAt }
- (No user model needed — no auth for MVP)

### API Routes
- None needed for MVP — all conversion happens client-side using Canvas API / sharp

### Acceptance Criteria
- User can drag an image onto the page and it converts
- Conversion completes in under 3 seconds for files under 5MB
- Converted file downloads automatically
- Works on Chrome, Firefox, Safari
- Mobile responsive
- Lighthouse performance score > 90
