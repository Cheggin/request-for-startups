export {
  generateSchema,
  parseDataModels,
  toTableName,
  mapType,
} from "./generator.js";
export type { ParsedEntity, ParsedField } from "./generator.js";

export {
  getTableTemplate,
  getTableTemplates,
  ALL_TEMPLATES,
  USERS_TABLE,
  SESSIONS_TABLE,
  SUBSCRIPTIONS_TABLE,
  CONTENT_ITEMS_TABLE,
  NOTIFICATIONS_TABLE,
  FILE_UPLOADS_TABLE,
} from "./templates.js";
export type { TableTemplate } from "./templates.js";
