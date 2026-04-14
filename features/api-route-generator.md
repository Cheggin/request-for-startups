# api-route-generator

**Status:** 🟢 Complete
**Agent:** backend
**Category:** coding
**Created:** 2026-04-13

## Description

Generate Next.js API routes from the product spec. Each route includes input validation, error handling, and auth checks (when the spec requires authentication). Every route gets a corresponding test file. Routes are documented with JSDoc for developer clarity and potential API docs generation.

## Checklist

- [ ] API route parser — extract endpoint definitions from product spec (path, method, input, output)
- [ ] Route file generation — create app/api/[route]/route.ts files following Next.js App Router conventions
- [ ] Input validation — validate request body/params using Zod schemas derived from spec
- [ ] Error handling — consistent error response format with status codes and messages
- [ ] Auth checks — verify session/token when spec marks route as authenticated
- [ ] Response typing — TypeScript return types matching spec output schemas
- [ ] JSDoc generation — document each route with description, params, return type, error cases
- [ ] Test file generation — create corresponding test file for each route
- [ ] Test coverage — tests for happy path, validation errors, auth failures, edge cases
- [ ] Rate limiting setup — apply rate limits to routes that need protection
- [ ] CORS configuration — set appropriate headers for API routes
- [ ] Route grouping — organize routes by resource (users, posts, etc.) in directory structure
- [ ] OpenAPI spec output — generate openapi.json from route definitions (optional)

## Notes

- Some routes may be thin wrappers around Convex functions — that's fine, the route still handles HTTP concerns
- Zod schemas should be shared between route validation and frontend form validation
- Error format: { error: string, code: string, details?: object } — consistent across all routes
- Auth pattern depends on the stack — could be NextAuth, Clerk, or custom JWT
- Tests use the Next.js test helpers for route handlers
- JSDoc is not optional — every route must be documented for the coding agent to understand it later
