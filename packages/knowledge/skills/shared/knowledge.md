---
name: knowledge
description: Query, ingest, and maintain Karpathy-style LLM wiki knowledge bases
triggers: ["knowledge", "wiki query", "wiki ingest", "wiki lint", "knowledge base", "kb"]
---

# Knowledge Skill

Any agent can invoke this skill to interact with the wiki knowledge bases.

## Operations

### Query the wiki before building

Before starting work in a domain, query the relevant knowledge base for existing patterns, decisions, and context.

```
queryKnowledge(rootPath, "coding", "authentication patterns")
```

This returns structured context (index content + relevant pages) for the calling agent to synthesize. The agent does NOT need to call an LLM — it reads the returned pages directly.

### Ingest learnings after completing work

After completing significant work, capture learnings back into the wiki.

```
ingestSource(rootPath, "coding", {
  title: "OAuth2 Implementation Patterns",
  content: "...",
  type: "doc"
})
```

Then create or update wiki pages summarizing the learning:

```
createPage(rootPath, "coding", {
  title: "OAuth2 Best Practices",
  content: "...",
  tags: ["auth", "oauth2", "security"],
  linkedPages: ["authentication-patterns"]
})
```

### Run lint checks

Periodically verify wiki health:

```
lintWiki(rootPath, "coding")
```

Returns issues: orphaned pages, stale content, missing cross-references, index sync problems.

### Initialize a knowledge base

When entering a new category for the first time:

```
initKnowledgeBase(rootPath, "growth")
```

Creates the directory structure: raw/, wiki/, index.md, log.md.

## Categories

| Category | Domain |
|----------|--------|
| coding | Technical patterns, frameworks, architecture |
| growth | User acquisition, retention, metrics |
| design | UI/UX, design systems, accessibility |
| operations | Infrastructure, deployment, monitoring |
| content | Copywriting, documentation, SEO |
| general | Cross-cutting concerns, strategy |

## Storage Layout

```
.harness/knowledge/{category}/
  raw/          # Immutable source documents
  wiki/         # LLM-compiled markdown pages
  index.md      # Auto-maintained catalog
  log.md        # Append-only operation chronicle
```

## Principles (Karpathy Model)

1. **raw/ is immutable** — sources are never modified after ingestion
2. **wiki/ is LLM-owned** — the LLM compiles, synthesizes, and maintains all wiki pages
3. **Index-first navigation** — always read index.md before diving into pages
4. **Cross-reference everything** — use `[[slug]]` wiki-links between related pages
5. **Log all operations** — every ingest, query, lint, and update is recorded
6. **Lint regularly** — catch contradictions, stale content, and orphaned pages early
7. **Compound over time** — each session should leave the wiki better than it found it
