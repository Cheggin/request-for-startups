---
name: research
description: Query, store, and loop on persistent research knowledge. Check prior experiments before building.
user-invocable: true
---

# Research

Persistent research knowledge system. Query existing findings before building. Store new findings after completing work. Run research loops for deep investigation. Check the experiment ledger to avoid repeating failures.

## Operations

### 1. Query existing research

Before starting work in any category, query the research store for existing findings.

```
research_query({ query: "authentication best practices", category: "coding", tags: ["auth"] })
```

Returns matching wiki pages ranked by relevance with snippets. Use these findings to inform your approach.

### 2. Add new findings

After completing work or discovering something useful, store it as a research page.

```
research_add({
  category: "coding",
  title: "Convex Auth Pattern",
  content: "Convex uses server-side auth checks in mutations...",
  tags: ["convex", "auth", "pattern"],
  confidence: 0.8,
  source: "session"
})
```

Each page gets YAML frontmatter with title, category, tags, created/updated timestamps, confidence (0.0-1.0), and source (web/reference/experiment/session).

### 3. Run a research loop

For deep investigation on a specific topic: search the web, store findings, produce a brief.

```
research_loop({
  category: "growth",
  goal: "Increase landing page conversion rate"
})
```

Steps:
1. Read all prior research in the category
2. Read the experiment ledger for past results
3. Do web research (WebSearch) for best practices
4. Store each finding as a wiki page
5. Generate a research brief with ranked ideas
6. Brief format: { category, goal, prior_findings_summary, ideas: [{ title, source, evidence, confidence, estimated_impact }] }

### 4. Check if experiment was already tried

Before running any experiment or trying a new approach, check the ledger.

```
research_check_tried({ description: "increase learning rate to 0.04", category: "coding" })
```

Returns the matching ledger entry if found (with status: keep/discard/crash), or null if this is a new experiment. This prevents wasting time on approaches that already failed.

### 5. Log experiment result

After trying something, log the outcome to the experiment ledger.

```
research_log({
  category: "coding",
  experiment_description: "switch to GeLU activation",
  metric: "val_bpb",
  result: "1.005",
  status: "discard",
  confidence: 0.6
})
```

Status values: "keep" (metric improved), "discard" (no improvement), "crash" (failed to run).

### 6. List research pages

```
research_list({ category: "coding" })  # List pages in one category
research_list({})                       # List all pages across categories
```

### 7. Read a specific page

```
research_read({ category: "coding", slug: "typescript-best-practices" })
```

## Categories

Pages are organized by category: `coding`, `growth`, `design`, `operations`, `content`, `architecture`, `decision`, `pattern`.

## Storage

- Wiki pages: `.harness/research/{category}/{slug}.md` (markdown with YAML frontmatter)
- Experiment ledger: `.harness/research/ledger.tsv` (append-only TSV)
- Each page has: title, category, tags, created, updated, confidence (0.0-1.0), source

## When to use this skill

- **Before building**: Query for existing research on the topic
- **After building**: Store what you learned as a research page
- **Before experimenting**: Check if a similar experiment was already tried
- **After experimenting**: Log the result to the ledger
- **For deep investigation**: Run a research loop with web search

## Anti-Patterns

- Building without checking prior research first (may repeat solved problems)
- Not logging experiment results (knowledge is lost between sessions)
- Logging vague experiment descriptions (makes deduplication impossible)
- Setting all confidence to 1.0 (uncalibrated confidence is useless)
- Storing findings without source citations (unverifiable claims)

## Hard Constraints

- NO vector embeddings — search uses keyword + tag matching only
- Ledger is append-only — never edit or delete rows
- Every wiki page must have YAML frontmatter
- Every finding must cite its source
- Check wasAlreadyTried before proposing experiments
