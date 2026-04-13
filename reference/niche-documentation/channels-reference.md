# Channels Reference

**Source:** https://code.claude.com/docs/en/channels-reference

> Build an MCP server that pushes webhooks, alerts, and chat messages into a Claude Code session. Reference for the channel contract: capability declaration, notification events, reply tools, sender gating, and permission relay.

> **Note:** Channels are in research preview and require Claude Code v2.1.80 or later. They require claude.ai login. Console and API key authentication is not supported. Team and Enterprise organizations must explicitly enable them.

A channel is an MCP server that pushes events into a Claude Code session so Claude can react to things happening outside the terminal.

You can build a one-way or two-way channel. One-way channels forward alerts, webhooks, or monitoring events for Claude to act on. Two-way channels like chat bridges also expose a reply tool so Claude can send messages back. A channel with a trusted sender path can also opt in to relay permission prompts so you can approve or deny tool use remotely.

This page covers:

* Overview: how channels work
* What you need: requirements and general steps
* Example: build a webhook receiver: a minimal one-way walkthrough
* Server options: the constructor fields
* Notification format: the event payload
* Expose a reply tool: let Claude send messages back
* Gate inbound messages: sender checks to prevent prompt injection
* Relay permission prompts: forward tool approval prompts to remote channels

To use an existing channel instead of building one, see Channels. Telegram, Discord, iMessage, and fakechat are included in the research preview.

## Overview

A channel is an MCP server that runs on the same machine as Claude Code. Claude Code spawns it as a subprocess and communicates over stdio. Your channel server is the bridge between external systems and the Claude Code session:

* **Chat platforms** (Telegram, Discord): your plugin runs locally and polls the platform's API for new messages. When someone DMs your bot, the plugin receives the message and forwards it to Claude. No URL to expose.
* **Webhooks** (CI, monitoring): your server listens on a local HTTP port. External systems POST to that port, and your server pushes the payload to Claude.

## What you need

The only hard requirement is the `@modelcontextprotocol/sdk` package and a Node.js-compatible runtime. Bun, Node, and Deno all work. The pre-built plugins in the research preview use Bun, but your channel doesn't have to.

Your server needs to:

1. Declare the `claude/channel` capability so Claude Code registers a notification listener
2. Emit `notifications/claude/channel` events when something happens
3. Connect over stdio transport (Claude Code spawns your server as a subprocess)

During the research preview, custom channels aren't on the approved allowlist. Use `--dangerously-load-development-channels` to test locally.

## Example: build a webhook receiver

This walkthrough builds a single-file server that listens for HTTP requests and forwards them into your Claude Code session. By the end, anything that can send an HTTP POST, like a CI pipeline, a monitoring alert, or a `curl` command, can push events to Claude.

### Step 1: Create the project

Create a new directory and install the MCP SDK:

```bash
mkdir webhook-channel && cd webhook-channel
bun add @modelcontextprotocol/sdk
```

### Step 2: Write the channel server

Create a file called `webhook.ts`. This is your entire channel server: it connects to Claude Code over stdio, and it listens for HTTP POSTs on port 8788. When a request arrives, it pushes the body to Claude as a channel event.

```ts
#!/usr/bin/env bun
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

// Create the MCP server and declare it as a channel
const mcp = new Server(
  { name: 'webhook', version: '0.0.1' },
  {
    // this key is what makes it a channel — Claude Code registers a listener for it
    capabilities: { experimental: { 'claude/channel': {} } },
    // added to Claude's system prompt so it knows how to handle these events
    instructions: 'Events from the webhook channel arrive as <channel source="webhook" ...>. They are one-way: read them and act, no reply expected.',
  },
)

// Connect to Claude Code over stdio (Claude Code spawns this process)
await mcp.connect(new StdioServerTransport())

// Start an HTTP server that forwards every POST to Claude
Bun.serve({
  port: 8788,  // any open port works
  // localhost-only: nothing outside this machine can POST
  hostname: '127.0.0.1',
  async fetch(req) {
    const body = await req.text()
    await mcp.notification({
      method: 'notifications/claude/channel',
      params: {
        content: body,  // becomes the body of the <channel> tag
        // each key becomes a tag attribute, e.g. <channel path="/" method="POST">
        meta: { path: new URL(req.url).pathname, method: req.method },
      },
    })
    return new Response('ok')
  },
})
```

