/**
 * Orders features by dependency using topological sort.
 * Foundation features come first, dependent features later.
 */

export interface FeatureNode {
  name: string;
  dependencies: string[];
  priority: "P0" | "P1" | "P2";
  category: "frontend" | "backend" | "fullstack";
  size: "S" | "M" | "L";
}

/**
 * Perform a topological sort on features based on their dependencies.
 * Features with no dependencies come first.
 * Within the same dependency depth, P0 > P1 > P2.
 *
 * Throws if a circular dependency is detected.
 */
export function topologicalSort(features: FeatureNode[]): FeatureNode[] {
  const featureMap = new Map<string, FeatureNode>();
  for (const f of features) {
    featureMap.set(f.name, f);
  }

  // Build adjacency list (reverse: dependents point to what they depend on)
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, string[]>();

  for (const f of features) {
    if (!inDegree.has(f.name)) inDegree.set(f.name, 0);
    if (!dependents.has(f.name)) dependents.set(f.name, []);

    for (const dep of f.dependencies) {
      // Only count dependencies that exist in the feature set
      if (featureMap.has(dep)) {
        inDegree.set(f.name, (inDegree.get(f.name) ?? 0) + 1);
        if (!dependents.has(dep)) dependents.set(dep, []);
        dependents.get(dep)!.push(f.name);
      }
    }
  }

  // Kahn's algorithm
  const priorityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2 };
  const queue: FeatureNode[] = [];

  for (const f of features) {
    if ((inDegree.get(f.name) ?? 0) === 0) {
      queue.push(f);
    }
  }

  // Sort queue by priority (P0 first)
  queue.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const sorted: FeatureNode[] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.name)) continue;
    visited.add(current.name);
    sorted.push(current);

    const deps = dependents.get(current.name) ?? [];
    for (const depName of deps) {
      const newDegree = (inDegree.get(depName) ?? 1) - 1;
      inDegree.set(depName, newDegree);
      if (newDegree === 0) {
        const depNode = featureMap.get(depName)!;
        queue.push(depNode);
      }
    }

    // Re-sort queue by priority after adding new items
    queue.sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  if (sorted.length !== features.length) {
    const missing = features
      .filter((f) => !visited.has(f.name))
      .map((f) => f.name);
    throw new Error(
      `Circular dependency detected among features: ${missing.join(", ")}`
    );
  }

  return sorted;
}

/**
 * Compute the depth (longest path from root) for each feature.
 * Used to determine build order layers.
 */
export function computeDepth(features: FeatureNode[]): Map<string, number> {
  const featureMap = new Map<string, FeatureNode>();
  for (const f of features) {
    featureMap.set(f.name, f);
  }

  const depths = new Map<string, number>();
  const memo = new Map<string, number>();

  function getDepth(name: string): number {
    if (memo.has(name)) return memo.get(name)!;

    const feature = featureMap.get(name);
    if (!feature || feature.dependencies.length === 0) {
      memo.set(name, 0);
      return 0;
    }

    let maxDepth = 0;
    for (const dep of feature.dependencies) {
      if (featureMap.has(dep)) {
        maxDepth = Math.max(maxDepth, getDepth(dep) + 1);
      }
    }

    memo.set(name, maxDepth);
    return maxDepth;
  }

  for (const f of features) {
    depths.set(f.name, getDepth(f.name));
  }

  return depths;
}

/**
 * Group features into build layers based on dependency depth.
 * Layer 0 = no dependencies (foundation), layer 1 = depends on layer 0, etc.
 */
export function groupByLayer(features: FeatureNode[]): FeatureNode[][] {
  const depths = computeDepth(features);
  const layers = new Map<number, FeatureNode[]>();

  for (const f of features) {
    const depth = depths.get(f.name) ?? 0;
    if (!layers.has(depth)) layers.set(depth, []);
    layers.get(depth)!.push(f);
  }

  const maxLayer = Math.max(...Array.from(layers.keys()), 0);
  const result: FeatureNode[][] = [];
  for (let i = 0; i <= maxLayer; i++) {
    result.push(layers.get(i) ?? []);
  }

  return result;
}
