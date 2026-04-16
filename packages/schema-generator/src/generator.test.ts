import { describe, it, expect } from "vitest";
import { generateSchema, toTableName, mapType, parseDataModels } from "./generator.js";
import type { ParsedEntity } from "./generator.js";

describe("toTableName", () => {
  it("converts PascalCase to camelCase plural", () => {
    expect(toTableName("User")).toBe("users");
    expect(toTableName("Project")).toBe("projects");
  });

  it("handles names ending in s/x/z", () => {
    expect(toTableName("Address")).toBe("addresses");
    expect(toTableName("Box")).toBe("boxes");
  });

  it("handles names ending in consonant+y", () => {
    expect(toTableName("Category")).toBe("categories");
    expect(toTableName("Company")).toBe("companies");
  });

  it("handles names ending in vowel+y", () => {
    expect(toTableName("Survey")).toBe("surveys");
    expect(toTableName("Key")).toBe("keys");
  });
});

describe("mapType", () => {
  it("maps basic types to Convex validators", () => {
    expect(mapType("string", [])).toBe("v.string()");
    expect(mapType("number", [])).toBe("v.number()");
    expect(mapType("boolean", [])).toBe("v.boolean()");
    expect(mapType("float", [])).toBe("v.float64()");
  });

  it("maps Id references", () => {
    expect(mapType('Id<"users">', [])).toBe('v.id("users")');
  });

  it("maps entity name references to v.id", () => {
    expect(mapType("User", ["User", "Project"])).toBe('v.id("users")');
  });

  it("maps array types", () => {
    expect(mapType("string[]", [])).toBe("v.array(v.string())");
    expect(mapType("Array<number>", [])).toBe("v.array(v.number())");
  });

  it("maps object/json to v.any()", () => {
    expect(mapType("object", [])).toBe("v.any()");
    expect(mapType("json", [])).toBe("v.any()");
  });

  it("defaults unknown types to v.string()", () => {
    expect(mapType("unknownType", [])).toBe("v.string()");
  });
});

describe("parseDataModels", () => {
  it("parses entities from a spec with Data Models section", () => {
    const spec = `## 3. Data Models

**User**
- email: string
- name: string
- role: string (optional)

**Project**
- title: string
- ownerId: Id<"users">
- status: string
`;
    const entities = parseDataModels(spec);
    expect(entities.length).toBe(2);
    expect(entities[0].name).toBe("User");
    expect(entities[0].tableName).toBe("users");
    expect(entities[0].fields.length).toBeGreaterThanOrEqual(2);
    expect(entities[1].name).toBe("Project");
  });

  it("auto-generates indexes for email, slug, status fields", () => {
    const spec = `### Data Models

**User**
- email: string
- slug: string
- status: string
`;
    const entities = parseDataModels(spec);
    expect(entities[0].indexes).toContain("by_email");
    expect(entities[0].indexes).toContain("by_slug");
    expect(entities[0].indexes).toContain("by_status");
  });

  it("returns empty array when no Data Models section", () => {
    expect(parseDataModels("# Some spec\nNo data models here")).toEqual([]);
  });

  it("detects optional fields", () => {
    const spec = `### Data Models

**User**
- bio: string (optional)
`;
    const entities = parseDataModels(spec);
    const bioField = entities[0].fields.find((f) => f.name === "bio");
    expect(bioField?.optional).toBe(true);
  });
});

describe("generateSchema", () => {
  it("produces valid Convex schema imports", () => {
    const spec = `### Data Models

**User**
- email: string
- name: string
`;
    const schema = generateSchema(spec);
    expect(schema).toContain('import { defineSchema, defineTable }');
    expect(schema).toContain('import { v }');
    expect(schema).toContain("defineTable");
  });

  it("produces fallback schema when no data models found", () => {
    const schema = generateSchema("No models here");
    expect(schema).toContain("defineSchema");
    expect(schema).toContain("No data models were found");
  });

  it("includes createdAt and updatedAt on every table", () => {
    const spec = `### Data Models

**Task**
- title: string
`;
    const schema = generateSchema(spec);
    expect(schema).toContain("createdAt: v.number()");
    expect(schema).toContain("updatedAt: v.number()");
  });
});