The file does three things in order:

* **Server configuration**: creates the MCP server with `claude/channel` in its capabilities, which is what tells Claude Code this is a channel. The `instructions` string goes into Claude's system prompt: tell Claude what events to expect, whether to reply, and how to route replies if it should.
* **Stdio connection**: connects to Claude Code over stdin/stdout. This is standard for any MCP server: Claude Code spawns it as a subprocess.
* **HTTP listener**: starts a local web server on port 8788. Every POST body gets forwarded to Claude as a channel event via `mcp.notification()`. The `content` becomes the event body, and each `meta` entry becomes an attribute on the `<channel>` tag. The listener needs access to the `mcp` instance, so it runs in the same process.

### Step 3: Register your server with Claude Code

Add the server to your MCP config so Claude Code knows how to start it:

```json
{
  "mcpServers": {
    "webhook": { "command": "bun", "args": ["./webhook.ts"] }
  }
}
```

### Step 4: Test it

During the research preview, custom channels aren't on the allowlist, so start Claude Code with the development flag:

```bash
claude --dangerously-load-development-channels server:webhook
```

In a separate terminal, simulate a webhook:

```bash
curl -X POST localhost:8788 -d "build failed on main: https://ci.example.com/run/1234"
```

The payload arrives in your Claude Code session as a `<channel>` tag:

```text
<channel source="webhook" path="/" method="POST">build failed on main: https://ci.example.com/run/1234</channel>
```

**Troubleshooting:**
* **`curl` succeeds but nothing reaches Claude**: run `/mcp` in your session to check the server's status. "Failed to connect" usually means a dependency or import error; check `~/.claude/debug/<session-id>.txt` for stderr trace.
* **`curl` fails with "connection refused"**: the port is not bound yet or a stale process is holding it. `lsof -i :<port>` shows what's listening.

## Test during the research preview

```bash
# Testing a plugin you're developing
claude --dangerously-load-development-channels plugin:yourplugin@yourmarketplace

# Testing a bare .mcp.json server (no plugin wrapper yet)
claude --dangerously-load-development-channels server:webhook
```

The bypass is per-entry. This flag skips the allowlist only. The `channelsEnabled` organization policy still applies.

## Server options

A channel sets these options in the `Server` constructor:

| Field | Type | Description |
|:------|:-----|:------------|
| `capabilities.experimental['claude/channel']` | `object` | Required. Always `{}`. Presence registers the notification listener. |
| `capabilities.experimental['claude/channel/permission']` | `object` | Optional. Always `{}`. Declares that this channel can receive permission relay requests. |
| `capabilities.tools` | `object` | Two-way only. Always `{}`. Standard MCP tool capability. |
| `instructions` | `string` | Recommended. Added to Claude's system prompt. Tell Claude what events to expect, whether to reply, and how. |

Example two-way setup:

```ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js'

const mcp = new Server(
  { name: 'your-channel', version: '0.0.1' },
  {
    capabilities: {
      experimental: { 'claude/channel': {} },  // registers the channel listener
      tools: {},  // omit for one-way channels
    },
    instructions: 'Messages arrive as <channel source="your-channel" ...>. Reply with the reply tool.',
  },
)
```

## Notification format

Your server emits `notifications/claude/channel` with two params:

| Field | Type | Description |
|:------|:-----|:------------|
| `content` | `string` | The event body. Delivered as the body of the `<channel>` tag. |
| `meta` | `Record<string, string>` | Optional. Each entry becomes an attribute on the `<channel>` tag. Keys must be identifiers: letters, digits, and underscores only. Keys with hyphens or other characters are silently dropped. |

Example:

```ts
await mcp.notification({
  method: 'notifications/claude/channel',
  params: {
    content: 'build failed on main: https://ci.example.com/run/1234',
    meta: { severity: 'high', run_id: '1234' },
  },
})
```

Arrives as:

