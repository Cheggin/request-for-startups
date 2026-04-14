

The spec has been written to `product-spec.md`. It covers:

- **3 routes** (`/`, `/about`, `/404`)
- **12 features** across P0/P1/P2 with testable acceptance criteria checkboxes
- **4 data models** (`SourceImage`, `ConvertedImage`, `ImageFormat`, `ConversionHistoryEntry`) — all ephemeral, no database
- **15 components/hooks** organized into layout, converter, feedback, and utility categories
- **Non-functional requirements** for performance, privacy, accessibility, browser support, bundle size, and SEO

Key design decisions in the spec:
- SVG output is disabled for raster sources (no raster-to-vector magic)
- Quality slider only appears for lossy formats (JPG/WebP)
- Batch conversion is a P2 upsell placeholder with no implementation
- Conversion history uses `sessionStorage` — no persistence across tabs
