export interface BlogPost {
  title: string;
  slug: string;
  date: string;
  description: string;
  content: string;
}

export const blogPosts: BlogPost[] = [
  {
    title: "PNG vs WebP: which format should you use in 2026?",
    slug: "png-vs-webp-2026",
    date: "2026-04-10",
    description:
      "A practical comparison of PNG and WebP for web delivery — file sizes, quality tradeoffs, browser support, and when to pick each format.",
    content: `I've spent the last few years building image conversion tools, and the PNG vs WebP question comes up constantly. The answer isn't as simple as "just use WebP" — it depends on what you're optimizing for. Here's what I've learned from processing millions of images.

## The file size difference is real, but it varies

WebP files are **26-34% smaller** than equivalent PNGs on average. But that number shifts depending on the image content:

- **Screenshots and UI elements**: 28% average reduction. WebP's predictive coding handles flat color regions and sharp edges well, though PNG's deflate compression is already efficient here.
- **Photographs with transparency**: 34% average reduction. This is where WebP pulls ahead significantly — PNG was never designed for photographic content with alpha channels.
- **Simple icons and logos (under 5KB)**: 12-18% reduction. At this size, the overhead of WebP's container format eats into the savings. For tiny assets, the difference is negligible.
- **Complex illustrations with gradients**: 31% average reduction. WebP's lossy-with-alpha mode has no PNG equivalent, which opens up compression strategies that aren't possible with PNG at all.

These numbers come from batch conversions at quality 80 (WebP's default). Push quality to 90+ and the gap narrows to 15-20%. Drop to quality 60 and you'll see 40%+ reductions, but with visible artifacts in gradients.

## Quality comparison at different compression levels

WebP quality settings don't map 1:1 to what you'd expect. Here's what actually happens at each tier:

**Quality 90-100**: Virtually indistinguishable from PNG. SSIM scores consistently above 0.98. File size savings drop to 15-22%. Use this for product photography or anything where a client will pixel-peep.

**Quality 75-85**: The sweet spot for most web use. SSIM stays above 0.95. You'll see 26-34% size reduction. Artifacts only show up if you zoom to 400%+ on gradient-heavy areas. This is what I recommend for 90% of web images.

**Quality 50-70**: Noticeable quality loss in smooth gradients and skin tones. Fine for thumbnails, social media previews, and content where load speed matters more than fidelity. Size reduction hits 38-45%.

**Quality below 50**: Blocky artifacts become obvious. I wouldn't use this for anything user-facing unless you're serving extremely bandwidth-constrained users.

One thing worth noting: WebP's lossy compression and PNG's lossless compression are fundamentally different algorithms. Comparing "quality 80 WebP" to "PNG" isn't apples-to-apples — PNG preserves every pixel exactly. If you need bit-perfect reproduction (medical imaging, print production, sprite sheets for pixel art), PNG is still the right choice.

## Browser support in 2026

WebP hit **97.4% global browser support** as of March 2026 (per caniuse data). The remaining 2.6% is mostly older embedded browsers and some legacy enterprise IE configurations that should've been retired years ago.

The specific breakdown:

| Browser | WebP support since |
|---|---|
| Chrome | Version 32 (2014) |
| Firefox | Version 65 (2019) |
| Safari | Version 16 (2022) |
| Edge | Version 18 (2018) |
| Samsung Internet | Version 4.0 (2016) |
| Opera | Version 19 (2013) |

Safari was the last major holdout, but that was four years ago now. If you're still serving PNG fallbacks for WebP in 2026, you're adding complexity for a user base that rounds to zero.

The one exception: email clients. Outlook desktop, Yahoo Mail, and several enterprise mail clients still don't render WebP. If you're building email templates, stick with PNG or JPEG.

## When to use PNG

PNG isn't dead. Use it when:

- **You need lossless quality guaranteed** — screenshots for documentation, pixel art, technical diagrams where every pixel matters.
- **Your workflow involves repeated editing** — PNG doesn't degrade on re-save. WebP lossy does. If a file gets opened, edited, and saved 10 times in a design pipeline, PNG keeps its quality.
- **You're targeting email** — as mentioned, email client support for WebP is still inconsistent.
- **Your images are already tiny** — a 3KB favicon gains almost nothing from WebP conversion and adds a format dependency.
- **You need broad tool compatibility** — every image editor, CMS, and design tool handles PNG natively. WebP support in tools like older Photoshop versions or niche CMS plugins can still be hit-or-miss.

## When to use WebP

WebP is the better default for web delivery when:

- **Page load speed matters** — and it always does. A 30% reduction across 15 images on a page adds up fast. On a product listing page with 40 thumbnails, switching from PNG to WebP at quality 80 can cut 200-400KB from the total page weight.
- **You're serving mobile users** — 58% of global web traffic is mobile (Statcounter, Q1 2026). Smaller images mean faster renders on slower connections.
- **You need transparency with smaller files** — WebP lossy-with-alpha gives you transparency at a fraction of PNG's file size. This is a capability PNG simply doesn't have.
- **You're optimizing Core Web Vitals** — Largest Contentful Paint improves directly with smaller image payloads. I've seen LCP drop by 200-400ms on image-heavy pages after a PNG-to-WebP migration.

## What about AVIF?

AVIF offers even better compression than WebP (40-50% smaller than PNG), but it comes with tradeoffs: slower encoding (5-10x slower than WebP), limited browser support at 92.1%, and poor support in image editing tools. For automated pipelines where encoding time doesn't matter, AVIF is worth considering. For interactive tools where a user is waiting for a conversion, WebP's speed advantage matters.

## The practical recommendation

Use WebP as your default web delivery format. Keep PNG as your archival and editing format. Convert at the point of delivery, not at the point of creation.

The workflow that makes sense for most teams: design and store assets as PNG (or the original source format), then convert to WebP when serving to browsers. This gives you lossless originals for future re-processing and optimized delivery for end users.

---

**Want to convert your images right now?** Our [image converter tool](/) handles PNG to WebP (and back) directly in your browser. No upload to a server, no file size limits, no account required. Drop your file, pick your format and quality, and download the result. It takes about 2 seconds.`,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}
