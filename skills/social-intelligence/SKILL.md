---
name: social-intelligence
description: Monitor social media platforms (Reddit, Twitter/X, LinkedIn, Hacker News) for startup mentions, competitor activity, and market sentiment using Browser Use API for authenticated scraping.
user-invocable: true
group: grow
prerequisites: [social-media]
next: [slack-course-correction]
workflows: [seo-content-growth]
---

# Social Intelligence

Automated social media monitoring and analysis across platforms. Uses Browser Use cloud API for authenticated scraping — persistent profiles keep sessions logged in.

## Core Rule

**Every startup needs social listening.** You can't grow what you can't measure. Monitor your own mentions, competitor activity, and market sentiment across every platform where your audience lives.

## Architecture

```
Browser Use API (cloud browser automation)
    ├── Reddit scraping (subreddit monitoring, mentions, sentiment)
    ├── Twitter/X scraping (mentions, engagement, influencers)
    ├── LinkedIn scraping (company mentions, industry posts)
    ├── Hacker News (via Algolia API — free, no browser needed)
    └── Competitor websites (pricing changes, feature launches)
         │
         ▼
    Aggregation → Convex (dashboard data store)
         │
         ▼
    Dashboard (growth page) + Slack alerts
```

## Browser Use API

### Authentication

```typescript
const BROWSER_USE_API = "https://api.browser-use.com/api/v3";

const headers = {
  "X-Browser-Use-API-Key": process.env.BROWSER_USE_API_KEY!,
  "Content-Type": "application/json",
};
```

### Create a Profile (one-time per platform)

Profiles persist cookies and sessions. Create one per social platform so the browser stays logged in.

```typescript
async function createProfile(name: string): Promise<string> {
  const res = await fetch(`${BROWSER_USE_API}/profiles`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  return data.id; // store this profile ID
}

// Create profiles for each platform during onboarding:
// "reddit-monitor", "twitter-monitor", "linkedin-monitor"
```

### Run a Scraping Task

