import { convert } from "../lib/json-to-ts";

describe("convert", () => {
  it("converts simple object with string and number", () => {
    const json = '{"name": "Ada", "age": 30}';
    const result = convert(json);
    expect(result).toContain("export interface Root");
    expect(result).toContain("name: string;");
    expect(result).toContain("age: number;");
  });

  it("converts boolean and null types", () => {
    const json = '{"active": true, "deleted": null}';
    const result = convert(json);
    expect(result).toContain("active: boolean;");
    expect(result).toContain("deleted: null;");
  });

  it("handles nested objects with named interfaces", () => {
    const json = '{"user": {"address": {"city": "NYC"}}}';
    const result = convert(json);
    expect(result).toContain("interface Root");
    expect(result).toContain("user: User;");
    expect(result).toContain("interface User");
    expect(result).toContain("address: Address;");
    expect(result).toContain("interface Address");
    expect(result).toContain("city: string;");
  });

  it("handles homogeneous arrays", () => {
    const json = '{"ids": [1, 2, 3]}';
    const result = convert(json);
    expect(result).toContain("ids: number[];");
  });

  it("handles mixed arrays as union types", () => {
    const json = '{"mix": ["a", 1]}';
    const result = convert(json);
    expect(result).toContain("mix: (string | number)[];");
  });

  it("handles empty arrays as unknown[]", () => {
    const json = '{"empty": []}';
    const result = convert(json);
    expect(result).toContain("empty: unknown[];");
  });

  it("handles empty objects as Record<string, unknown>", () => {
    const json = '{"data": {}}';
    const result = convert(json);
    expect(result).toContain("data: Record<string, unknown>;");
  });

  it("detects optional fields in arrays of objects", () => {
    const json = JSON.stringify({
      users: [
        { name: "A", email: "a@b" },
        { name: "B" },
      ],
    });
    const result = convert(json);
    expect(result).toContain("name: string;");
    expect(result).toContain("email?: string;");
  });

  it("uses custom root name", () => {
    const json = '{"x": 1}';
    const result = convert(json, { rootName: "UserResponse" });
    expect(result).toContain("interface UserResponse");
  });

  it("generates type aliases with style: type", () => {
    const json = '{"x": 1}';
    const result = convert(json, { style: "type" });
    expect(result).toContain("export type Root = {");
    expect(result).toContain("};");
  });

  it("omits export keyword when exportKeyword is false", () => {
    const json = '{"x": 1}';
    const result = convert(json, { exportKeyword: false });
    expect(result).not.toContain("export ");
    expect(result).toContain("interface Root");
  });

  it("adds readonly modifier", () => {
    const json = '{"name": "Ada", "age": 30}';
    const result = convert(json, { readonly: true });
    expect(result).toContain("readonly name: string;");
    expect(result).toContain("readonly age: number;");
  });

  it("marks all properties optional with optional flag", () => {
    const json = '{"name": "Ada", "age": 30}';
    const result = convert(json, { optional: true });
    expect(result).toContain("name?: string;");
    expect(result).toContain("age?: number;");
  });

  it("handles arrays of objects with merged interfaces", () => {
    const json = JSON.stringify({
      items: [
        { id: 1, label: "one" },
        { id: 2, label: "two" },
      ],
    });
    const result = convert(json);
    expect(result).toContain("items: Items[];");
    expect(result).toContain("interface Items");
    expect(result).toContain("id: number;");
    expect(result).toContain("label: string;");
  });

  it("handles top-level arrays", () => {
    const json = '[{"a": 1}, {"a": 2}]';
    const result = convert(json);
    expect(result).toContain("type Root = RootItem[]");
    expect(result).toContain("interface RootItem");
  });

  it("throws on invalid JSON", () => {
    expect(() => convert("{invalid}")).toThrow("Invalid JSON");
  });

  it("handles string arrays", () => {
    const json = '{"tags": ["ts", "js", "go"]}';
    const result = convert(json);
    expect(result).toContain("tags: string[];");
  });

  it("handles deeply nested structures", () => {
    const json = JSON.stringify({
      a: { b: { c: { d: "deep" } } },
    });
    const result = convert(json);
    expect(result).toContain("interface Root");
    expect(result).toContain("interface A");
    expect(result).toContain("interface B");
    expect(result).toContain("interface C");
    expect(result).toContain("d: string;");
  });

  it("handles null in union with other types in arrays", () => {
    const json = JSON.stringify({
      users: [
        { name: "A", email: "a@b.com" },
        { name: "B", email: null },
      ],
    });
    const result = convert(json);
    expect(result).toContain("email: string | null;");
  });

  it("handles primitive top-level values", () => {
    expect(convert('"hello"')).toContain("type Root = string;");
    expect(convert("42")).toContain("type Root = number;");
    expect(convert("true")).toContain("type Root = boolean;");
    expect(convert("null")).toContain("type Root = null;");
  });
});
