# Plan: Programmatic SEO conversion pages

## Architecture

- **Server component** `app/convert/[slug]/page.tsx` — handles `generateMetadata`, `generateStaticParams`, renders static SEO content
- **Client component** `components/converter/route-converter.tsx` — wraps existing converter hook with pre-set source/target format
- **Data file** `lib/conversion-data.ts` — unique data per route (size change, use cases, browser support)
- **Layout** `app/convert/layout.tsx` — shared wrapper for convert pages

## Routes

| Slug | Source | Target |
|------|--------|--------|
| png-to-jpg | png | jpg |
| png-to-webp | png | webp |
| jpg-to-png | jpg | png |
| jpg-to-webp | jpg | webp |
| webp-to-png | webp | png |
| webp-to-jpg | webp | jpg |

## Files to create

1. `lib/conversion-data.ts` — route data with `getConversionData(slug)` and `getAllSlugs()`
2. `app/convert/layout.tsx` — minimal shared layout
3. `app/convert/[slug]/page.tsx` — server component: metadata + SEO content + client converter
4. `components/converter/route-converter.tsx` — client component reusing useImageConverter with pre-set format

## Key decisions

- `dynamicParams = false` — only our 6 routes, 404 for anything else
- Page is a server component so generateMetadata works natively
- Client converter component accepts `defaultFormat` prop to pre-select target format
- Related conversions rendered as internal links for SEO juice
- No AI slop words. Sentence case headings.
