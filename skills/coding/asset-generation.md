---
name: asset-generation
description: Generate hero images, illustrations, and visual assets for SaaS websites using AI image APIs. Every page MUST have a visual centerpiece — never just text. Use Fal.ai with Flux 2 Pro for best quality. Triggers when building landing pages, hero sections, or any page that needs custom imagery.
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

## Recommended API: Fal.ai + Flux 2 Pro

Best quality, fastest, cheapest for hero images in 2026.

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

// result.data.images[0].url — download and save to public/
```

## Alternative APIs

| Provider | Model | Cost | Best For |
|----------|-------|------|----------|
| Fal.ai | Flux 2 Pro | ~$0.05/img | Hero images, photorealism |
| Fal.ai | Flux Schnell | ~$0.003/img | Fast iterations, drafts |
| Replicate | SDXL + LoRA | ~$0.02/img | Custom styles, brand-specific |
| OpenAI | DALL-E 3 | ~$0.04/img | Good text rendering |
| Recraft | v3 | ~$0.04/img | Brand assets, icons |

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
