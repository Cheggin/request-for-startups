# Plan: Research Agent + Persistent Knowledge System

## 1. packages/research-store/
- `src/wiki.ts` — Wiki-style knowledge base at .harness/research/
- `src/ledger.ts` — Experiment ledger (TSV, autoresearch pattern)
- `src/brief.ts` — Research brief generator (OMC si-researcher pattern)
- `src/index.ts` — Re-exports
- `tests/wiki.test.ts`, `tests/ledger.test.ts`, `tests/brief.test.ts`

## 2. agents/researcher.md
- OMC-format agent definition
- Opus model, level 3
- Karpathy principles, NEVER STOP in experiment mode
- Reads prior research, does web research, stores findings, produces briefs

## 3. skills/shared/research.md
- SKILL.md format shared skill
- Query store, add findings, run research loop, check ledger for duplicates

## Storage
- `.harness/research/{category}/{slug}.md` — wiki pages with YAML frontmatter
- `.harness/research/ledger.tsv` — experiment log
