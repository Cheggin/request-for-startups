---
name: programmatic-seo
description: Generate programmatic SEO pages at scale from structured data. Use when a SaaS has a natural "matrix" of variations (format conversions, city pages, tool comparisons). Creates unique, data-enriched pages that survive Google's "zero information gain" filter. Query SEO Chat API for validation.
---

# Programmatic SEO Page Generator

Generate hundreds of unique, high-quality landing pages from a data matrix. Each page targets a specific long-tail keyword while providing genuine value — not keyword-stuffed templates.

## When to Use

- Tool SaaS with format/conversion matrix (e.g., "PNG to JPG", "CSV to JSON")
- Location-based SaaS with city/region variants
- Comparison SaaS with product/feature matrices
- Any SaaS where user intent varies by a structured parameter

## Strategy (from SEO Chat research)

1. **Build a Format Matrix** — enumerate every Source × Target combination
2. **Enrich each page with unique data** the SaaS generates:
   - Conversion benchmarks (average file size reduction)
   - Quality comparisons (visual diff at different settings)
   - Use-case guidance (web vs print vs social media)
3. **Add use-case modifiers** — "Convert PNG to JPG for Web" vs "for Print"
4. **Include device context** — "Compress Images for iOS" vs "for Android"

## Steps

1. Read the product spec to identify the data matrix dimensions
2. Generate a route map: `/convert/{source}-to-{target}` for each combination
3. For each page:
   a. Create a unique title and meta description (not template-swapped)
   b. Include a functional converter widget (the page IS the tool)
   c. Add unique data: benchmarks, comparisons, recommendations
   d. Add structured data (JSON-LD) for rich snippets
   e. Internal link to related conversions
4. Generate a sitemap covering all programmatic pages
5. Query SEO Chat API to validate keyword targeting for top pages

## Anti-Patterns

- Template pages with only the keyword swapped — triggers "zero information gain" penalty
- Pages without the actual tool — users bounce, Google notices
- Thin pages with <300 words and no unique data
- Duplicate meta descriptions across pages

## Validation

- [ ] Each page has unique title, meta description, and H1
- [ ] Each page includes the functional tool (not just text)
- [ ] Each page has at least one unique data point (benchmark, comparison)
- [ ] Structured data (JSON-LD) present on every page
- [ ] Internal linking between related pages
- [ ] Sitemap includes all programmatic pages
