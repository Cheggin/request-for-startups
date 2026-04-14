# docs-agent

**Status:** 🔴 Not started
**Agent:** unassigned
**Category:** coding
**Created:** 2026-04-13

## Description

A specialized documentation agent for devtool startups. Distinct from the writing agent (marketing copy) — this agent writes for developers: API references, SDK guides, code examples, changelogs. Only activated when the product spec identifies the startup as a devtool/API/SDK/CLI.

## Checklist

- [ ] Agent definition at agents/docs.md (OMC format, Karpathy principles)
- [ ] Activation condition: product spec type === "devtool" | "api" | "sdk" | "cli"
- [ ] Skills: api-reference-generator, getting-started-guide, code-examples, changelog-generator, migration-guide
- [ ] Reads source code to generate accurate API docs (not hallucinated)
- [ ] Validates code examples actually compile and run
- [ ] Integrates with the website template (docs pages or separate docs site)
- [ ] Supports OpenAPI/Swagger spec generation for REST APIs
- [ ] Supports TypeDoc/JSDoc extraction for SDK/library docs

## Notes

- Different from writing agent: this agent reads code, writing agent reads brand guidelines
- Should be in coding category (reads/validates code) not content category
- Only spawned when product type warrants it — B2C products don't need API docs
