import type { ImageFormat } from "@/lib/constants";

export interface ConversionRoute {
  slug: string;
  sourceFormat: ImageFormat;
  targetFormat: ImageFormat;
  sourceLabel: string;
  targetLabel: string;
  title: string;
  metaDescription: string;
  headline: string;
  description: string;
  typicalSizeChange: string;
  sizeChangeDirection: "smaller" | "larger" | "similar";
  useCases: string[];
  browserSupport: {
    chrome: boolean;
    firefox: boolean;
    safari: boolean;
    edge: boolean;
  };
  browserSupportNote: string;
  prosOfTarget: string[];
  consOfTarget: string[];
}

const CONVERSION_ROUTES: ConversionRoute[] = [
  {
    slug: "png-to-jpg",
    sourceFormat: "png",
    targetFormat: "jpg",
    sourceLabel: "PNG",
    targetLabel: "JPG",
    title: "Convert PNG to JPG online — free, private, no upload",
    metaDescription:
      "Convert PNG images to JPG directly in your browser. No file uploads, no servers. Adjust quality and download instantly.",
    headline: "PNG to JPG converter",
    description:
      "Convert PNG files to JPG to reduce file size when you don't need transparency. JPG uses lossy compression, so photos and complex images shrink significantly with minimal visible quality loss.",
    typicalSizeChange: "60-80% smaller",
    sizeChangeDirection: "smaller",
    useCases: [
      "Reducing photo file sizes for web pages",
      "Email attachments with size limits",
      "Social media uploads that don't need transparency",
      "Archiving screenshots where transparency is irrelevant",
    ],
    browserSupport: { chrome: true, firefox: true, safari: true, edge: true },
    browserSupportNote: "JPG is supported in every major browser since the 1990s.",
    prosOfTarget: [
      "Much smaller files for photographic content",
      "Universal compatibility across all devices and platforms",
      "Adjustable quality lets you balance size and clarity",
    ],
    consOfTarget: [
      "No transparency support — alpha channel is flattened to white",
      "Lossy compression introduces artifacts at low quality settings",
      "Not ideal for text, line art, or images with sharp edges",
    ],
  },
  {
    slug: "png-to-webp",
    sourceFormat: "png",
    targetFormat: "webp",
    sourceLabel: "PNG",
    targetLabel: "WebP",
    title: "Convert PNG to WebP online — free, private, no upload",
    metaDescription:
      "Convert PNG images to WebP for smaller files with transparency support. Runs entirely in your browser — no uploads needed.",
    headline: "PNG to WebP converter",
    description:
      "Convert PNG files to WebP to get smaller files while keeping transparency. WebP supports both lossy and lossless compression, making it a strong replacement for PNG on the web.",
    typicalSizeChange: "25-35% smaller",
    sizeChangeDirection: "smaller",
    useCases: [
      "Optimizing website images for faster page loads",
      "Replacing PNG assets in web apps while keeping transparency",
      "Reducing bandwidth for image-heavy pages",
      "Progressive web apps that need small, high-quality assets",
    ],
    browserSupport: { chrome: true, firefox: true, safari: true, edge: true },
    browserSupportNote:
      "WebP is supported in all major browsers. Safari added support in version 14 (2020).",
    prosOfTarget: [
      "Smaller files than PNG with lossless compression",
      "Supports transparency (alpha channel)",
      "Both lossy and lossless modes available",
    ],
    consOfTarget: [
      "Some older image editors don't open WebP files natively",
      "Not supported in Internet Explorer",
      "Less familiar to non-technical users who may expect PNG or JPG",
    ],
  },
  {
    slug: "jpg-to-png",
    sourceFormat: "jpg",
    targetFormat: "png",
    sourceLabel: "JPG",
    targetLabel: "PNG",
    title: "Convert JPG to PNG online — free, private, no upload",
    metaDescription:
      "Convert JPG images to PNG for lossless quality and transparency support. Runs in your browser — your files never leave your device.",
    headline: "JPG to PNG converter",
    description:
      "Convert JPG files to PNG when you need lossless quality or plan to add transparency later. PNG uses lossless compression, so the output won't degrade further on re-saves.",
    typicalSizeChange: "2-5x larger",
    sizeChangeDirection: "larger",
    useCases: [
      "Preparing images for editing workflows that require lossless formats",
      "Converting photos that need a transparency layer added later",
      "Archiving images in a format that won't degrade on re-saves",
      "Screenshots and UI mockups that need pixel-perfect clarity",
    ],
    browserSupport: { chrome: true, firefox: true, safari: true, edge: true },
    browserSupportNote: "PNG is universally supported across all browsers and devices.",
    prosOfTarget: [
      "Lossless compression — no quality loss on re-saves",
      "Supports full alpha transparency",
      "Ideal for text, line art, and sharp-edged graphics",
    ],
    consOfTarget: [
      "Significantly larger file size than JPG for photos",
      "No adjustable quality slider — always lossless",
      "Not optimal for photographic content on bandwidth-limited pages",
    ],
  },
  {
    slug: "jpg-to-webp",
    sourceFormat: "jpg",
    targetFormat: "webp",
    sourceLabel: "JPG",
    targetLabel: "WebP",
    title: "Convert JPG to WebP online — free, private, no upload",
    metaDescription:
      "Convert JPG images to WebP for 25-35% smaller files at the same visual quality. Browser-based, no uploads, completely private.",
    headline: "JPG to WebP converter",
    description:
      "Convert JPG files to WebP to cut file size without losing visible quality. WebP's lossy compression outperforms JPG at equivalent quality settings, making it the preferred format for web delivery.",
    typicalSizeChange: "25-35% smaller",
    sizeChangeDirection: "smaller",
    useCases: [
      "Optimizing product photos for e-commerce sites",
      "Reducing page weight for Core Web Vitals scores",
      "Batch-converting blog post images for faster load times",
      "Mobile-first sites where bandwidth matters",
    ],
    browserSupport: { chrome: true, firefox: true, safari: true, edge: true },
    browserSupportNote:
      "WebP is supported in all modern browsers including Safari 14+, Chrome, Firefox, and Edge.",
    prosOfTarget: [
      "Smaller files than JPG at the same visual quality",
      "Supports transparency, unlike JPG",
      "Modern format optimized for web delivery",
    ],
    consOfTarget: [
      "Not natively supported by some older image editing tools",
      "Slightly slower to encode than JPG in some implementations",
      "Less universal than JPG for non-web uses like print",
    ],
  },
  {
    slug: "webp-to-png",
    sourceFormat: "webp",
    targetFormat: "png",
    sourceLabel: "WebP",
    targetLabel: "PNG",
    title: "Convert WebP to PNG online — free, private, no upload",
    metaDescription:
      "Convert WebP images to PNG for maximum compatibility and lossless quality. Runs entirely in your browser — nothing is uploaded.",
    headline: "WebP to PNG converter",
    description:
      "Convert WebP files to PNG when you need broad compatibility or a lossless format for editing. PNG is accepted everywhere and won't lose quality on repeated saves.",
    typicalSizeChange: "2-4x larger",
    sizeChangeDirection: "larger",
    useCases: [
      "Sharing images with people who can't open WebP files",
      "Importing web images into older design tools",
      "Converting downloaded images for use in presentations",
      "Archiving images in a universally supported format",
    ],
    browserSupport: { chrome: true, firefox: true, safari: true, edge: true },
    browserSupportNote: "PNG is supported in every browser and image viewer.",
    prosOfTarget: [
      "Universal compatibility — works everywhere",
      "Lossless compression preserves full quality",
      "Supports alpha transparency",
    ],
    consOfTarget: [
      "Larger file size than WebP",
      "Not optimal for web delivery compared to WebP",
      "Overkill for simple photos where some compression is acceptable",
    ],
  },
  {
    slug: "webp-to-jpg",
    sourceFormat: "webp",
    targetFormat: "jpg",
    sourceLabel: "WebP",
    targetLabel: "JPG",
    title: "Convert WebP to JPG online — free, private, no upload",
    metaDescription:
      "Convert WebP images to JPG for universal compatibility. Browser-based conversion, no uploads, free and private.",
    headline: "WebP to JPG converter",
    description:
      "Convert WebP files to JPG when you need a format that works everywhere. JPG is the most widely supported image format and is accepted by virtually every platform, tool, and device.",
    typicalSizeChange: "10-30% larger",
    sizeChangeDirection: "larger",
    useCases: [
      "Uploading to platforms that don't accept WebP",
      "Attaching images in emails where WebP may not render",
      "Printing photos from web downloads",
      "Using images in legacy software that only supports JPG",
    ],
    browserSupport: { chrome: true, firefox: true, safari: true, edge: true },
    browserSupportNote: "JPG is the most widely supported image format in existence.",
    prosOfTarget: [
      "Works on every device, browser, and platform",
      "Compact file sizes for photographic content",
      "Accepted by all social media and email platforms",
    ],
    consOfTarget: [
      "Lossy compression — quality degrades on re-saves",
      "No transparency support",
      "Larger than WebP at equivalent quality levels",
    ],
  },
];

export function getConversionData(slug: string): ConversionRoute | null {
  return CONVERSION_ROUTES.find((route) => route.slug === slug) ?? null;
}

export function getAllConversionSlugs(): string[] {
  return CONVERSION_ROUTES.map((route) => route.slug);
}

export function getRelatedConversions(currentSlug: string): ConversionRoute[] {
  const current = getConversionData(currentSlug);
  if (!current) return [];

  return CONVERSION_ROUTES.filter(
    (route) =>
      route.slug !== currentSlug &&
      (route.sourceFormat === current.sourceFormat ||
        route.targetFormat === current.targetFormat)
  );
}