```typescript
interface ScrapeTask {
  task: string;
  profileId?: string;
  model?: "bu-mini" | "bu-max" | "bu-ultra";
  maxCostUsd?: number;
  outputSchema?: Record<string, unknown>;
}

async function runBrowserTask(params: ScrapeTask) {
  const res = await fetch(`${BROWSER_USE_API}/sessions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      task: params.task,
      profileId: params.profileId,
      model: params.model || "bu-mini", // cheapest for scraping
      maxCostUsd: params.maxCostUsd || 0.10,
      outputSchema: params.outputSchema,
    }),
  });
  return await res.json();
}
```

## Platform-Specific Scraping

### Reddit

Monitor relevant subreddits for mentions of the startup, competitors, and industry keywords.

```typescript
const redditTask = {
  task: `Go to reddit.com. Search for "${startupName}" and "${competitorName}" in r/${targetSubreddit}. 
  For each post found in the last 7 days, extract: title, score, comment count, top 3 comments with scores, 
  and overall sentiment (positive/negative/neutral). Return as JSON array.`,
  profileId: redditProfileId,
  model: "bu-mini" as const,
  maxCostUsd: 0.05,
  outputSchema: {
    type: "object",
    properties: {
      posts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            url: { type: "string" },
            score: { type: "number" },
            commentCount: { type: "number" },
            sentiment: { type: "string", enum: ["positive", "negative", "neutral"] },
            topComments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  score: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
  },
};
```

**What to track:**
- Mentions of your startup name
- Mentions of competitors
- Pain point discussions in your niche
- Feature requests that align with your roadmap
- Negative sentiment spikes (potential PR issues)

### Twitter/X

```typescript
const twitterTask = {
  task: `Go to x.com. Search for "${startupName}" in the last 7 days. 
  For each tweet, extract: author handle, follower count, text, like count, retweet count, reply count.
  Also search for "${competitorName}" and extract the same.
  Identify the top 5 most influential accounts discussing this space.
  Return structured JSON.`,
  profileId: twitterProfileId,
  model: "bu-mini" as const,
  maxCostUsd: 0.08,
};
```

**What to track:**
- Brand mentions and sentiment
- Competitor mentions and sentiment
- Influencer engagement (who's talking about the space)
- Trending topics in your niche
- Best posting times (when mentions get most engagement)

### LinkedIn

```typescript
const linkedinTask = {
  task: `Go to linkedin.com. Search for posts mentioning "${startupName}" or "${industryKeyword}" 
  from the last 7 days. For each post, extract: author name, title, company, post text, 
  reaction count, comment count. Return as JSON.`,
  profileId: linkedinProfileId,
  model: "bu-mini" as const,
  maxCostUsd: 0.08,
};
```

**What to track:**
- Industry thought leadership content
- Competitor company page activity
- Job postings from competitors (signals growth/pivot)
- Partnership announcements

### Hacker News (Free — No Browser Use needed)

HN has the Algolia API — free, no auth, no browser automation required.

```typescript
const HN_API = "https://hn.algolia.com/api/v1";

async function searchHN(query: string, days: number = 7) {
  const timestamp = Math.floor(Date.now() / 1000) - days * 86400;
  const url = `${HN_API}/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${timestamp}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.hits.map((hit: any) => ({
    title: hit.title,
    url: hit.url,
    points: hit.points,
    comments: hit.num_comments,
    hnUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
    createdAt: hit.created_at,
  }));
}
```

**What to track:**
- Show HN posts from competitors
- Industry discussions and sentiment
- Feature requests / pain points
- Viral content in your space

## Competitor Website Monitoring

Use Browser Use to detect changes on competitor websites:

```typescript
const competitorMonitorTask = {
  task: `Go to ${competitorUrl}/pricing. Extract: all plan names, prices, and feature lists.
  Then go to ${competitorUrl} and extract: the hero tagline, main CTA text, and any new feature announcements.
  Compare with previous data and note any changes. Return structured JSON.`,
  model: "bu-mini" as const,
  maxCostUsd: 0.05,
};
```

**Monitor for:**
- Pricing changes (increases, new tiers, removed features)
- New feature launches (announced on homepage or changelog)
- Messaging pivots (tagline changes, new positioning)
- Design changes (major redesigns signal strategic shifts)

## Aggregation

All platform data flows into a unified format:

```typescript
interface SocialMention {
  platform: "reddit" | "twitter" | "linkedin" | "hn" | "web";
  content: string;
  url: string;
  author: string;
  engagement: number; // normalized: likes + comments + shares
  sentiment: "positive" | "negative" | "neutral";
  mentionType: "brand" | "competitor" | "industry";
  timestamp: string;
}

interface CompetitorSnapshot {
  competitor: string;
  url: string;
  pricing: { plan: string; price: string; features: string[] }[];
  tagline: string;
  lastChecked: string;
  changes: string[]; // diffs from previous snapshot
}
```

## Schedule

| Task | Frequency | Cost Estimate |
|------|-----------|---------------|
| Reddit monitoring | Daily | ~$0.05/run |
| Twitter mentions | Daily | ~$0.08/run |
| LinkedIn monitoring | Weekly | ~$0.08/run |
| HN search | Daily | Free (API) |
| Competitor websites | Weekly | ~$0.05/competitor |
| **Total (5 competitors)** | **Monthly** | **~$8-12/mo** |

## Slack Alerts

Post to Slack when:
- Sentiment spike (>3 negative mentions in 24h)
- Competitor pricing change detected
- Viral mention (engagement > 100)
- New influencer discovered (>10k followers mentioning your space)
- Competitor launches new feature

## Anti-Patterns

- Scraping too frequently (get rate-limited or blocked)
- Not using profiles (re-authenticating every session wastes time and money)
- Scraping without `maxCostUsd` (runaway costs)
- Raw-dumping scraped data without sentiment analysis
- Monitoring platforms where your audience doesn't exist
- Using `bu-ultra` for simple scraping tasks (`bu-mini` is sufficient)

## Profile Setup (During Onboarding)

The harness creates Browser Use profiles during `harness init`:
1. Create profiles: `reddit-monitor`, `twitter-monitor`, `linkedin-monitor`
2. Tell the user: "Log into Reddit/Twitter/LinkedIn in the Browser Use live view to persist sessions"
3. Store profile IDs in `.harness/browser-use-profiles.json`
4. Subsequent scraping tasks use these profile IDs automatically
