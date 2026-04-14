---
name: contributing-guide
description: Auto-generate a CONTRIBUTING.md covering dev setup, coding standards, and PR process. Use when the user needs a contributing guide for their repository, wants to document the development workflow for new contributors, or needs to keep contribution docs in sync with actual project configuration.
user-invocable: true
---

# Contributing Guide Generator

Auto-generate a CONTRIBUTING.md from project configuration so it stays in sync with the actual project state. Covers dev environment setup, coding standards, PR process, and agent interaction patterns.

## Workflow

### 1. Analyze Project Configuration

Read project configuration files to determine:
- **Tech stack**: `package.json`, `tsconfig.json`, `Cargo.toml`, `pyproject.toml`, etc.
- **Required tools**: Node.js version, package manager, CLI tools, environment variables
- **Coding standards**: Linter configs (`.eslintrc`, `biome.json`, `.prettierrc`), formatter settings
- **Test setup**: Test runner, coverage thresholds, test commands

### 2. Generate Prerequisites Section

List all required tools with version requirements and install commands:

```markdown
## Prerequisites

- Node.js >= 20 ([install](https://nodejs.org))
- pnpm 9.x (`npm install -g pnpm`)
- Convex CLI (`pnpm install -g convex`)
```

### 3. Generate Dev Setup Section

Derive step-by-step instructions from the actual project setup process:

```markdown
## Getting Started

1. Clone the repository
2. `pnpm install`
3. Copy `.env.example` to `.env.local` and fill in values
4. `pnpm dev`
```

Include expected output so contributors can verify success.

### 4. Document Coding Standards

Extract standards directly from linter and formatter configs:
- Code style rules (semicolons, quotes, indentation)
- Import ordering conventions
- Naming conventions derived from lint rules

### 5. Define PR Process

Document:
- Branch naming convention (e.g., `feat/short-description`, `fix/issue-number`)
- Commit message format (conventional commits or project-specific)
- Review expectations and required checks
- How to run tests and linting before submitting

### 6. Document Agent Workflow

Explain how automated agents interact with the codebase so human contributors understand:
- Which files agents may modify
- How agent-generated PRs are reviewed
- How to distinguish agent commits from human commits

### 7. Validate and Maintain

Verify the generated guide matches the current project state (no stale references to removed scripts or outdated versions). Set up regeneration so CONTRIBUTING.md updates when project config changes.

## Anti-Patterns

- Setup section that says "install dependencies" without specifying the package manager or command
- Manually written contributing guide already outdated compared to actual project config
- No mention of how agents interact with the codebase, confusing human contributors
- Referencing scripts or commands that no longer exist in the repo