```text
<channel source="your-channel" severity="high" run_id="1234">
build failed on main: https://ci.example.com/run/1234
</channel>
```

## Expose a reply tool

If your channel is two-way, expose a standard MCP tool that Claude can call to send messages back. A reply tool has three components:

1. A `tools: {}` entry in your `Server` constructor capabilities
2. Tool handlers that define the tool's schema and implement the send logic
3. An `instructions` string that tells Claude when and how to call the tool

### Step 1: Enable tool discovery

```ts
capabilities: {
  experimental: { 'claude/channel': {} },
  tools: {},  // enables tool discovery
},
```

### Step 2: Register the reply tool

```ts
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'reply',
    description: 'Send a message back over this channel',
    inputSchema: {
      type: 'object',
      properties: {
        chat_id: { type: 'string', description: 'The conversation to reply in' },
        text: { type: 'string', description: 'The message to send' },
      },
      required: ['chat_id', 'text'],
    },
  }],
}))

mcp.setRequestHandler(CallToolRequestSchema, async req => {
  if (req.params.name === 'reply') {
    const { chat_id, text } = req.params.arguments as { chat_id: string; text: string }
    send(`Reply to ${chat_id}: ${text}`)
    return { content: [{ type: 'text', text: 'sent' }] }
  }
  throw new Error(`unknown tool: ${req.params.name}`)
})
```

### Step 3: Update the instructions

```ts
instructions: 'Messages arrive as <channel source="webhook" chat_id="...">. Reply with the reply tool, passing the chat_id from the tag.'
```

### Full two-way webhook.ts

```ts
#!/usr/bin/env bun
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'

// --- Outbound: write to any curl -N listeners on /events --------------------
const listeners = new Set<(chunk: string) => void>()
function send(text: string) {
  const chunk = text.split('\n').map(l => `data: ${l}\n`).join('') + '\n'
  for (const emit of listeners) emit(chunk)
}

const mcp = new Server(
  { name: 'webhook', version: '0.0.1' },
  {
    capabilities: {
      experimental: { 'claude/channel': {} },
      tools: {},
    },
    instructions: 'Messages arrive as <channel source="webhook" chat_id="...">. Reply with the reply tool, passing the chat_id from the tag.',
  },
)

mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'reply',
    description: 'Send a message back over this channel',
    inputSchema: {
      type: 'object',
      properties: {
        chat_id: { type: 'string', description: 'The conversation to reply in' },
        text: { type: 'string', description: 'The message to send' },
      },
      required: ['chat_id', 'text'],
    },
  }],
}))

mcp.setRequestHandler(CallToolRequestSchema, async req => {
  if (req.params.name === 'reply') {
    const { chat_id, text } = req.params.arguments as { chat_id: string; text: string }
    send(`Reply to ${chat_id}: ${text}`)
    return { content: [{ type: 'text', text: 'sent' }] }
  }
  throw new Error(`unknown tool: ${req.params.name}`)
})

await mcp.connect(new StdioServerTransport())

let nextId = 1
Bun.serve({
  port: 8788,
  hostname: '127.0.0.1',
  idleTimeout: 0,
  async fetch(req) {
    const url = new URL(req.url)

    // GET /events: SSE stream so curl -N can watch Claude's replies live
    if (req.method === 'GET' && url.pathname === '/events') {
      const stream = new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(': connected\n\n')
          const emit = (chunk: string) => ctrl.enqueue(chunk)
          listeners.add(emit)
          req.signal.addEventListener('abort', () => listeners.delete(emit))
        },
      })
      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      })
    }

    // POST: forward to Claude as a channel event
    const body = await req.text()
    const chat_id = String(nextId++)
    await mcp.notification({
      method: 'notifications/claude/channel',
      params: {
        content: body,
        meta: { chat_id, path: url.pathname, method: req.method },
      },
    })
    return new Response('ok')
  },
})
```

## Gate inbound messages

An ungated channel is a prompt injection vector. Anyone who can reach your endpoint can put text in front of Claude. Check the sender against an allowlist before calling `mcp.notification()`:

```ts
const allowed = new Set(loadAllowlist())

if (!allowed.has(message.from.id)) {
  return  // drop silently
}
await mcp.notification({ ... })
```

