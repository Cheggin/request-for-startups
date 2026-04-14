---
name: asset-generation
description: Generate hero images, illustrations, and visual assets for SaaS websites using AI image APIs. Every page MUST have a visual centerpiece — never just text. Use Fal.ai with Flux 2 Pro for best quality. Triggers when building landing pages, hero sections, or any page that needs custom imagery.
user-invocable: true
---

# Asset Generation

Generate custom images for SaaS websites using AI image APIs.

## Core Rule

**Landing pages and marketing pages MUST have a visual centerpiece.** A text-only lander looks unfinished. The visual IS the design for landers.

Pages that need custom visuals:
- Landing / home page — hero image, illustration, or product demo
- Pricing page — can benefit from illustration but not required
- Blog posts — featured image per post
- About page — team photos or brand illustration

Pages that DON'T need generated assets:
- Legal pages (terms, privacy) — text is fine
- Documentation — code examples are the visual
- Settings / dashboard — the UI itself is the content

## Production Images: Midjourney

Midjourney produces the best quality images for hero sections, illustrations, and brand visuals. **No AI tool matches it for final production assets.**

The harness CANNOT generate Midjourney images programmatically. Instead:
1. During build, use Fal.ai to generate **prototype placeholder images** so the layout works
2. Add a `TODO(midjourney)` comment next to every placeholder image in the codebase
3. Tell the user: "Replace these placeholders with Midjourney-generated images before launch"
4. The user generates their own via Midjourney (Discord or web) and drops them into `public/images/`

This is a manual step. The harness automates everything it can, but Midjourney quality requires human curation.

## Prototyping API: Fal.ai + Flux 2 Pro

Use Fal.ai for placeholder images during development. Fast, cheap, good enough for layout validation.

```bash
npm install @fal-ai/client
```

```typescript
import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_KEY });

const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
  input: {
    prompt: "Painterly illustration of a Mediterranean terrace overlooking the sea, warm sunlight, classical statue, vibrant flowers, impressionist style",
    image_size: "landscape_16_9",
    num_images: 1,
  },
});

// result.data.images[0].url — download and save to public/images/
// Mark as placeholder: <!-- TODO(midjourney): Replace with production image -->
```

## API Comparison

| Provider | Quality | Cost | Use Case |
|----------|---------|------|----------|
| **Midjourney** | Best | $10/mo plan | Production hero images, illustrations — USER generates manually |
| Fal.ai Flux 2 Pro | Good | ~$0.05/img | Prototyping placeholders during build |
| Fal.ai Flux Schnell | Okay | ~$0.003/img | Fast iterations, layout testing |
| Replicate SDXL | Good | ~$0.02/img | Custom LoRA styles if needed |
| OpenAI DALL-E 3 | Okay | ~$0.04/img | Text rendering in images |
| Recraft v3 | Good | ~$0.04/img | Brand assets, icons |

## Prompt Engineering for Web Assets

### Hero images
- Describe the MOOD, not the product: "Warm sunset over a workspace" not "A SaaS dashboard"
- Include style keywords: "painterly", "impressionist", "minimal illustration", "isometric", "3D render"
- Specify aspect ratio: "landscape 16:9" for hero, "square" for cards
- Avoid: photorealistic faces (uncanny valley), generic office scenes

### Illustrations
- Match the design preset style (neobrutalist = bold flat, minimal = line art, warm = watercolor)
- Request transparency when possible (PNG with alpha)
- Be specific about color palette to match brand

### Icons
- Generate a set, not one at a time (consistent style)
- "Set of 6 minimal line icons for [features], consistent 2px stroke, [brand color]"
- Or use Lucide/Heroicons and skip generation for simple icons

## Integration

1. Generate assets during the scaffold/build phase
2. Save to `public/images/` with descriptive names
3. Use `next/image` with proper width/height for zero layout shift
4. Lazy load below-fold images
5. Generate WebP versions for smaller file sizes

## When NOT to generate

- Product screenshots — use the actual product (Playwright screenshot)
- Logos — user provides or we generate separately with specific brand requirements
- Stock-looking photos — better to skip than have generic AI photos

## Anti-Patterns

- Text-only hero with no visual element
- Generic "person at laptop" AI photo
- Tiny icon as the only visual on a page
- AI-generated image that doesn't match the color palette
- Using the same style of image across every startup (each needs unique visual identity)
