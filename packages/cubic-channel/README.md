# Cubic Webhook Channel

Two-part system that pipes Cubic code review events from GitHub into a Claude Code session in real time.

```
Cubic reviews PR  ->  GitHub webhook fires
  ->  Railway receiver (verifies signature, filters for Cubic)
  ->  Writes to Convex (real-time event queue)
  ->  Local MCP channel polls Convex
  ->  Pushes <channel> events into Claude Code session
  ->  Claude fixes the issue, pushes, Cubic re-reviews
```

## Ground Truth: Cubic Review Pipeline (Non-Negotiable)

Every repo the harness creates MUST have the following. No exceptions.

1. **`.mcp.json` with cubic-channel registered** — The cubic-channel MCP server must be in every repo's `.mcp.json` so every Claude Code session (Builder, QA, Deployer, any agent) receives Cubic review findings in real time.

2. **Cubic GitHub App installed** — The Cubic GitHub App must be installed on the repo so it auto-reviews every PR.

3. **All work goes through PRs with Cubic review** — Agents never push directly to main. Every change is a feature branch + PR. Cubic reviews automatically on push. No merging until Cubic is clean.

4. **Agents fix until clean** — When Cubic posts findings, the agent checks `/cubic-comments`, fixes every issue, and pushes again. This loops until Cubic returns a clean review. Only then can the PR be merged.

The onboarding scaffold step (Step 5 in the harness) automates this setup for every new repo:
- Deploys a Convex project for the event queue
- Deploys the webhook receiver to Railway
- Configures the GitHub webhook
- Registers the cubic-channel in `.mcp.json`
- Installs the Cubic GitHub App

## Components

| Component | Location | Runs where |
|-----------|----------|------------|
| Webhook receiver | `receiver/index.ts` | Railway (remote) |
| MCP channel server | `channel/index.ts` | Local (Claude Code subprocess) |
| Convex schema + functions | `convex/` | Convex cloud |

## Prerequisites

- [Bun](https://bun.sh) runtime
- A [Convex](https://convex.dev) account and project
- A [Railway](https://railway.app) account
- A GitHub repo with a configured webhook secret

## Setup

### 1. Install dependencies

```bash
cd packages/cubic-channel
bun install
```

### 2. Deploy Convex functions

```bash
npx convex deploy
```

This deploys the schema (`convex/schema.ts`) and mutations/queries (`convex/cubicEvents.ts`) to your Convex project. Note your deployment URL (e.g. `https://your-deployment.convex.cloud`).

### 3. Deploy the receiver to Railway

Set the required environment variables in your Railway project:

| Variable | Description |
|----------|-------------|
| `GITHUB_WEBHOOK_SECRET` | The secret you configure in GitHub webhook settings |
| `CONVEX_URL` | Your Convex deployment URL |

Then deploy:

```bash
railway up
```

Railway will assign a public URL (e.g. `https://cubic-receiver.up.railway.app`).

### 4. Configure the GitHub webhook

In your GitHub repo, go to **Settings > Webhooks > Add webhook**:

| Field | Value |
|-------|-------|
| Payload URL | Your Railway URL (e.g. `https://cubic-receiver.up.railway.app`) |
| Content type | `application/json` |
| Secret | Same value as `GITHUB_WEBHOOK_SECRET` |
| Events | Select: `Pull request reviews`, `Pull request review comments`, `Issue comments` |

### 5. Register the local MCP channel

Add the channel server to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "cubic-channel": {
      "command": "bun",
      "args": ["run", "packages/cubic-channel/channel/index.ts"],
      "env": {
        "CONVEX_URL": "https://your-deployment.convex.cloud",
        "REPO": "owner/repo-name",
        "POLL_INTERVAL": "5000"
      }
    }
  }
}
```

Claude Code will spawn this as a subprocess. It polls Convex every `POLL_INTERVAL` ms for new Cubic review events and pushes them into your session as `<channel>` notifications.

## Environment Variables

### Receiver (`receiver/index.ts`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_WEBHOOK_SECRET` | Yes | GitHub webhook HMAC secret |
| `CONVEX_URL` | Yes | Convex deployment URL |
| `PORT` | No | Server port (default: `8789`) |

### Channel (`channel/index.ts`)

| Variable | Required | Description |
|----------|----------|-------------|
| `CONVEX_URL` | Yes | Convex deployment URL |
| `REPO` | Yes | GitHub repo to watch (`owner/name`) |
| `POLL_INTERVAL` | No | Polling interval in ms (default: `5000`) |

## MCP Tools

The channel exposes two tools to Claude Code:

- **`mark_processed`** — Mark a single event as handled (takes `eventId`)
- **`mark_all_processed`** — Mark all pending events for the repo as handled

## Testing

```bash
bun run vitest
```

## How it works

1. Cubic reviews a PR on GitHub and posts review comments
2. GitHub fires a webhook to the Railway receiver
3. The receiver verifies the HMAC signature, checks the comment author is Cubic (not a human), and writes the event to Convex
4. The local MCP channel polls Convex for unprocessed events
5. New events are pushed into the Claude Code session as `<channel>` notifications with metadata (PR number, file, line, severity)
6. Claude Code reads the finding, fixes the code, and pushes
7. Cubic re-reviews automatically, and the cycle repeats until the review is clean
