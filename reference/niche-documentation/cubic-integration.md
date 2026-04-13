# Cubic Integration Reference

**Source:** https://docs.cubic.dev

## Claude Code Plugin Install

```bash
npx @cubic-plugin/cubic-plugin install --to claude
```

Or via marketplace:
```bash
/plugin marketplace add mrge-io/cubic-claude-plugin
/plugin install cubic@cubic
```

## MCP Server

| Component | Details |
|-----------|---------|
| Transport | HTTP (Streamable) |
| Endpoint | `https://www.cubic.dev/api/mcp` |
| Auth | Bearer token (`cbk_` prefix) |
| Env var | `CUBIC_API_KEY` |

Manual setup:
```bash
claude mcp add --transport http cubic https://www.cubic.dev/api/mcp \
  --header "Authorization: Bearer cbk_your_api_key_here"
```

## MCP Tools

### PR Review
- **`get_pr_issues`** — Retrieves open review comments for PRs, organized by file with severity and confidence. Params: `repo`, `pullNumber`, `owner` (optional).

### Wiki
- **`list_wikis`** — Discover repos with wikis
- **`list_wiki_pages`** — List available doc pages
- **`get_wiki_page`** — Fetch full page content

### Codebase Scans
- **`list_scans`** — Survey scan summaries with pagination
- **`get_scan`** — Filter issues by category, severity, triage status, or file path
- **`get_issue`** — Full issue details including code context

### Review Learnings
- **`list_learnings`** — Team-specific code review patterns
- **`get_learning`** — Detailed feedback context for specific patterns

## Claude Code Skills

| Skill | Function |
|-------|----------|
| `/cubic-comments [pr]` | Display review feedback on PRs (auto-detects branch) |
| `/cubic-run-review [flags]` | Local AI code review on uncommitted changes |
| `/cubic-wiki [page]` | Access AI-generated codebase docs |
| `/cubic-scan [id]` | Retrieve security scan results |
| `/cubic-learnings [id]` | Review team-specific patterns |

## CLI

```bash
curl -fsSL https://cubic.dev/install | bash
```

## Key Insight: No Webhooks

Cubic does NOT have webhook/push notifications. Integration is poll-based via MCP tools. The harness should call `get_pr_issues` after each PR/commit to check for review findings, not wait for a push.
