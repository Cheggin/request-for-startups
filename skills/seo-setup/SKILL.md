---
name: seo-setup
description: Generate comprehensive SEO assets from the product spec including sitemap.xml, robots.txt, meta tags, Open Graph tags, JSON-LD structured data, and canonical URLs. Use when setting up SEO for a new site, adding meta tags or structured data, generating sitemaps, integrating Lighthouse SEO audits into CI, or ensuring social sharing previews work correctly.
user-invocable: true
group: ship
prerequisites: [website-creation]
next: [seo-chat, programmatic-seo]
workflows: [full-startup, build-lander, seo-content-growth]
---

# SEO Setup

## Asset Generation

1. Read the product spec to extract page titles, descriptions, and content metadata for each public route.
2. Generate `sitemap.xml` from all public routes with lastmod dates and change frequencies.
3. Generate `robots.txt` with sensible defaults: allow public routes, disallow admin/API paths.
4. Set per-page meta tags (title, description) derived from the product spec.
5. Add Open Graph tags (og:title, og:description, og:image) on every public page.
6. Add Twitter Card meta tags on every public page.
7. Generate JSON-LD structured data for Organization, Product, and FAQ schemas.
8. Add canonical URLs on every page to prevent duplicate content issues.

## Maintenance

Configure automatic regeneration of `sitemap.xml` and `robots.txt` when routes or content change.

## CI Integration

1. Run Lighthouse SEO audit in CI; track score per build.
2. Flag broken links and missing alt text.
3. Block the build if Lighthouse SEO score drops below the configured threshold.
