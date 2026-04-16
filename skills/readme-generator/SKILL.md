---
name: readme-generator
description: Auto-generate a README.md with product overview, tech stack, setup instructions, and architecture. Use when the user needs a README for their startup repository, wants to document the project for new developers, or needs to keep the README in sync with the actual project state.
user-invocable: true
group: comms
prerequisites: []
next: [documentation-generator, contributing-guide]
workflows: [full-startup]
---

# README Generator

Auto-generate a README.md that stays in sync with the project state. Includes what the product does, the tech stack, how to set up the dev environment, an architecture overview, and how to contribute.

## Workflow

### 1. Extract Product Description

Read the product spec to write a plain-language description of what the product does and who it is for. Keep it to two or three sentences.

### 2. List Tech Stack

Read project configuration files (`package.json`, `stacks.yml`, etc.) to list the tech stack and major dependencies with version numbers and links:

```markdown
## Tech Stack

- [Next.js 15](https://nextjs.org) - React framework
- [Convex](https://convex.dev) - Backend and database
- [Tailwind CSS 4](https://tailwindcss.com) - Styling
- [Clerk](https://clerk.com) - Authentication
```

### 3. Generate Getting Started

Derive step-by-step local dev setup instructions from the actual project setup process:

```markdown
## Getting Started

1. Clone the repository: `git clone <url>`
2. Install dependencies: `pnpm install`
3. Copy environment variables: `cp .env.example .env.local`
4. Start the dev server: `pnpm dev`
```

### 4. Architecture Overview

Describe the high-level system design: how the frontend, backend, database, and external services connect. Include a project structure section explaining key directories and their purpose.

### 5. Contributing Section

Summarize how agents and humans contribute. Link to CONTRIBUTING.md if it exists.

### 6. Add Badges and Links

Generate badges for build status, deploy status, and test coverage. Link to the documentation site if the documentation-generator skill is active.

### 7. Validate and Maintain

Check the README against the actual project state to ensure no stale references (removed scripts, outdated versions, renamed directories). Configure regeneration so the README updates when features are added or the stack changes.

## Anti-Patterns

- README with only a project title and no description or setup instructions
- Tech stack section listing "React" without specifying the framework version or related tools
- Setup instructions that reference a script that no longer exists in the repo
- Architecture section that doesn't match the actual project structure
