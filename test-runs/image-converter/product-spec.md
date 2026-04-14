Done. `product-spec.md` has been written with the full image converter spec covering:

- **8 routes** — converter, history, pricing, auth, account, about, and legal pages
- **16 features** across P0/P1/P2 with testable acceptance criteria for each
- **4 Convex tables** — `users`, `conversions`, `sharedLinks` (P2), `apiKeys` (P2) with typed fields and indexes
- **Client-side types** — `SourceImage`, `ConvertedImage`, `ImageFormat` for in-browser state
- **28 components** organized by domain — layout, converter, history, auth, and shared UI
- **7 hooks/utilities** — conversion engine, drop zone, SVG tracer, dark mode, and helpers
- **Non-functional requirements** — performance, privacy, bundle size, browser support, a11y, SEO

- Conversion history uses `sessionStorage` — no persistence across tabs
