export {
  generateRoutes,
  parseApiRoutes,
  groupByResource,
} from "./generator.js";
export type { ParsedRoute, GeneratedRoute } from "./generator.js";

export {
  getRouteTemplate,
  ALL_ROUTE_TEMPLATES,
  CRUD_TEMPLATE,
  AUTH_PROTECTED_TEMPLATE,
  WEBHOOK_HANDLER_TEMPLATE,
  FILE_UPLOAD_TEMPLATE,
} from "./templates.js";
export type { RouteTemplate, RouteTemplateOptions } from "./templates.js";
