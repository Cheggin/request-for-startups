---
name: documentation-generator
description: Auto-generate user-facing documentation including API reference, user guides, and changelog
category: content
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

## Purpose

Auto-generate user-facing documentation for the product. This includes API reference from code comments and type definitions, user guides from the product spec, and a changelog from git history. Documentation is published as part of the website or as a separate docs site and is rebuilt on every deploy.

## Steps

1. Scaffold the documentation site structure (e.g., /docs route or separate subdomain).
2. Parse code comments, JSDoc annotations, and TypeScript type definitions to generate API reference pages.
3. Read the product spec to identify major features and generate a user guide for each.
4. Parse git history using conventional commit format to generate a grouped changelog (features, fixes, breaking changes).
5. Build navigation with sidebar and breadcrumbs across all doc sections.
6. Add search functionality across all documentation pages.
7. Include runnable code examples in the API reference.
8. Generate OpenAPI/Swagger spec if the product has a public API.
9. Link documentation from README, landing page, and in-app help.
10. Configure docs to rebuild on every deploy to prevent stale content.

## Examples

Good:
- "API reference page for the /users endpoint showing request params, response schema, and a curl example."
- "User guide for the dashboard feature with screenshots, step-by-step instructions, and common troubleshooting tips."
- "Changelog grouped by version with sections for features, fixes, and breaking changes."

Bad:
- "API reference that lists endpoint names without request/response schemas or examples."
- "User guide written in developer jargon instead of plain language for end users."
- "Changelog that is a flat list of commit messages with no grouping or formatting."

## Checklist

- [ ] Docs site scaffolded with proper routing
- [ ] API reference auto-generated from code comments and type definitions
- [ ] User guides generated from product spec, one per major feature
- [ ] Changelog generated from git history with conventional commit parsing
- [ ] Search functionality across all documentation
- [ ] Navigation with sidebar and breadcrumbs
- [ ] Code examples included in API reference
- [ ] Docs rebuilt on every deploy with no stale content
- [ ] Versioning support for API breaking changes
- [ ] Docs linked from README, landing page, and in-app help
- [ ] OpenAPI/Swagger spec generated if product has a public API