Gate on the sender's identity, not the chat or room identity: `message.from.id`, not `message.chat.id`. In group chats, these differ, and gating on the room would let anyone in an allowlisted group inject messages.

The Telegram and Discord channels gate on a sender allowlist the same way. They bootstrap the list by pairing: the user DMs the bot, the bot replies with a pairing code, the user approves it in their Claude Code session, and their platform ID is added.

## Relay permission prompts

> **Note:** Permission relay requires Claude Code v2.1.81 or later.

When Claude calls a tool that needs approval, the local terminal dialog opens and the session waits. A two-way channel can opt in to receive the same prompt in parallel and relay it to you on another device. Both stay live: you can answer in the terminal or on your phone, and Claude Code applies whichever answer arrives first and closes the other.

Relay covers tool-use approvals like `Bash`, `Write`, and `Edit`. Project trust and MCP server consent dialogs don't relay.

### How relay works

1. Claude Code generates a short request ID and notifies your server
2. Your server forwards the prompt and ID to your chat app
3. The remote user replies with a yes or no and that ID
4. Your inbound handler parses the reply into a verdict, and Claude Code applies it only if the ID matches an open request

The local terminal dialog stays open through all of this.

### Permission request fields

The outbound notification from Claude Code is `notifications/claude/channel/permission_request`:

| Field | Description |
|:------|:------------|
| `request_id` | Five lowercase letters drawn from `a`-`z` without `l`. Include it in your outgoing prompt so it can be echoed in the reply. |
| `tool_name` | Name of the tool Claude wants to use, e.g. `Bash` or `Write`. |
| `description` | Human-readable summary of what this specific tool call does. |
| `input_preview` | The tool's arguments as a JSON string, truncated to 200 characters. |

The verdict your server sends back is `notifications/claude/channel/permission` with two fields: `request_id` echoing the ID above, and `behavior` set to `'allow'` or `'deny'`.

### Add relay to a chat bridge

#### Step 1: Declare the permission capability

```ts
capabilities: {
  experimental: {
    'claude/channel': {},
    'claude/channel/permission': {},  // opt in to permission relay
  },
  tools: {},
},
```

#### Step 2: Handle the incoming request

```ts
import { z } from 'zod'

const PermissionRequestSchema = z.object({
  method: z.literal('notifications/claude/channel/permission_request'),
  params: z.object({
    request_id: z.string(),
    tool_name: z.string(),
    description: z.string(),
    input_preview: z.string(),
  }),
})

mcp.setNotificationHandler(PermissionRequestSchema, async ({ params }) => {
  send(
    `Claude wants to run ${params.tool_name}: ${params.description}\n\n` +
    `Reply "yes ${params.request_id}" or "no ${params.request_id}"`,
  )
})
```

#### Step 3: Intercept the verdict in your inbound handler

```ts
// matches "y abcde", "yes abcde", "n abcde", "no abcde"
const PERMISSION_REPLY_RE = /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i

async function onInbound(message: PlatformMessage) {
  if (!allowed.has(message.from.id)) return

  const m = PERMISSION_REPLY_RE.exec(message.text)
  if (m) {
    await mcp.notification({
      method: 'notifications/claude/channel/permission',
      params: {
        request_id: m[2].toLowerCase(),
        behavior: m[1].toLowerCase().startsWith('y') ? 'allow' : 'deny',
      },
    })
    return
  }

  // normal chat path
  await mcp.notification({
    method: 'notifications/claude/channel',
    params: { content: message.text, meta: { chat_id: String(message.chat.id) } },
  })
}
```

### Full example with permission relay

