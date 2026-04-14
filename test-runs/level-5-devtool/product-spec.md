# json2ts — Product Spec

**Product:** CLI + Web platform that converts JSON to TypeScript types
**Date:** 2026-04-14
**Status:** Draft

---

## 1. Problem

Developers manually write TypeScript interfaces from JSON API responses. This is tedious, error-prone, and repeated dozens of times per project. Existing tools are either web-only (no CLI workflow), abandoned, or miss edge cases (nullable fields, mixed arrays, deeply nested objects).

## 2. Solution

Two packages:

| Package | Description |
|---------|------------|
| `json2ts` (npm) | CLI tool. Reads JSON, outputs TypeScript types. |
| `json2ts.dev` (Next.js) | Website with playground, docs, and paid API access. |

---

## 3. CLI Package (`json2ts`)

### 3.1 Core Commands

```bash
# File input
json2ts input.json

# Stdin pipe
curl https://api.example.com/users | json2ts

# Output to file
json2ts input.json -o types.ts

# Named root type
json2ts input.json --name UserResponse

# Read from clipboard
json2ts --clipboard
```

### 3.2 CLI Flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--output` | `-o` | stdout | Write to file instead of stdout |
| `--name` | `-n` | `Root` | Name of the root type |
| `--type` | `-t` | `interface` | Output style: `interface` or `type` |
| `--export` | `-e` | `true` | Add `export` keyword |
| `--optional` | | `false` | Mark all properties as optional |
| `--readonly` | | `false` | Mark all properties as readonly |
| `--no-comments` | | `false` | Suppress inline comments |
| `--array-strategy` | | `union` | How to handle mixed arrays: `union`, `tuple`, `any` |
| `--depth` | `-d` | `unlimited` | Max nesting depth before collapsing to `Record<string, unknown>` |
| `--clipboard` | `-c` | `false` | Read JSON from system clipboard |

### 3.3 Type Inference Rules

| JSON Value | TypeScript Type |
|-----------|----------------|
| `"hello"` | `string` |
| `42` | `number` |
| `true` | `boolean` |
| `null` | `null` |
| `[1, 2, 3]` | `number[]` |
| `["a", 1]` | `(string \| number)[]` |
| `[]` | `unknown[]` |
| `{}` | `Record<string, unknown>` (empty object) |
| Nested object | Named interface (e.g., `Address`) |
| Array of objects | Merged interface + `Type[]` |

**Optional field detection:** When processing an array of objects, if a key appears in some objects but not all, it is marked optional (`?`).

**Naming strategy:** Nested interfaces are named by their parent key in PascalCase. Collisions get a numeric suffix (`Address`, `Address2`).

### 3.4 Technical Details

- **Runtime:** Node.js >= 18
- **Language:** TypeScript (compiled to ESM + CJS)
- **Dependencies:** Minimal — `commander` for CLI args, zero runtime deps for the converter core
- **Package structure:**
  ```
  json2ts/
  ├── src/
  │   ├── cli.ts          # CLI entry point
  │   ├── converter.ts    # Core conversion logic (pure function)
  │   ├── inferrer.ts     # Type inference engine
  │   ├── formatter.ts    # Output formatting (interface vs type alias)
  │   ├── naming.ts       # PascalCase naming + collision resolution
  │   └── options.ts      # Option types and defaults
  ├── bin/
  │   └── json2ts.js      # Bin entry
  ├── package.json
  └── tsconfig.json
  ```
- **Core export:** `convert(json: string, options?: ConvertOptions): string` — usable programmatically without the CLI

---

## 4. Website (`json2ts.dev`)

### 4.1 Tech Stack

- Next.js 15 App Router
- Tailwind CSS v4
- TypeScript
- Font: JetBrains Mono (code), Geist Sans (UI)
- No Inter font
- Deployed on Vercel

### 4.2 Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero with live demo, features, social proof, CTA |
| `/playground` | Playground | Paste JSON, get types instantly (client-side) |
| `/docs` | Docs index | Installation, quickstart, links to sub-pages |
| `/docs/cli` | CLI Reference | All flags, examples, exit codes |
| `/docs/api` | API Reference | REST API endpoints, auth, rate limits |
| `/docs/programmatic` | Library Usage | Using `convert()` in code |
| `/pricing` | Pricing | Free CLI vs paid API tiers |
| `/blog` | Blog index | SEO content, changelog |
| `/blog/[slug]` | Blog post | Individual posts |
| `/login` | Auth | Sign in for API key management |
| `/dashboard` | Dashboard | API key management, usage stats |
| `/dashboard/keys` | API Keys | Create/revoke keys |
| `/dashboard/usage` | Usage | Request counts, graphs |

