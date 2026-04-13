---
name: blog-scaffolder
description: Scaffold SEO-optimized blog posts derived from product specs and competitor research
category: content
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - WebSearch
---

## Purpose

Generate a complete blog post system for a startup website. Topics are derived from the product spec and competitor research. Each post is SEO-optimized with proper metadata, heading structure, and internal linking. The blog integrates into the existing site and supports ongoing content publishing.

## Steps

1. Read the product spec and competitor research to identify content gaps and target keywords.
2. Generate a list of blog topics targeting long-tail keywords relevant to the product category.
3. Scaffold the blog infrastructure (e.g., /blog route, MDX/markdown system with frontmatter support).
4. For each blog post, create a markdown file with:
   - Title optimized for the target keyword
   - Meta description under 160 characters
   - Proper heading hierarchy (H1 > H2 > H3)
   - Internal links to product pages and related posts
   - Open Graph metadata for social sharing
5. Create a blog index page with pagination and post previews.
6. Add the blog to the site navigation and link from the landing page.
7. Generate an RSS feed and include blog posts in sitemap.xml.
8. Validate all posts for readability, grammar, and factual accuracy.

## Examples

Good:
- "A blog post with a clear H1, descriptive meta, three H2 sections, and links to the product pricing page."
- "Blog index at /blog showing 10 posts per page with title, excerpt, date, and read-time estimate."
- "RSS feed at /blog/rss.xml containing all published posts with full content."

Bad:
- "A blog post with no meta description and all content under a single heading."
- "Blog posts with no internal links to the product or other posts."
- "Hard-coded blog post list with no pagination or dynamic generation."

## Checklist

- [ ] Blog section added to the website (e.g., /blog route)
- [ ] MDX or markdown-based blog post system with frontmatter
- [ ] Topic generation from product spec keywords and competitor gaps
- [ ] SEO optimization with target keyword, meta description, and heading structure
- [ ] Internal linking to product pages and other blog posts
- [ ] Blog post index page with pagination
- [ ] Blog linked from landing page navigation
- [ ] RSS feed generated for blog posts
- [ ] Blog posts included in sitemap.xml
- [ ] Open Graph images generated per post
- [ ] Content quality check for readability, grammar, and factual accuracy
