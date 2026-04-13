# database-schema-generator

**Status:** 🔴 Not started
**Agent:** backend
**Category:** coding
**Created:** 2026-04-13

## Description

Generate Convex schema from the product spec data models. Includes table definitions, indexes for common query patterns, validators for input data, query functions for reading data, and mutation functions for writing data. The generated schema is the source of truth for all backend data — no ad-hoc table creation allowed.

## Checklist

- [ ] Data model parser — extract entities, fields, types, and relationships from product spec
- [ ] Convex schema generation — create schema.ts with defineSchema and defineTable calls
- [ ] Field type mapping — map spec types to Convex types (v.string(), v.number(), v.boolean(), etc.)
- [ ] Relationship modeling — references between tables using v.id("tableName")
- [ ] Index generation — create indexes for fields used in queries (by_user, by_status, etc.)
- [ ] Validator generation — input validators for each mutation using v.object()
- [ ] Query function generation — read functions for each table (list, getById, getBy[field])
- [ ] Mutation function generation — write functions for each table (create, update, delete)
- [ ] Auth integration — queries/mutations check auth context when spec requires it
- [ ] Seed data generation — create sample data for development and testing
- [ ] Schema migration notes — document how to evolve schema without data loss
- [ ] Convex deploy validation — run `npx convex dev` to verify schema deploys cleanly
- [ ] Type export — export TypeScript types derived from schema for frontend use

## Notes

- Convex uses a document model, not relational — don't over-normalize
- Indexes are critical for performance — every query pattern needs a matching index
- Validators prevent bad data at the boundary — never trust client input
- Schema is generated once and then evolved — the generator should support incremental updates
- All generated functions go in convex/ directory following Convex conventions
- The schema must match the product spec data models exactly — drift causes bugs downstream
