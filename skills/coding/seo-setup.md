# seo-setup

**Status:** 🔴 Not started
**Agent:** website-dev
**Category:** coding
**Created:** 2026-04-13

## Description

Automated SEO setup generated from the product spec. Produces sitemap.xml, robots.txt, meta tags (title, description, Open Graph), structured data (JSON-LD), and canonical URLs. Regenerated whenever content changes. Lighthouse SEO score is tracked and reported.

## Checklist

- [ ] Generate sitemap.xml from all public routes
- [ ] Generate robots.txt with sensible defaults
- [ ] Meta tags (title, description) set per page from product spec
- [ ] Open Graph tags (og:title, og:description, og:image) for social sharing
- [ ] Twitter Card meta tags
- [ ] JSON-LD structured data for Organization, Product, and FAQ schemas
- [ ] Canonical URLs on every page to prevent duplicate content
- [ ] Sitemap and robots.txt regenerated on content/route changes
- [ ] Lighthouse SEO audit integrated into CI — score tracked per build
- [ ] SEO score reported in investor updates when it changes
- [ ] No broken links or missing alt text flagged by audit

## Notes

- SEO defaults are scaffolded by the website-template feature — this feature fills in real values from the product spec
- Structured data schemas should match the startup's actual product category
- Lighthouse CI can run in GitHub Actions and fail the build if SEO score drops below threshold
