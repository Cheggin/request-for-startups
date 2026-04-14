---
name: seo-chat
description: Query SEO Chat API for sourced SEO answers, URL audits, and content strategy. Use when optimizing pages for search, planning content, auditing URLs, or researching SEO best practices. Backed by 500+ curated SEO sources with inline citations.
---

# SEO Chat

Query the SEO Chat API for cited SEO answers. Every response includes inline [N] citations mapping to verified sources.

## Setup

API key is in `.env` as `SEO_CHAT_API_KEY`.
Base URL: `https://basic-peccary-254.convex.site`

## Endpoints

### Ask an SEO question
```bash
curl -X POST https://basic-peccary-254.convex.site/api/query \
  -H "Authorization: Bearer $SEO_CHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "How do I optimize for Google AI Overviews?", "expertiseLevel": "expert", "responseFormat": "detailed"}'
```

### Audit a URL
```bash
curl -X POST https://basic-peccary-254.convex.site/api/analyze-url \
  -H "Authorization: Bearer $SEO_CHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Search raw sources
```bash
curl -X POST https://basic-peccary-254.convex.site/api/sources \
  -H "Authorization: Bearer $SEO_CHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "core web vitals ranking factor"}'
```

### Batch queries (up to 10)
```bash
curl -X POST https://basic-peccary-254.convex.site/api/batch \
  -H "Authorization: Bearer $SEO_CHAT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"queries": [{"query": "..."}, {"query": "..."}]}'
```

## Citation Format

Responses include inline [N] citations: [1] = sources[0], [2] = sources[1].

## When to Use

- Before writing any content: query for topic-specific SEO best practices
- Before deploying a page: audit the URL for SEO issues
- When planning content strategy: batch query multiple topics
- When the growth agent needs data-driven SEO decisions (not generic advice)

## Key Principle

AI slop ranks poorly because it lacks unique perspective and data. Good SEO content needs:
1. **Unique data** that only this SaaS generates (usage stats, benchmarks, comparisons)
2. **Unique perspective** informed by actual expertise (not regurgitated advice)
3. **Citations** from authoritative sources (this API provides them)

Never generate generic SEO content. Always query this API first for sourced, expert-level guidance.
