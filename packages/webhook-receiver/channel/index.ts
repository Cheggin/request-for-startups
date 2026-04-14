#!/usr/bin/env bun

/**
 * Universal Webhook MCP Channel Server
 *
 * Runs locally, spawned by Claude Code as a subprocess.
 * Polls Convex for unprocessed webhook events and pushes
 * them into the Claude Code session as <channel> events,
 * routing to the right agent based on agentTarget.
 *
 * Environment variables:
 *   CONVEX_URL     — Convex deployment URL
 *   AGENT_TARGET   — optional: only poll events for this agent (e.g. "ops", "backend")
 *   SOURCE_FILTER  — optional: only poll events from this source (e.g. "github", "sentry")
 *   POLL_INTERVAL  — polling interval in ms (default: 5000)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const CONVEX_URL = process.env.CONVEX_URL;
const AGENT_TARGET = process.env.AGENT_TARGET || undefined;
const SOURCE_FILTER = process.env.SOURCE_FILTER || undefined;
const _parsedInterval = parseInt(process.env.POLL_INTERVAL || "5000", 10);
const POLL_INTERVAL =
  Number.isFinite(_parsedInterval) && _parsedInterval > 0
    ? _parsedInterval
    : 5000;

if (!CONVEX_URL) throw new Error("CONVEX_URL is required");

const mcp = new Server(
  { name: "webhook-channel", version: "0.0.1" },
  {
    capabilities: {
      experimental: { "claude/channel": {} },
      tools: {},
    },
    instructions: [
      'Webhook events arrive as <channel source="webhook-channel" webhook_source="..." event_type="..." severity="...">.',
      "Each event is an incoming webhook from an external service (GitHub, Sentry, uptime monitor, etc.).",
      "Handle the event based on its source and event_type.",
      "Use the mark_processed tool after handling each event.",
      "Use the get_events_by_source tool to query events from a specific source.",
    ].join(" "),
  }
);

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "mark_processed",
      description: "Mark a webhook event as processed after handling it",
      inputSchema: {
        type: "object",
        properties: {
          eventId: {
            type: "string",
            description: "The Convex document ID of the event to mark",
          },
        },
        required: ["eventId"],
      },
    },
    {
      name: "get_events_by_source",
      description: "Get recent events from a specific webhook source",
      inputSchema: {
        type: "object",
        properties: {
          source: {
            type: "string",
            description:
              'The webhook source to query (e.g. "github", "sentry", "uptime", "custom")',
          },
          limit: {
            type: "number",
            description: "Maximum number of events to return (default: 20)",
          },
        },
        required: ["source"],
      },
    },
  ],
}));

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === "mark_processed") {
    const { eventId } = req.params.arguments as { eventId: string };
    await convexMutation("events:markProcessed", { eventId });
    return { content: [{ type: "text", text: "marked as processed" }] };
  }

  if (req.params.name === "get_events_by_source") {
    const { source, limit } = req.params.arguments as {
      source: string;
      limit?: number;
    };
    const events = await convexQuery("events:getBySource", {
      source,
      limit: limit || 20,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(events, null, 2) }],
    };
  }

  throw new Error(`unknown tool: ${req.params.name}`);
});

async function convexQuery(
  path: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });

  if (!response.ok) {
    throw new Error(`Convex query failed: ${response.status}`);
  }

  const data = await response.json();
  return data.value;
}

async function convexMutation(
  path: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });

  if (!response.ok) {
    throw new Error(`Convex mutation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.value;
}

interface WebhookEvent {
  _id: string;
  source: string;
  eventType: string;
  eventId: string;
  payload: string;
  metadata?: {
    repo?: string;
    severity?: string;
    url?: string;
    title?: string;
    author?: string;
    prNumber?: number;
    file?: string;
    line?: number;
    monitor?: string;
    environment?: string;
  };
  status: string;
  agentTarget?: string;
  timestamp: number;
}

const deliveredIds = new Set<string>();

async function pollAndDeliver(): Promise<void> {
  try {
    const queryArgs: Record<string, unknown> = {};
    if (AGENT_TARGET) queryArgs.agentTarget = AGENT_TARGET;
    else if (SOURCE_FILTER) queryArgs.source = SOURCE_FILTER;

    const events = (await convexQuery(
      "events:getUnprocessed",
      queryArgs
    )) as WebhookEvent[];

    for (const event of events) {
      if (deliveredIds.has(event._id)) continue;

      // Mark as processing so other channels don't pick it up
      await convexMutation("events:markProcessing", { eventId: event._id });

      const meta: Record<string, string> = {
        event_id: event._id,
        webhook_source: event.source,
        event_type: event.eventType,
        webhook_event_id: event.eventId,
        timestamp: String(event.timestamp),
      };

      if (event.agentTarget) meta.agent_target = event.agentTarget;
      if (event.metadata?.severity) meta.severity = event.metadata.severity;
      if (event.metadata?.repo) meta.repo = event.metadata.repo;
      if (event.metadata?.url) meta.url = event.metadata.url;
      if (event.metadata?.title) meta.title = event.metadata.title;
      if (event.metadata?.author) meta.author = event.metadata.author;
      if (event.metadata?.prNumber)
        meta.pr_number = String(event.metadata.prNumber);
      if (event.metadata?.file) meta.file = event.metadata.file;
      if (event.metadata?.line) meta.line = String(event.metadata.line);
      if (event.metadata?.monitor) meta.monitor = event.metadata.monitor;
      if (event.metadata?.environment)
        meta.environment = event.metadata.environment;

      // Build a human-readable summary for the channel content
      const parts = [`[${event.source}] ${event.eventType}`];
      if (event.metadata?.title) parts.push(event.metadata.title);
      if (event.metadata?.severity)
        parts.push(`(severity: ${event.metadata.severity})`);

      await mcp.notification({
        method: "notifications/claude/channel",
        params: {
          content: parts.join(" - "),
          meta,
        },
      });
      deliveredIds.add(event._id);
    }
  } catch {
    // Silently retry on next poll
  }
}

await mcp.connect(new StdioServerTransport());

setInterval(pollAndDeliver, POLL_INTERVAL);
pollAndDeliver();
