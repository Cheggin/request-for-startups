import { describe, test, expect } from "bun:test";
import { parseApiRoutes, groupByResource, generateRoutes } from "./generator.js";

describe("parseApiRoutes", () => {
  test("returns empty array for spec with no API Routes section", () => {
    const result = parseApiRoutes("# Product Spec\nSome content.");
    expect(result).toEqual([]);
  });

  test("parses a single route from spec", () => {
    const spec = `### API Routes
**GET /api/users**
description: List all users
auth: required
`;
    const routes = parseApiRoutes(spec);
    expect(routes.length).toBe(1);
    expect(routes[0].method).toBe("GET");
    expect(routes[0].path).toBe("/api/users");
    expect(routes[0].auth).toBe("required");
  });

  test("parses multiple routes", () => {
    const spec = `### API Routes
**GET /api/users**
description: List users

**POST /api/users**
description: Create user
`;
    const routes = parseApiRoutes(spec);
    expect(routes.length).toBe(2);
    expect(routes[0].method).toBe("GET");
    expect(routes[1].method).toBe("POST");
  });
});

describe("groupByResource", () => {
  test("groups routes by resource name", () => {
    const routes = [
      { method: "GET", path: "/api/users", description: "", auth: "none" as const, inputFields: [], outputFields: [], errors: [] },
      { method: "POST", path: "/api/users", description: "", auth: "none" as const, inputFields: [], outputFields: [], errors: [] },
      { method: "GET", path: "/api/posts", description: "", auth: "none" as const, inputFields: [], outputFields: [], errors: [] },
    ];
    const groups = groupByResource(routes);
    expect(groups.get("users")?.length).toBe(2);
    expect(groups.get("posts")?.length).toBe(1);
  });

  test("returns empty map for no routes", () => {
    const groups = groupByResource([]);
    expect(groups.size).toBe(0);
  });
});

describe("generateRoutes", () => {
  test("returns empty array for spec with no routes", () => {
    const result = generateRoutes("# Empty spec", "schema.ts");
    expect(result).toEqual([]);
  });
});
