/**
 * @harness/figma-integration — Design generation via Figma MCP.
 *
 * Calls the Figma MCP tool (mcp__figma__generate_figma_design) for each page
 * defined in the product spec, applying the design system consistently.
 */

import type { DesignSystem } from "./design-system.js";

export interface PageSpec {
  name: string;
  slug: string;
  description: string;
  layout: string;
  contentRequirements: string[];
  responsive: boolean;
}

export interface GeneratedDesign {
  pageSlug: string;
  pageName: string;
  figmaNodeId: string;
  figmaUrl: string;
  variants: DesignVariant[];
}

export interface DesignVariant {
  viewport: "desktop" | "mobile";
  nodeId: string;
  width: number;
  height: number;
}

export interface GenerateDesignsResult {
  figmaFileUrl: string;
  designs: GeneratedDesign[];
  errors: Array<{ pageSlug: string; error: string }>;
}

export interface FigmaDesignMcpClient {
  generateFigmaDesign(params: {
    description: string;
    designSystem?: string;
    viewport?: string;
  }): Promise<{ nodeId: string; fileUrl: string }>;
}

/**
 * Build the design prompt for a single page, incorporating the design system.
 */
export function buildDesignPrompt(page: PageSpec, designSystem: DesignSystem): string {
  const colorTokens = designSystem.colors
    .map((c) => `${c.name}: ${c.value}`)
    .join(", ");

  const typographyTokens = designSystem.typography
    .map((t) => `${t.name}: ${t.value}`)
    .join(", ");

  const spacingTokens = designSystem.spacing
    .map((s) => `${s.name}: ${s.value}`)
    .join(", ");

  const lines = [
    `Page: ${page.name}`,
    `Layout: ${page.layout}`,
    `Description: ${page.description}`,
    "",
    "Content requirements:",
    ...page.contentRequirements.map((r) => `- ${r}`),
    "",
    "Design system tokens:",
    `Colors: ${colorTokens || "none specified"}`,
    `Typography: ${typographyTokens || "none specified"}`,
    `Spacing: ${spacingTokens || "none specified"}`,
  ];

  return lines.join("\n");
}

/**
 * Generate designs for all pages in the spec by calling the Figma MCP tool
 * once per page (and once per viewport if responsive).
 */
export async function generateDesigns(
  pages: PageSpec[],
  designSystem: DesignSystem,
  mcpClient: FigmaDesignMcpClient
): Promise<GenerateDesignsResult> {
  const designs: GeneratedDesign[] = [];
  const errors: Array<{ pageSlug: string; error: string }> = [];
  let figmaFileUrl = "";

  for (const page of pages) {
    try {
      const prompt = buildDesignPrompt(page, designSystem);

      // Desktop variant
      const desktopResult = await mcpClient.generateFigmaDesign({
        description: `${prompt}\n\nViewport: desktop (1440px wide)`,
        designSystem: JSON.stringify(designSystem.rawVariables),
        viewport: "desktop",
      });

      figmaFileUrl = figmaFileUrl || desktopResult.fileUrl;

      const variants: DesignVariant[] = [
        { viewport: "desktop", nodeId: desktopResult.nodeId, width: 1440, height: 900 },
      ];

      // Mobile variant if responsive
      if (page.responsive) {
        const mobileResult = await mcpClient.generateFigmaDesign({
          description: `${prompt}\n\nViewport: mobile (390px wide, mobile-first layout)`,
          designSystem: JSON.stringify(designSystem.rawVariables),
          viewport: "mobile",
        });

        variants.push({
          viewport: "mobile",
          nodeId: mobileResult.nodeId,
          width: 390,
          height: 844,
        });
      }

      designs.push({
        pageSlug: page.slug,
        pageName: page.name,
        figmaNodeId: desktopResult.nodeId,
        figmaUrl: desktopResult.fileUrl,
        variants,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ pageSlug: page.slug, error: message });
    }
  }

  return { figmaFileUrl, designs, errors };
}

/**
 * Parse page definitions from a product spec markdown string.
 * Expects H2 sections with YAML-like metadata.
 */
export function parsePageSpecs(specMarkdown: string): PageSpec[] {
  const pages: PageSpec[] = [];
  const pageBlocks = specMarkdown.split(/^## /m).slice(1);

  for (const block of pageBlocks) {
    const lines = block.trim().split("\n");
    const name = lines[0]?.trim() ?? "";
    if (!name) continue;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let description = "";
    let layout = "single-column";
    const contentRequirements: string[] = [];
    let responsive = true;

    for (const line of lines.slice(1)) {
      const trimmed = line.trim();
      if (trimmed.startsWith("Layout:")) {
        layout = trimmed.replace("Layout:", "").trim();
      } else if (trimmed.startsWith("Responsive:")) {
        responsive = trimmed.replace("Responsive:", "").trim().toLowerCase() !== "false";
      } else if (trimmed.startsWith("- ")) {
        contentRequirements.push(trimmed.slice(2));
      } else if (trimmed && !description) {
        description = trimmed;
      }
    }

    pages.push({ name, slug, description, layout, contentRequirements, responsive });
  }

  return pages;
}
