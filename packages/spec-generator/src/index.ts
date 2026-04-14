export {
  generateSpec,
  buildSpecPrompt,
  parseSpecSections,
  validateSpec,
  execClaude,
} from "./generator.js";
export type {
  GenerateSpecOptions,
  ProductSpec,
  SpecSection,
} from "./generator.js";

export {
  detectStartupType,
  getTemplate,
  TEMPLATES,
} from "./templates.js";
export type {
  StartupType,
  SpecTemplate,
} from "./templates.js";
