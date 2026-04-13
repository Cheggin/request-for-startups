# Build Plan: Cubic Webhook Channel

## Components (in build order)

### 1. Convex Schema — webhook event queue
- Table: `cubicEvents` with fields: repo, pr number, file, severity, message, status (pending/processed), timestamp
- Query: `getUnprocessed` — returns pending events for a given repo
- Mutation: `addEvent` — called by Railway receiver
- Mutation: `markProcessed` — called by local MCP channel after Claude handles it

### 2. Railway Webhook Receiver
- Thin HTTP server (Bun)
- Receives GitHub webhook POST
- Verifies signature with webhook secret
- Filters for Cubic-authored comments
- Writes to Convex via HTTP API
- Deployed to user's Railway account

### 3. Local MCP Channel Server
- MCP channel server (Bun + @modelcontextprotocol/sdk)
- Polls Convex for unprocessed events (Convex subscriptions need client SDK; polling is simpler for MCP subprocess)
- Pushes events to Claude Code session via mcp.notification()
- Marks events as processed after delivery
- Registered in .mcp.json

## Directory structure
```
packages/
  cubic-channel/
    convex/
      schema.ts
      cubicEvents.ts
    receiver/
      index.ts          # Railway webhook receiver
    channel/
      index.ts          # Local MCP channel server
    package.json
```