### 4.3 Page Specifications

#### 4.3.1 Landing Page (`/`)

**Sections (top to bottom):**

1. **Hero** — Split layout. Left: headline, subhead, install command with copy button (`npm i -g json2ts`). Right: animated terminal showing `curl ... | json2ts` with output appearing line by line.

2. **Live Demo Strip** — Narrow section. Small JSON input on left, arrow, TypeScript output on right. Updates in real-time as user edits. Uses the same converter core as the CLI (bundled client-side).

3. **Features Grid** — 2x3 grid:
   - Pipe-friendly (stdin support)
   - Smart type inference (unions, optionals)
   - Nested objects (recursive extraction)
   - Zero config (works out of the box)
   - Programmatic API (import and use in code)
   - Blazing fast (no network, pure local)

4. **Comparison Table** — json2ts vs quicktype vs json-to-ts vs manual. Columns: CLI support, optional detection, mixed arrays, actively maintained, bundle size.

5. **Code Examples** — Tabbed component showing 3 use cases:
   - Basic file conversion
   - Piping from curl
   - Programmatic usage in a script

6. **CTA** — "Try it in the playground" button + "Star on GitHub" button.

7. **Footer** — Links to docs, GitHub, npm, Twitter/X. Copyright.

#### 4.3.2 Playground (`/playground`)

**Layout:** Two-panel editor (left: JSON input, right: TypeScript output).

**Behavior:**
- Client-side only. No server calls. The converter core is bundled into the page.
- JSON panel has syntax highlighting + error indicators for invalid JSON.
- TypeScript panel has syntax highlighting + copy button.
- Options bar above panels: root type name, interface vs type alias, export toggle, readonly toggle.
- Conversion runs on every keystroke (debounced 150ms).
- URL state: JSON input is encoded in a URL hash so playground links are shareable.
- Example buttons: pre-loaded JSON samples (GitHub API user, Stripe invoice, simple array).

**Editor:** CodeMirror 6 with JSON and TypeScript language support.

#### 4.3.3 Docs (`/docs`)

MDX-based. Sidebar navigation. Sections:

- **Getting Started** — Install, first command, expected output.
- **CLI Reference** — Every flag with examples.
- **Programmatic Usage** — `import { convert } from 'json2ts'` with examples.
- **API Reference** — Endpoint, auth, request/response format, rate limits.
- **Type Inference** — How each JSON type maps, edge cases, array merging logic.
- **FAQ** — Common questions.

#### 4.3.4 Pricing (`/pricing`)

| | Free (CLI) | Pro ($12/mo) | Team ($29/mo) |
|---|-----------|-------------|---------------|
| CLI tool | Yes | Yes | Yes |
| Playground | Yes | Yes | Yes |
| REST API | 100 req/day | 10,000 req/day | 50,000 req/day |
| Batch conversion | No | Yes | Yes |
| Custom naming templates | No | Yes | Yes |
| Priority support | No | Email | Slack + Email |
| API key management | 1 key | 5 keys | Unlimited keys |

Payment via Stripe Checkout. No credit card required for free tier.

#### 4.3.5 Dashboard (`/dashboard`)

Authenticated area (NextAuth.js with GitHub OAuth).

- **Overview:** Current plan, usage this billing period, quick actions.
- **API Keys:** Table of keys with created date, last used, revoke button. "Create new key" button.
- **Usage:** Bar chart of daily API requests. Current period total vs limit.

---

## 5. API Service

**Endpoint:** `POST https://api.json2ts.dev/v1/convert`

```bash
curl -X POST https://api.json2ts.dev/v1/convert \
  -H "Authorization: Bearer j2t_xxxx" \
  -H "Content-Type: application/json" \
  -d '{"json": "{\"name\": \"Ada\"}", "options": {"name": "User"}}'
```

