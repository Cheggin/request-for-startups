export { createGateGuard } from "./gateguard.js";
export { checkConfigProtection } from "./config-protection.js";
export { checkDeployGate } from "./deploy-gate.js";
export { checkMetricsGate } from "./metrics-gate.js";
export {
  buildSignalPayload,
  detectAgentName,
  getSignalFileName,
  writeInterAgentSignal,
} from "./inter-agent-signal.js";

export type { ToolCall, HookResult } from "./gateguard.js";
export type { HookEventInput } from "./inter-agent-signal.js";
