#!/usr/bin/env bun

/**
 * Cubic Local MCP Channel Server
 *
 * Runs locally, spawned by Claude Code as a subprocess.
 * Polls Convex for unprocessed Cubic review events and
 * pushes them into the Claude Code session as <channel> events.
 *
 * Environment variables:
 *   CONVEX_URL    — Convex deployment URL
 *   REPO          — GitHub repo (owner/name) to watch
 *   POLL_INTERVAL — Polling interval in ms (default: 5000)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const CONVEX_URL = process.env.CONVEX_URL;
const REPO = process.env.REPO;
const _parsedInterval = parseInt(process.env.POLL_INTERVAL || "5000", 10);
const POLL_INTERVAL = Number.isFinite(_parsedInterval) && _parsedInterval > 0 ? _parsedInterval : 5000;

if (!CONVEX_URL) throw new Error("CONVEX_URL is required");
if (!REPO) throw new Error("REPO is required (e.g. owner/repo)");

const mcp = new Server(
  { name: "cubic-channel", version: "0.0.1" },
  {
    capabilities: {
      experimental: { "claude/channel": {} },
      tools: {},
    },
    instructions: [
      'Code review events from Cubic arrive as <channel source="cubic-channel" pr="..." file="..." line="..." severity="...">.',
      "Each event is a code review finding from Cubic that needs to be fixed.",
      "Fix the issue in the referenced file/line, then push the fix.",
      "Cubic will re-review automatically; new findings will arrive as more channel events.",
      "Use the mark_processed tool after handling each event.",
      "Use the mark_all_processed tool to clear all pending events for the repo.",
    ].join(" "),
  }
);

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "mark_processed",
      description:
        "Mark a single Cubic review event as processed after handling it",
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
      name: "mark_all_processed",
      description:
        "Mark all pending Cubic review events as processed for this repo",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
  ],
}));

mcp.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name === "mark_processed") {
    const { eventId } = req.params.arguments as { eventId: string };
    await convexMutation("cubicEvents:markProcessed", { eventId });
    return { content: [{ type: "text", text: "marked as processed" }] };
  }

  if (req.params.name === "mark_all_processed") {
    const result = await convexMutation("cubicEvents:markAllProcessed", {
      repo: REPO,
    });
    return {
      content: [{ type: "text", text: `marked ${result} events as processed` }],
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

interface CubicEvent {
  _id: string;
  repo: string;
  prNumber: number;
  file?: string;
  line?: number;
  severity: string;
  message: string;
  author: string;
  commentId: number;
}

const deliveredIds = new Set<string>();

async function pollAndDeliver(): Promise<void> {
  try {
    const events = (await convexQuery("cubicEvents:getUnprocessed", {
      repo: REPO,
    })) as CubicEvent[];

    for (const event of events) {
      if (deliveredIds.has(event._id)) continue;

      const meta: Record<string, string> = {
        event_id: event._id,
        pr: String(event.prNumber),
        severity: event.severity,
        author: event.author,
        comment_id: String(event.commentId),
      };

      if (event.file) meta.file = event.file;
      if (event.line) meta.line = String(event.line);

      await mcp.notification({
        method: "notifications/claude/channel",
        params: {
          content: event.message,
          meta,
        },
      });
      deliveredIds.add(event._id);
    }
  } catch (err) {
    // Silently retry on next poll — don't crash the channel
  }
}

await mcp.connect(new StdioServerTransport());

setInterval(pollAndDeliver, POLL_INTERVAL);
pollAndDeliver();
