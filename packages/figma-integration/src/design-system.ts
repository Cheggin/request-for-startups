/**
 * @harness/figma-integration — Design system extraction.
 *
 * Extracts colors, typography, and spacing from a Figma file
 * and writes a structured design-system.md to .harness/.
 */

export interface DesignToken {
  name: string;
  value: string;
  type: "color" | "typography" | "spacing" | "radius" | "shadow";
}

export interface DesignSystem {
  colors: DesignToken[];
  typography: DesignToken[];
  spacing: DesignToken[];
  radius: DesignToken[];
  shadows: DesignToken[];
  rawVariables: Record<string, string>;
}

/**
 * Extract the design system from a Figma file via MCP tools.
 * Returns structured tokens for colors, typography, spacing, etc.
 *
 * Calls mcp__figma__get_variable_defs to pull Figma variables,
 * then normalizes them into our DesignToken format.
 */
export async function extractDesignSystem(
  figmaUrl: string,
  mcpClient: FigmaMcpClient
): Promise<DesignSystem> {
  const fileKey = parseFigmaFileKey(figmaUrl);
  if (!fileKey) {
    throw new Error(`Invalid Figma URL: cannot extract file key from "${figmaUrl}"`);
  }

  const variables = await mcpClient.getVariableDefs({ fileKey });

  const tokens = classifyVariables(variables);

  return tokens;
}

/**
 * Write the design system to .harness/design-system.md in a human-readable format.
 */
export function formatDesignSystemMarkdown(ds: DesignSystem): string {
  const lines: string[] = [
    "# Design System",
    "",
    "Auto-extracted from Figma. Do not edit manually — regenerate from source.",
    "",
  ];

  if (ds.colors.length > 0) {
    lines.push("## Colors", "");
    lines.push("| Token | Value |", "|---|---|");
    for (const t of ds.colors) {
      lines.push(`| ${t.name} | \`${t.value}\` |`);
    }
    lines.push("");
  }

  if (ds.typography.length > 0) {
    lines.push("## Typography", "");
    lines.push("| Token | Value |", "|---|---|");
    for (const t of ds.typography) {
      lines.push(`| ${t.name} | \`${t.value}\` |`);
    }
    lines.push("");
  }

  if (ds.spacing.length > 0) {
    lines.push("## Spacing", "");
    lines.push("| Token | Value |", "|---|---|");
    for (const t of ds.spacing) {
      lines.push(`| ${t.name} | \`${t.value}\` |`);
    }
    lines.push("");
  }

  if (ds.radius.length > 0) {
    lines.push("## Border Radius", "");
    lines.push("| Token | Value |", "|---|---|");
    for (const t of ds.radius) {
      lines.push(`| ${t.name} | \`${t.value}\` |`);
    }
    lines.push("");
  }

  if (ds.shadows.length > 0) {
    lines.push("## Shadows", "");
    lines.push("| Token | Value |", "|---|---|");
    for (const t of ds.shadows) {
      lines.push(`| ${t.name} | \`${t.value}\` |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// --- Internal helpers ---

export interface FigmaMcpClient {
  getVariableDefs(params: { fileKey: string }): Promise<FigmaVariable[]>;
}

export interface FigmaVariable {
  name: string;
  resolvedType: string;
  valuesByMode: Record<string, string>;
}

/**
 * Parse the file key from a Figma URL.
 * Supports: figma.com/design/:fileKey/..., figma.com/file/:fileKey/...
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

const TYPE_CLASSIFICATION: Record<string, DesignToken["type"]> = {
  COLOR: "color",
  FLOAT: "spacing",
};

const NAME_HINTS: Array<{ pattern: RegExp; type: DesignToken["type"] }> = [
  { pattern: /color|fill|stroke|bg|background|border-color/i, type: "color" },
  { pattern: /font|text|heading|body|caption|typography|type/i, type: "typography" },
  { pattern: /space|gap|padding|margin|spacing/i, type: "spacing" },
  { pattern: /radius|corner|rounded/i, type: "radius" },
  { pattern: /shadow|elevation|drop/i, type: "shadow" },
];

/**
 * Classify raw Figma variables into typed design tokens.
 */
export function classifyVariables(variables: FigmaVariable[]): DesignSystem {
  const ds: DesignSystem = {
    colors: [],
    typography: [],
    spacing: [],
    radius: [],
    shadows: [],
    rawVariables: {},
  };

  for (const v of variables) {
    const value = Object.values(v.valuesByMode)[0] ?? "";
    ds.rawVariables[v.name] = value;

    const tokenType = inferTokenType(v);
    if (!tokenType) continue;

    const token: DesignToken = { name: v.name, value, type: tokenType };

    switch (tokenType) {
      case "color":
        ds.colors.push(token);
        break;
      case "typography":
        ds.typography.push(token);
        break;
      case "spacing":
        ds.spacing.push(token);
        break;
      case "radius":
        ds.radius.push(token);
        break;
      case "shadow":
        ds.shadows.push(token);
        break;
    }
  }

  return ds;
}

function inferTokenType(v: FigmaVariable): DesignToken["type"] | null {
  // First: check name-based hints (more specific)
  for (const hint of NAME_HINTS) {
    if (hint.pattern.test(v.name)) return hint.type;
  }
  // Fallback: use Figma's resolvedType
  return TYPE_CLASSIFICATION[v.resolvedType] ?? null;
}
