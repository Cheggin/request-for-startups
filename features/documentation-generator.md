# documentation-generator

**Status:** 🔴 Not started
**Agent:** coding
**Category:** coding
**Created:** 2026-04-13

## Description

Auto-generate user-facing documentation. API reference from code, user guides from the product spec, and a changelog from git history. Published as part of the website or as a separate docs site.

## Checklist

- [ ] Docs site scaffolded (e.g., /docs route or separate subdomain)
- [ ] API reference auto-generated from code comments and type definitions
- [ ] User guides generated from product spec — one guide per major feature
- [ ] Changelog generated from git history with conventional commit parsing
- [ ] Search functionality across all docs
- [ ] Docs navigation with sidebar and breadcrumbs
- [ ] Code examples included in API reference
- [ ] Docs rebuilt on every deploy — no stale documentation
- [ ] Versioning support if API has breaking changes
- [ ] Docs linked from README, landing page, and in-app help
- [ ] OpenAPI/Swagger spec generated if the product has a public API

## Notes

- Changelog should group changes by type (features, fixes, breaking changes)
- API reference generation can use TypeDoc, Swagger, or similar tooling
- User guides should be written for end users, not developers — plain language
