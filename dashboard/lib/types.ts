export type AgentStatus = "running" | "idle" | "stuck";

export interface Agent {
  id: string;
  name: string;
  paneId: string;
  paneTitle: string;
  status: AgentStatus;
  currentCommand: string;
  lastOutput: string;
  lastActivityTs: number;
  idleDuration: number;
  isCeo: boolean;
}

export interface FleetSummary {
  running: number;
  idle: number;
  stuck: number;
  total: number;
}

export interface ChainPhase {
  name: string;
  required: string[];
  completed: string[];
  progress: number;
  isActive: boolean;
  isDone: boolean;
}

export interface SkillChainState {
  flowName: string;
  description: string;
  phases: ChainPhase[];
  overallProgress: number;
}

export interface TraceEvent {
  timestamp: number;
  type: string;
  file: string;
  content: string;
}

export interface ActivityPoint {
  day: number;
  hour: number;
  count: number;
  date: string;
}

export interface NudgeRequest {
  paneId: string;
  message: string;
}

export interface NudgeResponse {
  success: boolean;
  error?: string;
}
