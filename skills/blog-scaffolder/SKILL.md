---
name: blog-scaffolder
description: Scaffold SEO-optimized blog post systems derived from product specs and competitor research. Use when the user needs a blog section for their startup website, wants to generate blog content from product specs, needs SEO-optimized posts with proper metadata and heading structure, or wants a complete blog infrastructure with RSS, sitemap, and pagination.
user-invocable: true
---

# Blog Scaffolder

Generate a complete blog post system for a startup website. Topics are derived from the product spec and competitor research. Each post is SEO-optimized with proper metadata, heading structure, and internal linking.

## Workflow

### 1. Research and Topic Generation

Read the product spec and competitor research to identify content gaps and target keywords. Generate a list of blog topics targeting long-tail keywords relevant to the product category.

When identifying topics, prioritize:
- Keywords competitors rank for but the product doesn't cover
- Questions potential users ask about the problem space
- Technical topics that demonstrate domain expertise

### 2. Scaffold Blog Infrastructure

Set up the blog system within the existing site:
- Create the `/blog` route with MDX or markdown support and frontmatter parsing
- Create a blog index page with pagination and post previews (title, excerpt, date, read-time estimate)
- Add the blog to site navigation and link from the landing page

### 3. Create Individual Posts

For each blog post, create a markdown file with:

```markdown
---
title: "Keyword-optimized title"
description: "Meta description under 160 characters"
user-invocable: true
date: "YYYY-MM-DD"
author: "Author Name"
tags: ["relevant", "keywords"]
image: "/blog/og/post-slug.png"
---

# H1 Title (matches frontmatter title)

## H2 Section (3-5 per post)

### H3 Subsection (as needed)
```

Each post must include:
- Title optimized for the target keyword
- Meta description under 160 characters
- Proper heading hierarchy (H1 > H2 > H3, no skipped levels)
- Internal links to product pages and related posts
- Open Graph metadata for social sharing

### 4. Feeds and Discovery

- Generate an RSS feed at `/blog/rss.xml` containing all published posts
- Include blog posts in `sitemap.xml`
- Add structured data (JSON-LD) for blog posts

### 5. Quality Validation

Validate all posts for:
- Heading hierarchy correctness (no skipped levels)
- Meta description length (under 160 characters)
- Internal link presence (at least one per post)
- Image alt text on all images
- Readability and factual accuracy

## Anti-Patterns

- Posts with no meta description or all content under a single heading
- Blog posts with no internal links to the product or other posts
- Hard-coded blog post list with no pagination or dynamic generation
- Identical Open Graph images across all posts
- Keyword stuffing instead of natural language
