import { describe, it, expect } from "bun:test";
import {
  topologicalSort,
  computeDepth,
  groupByLayer,
  type FeatureNode,
} from "./dependency-graph.js";

function makeNode(
  name: string,
  deps: string[] = [],
  priority: "P0" | "P1" | "P2" = "P0"
): FeatureNode {
  return {
    name,
    dependencies: deps,
    priority,
    category: "fullstack",
    size: "M",
  };
}

describe("dependency-graph", () => {
  describe("topologicalSort", () => {
    it("returns features with no dependencies first", () => {
      const features = [
        makeNode("Dashboard", ["Auth"]),
        makeNode("Auth"),
        makeNode("Landing"),
      ];
      const sorted = topologicalSort(features);
      const names = sorted.map((f) => f.name);

      expect(names.indexOf("Auth")).toBeLessThan(
        names.indexOf("Dashboard")
      );
    });

    it("handles a linear chain", () => {
      const features = [
        makeNode("C", ["B"]),
        makeNode("B", ["A"]),
        makeNode("A"),
      ];
      const sorted = topologicalSort(features);
      expect(sorted.map((f) => f.name)).toEqual(["A", "B", "C"]);
    });

    it("handles features with no dependencies", () => {
      const features = [
        makeNode("A"),
        makeNode("B"),
        makeNode("C"),
      ];
      const sorted = topologicalSort(features);
      expect(sorted).toHaveLength(3);
    });

    it("prioritizes P0 over P1 at the same depth", () => {
      const features = [
        makeNode("B", [], "P1"),
        makeNode("A", [], "P0"),
        makeNode("C", [], "P2"),
      ];
      const sorted = topologicalSort(features);
      expect(sorted[0].name).toBe("A");
      expect(sorted[2].name).toBe("C");
    });

    it("throws on circular dependencies", () => {
      const features = [
        makeNode("A", ["B"]),
        makeNode("B", ["A"]),
      ];
      expect(() => topologicalSort(features)).toThrow(
        /circular dependency/i
      );
    });

    it("ignores dependencies on features not in the set", () => {
      const features = [
        makeNode("A", ["NonExistent"]),
        makeNode("B"),
      ];
      const sorted = topologicalSort(features);
      expect(sorted).toHaveLength(2);
    });

    it("handles diamond dependencies", () => {
      const features = [
        makeNode("D", ["B", "C"]),
        makeNode("B", ["A"]),
        makeNode("C", ["A"]),
        makeNode("A"),
      ];
      const sorted = topologicalSort(features);
      const names = sorted.map((f) => f.name);

      expect(names.indexOf("A")).toBeLessThan(names.indexOf("B"));
      expect(names.indexOf("A")).toBeLessThan(names.indexOf("C"));
      expect(names.indexOf("B")).toBeLessThan(names.indexOf("D"));
      expect(names.indexOf("C")).toBeLessThan(names.indexOf("D"));
    });
  });

  describe("computeDepth", () => {
    it("assigns depth 0 to root features", () => {
      const features = [makeNode("A"), makeNode("B")];
      const depths = computeDepth(features);
      expect(depths.get("A")).toBe(0);
      expect(depths.get("B")).toBe(0);
    });

    it("assigns correct depths for a chain", () => {
      const features = [
        makeNode("C", ["B"]),
        makeNode("B", ["A"]),
        makeNode("A"),
      ];
      const depths = computeDepth(features);
      expect(depths.get("A")).toBe(0);
      expect(depths.get("B")).toBe(1);
      expect(depths.get("C")).toBe(2);
    });

    it("assigns depth based on longest path", () => {
      const features = [
        makeNode("D", ["B", "C"]),
        makeNode("B", ["A"]),
        makeNode("C"),
        makeNode("A"),
      ];
      const depths = computeDepth(features);
      // D depends on B (depth 1) and C (depth 0), so D = 2
      expect(depths.get("D")).toBe(2);
    });
  });

  describe("groupByLayer", () => {
    it("groups features into dependency layers", () => {
      const features = [
        makeNode("C", ["B"]),
        makeNode("B", ["A"]),
        makeNode("A"),
        makeNode("D"),
      ];
      const layers = groupByLayer(features);

      expect(layers).toHaveLength(3);
      expect(layers[0].map((f) => f.name).sort()).toEqual(["A", "D"]);
      expect(layers[1].map((f) => f.name)).toEqual(["B"]);
      expect(layers[2].map((f) => f.name)).toEqual(["C"]);
    });

    it("handles single layer (no dependencies)", () => {
      const features = [makeNode("A"), makeNode("B"), makeNode("C")];
      const layers = groupByLayer(features);
      expect(layers).toHaveLength(1);
      expect(layers[0]).toHaveLength(3);
    });
  });
});
