#!/usr/bin/env bash
# generate-agents-md.sh — Reads agent-categories.yml + skills/ to produce AGENTS.md for Codex
# Usage: bash scripts/generate-agents-md.sh > AGENTS.md

set -eo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CATEGORIES_FILE="$REPO_ROOT/.harness/agent-categories.yml"
SKILLS_DIR="$REPO_ROOT/skills"

if [ ! -f "$CATEGORIES_FILE" ]; then
  echo "Error: $CATEGORIES_FILE not found" >&2
  exit 1
fi

# ─── Header ────────────────────────────────────────────────────────────────

cat <<'HEADER'
# Startup Harness — Multi-Agent Development Platform

This project uses a fleet of specialized agents orchestrated via Claude Code and Codex.
Each agent has a defined role, skill set, and ground truth rules. Work is coordinated
through tmux grids, GitHub Issues, and loop-based automation.

## Build & Test

```bash
# Install runtime deps (ajv, ajv-formats, better-sqlite3)
npm install

# Run the hook test suite
npm run test:hooks

# Link the omc binary onto PATH
npm link
```

> [!IMPORTANT]
> Never commit directly to main. All work goes through feature branches + PRs.
> Every PR gets Cubic auto-review — no merge until clean.

## Architecture

```
.harness/                 # Harness configuration
  agents/*.json           # Per-agent scope config (writable/readonly/blocked)
  agent-categories.yml    # Category -> skills mapping
  loops.yml               # Loop automation registry
  stacks.yml              # Tech stack definitions
  secrets.env             # Service credentials (gitignored)
skills/                   # Skill definitions (SKILL.md per skill, 121 total)
agents/                   # Agent prompts (*.md per agent, 32 total)
hooks/                    # Plugin-shipped hooks (node .mjs/.cjs)
dist/                     # Vendored OMC compiled runtime
bridge/                   # Bundled daemons (cli.cjs, mcp-server.cjs, team-bridge.cjs)
chains/skill-chains.json  # Deterministic flow enforcement
scripts/                  # Automation scripts
```

HEADER

# ─── Agent Roles ───────────────────────────────────────────────────────────

echo "## Agent Roles"
echo ""

# Parse categories from YAML (portable awk-based parsing)
current_category=""
in_agents=0
in_ground_truth=0
in_skill_categories=0

while IFS= read -r line; do
  # Skip comments and empty lines
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// /}" ]] && continue

  # Top-level category (no leading whitespace, ends with colon)
  if [[ "$line" =~ ^([a-z_]+):$ ]] && [[ ! "$line" =~ ^shared_skills ]]; then
    current_category="${BASH_REMATCH[1]}"
    in_agents=0
    in_ground_truth=0
    in_skill_categories=0
    cap_name="$(echo "$current_category" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')"
    echo "### $cap_name"
    echo ""
    continue
  fi

  # Description
  if [[ "$line" =~ ^[[:space:]]+description:[[:space:]]*(.+) ]] && [ -n "$current_category" ]; then
    echo "${BASH_REMATCH[1]}"
    echo ""
    continue
  fi

  # Agents list
  if [[ "$line" =~ ^[[:space:]]+agents: ]]; then
    in_agents=1
    in_ground_truth=0
    in_skill_categories=0
    echo "**Agents:**"
    continue
  fi

  # Skill categories list
  if [[ "$line" =~ ^[[:space:]]+skill_categories: ]]; then
    in_agents=0
    in_ground_truth=0
    in_skill_categories=1
    echo ""
    echo "**Skill categories:**"
    continue
  fi

  # Ground truth list
  if [[ "$line" =~ ^[[:space:]]+ground_truth: ]]; then
    in_agents=0
    in_ground_truth=1
    in_skill_categories=0
    echo ""
    echo "**Ground truth rules:**"
    continue
  fi

  # Required MCP / hooks (reset list state)
  if [[ "$line" =~ ^[[:space:]]+required_mcp: ]] || [[ "$line" =~ ^[[:space:]]+required_hooks: ]]; then
    in_agents=0
    in_ground_truth=0
    in_skill_categories=0
    continue
  fi

  # List items
  if [[ "$line" =~ ^[[:space:]]+-[[:space:]]*(.+) ]]; then
    item="${BASH_REMATCH[1]}"
    # Strip trailing comments
    item="${item%%#*}"
    item="$(echo "$item" | sed 's/[[:space:]]*$//')"
    if [ $in_agents -eq 1 ]; then
      echo "- \`$item\`"
    elif [ $in_ground_truth -eq 1 ]; then
      echo "- $item"
    elif [ $in_skill_categories -eq 1 ]; then
      echo "- \`$item\`"
    fi
    continue
  fi
done < "$CATEGORIES_FILE"

echo ""

# ─── Shared Skills ─────────────────────────────────────────────────────────

echo "## Shared Skills (loaded for all agents)"
echo ""
grep -A 20 '^shared_skills:' "$CATEGORIES_FILE" | grep '^ *- ' | sed 's/^ *- /- `/' | sed 's/$/.`/' | sed 's/\.`$/`/'
echo ""

# ─── Available Skills ──────────────────────────────────────────────────────

echo "## Available Skills"
echo ""
echo "| Skill | Path |"
echo "|-------|------|"

if [ -d "$SKILLS_DIR" ]; then
  for skill_dir in "$SKILLS_DIR"/*/; do
    skill_name="$(basename "$skill_dir")"
    skill_file="$skill_dir/SKILL.md"
    if [ -f "$skill_file" ]; then
      echo "| \`$skill_name\` | \`skills/$skill_name/SKILL.md\` |"
    fi
  done
fi

echo ""

# ─── Key Conventions ───────────────────────────────────────────────────────

cat <<'CONVENTIONS'
## Key Conventions

> [!IMPORTANT]
> Agents MUST invoke skills via their slash command (e.g., `/startup-harness:startup-init`).
> Never interpret a skill name as a description of what to build.

- **TDD**: Write tests first, implement second, never simultaneously
- **Vitest** for unit tests, **Playwright** for e2e
- **Feature branches + PRs** — never commit to main
- **GitHub Issues** track every task — move cards on Project board
- **Context resets** use GitHub Issues as handoff state
- **GateGuard**: must Read before Edit on any file
- Coding agents cannot modify harness configs, linter configs, CI configs, or tsconfig
- Content agents cannot modify code files
- Commander cannot write or edit code directly
- Researcher produces research briefs consumed by other agents

## Environment Variables

Service credentials are stored in `.harness/secrets.env`. Required services:
- `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` — Analytics
- `CONVEX_URL` / `NEXT_PUBLIC_CONVEX_URL` — Backend
- `VERCEL_TOKEN` — Deployment
- `STRIPE_SECRET_KEY` — Payments
- `SENTRY_DSN` — Error tracking
- `BROWSER_USE_API_KEY` — Browser automation
- `FAL_KEY` — AI image generation
- `RESEND_API_KEY` — Email
CONVENTIONS