**Response:**
```json
{
  "typescript": "export interface User {\n  name: string;\n}",
  "meta": {
    "types_generated": 1,
    "inference_time_ms": 2
  }
}
```

**Rate limiting:** Token bucket per API key. Headers: `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

**Auth:** Bearer token. Keys prefixed `j2t_` for easy identification in logs.

---

## 6. Component Inventory

### 6.1 Shared / Layout

| Component | Location | Description |
|-----------|----------|-------------|
| `RootLayout` | `app/layout.tsx` | HTML shell, font loading (Geist Sans + JetBrains Mono), metadata |
| `Header` | `components/header.tsx` | Logo, nav links (Playground, Docs, Pricing), GitHub stars badge, sign-in button |
| `Footer` | `components/footer.tsx` | Links grid, copyright |
| `MobileNav` | `components/mobile-nav.tsx` | Hamburger menu for small screens |
| `ThemeToggle` | `components/theme-toggle.tsx` | Light/dark mode switch |

### 6.2 Landing Page

| Component | Description |
|-----------|-------------|
| `Hero` | Headline, subhead, install command, animated terminal |
| `AnimatedTerminal` | Typewriter effect showing CLI in action |
| `InstallCommand` | `npm i -g json2ts` with copy-to-clipboard button |
| `LiveDemoStrip` | Inline JSON-to-TS converter |
| `FeaturesGrid` | 2x3 grid of feature cards |
| `FeatureCard` | Icon + title + description |
| `ComparisonTable` | Tool comparison with checkmarks |
| `CodeExamples` | Tabbed code snippets |
| `CTASection` | Playground + GitHub buttons |

### 6.3 Playground

| Component | Description |
|-----------|-------------|
| `PlaygroundLayout` | Two-panel split with drag-to-resize divider |
| `JsonEditor` | CodeMirror instance for JSON input with validation |
| `TypeScriptViewer` | CodeMirror instance (read-only) for TS output |
| `OptionsBar` | Root name input, type style toggle, export/readonly checkboxes |
| `ExampleSelector` | Dropdown of pre-loaded JSON examples |
| `CopyButton` | Copies TypeScript output to clipboard |
| `ShareButton` | Generates shareable URL with JSON encoded in hash |
| `ErrorBanner` | Displays JSON parse errors inline |

### 6.4 Docs

| Component | Description |
|-----------|-------------|
| `DocsSidebar` | Collapsible navigation tree |
| `DocsContent` | MDX renderer with custom components |
| `CodeBlock` | Syntax-highlighted code with copy button and filename label |
| `FlagTable` | Renders CLI flag documentation as a table |
| `ApiEndpoint` | Styled endpoint block (method + path + description) |

### 6.5 Pricing

| Component | Description |
|-----------|-------------|
| `PricingGrid` | 3-column tier cards |
| `PricingCard` | Tier name, price, feature list, CTA button |
| `FeatureRow` | Checkmark/cross + feature text |
| `BillingToggle` | Monthly/annual switch |

### 6.6 Dashboard

| Component | Description |
|-----------|-------------|
| `DashboardShell` | Sidebar nav + content area |
| `ApiKeyTable` | List of keys with actions |
| `CreateKeyDialog` | Modal for naming a new key |
| `UsageChart` | Bar chart (recharts or similar) |
| `PlanBadge` | Shows current plan tier |

---

## 7. Features — Prioritized

### P0 — Must Ship (MVP)

| # | Feature | Acceptance Criteria |
|---|---------|-------------------|
| P0-1 | **CLI reads JSON file and outputs TS interfaces** | Given `input.json` containing `{"name":"Ada","age":30}`, running `json2ts input.json` prints `export interface Root { name: string; age: number; }` to stdout. Exit code 0. |
| P0-2 | **Stdin pipe support** | Given `echo '{"x":1}' \| json2ts`, output is `export interface Root { x: number; }`. Works with curl pipes. |
| P0-3 | **Nested object extraction** | Given `{"user":{"address":{"city":"NYC"}}}`, output contains `interface Address { city: string; }` and `interface User { address: Address; }` and `interface Root { user: User; }`. |
| P0-4 | **Array type inference** | Given `{"ids":[1,2,3]}`, output is `ids: number[]`. Given `{"mix":["a",1]}`, output is `mix: (string \| number)[]`. Given `{"empty":[]}`, output is `empty: unknown[]`. |
| P0-5 | **Optional field detection** | Given `{"users":[{"name":"A","email":"a@b"},{"name":"B"}]}`, the `email` field in the inferred `User` interface is marked `email?: string`. |
| P0-6 | **Output to file** | Running `json2ts input.json -o types.ts` writes output to `types.ts`. File is created if it doesn't exist. Exits with code 0. |
| P0-7 | **Root type naming** | Running `json2ts input.json --name UserResponse` produces `export interface UserResponse { ... }`. |
| P0-8 | **Landing page** | Page loads at `/`. Contains hero with install command, features grid, and CTA to playground. Lighthouse performance score >= 90. |
| P0-9 | **Playground page** | Page loads at `/playground`. Pasting valid JSON in the left panel produces TypeScript in the right panel within 200ms. No server calls made during conversion. |
| P0-10 | **Docs page** | Page loads at `/docs`. Contains installation instructions, CLI flag reference, and at least 3 usage examples. Sidebar navigation works. |
| P0-11 | **Pricing page** | Page loads at `/pricing`. Shows 3 tiers with feature comparison. Free tier CTA links to npm install command. Paid tiers link to Stripe Checkout (or placeholder). |

### P1 — Should Ship (v1.0)

| # | Feature | Acceptance Criteria |
|---|---------|-------------------|
| P1-1 | **Interface vs type alias toggle** | `--type type` produces `export type Root = { ... }` instead of `export interface Root { ... }`. |
| P1-2 | **Readonly modifier** | `--readonly` produces `readonly name: string` for all properties. |
| P1-3 | **Null handling** | `{"x": null}` produces `x: null`. `{"x": "hello"}` in one array element and `{"x": null}` in another produces `x: string \| null`. |
| P1-4 | **Shareable playground URLs** | Clicking "Share" generates a URL with JSON encoded in the hash. Opening that URL pre-fills the playground. |
| P1-5 | **Dark mode** | Theme toggle in header. Persists preference in localStorage. Respects `prefers-color-scheme` on first visit. |
| P1-6 | **REST API endpoint** | `POST /v1/convert` with valid JSON body and API key returns TypeScript string. Invalid JSON returns 400. Missing/invalid key returns 401. Rate limit exceeded returns 429. |
| P1-7 | **GitHub OAuth login** | Clicking "Sign in" redirects to GitHub OAuth. On success, redirects to `/dashboard`. Session persists across page reloads. |
| P1-8 | **API key management** | In `/dashboard/keys`, user can create a new key (shown once), see list of keys (masked), and revoke a key. Revoked key returns 401 on next API call. |
| P1-9 | **Programmatic export** | `import { convert } from 'json2ts'` works in Node.js. Function signature: `convert(json: string, options?: ConvertOptions): string`. |
| P1-10 | **Error messages** | Invalid JSON input prints a clear error with line/column of the parse error. Non-existent file prints "File not found: path". Exit code 1 for all errors. |

### P2 — Nice to Have (v1.x)

| # | Feature | Acceptance Criteria |
|---|---------|-------------------|
| P2-1 | **Clipboard input** | `json2ts --clipboard` reads JSON from system clipboard and converts it. Works on macOS (pbpaste), Linux (xclip), Windows (PowerShell). |
| P2-2 | **Batch conversion** | `json2ts dir/` converts all `.json` files in a directory. Each produces a corresponding `.ts` file. |
| P2-3 | **Watch mode** | `json2ts input.json -o types.ts --watch` re-generates on file change. |
| P2-4 | **Custom naming template** | `--naming-template "I{{Name}}Response"` produces `IUserResponse` instead of `User`. |
| P2-5 | **JSDoc comments** | `--jsdoc` adds `/** Generated from input.json */` above each interface. |
| P2-6 | **Usage analytics dashboard** | `/dashboard/usage` shows a bar chart of daily API requests for the current billing period. |
| P2-7 | **Blog / SEO pages** | `/blog` with MDX posts. At least: "JSON to TypeScript: The Complete Guide", "Automating API Types in CI". |
| P2-8 | **VS Code extension** | Right-click a `.json` file -> "Convert to TypeScript". Uses the same converter core. |
| P2-9 | **Playground example presets** | Dropdown with "GitHub User", "Stripe Invoice", "Simple Array" that pre-fills the JSON panel. |
| P2-10 | **Annual billing discount** | Toggle on pricing page. Annual = 2 months free. Stripe handles proration. |

---

## 8. Data Model

### Users

```sql
users
  id          UUID PRIMARY KEY
  github_id   TEXT UNIQUE NOT NULL
  email       TEXT
  name        TEXT
  avatar_url  TEXT
  plan        ENUM('free', 'pro', 'team') DEFAULT 'free'
  created_at  TIMESTAMPTZ DEFAULT now()
