export {
  decompose,
  parseFeatures,
  parseFeatureBlock,
  toKebabCase,
  generateFeatureChecklist,
  buildIssueBody,
  buildIssueLabels,
} from "./decomposer.js";
export type {
  ParsedFeature,
  DecomposeOptions,
  DecomposeResult,
} from "./decomposer.js";

export {
  topologicalSort,
  computeDepth,
  groupByLayer,
} from "./dependency-graph.js";
export type { FeatureNode } from "./dependency-graph.js";
