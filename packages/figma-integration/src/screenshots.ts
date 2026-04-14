/**
 * @harness/figma-integration — Screenshot capture for visual QA baseline.
 *
 * Captures screenshots of Figma design frames and saves them to
 * .harness/design-screenshots/ for use in visual QA comparisons.
 */

import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

export interface ScreenshotResult {
  pageSlug: string;
  viewport: string;
  filePath: string;
  width: number;
  height: number;
}

export interface ScreenshotOptions {
  outputDir: string;
  format: "png" | "jpg";
  scale: number;
}

export interface FigmaScreenshotMcpClient {
  getScreenshot(params: {
    fileKey: string;
    nodeId: string;
    format?: string;
    scale?: number;
  }): Promise<{ imageData: Uint8Array; width: number; height: number }>;
}

export interface PageScreenshotInput {
  pageSlug: string;
  nodeId: string;
  viewport: "desktop" | "mobile";
  width: number;
  height: number;
}

const DEFAULT_OPTIONS: ScreenshotOptions = {
  outputDir: ".harness/design-screenshots",
  format: "png",
  scale: 2,
};

/**
 * Parse the file key from a Figma URL.
 */
export function parseFigmaFileKey(url: string): string | null {
  const patterns = [
    /figma\.com\/design\/([a-zA-Z0-9]+)/,
    /figma\.com\/file\/([a-zA-Z0-9]+)/,
    /figma\.com\/make\/([a-zA-Z0-9]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Capture screenshots for all design pages and save to the output directory.
 * Each screenshot is named: {pageSlug}-{viewport}.{format}
 */
export async function captureDesignScreenshots(
  figmaUrl: string,
  pages: PageScreenshotInput[],
  mcpClient: FigmaScreenshotMcpClient,
  options: Partial<ScreenshotOptions> = {}
): Promise<ScreenshotResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const fileKey = parseFigmaFileKey(figmaUrl);
  if (!fileKey) {
    throw new Error(`Invalid Figma URL: cannot extract file key from "${figmaUrl}"`);
  }

  await mkdir(opts.outputDir, { recursive: true });

  const results: ScreenshotResult[] = [];

  for (const page of pages) {
    const fileName = `${page.pageSlug}-${page.viewport}.${opts.format}`;
    const filePath = join(opts.outputDir, fileName);

    const screenshot = await mcpClient.getScreenshot({
      fileKey,
      nodeId: page.nodeId,
      format: opts.format,
      scale: opts.scale,
    });

    await writeFile(filePath, screenshot.imageData);

    results.push({
      pageSlug: page.pageSlug,
      viewport: page.viewport,
      filePath,
      width: screenshot.width,
      height: screenshot.height,
    });
  }

  return results;
}

/**
 * Generate a markdown manifest of all captured screenshots.
 * Useful for visual QA review.
 */
export function formatScreenshotManifest(results: ScreenshotResult[]): string {
  const lines: string[] = [
    "# Design Screenshots",
    "",
    "Visual QA baseline captured from Figma designs.",
    "",
    "| Page | Viewport | Dimensions | Path |",
    "|---|---|---|---|",
  ];

  for (const r of results) {
    lines.push(
      `| ${r.pageSlug} | ${r.viewport} | ${r.width}x${r.height} | \`${r.filePath}\` |`
    );
  }

  lines.push("");
  return lines.join("\n");
}
