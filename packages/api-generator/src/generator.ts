/**
 * Generates Next.js API route files from a product spec's API Routes section.
 * Each route gets input validation via Zod, error handling, and JSDoc documentation.
 */

import { CRUD_TEMPLATE, AUTH_PROTECTED_TEMPLATE, WEBHOOK_HANDLER_TEMPLATE, FILE_UPLOAD_TEMPLATE } from "./templates.js";
import type { RouteTemplateOptions } from "./templates.js";

export interface ParsedRoute {
  method: string;
  path: string;
  description: string;
  auth: "required" | "optional" | "none";
  inputFields: { name: string; type: string; required: boolean }[];
  outputFields: { name: string; type: string }[];
  errors: string[];
}

export interface GeneratedRoute {
  /** File path relative to app/api/ directory */
  filePath: string;
  /** The generated file content */
  content: string;
  /** The resource name this route belongs to */
  resource: string;
}

/**
 * Parse the API Routes section from a product spec.
 */
function parseApiRoutes(spec: string): ParsedRoute[] {
  const routes: ParsedRoute[] = [];

  const routesMatch = spec.match(
    /###?\s*\d*\.?\s*API\s*Routes?\s*\n([\s\S]*?)(?=\n###?\s|\n##\s|$)/i
  );
  if (!routesMatch) {
    return routes;
  }

  const section = routesMatch[1];

  // Split by route headers (bold method + path pattern)
  const routeBlocks = section.split(/\n(?=\*\*(?:GET|POST|PUT|PATCH|DELETE)\s)/);

  for (const block of routeBlocks) {
    const headerMatch = block.match(
      /\*\*(GET|POST|PUT|PATCH|DELETE)\s+([^\s*]+)\*\*/
    );
    if (!headerMatch) continue;

    const route: ParsedRoute = {
      method: headerMatch[1],
      path: headerMatch[2],
      description: "",
      auth: "none",
      inputFields: [],
      outputFields: [],
      errors: [],
    };

    // Extract description
    const descMatch = block.match(/description[:\s]+(.+)/i);
    if (descMatch) {
      route.description = descMatch[1].trim();
    } else {
      // Use first non-empty line after header as description
      const lines = block.split("\n").slice(1);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("-") && !trimmed.startsWith("*")) {
          route.description = trimmed;
          break;
        }
      }
    }

    // Extract auth requirement
    const authMatch = block.match(/auth[:\s]+(required|optional|none)/i);
    if (authMatch) {
      route.auth = authMatch[1].toLowerCase() as ParsedRoute["auth"];
    }

    // Extract input fields
    const inputSection = block.match(/input\s*(?:schema)?[:\s]*\n((?:\s*[-*]\s+.+\n?)+)/i);
    if (inputSection) {
      const fieldLines = inputSection[1].match(/[-*]\s+(\w+)[:\s]+(\w+)(?:\s*\(?(required|optional)?\)?)?/gi);
      if (fieldLines) {
        for (const line of fieldLines) {
          const fieldMatch = line.match(/[-*]\s+(\w+)[:\s]+(\w+)(?:\s*\(?(required|optional)?\)?)?/i);
          if (fieldMatch) {
            route.inputFields.push({
              name: fieldMatch[1],
              type: fieldMatch[2],
              required: fieldMatch[3]?.toLowerCase() !== "optional",
            });
          }
        }
      }
    }

    // Extract error codes
    const errorLines = block.match(/[-*]\s+(\d{3})[:\s]+(.+)/g);
    if (errorLines) {
      for (const line of errorLines) {
        route.errors.push(line.replace(/[-*]\s+/, "").trim());
      }
    }

    routes.push(route);
  }

  return routes;
}

/**
 * Group parsed routes by their resource name (first path segment after /api/).
 */
function groupByResource(routes: ParsedRoute[]): Map<string, ParsedRoute[]> {
  const groups = new Map<string, ParsedRoute[]>();

  for (const route of routes) {
    // Extract resource from path: /api/users/... -> users
    const match = route.path.match(/\/api\/(\w+)/);
    const resource = match ? match[1] : "misc";

    if (!groups.has(resource)) {
      groups.set(resource, []);
    }
    groups.get(resource)!.push(route);
  }

  return groups;
}

/**
 * Determine the best template to use for a group of routes.
 */
function selectTemplate(
  resource: string,
  routes: ParsedRoute[]
): { template: typeof CRUD_TEMPLATE; opts: RouteTemplateOptions } {
  const methods = new Set(routes.map((r) => r.method));
  const hasAuth = routes.some((r) => r.auth === "required");
  const isWebhook = resource.includes("webhook") || routes.some((r) => r.path.includes("webhook"));
  const isUpload = resource.includes("upload") || routes.some((r) => r.path.includes("upload"));

  // Collect fields from all routes for this resource
  const allFields = routes.flatMap((r) => r.inputFields);
  const uniqueFields = allFields.filter(
    (f, i, arr) => arr.findIndex((ff) => ff.name === f.name) === i
  );

  const opts: RouteTemplateOptions = {
    resource,
    auth: hasAuth,
    fields: uniqueFields.length > 0 ? uniqueFields : undefined,
  };

  if (isWebhook) {
    return { template: WEBHOOK_HANDLER_TEMPLATE, opts };
  }
  if (isUpload) {
    return { template: FILE_UPLOAD_TEMPLATE, opts };
  }
  if (hasAuth && methods.size <= 2) {
    return { template: AUTH_PROTECTED_TEMPLATE, opts };
  }
  return { template: CRUD_TEMPLATE, opts };
}

/**
 * Generate Next.js API route files from a product spec.
 *
 * @param spec - The full product-spec.md content
 * @param schemaPath - Path to the Convex schema file (for reference in generated code)
 * @returns Array of generated route files with their paths and content
 */
export function generateRoutes(
  spec: string,
  schemaPath: string
): GeneratedRoute[] {
  const parsedRoutes = parseApiRoutes(spec);

  if (parsedRoutes.length === 0) {
    return [];
  }

  const grouped = groupByResource(parsedRoutes);
  const generated: GeneratedRoute[] = [];

  for (const [resource, routes] of grouped) {
    const { template, opts } = selectTemplate(resource, routes);
    const content = template.generate(opts);

    // Add schema path reference as a comment at the top
    const withSchemaRef = `// Schema reference: ${schemaPath}\n${content}`;

    generated.push({
      filePath: `${resource}/route.ts`,
      content: withSchemaRef,
      resource,
    });
  }

  return generated;
}

// Export for testing
export { parseApiRoutes, groupByResource, selectTemplate };
