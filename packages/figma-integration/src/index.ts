/**
 * @harness/figma-integration — Figma MCP integration for design generation and visual QA.
 */

export {
  generateDesigns,
  buildDesignPrompt,
  parsePageSpecs,
} from "./generator.js";
export type {
  PageSpec,
  GeneratedDesign,
  DesignVariant,
  GenerateDesignsResult,
  FigmaDesignMcpClient,
} from "./generator.js";

export {
  captureDesignScreenshots,
  formatScreenshotManifest,
  parseFigmaFileKey,
} from "./screenshots.js";
export type {
  ScreenshotResult,
  ScreenshotOptions,
  FigmaScreenshotMcpClient,
  PageScreenshotInput,
} from "./screenshots.js";

export {
  extractDesignSystem,
  formatDesignSystemMarkdown,
  classifyVariables,
  parseFigmaFileKey as parseFigmaFileKeyFromDesignSystem,
} from "./design-system.js";
export type {
  DesignToken,
  DesignSystem,
  FigmaMcpClient,
  FigmaVariable,
} from "./design-system.js";
