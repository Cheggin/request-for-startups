---
name: documentation-generator
description: Auto-generate user-facing documentation including API reference, user guides, and changelog. Use when the user needs a documentation site, wants API docs generated from code comments and type definitions, needs user guides derived from a product spec, or wants a changelog generated from git history.
user-invocable: true
group: comms
prerequisites: []
next: [readme-generator]
workflows: [full-startup]
---

# Documentation Generator

Auto-generate user-facing documentation for the product: API reference from code, user guides from the product spec, and a changelog from git history. Documentation is published as part of the website or as a separate docs site and rebuilds on every deploy.

## Workflow

### 1. Scaffold Documentation Site

Set up the docs infrastructure:
- Create the `/docs` route or separate subdomain
- Build navigation with sidebar and breadcrumbs across all sections
- Add search functionality across all documentation pages

### 2. Generate API Reference

Parse code comments, JSDoc annotations, and TypeScript type definitions to produce API reference pages. Each endpoint or function page should include:
- Description and purpose
- Request parameters with types and constraints
- Response schema with examples
- Runnable code examples (curl, SDK snippets)

If the product has a public API, generate an OpenAPI/Swagger spec.

### 3. Generate User Guides

Read the product spec to identify major features and generate a user guide for each:
- Written in plain language for end users (not developer jargon)
- Step-by-step instructions with screenshots where applicable
- Common troubleshooting tips per feature

### 4. Generate Changelog

Parse git history using conventional commit format to produce a grouped changelog:

```markdown
## v1.2.0 (2025-01-15)

### Features
- Add dark mode support (#123)

### Fixes
- Fix login redirect on mobile (#124)

### Breaking Changes
- Remove deprecated /v1/users endpoint (#125)
```

### 5. Cross-Link and Publish

- Link documentation from README, landing page, and in-app help
- Add versioning support for API breaking changes
- Configure docs to rebuild on every deploy to prevent stale content

## Anti-Patterns

- API reference that lists endpoint names without request/response schemas or examples
- User guide written in developer jargon instead of plain language for end users
- Changelog that is a flat list of commit messages with no grouping or formatting
- Documentation that is manually maintained and goes stale after deployment