```ts
#!/usr/bin/env bun
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod'

// --- Outbound: write to any curl -N listeners on /events --------------------
const listeners = new Set<(chunk: string) => void>()
function send(text: string) {
  const chunk = text.split('\n').map(l => `data: ${l}\n`).join('') + '\n'
  for (const emit of listeners) emit(chunk)
}

// Sender allowlist
const allowed = new Set(['dev'])

const mcp = new Server(
  { name: 'webhook', version: '0.0.1' },
  {
    capabilities: {
      experimental: {
        'claude/channel': {},
        'claude/channel/permission': {},
      },
      tools: {},
    },
    instructions:
      'Messages arrive as <channel source="webhook" chat_id="...">. ' +
      'Reply with the reply tool, passing the chat_id from the tag.',
  },
)

// --- reply tool ---
mcp.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'reply',
    description: 'Send a message back over this channel',
    inputSchema: {
      type: 'object',
      properties: {
        chat_id: { type: 'string', description: 'The conversation to reply in' },
        text: { type: 'string', description: 'The message to send' },
      },
      required: ['chat_id', 'text'],
    },
  }],
}))

mcp.setRequestHandler(CallToolRequestSchema, async req => {
  if (req.params.name === 'reply') {
    const { chat_id, text } = req.params.arguments as { chat_id: string; text: string }
    send(`Reply to ${chat_id}: ${text}`)
    return { content: [{ type: 'text', text: 'sent' }] }
  }
  throw new Error(`unknown tool: ${req.params.name}`)
})

// --- permission relay ---
const PermissionRequestSchema = z.object({
  method: z.literal('notifications/claude/channel/permission_request'),
  params: z.object({
    request_id: z.string(),
    tool_name: z.string(),
    description: z.string(),
    input_preview: z.string(),
  }),
})

mcp.setNotificationHandler(PermissionRequestSchema, async ({ params }) => {
  send(
    `Claude wants to run ${params.tool_name}: ${params.description}\n\n` +
    `Reply "yes ${params.request_id}" or "no ${params.request_id}"`,
  )
})

await mcp.connect(new StdioServerTransport())

// --- HTTP on :8788 ---
const PERMISSION_REPLY_RE = /^\s*(y|yes|n|no)\s+([a-km-z]{5})\s*$/i
let nextId = 1

Bun.serve({
  port: 8788,
  hostname: '127.0.0.1',
  idleTimeout: 0,
  async fetch(req) {
    const url = new URL(req.url)

    if (req.method === 'GET' && url.pathname === '/events') {
      const stream = new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(': connected\n\n')
          const emit = (chunk: string) => ctrl.enqueue(chunk)
          listeners.add(emit)
          req.signal.addEventListener('abort', () => listeners.delete(emit))
        },
      })
      return new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      })
    }

    const body = await req.text()
    const sender = req.headers.get('X-Sender') ?? ''
    if (!allowed.has(sender)) return new Response('forbidden', { status: 403 })

    const m = PERMISSION_REPLY_RE.exec(body)
    if (m) {
      await mcp.notification({
        method: 'notifications/claude/channel/permission',
        params: {
          request_id: m[2].toLowerCase(),
          behavior: m[1].toLowerCase().startsWith('y') ? 'allow' : 'deny',
        },
      })
      return new Response('verdict recorded')
    }

    const chat_id = String(nextId++)
    await mcp.notification({
      method: 'notifications/claude/channel',
      params: { content: body, meta: { chat_id, path: url.pathname } },
    })
    return new Response('ok')
  },
})
```

### Testing the verdict path

Terminal 1 - start Claude Code:
```bash
claude --dangerously-load-development-channels server:webhook
```

Terminal 2 - stream outbound:
```bash
curl -N localhost:8788/events
```

Terminal 3 - send a message:
```bash
curl -d "list the files in this directory" -H "X-Sender: dev" localhost:8788
```

Then approve:
```bash
curl -d "yes <id>" -H "X-Sender: dev" localhost:8788
```

## Package as a plugin

To make your channel installable, wrap it in a plugin and publish it to a marketplace. Users install with `/plugin install`, then enable per session with `--channels plugin:<name>@<marketplace>`.

A channel published to your own marketplace still needs `--dangerously-load-development-channels` during the research preview. To get it on the approved allowlist, submit it to the official marketplace for security review. On Team and Enterprise plans, an admin can include your plugin in the org's `allowedChannelPlugins` list instead.

## See also

* Channels — install and use Telegram, Discord, iMessage, or fakechat
* Working channel implementations — complete server code with pairing flows, reply tools, and file attachments
* MCP — the underlying protocol
* Plugins — package your channel for installation
