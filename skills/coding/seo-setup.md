---
name: seo-setup
description: Automated SEO setup from product spec including sitemap, meta tags, structured data, and Lighthouse auditing
category: coding
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# SEO Setup

## Purpose

Generate comprehensive SEO assets from the product spec: sitemap.xml, robots.txt, meta tags, Open Graph tags, structured data (JSON-LD), and canonical URLs. Regenerate assets whenever content or routes change. Track Lighthouse SEO score in CI and report regressions.

## Steps

1. Read the product spec to extract page titles, descriptions, and content metadata for each public route.
2. Generate sitemap.xml from all public routes with proper lastmod dates and change frequencies.
3. Generate robots.txt with sensible defaults (allow all public routes, disallow admin/API paths).
4. Set per-page meta tags (title, description) derived from the product spec.
5. Add Open Graph tags (og:title, og:description, og:image) on every public page for social sharing.
6. Add Twitter Card meta tags on every public page.
7. Generate JSON-LD structured data for Organization, Product, and FAQ schemas matching the startup's product category.
8. Add canonical URLs on every page to prevent duplicate content issues.
9. Configure automatic regeneration of sitemap.xml and robots.txt when routes or content change.
10. Integrate Lighthouse SEO audit into CI and track the score per build.
11. Flag broken links and missing alt text discovered during the audit.
12. Block the build if the Lighthouse SEO score drops below the configured threshold.

## Examples

Good:
- "Generate sitemap.xml and robots.txt from the public route list, set meta tags from the product spec, and add JSON-LD Organization schema."
- "Run Lighthouse SEO audit in CI and fail the build if the score drops below 90."

Bad:
- "Add SEO." (No specific assets, no source for content, no audit.)
- "Make the site rank well on Google." (Not actionable, no specific technical steps.)

## Checklist

- [ ] sitemap.xml generated from all public routes
- [ ] robots.txt generated with sensible defaults
- [ ] Per-page meta tags (title, description) set from product spec
- [ ] Open Graph tags (og:title, og:description, og:image) added for social sharing
- [ ] Twitter Card meta tags added
- [ ] JSON-LD structured data for Organization, Product, and FAQ schemas
- [ ] Canonical URLs set on every page
- [ ] Sitemap and robots.txt regenerated on content or route changes
- [ ] Lighthouse SEO audit integrated into CI with score tracked per build
- [ ] Broken links and missing alt text flagged by audit
- [ ] Build blocked if SEO score drops below threshold