```

### API Keys

```sql
api_keys
  id          UUID PRIMARY KEY
  user_id     UUID REFERENCES users(id)
  name        TEXT NOT NULL
  key_hash    TEXT NOT NULL          -- bcrypt hash of j2t_xxxx
  key_prefix  TEXT NOT NULL          -- first 8 chars for display
  last_used   TIMESTAMPTZ
  revoked_at  TIMESTAMPTZ
  created_at  TIMESTAMPTZ DEFAULT now()
```

### Usage

```sql
api_usage
  id          UUID PRIMARY KEY
  key_id      UUID REFERENCES api_keys(id)
  timestamp   TIMESTAMPTZ DEFAULT now()
  input_size  INTEGER               -- bytes
  types_count INTEGER               -- number of interfaces generated
  latency_ms  INTEGER
```

---

## 9. Project Structure (Website)

```
json2ts-web/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing
│   ├── playground/
│   │   └── page.tsx
│   ├── docs/
│   │   ├── layout.tsx              # Sidebar layout
│   │   ├── page.tsx                # Getting started
│   │   ├── cli/page.tsx
│   │   ├── api/page.tsx
│   │   └── programmatic/page.tsx
│   ├── pricing/
│   │   └── page.tsx
│   ├── blog/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── login/
│   │   └── page.tsx
│   └── dashboard/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── keys/page.tsx
│       └── usage/page.tsx
├── components/
│   ├── header.tsx
│   ├── footer.tsx
│   ├── mobile-nav.tsx
│   ├── theme-toggle.tsx
│   ├── landing/
│   │   ├── hero.tsx
│   │   ├── animated-terminal.tsx
│   │   ├── install-command.tsx
│   │   ├── live-demo-strip.tsx
│   │   ├── features-grid.tsx
│   │   ├── comparison-table.tsx
│   │   ├── code-examples.tsx
│   │   └── cta-section.tsx
│   ├── playground/
│   │   ├── playground-layout.tsx
│   │   ├── json-editor.tsx
│   │   ├── typescript-viewer.tsx
│   │   ├── options-bar.tsx
│   │   └── example-selector.tsx
│   ├── docs/
│   │   ├── docs-sidebar.tsx
│   │   ├── code-block.tsx
│   │   ├── flag-table.tsx
│   │   └── api-endpoint.tsx
│   ├── pricing/
│   │   ├── pricing-grid.tsx
│   │   ├── pricing-card.tsx
│   │   └── billing-toggle.tsx
│   └── dashboard/
│       ├── dashboard-shell.tsx
│       ├── api-key-table.tsx
│       ├── create-key-dialog.tsx
│       ├── usage-chart.tsx
│       └── plan-badge.tsx
├── lib/
│   ├── converter.ts                # Re-exported from json2ts core
│   ├── auth.ts                     # NextAuth config
│   ├── db.ts                       # Database client
│   └── stripe.ts                   # Stripe helpers
├── public/
│   └── og-image.png
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## 10. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| CLI cold start | < 100ms |
| Conversion of 1MB JSON | < 500ms |
| Playground conversion latency | < 200ms (client-side) |
| Landing page Lighthouse perf | >= 90 |
| Playground bundle size | < 200KB gzipped (including CodeMirror) |
| API p99 latency | < 100ms |
| API uptime | 99.9% |
| Accessibility | WCAG 2.1 AA |

---

## 11. Open Questions

1. Should the CLI support YAML input as well? (Adds a dependency, broadens use case.)
2. Should the playground support URL fetch (paste an API URL, we fetch and convert)? CORS issues make this server-side only.
3. Zod schema output as an alternative to plain TS interfaces?
4. Should we support JSON Schema input in addition to raw JSON?
