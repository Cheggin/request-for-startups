/**
 * Generates Convex schema.ts from a product spec's data models section.
 * Parses entity definitions and produces defineTable calls with validators and indexes.
 */

import { ALL_TEMPLATES, type TableTemplate } from "./templates.js";

/** Convex field type mapping from spec types to v.* validators */
const TYPE_MAP: Record<string, string> = {
  string: "v.string()",
  number: "v.number()",
  boolean: "v.boolean()",
  float: "v.float64()",
  any: "v.any()",
};

interface ParsedField {
  name: string;
  type: string;
  optional: boolean;
}

interface ParsedEntity {
  name: string;
  tableName: string;
  fields: ParsedField[];
  indexes: string[];
  relationships: { field: string; target: string }[];
}

/**
 * Convert a PascalCase or camelCase entity name to a camelCase table name.
 * E.g. "UserProfile" -> "userProfiles", "User" -> "users"
 */
function toTableName(entityName: string): string {
  const base = entityName.charAt(0).toLowerCase() + entityName.slice(1);
  if (base.endsWith("s") || base.endsWith("x") || base.endsWith("z")) {
    return base + "es";
  }
  if (base.endsWith("y") && !/[aeiou]y$/i.test(base)) {
    return base.slice(0, -1) + "ies";
  }
  return base + "s";
}

/**
 * Map a spec type string to a Convex validator string.
 */
function mapType(typeStr: string, allEntityNames: string[]): string {
  const trimmed = typeStr.trim().toLowerCase();

  // Check for Id<"tableName"> references
  const idMatch = typeStr.match(/Id<"(\w+)">/i);
  if (idMatch) {
    return `v.id("${idMatch[1]}")`;
  }

  // Check for references to other entities
  for (const entity of allEntityNames) {
    if (trimmed === entity.toLowerCase() || trimmed === `id<${entity.toLowerCase()}>`) {
      return `v.id("${toTableName(entity)}")`;
    }
  }

  // Check for array types
  const arrayMatch = typeStr.match(/array[<[(](.+)[>)\]]/i);
  if (arrayMatch) {
    return `v.array(${mapType(arrayMatch[1], allEntityNames)})`;
  }
  if (trimmed.endsWith("[]")) {
    const inner = typeStr.slice(0, -2).trim();
    return `v.array(${mapType(inner, allEntityNames)})`;
  }

  // Check for object type
  if (trimmed === "object" || trimmed === "json") {
    return "v.any()";
  }

  // Check basic types
  if (TYPE_MAP[trimmed]) {
    return TYPE_MAP[trimmed];
  }

  // Default to string for unknown types
  return "v.string()";
}

/**
 * Parse the data models section from a product spec markdown string.
 */
function parseDataModels(spec: string): ParsedEntity[] {
  const entities: ParsedEntity[] = [];

  // Find the Data Models section
  const dataModelsMatch = spec.match(
    /###?\s*\d*\.?\s*Data\s*Models?\s*\n([\s\S]*?)(?=\n###?\s|\n##\s|$)/i
  );
  if (!dataModelsMatch) {
    return entities;
  }

  const section = dataModelsMatch[1];

  // Split by entity headers (bold or #### level)
  const entityBlocks = section.split(/\n(?=\*\*[A-Z]|\n####\s)/);

  for (const block of entityBlocks) {
    const nameMatch = block.match(/\*\*(\w+)\*\*|####\s+(\w+)/);
    if (!nameMatch) continue;

    const entityName = nameMatch[1] || nameMatch[2];
    const entity: ParsedEntity = {
      name: entityName,
      tableName: toTableName(entityName),
      fields: [],
      indexes: [],
      relationships: [],
    };

    // Parse fields from list items
    const fieldLines = block.match(/[-*]\s+(\w+)[\s:]+(.+)/g);
    if (fieldLines) {
      for (const line of fieldLines) {
        const fieldMatch = line.match(/[-*]\s+(\w+)[\s:]+(.+)/);
        if (!fieldMatch) continue;

        const fieldName = fieldMatch[1].toLowerCase();
        if (fieldName === "fields" || fieldName === "relationships" || fieldName === "constraints") {
          continue;
        }

        const rest = fieldMatch[2];
        const isOptional = /optional/i.test(rest);
        const typeMatch = rest.match(
          /(string|number|boolean|float|Id<"\w+"?>|array[<[(].+[>)\]]|\w+\[\]|object|json|\w+)/i
        );
        const type = typeMatch ? typeMatch[1] : "string";

        entity.fields.push({
          name: fieldName,
          type,
          optional: isOptional,
        });

        // Detect relationships from Id references
        const relMatch = rest.match(/Id<"(\w+)">/i);
        if (relMatch) {
          entity.relationships.push({
            field: fieldName,
            target: relMatch[1],
          });
          // Auto-generate index for foreign key fields
          entity.indexes.push(`by_${fieldName}`);
        }
      }
    }

    // Auto-add common indexes for typical field names
    for (const field of entity.fields) {
      if (field.name === "email") entity.indexes.push("by_email");
      if (field.name === "slug") entity.indexes.push("by_slug");
      if (field.name === "status") entity.indexes.push("by_status");
    }

    // Deduplicate indexes
    entity.indexes = [...new Set(entity.indexes)];

    if (entity.fields.length > 0) {
      entities.push(entity);
    }
  }

  return entities;
}

/**
 * Generate a Convex schema.ts string from parsed entities.
 */
function buildSchema(entities: ParsedEntity[]): string {
  const allEntityNames = entities.map((e) => e.name);

  const tableDefinitions = entities.map((entity) => {
    const fields = entity.fields
      .map((f) => {
        const validator = mapType(f.type, allEntityNames);
        return f.optional
          ? `    ${f.name}: v.optional(${validator}),`
          : `    ${f.name}: ${validator},`;
      })
      .join("\n");

    const indexes = entity.indexes
      .map((idx) => {
        const fieldName = idx.replace("by_", "");
        return `    .index("${idx}", ["${fieldName}"])`;
      })
      .join("\n");

    const indexBlock = indexes ? `\n${indexes}` : "";

    return `  ${entity.tableName}: defineTable({\n${fields}\n    createdAt: v.number(),\n    updatedAt: v.number(),\n  })${indexBlock}`;
  });

  return `import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
${tableDefinitions.join(",\n\n")},
});
`;
}

/**
 * Check if a template matches an entity that will be generated,
 * to avoid duplicate table definitions.
 */
function findMatchingTemplates(entities: ParsedEntity[]): TableTemplate[] {
  const entityTableNames = new Set(entities.map((e) => e.tableName));
  return ALL_TEMPLATES.filter((t) => !entityTableNames.has(t.name));
}

/**
 * Generate a Convex schema.ts from a product spec string.
 * Parses the Data Models section and produces a complete schema file.
 *
 * @param spec - The full product-spec.md content
 * @returns The generated schema.ts content as a string
 */
export function generateSchema(spec: string): string {
  const entities = parseDataModels(spec);

  if (entities.length === 0) {
    // Fallback: return a minimal schema with common templates
    const templateDefs = ALL_TEMPLATES.slice(0, 3)
      .map((t) => `  ${t.definition}`)
      .join(",\n\n");

    return `import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Auto-generated Convex schema.
 * No data models were found in the spec — using common defaults.
 * Update this file as your data models are defined.
 */
export default defineSchema({
${templateDefs},
});
`;
  }

  return buildSchema(entities);
}

// Export for testing
export { parseDataModels, buildSchema, toTableName, mapType };
export type { ParsedEntity, ParsedField };
