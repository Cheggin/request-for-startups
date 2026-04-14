export interface ValidationResult {
  service: string;
  status: "pass" | "fail" | "warn";
  message: string;
  critical: boolean;
  diagnostic?: string;
}

export interface ExecRunner {
  (command: string): string;
}

export function validateGitHub(exec: ExecRunner): ValidationResult {
  try {
    const output = exec("gh auth status");
    return {
      service: "github",
      status: "pass",
      message: "GitHub authenticated",
      critical: true,
    };
  } catch (error) {
    return {
      service: "github",
      status: "fail",
      message: "GitHub authentication failed",
      critical: true,
      diagnostic: "Run `gh auth login` to authenticate with GitHub",
    };
  }
}

export function validateVercel(exec: ExecRunner): ValidationResult {
  try {
    const output = exec("vercel whoami");
    return {
      service: "vercel",
      status: "pass",
      message: `Vercel authenticated as ${output.trim()}`,
      critical: true,
    };
  } catch (error) {
    return {
      service: "vercel",
      status: "fail",
      message: "Vercel authentication failed",
      critical: true,
      diagnostic: "Run `vercel login` to authenticate with Vercel",
    };
  }
}

export function validateRailway(exec: ExecRunner): ValidationResult {
  try {
    const output = exec("railway status");
    return {
      service: "railway",
      status: "pass",
      message: "Railway project connected",
      critical: false,
    };
  } catch (error) {
    return {
      service: "railway",
      status: "warn",
      message: "Railway not connected",
      critical: false,
      diagnostic: "Run `railway login` then `railway link` to connect",
    };
  }
}

export function validateConvex(exec: ExecRunner): ValidationResult {
  try {
    const output = exec("npx convex env");
    return {
      service: "convex",
      status: "pass",
      message: "Convex deployment reachable",
      critical: true,
    };
  } catch (error) {
    return {
      service: "convex",
      status: "fail",
      message: "Convex deployment unreachable",
      critical: true,
      diagnostic:
        "Run `npx convex dev` to initialize or check CONVEX_URL in .env.local",
    };
  }
}

export function validateCubic(exec: ExecRunner): ValidationResult {
  try {
    const output = exec("gh api /user/installations --jq '.installations[] | select(.app_slug == \"cubic-bot\") | .id'");
    if (output.trim()) {
      return {
        service: "cubic",
        status: "pass",
        message: "Cubic GitHub App installed",
        critical: false,
      };
    }
    return {
      service: "cubic",
      status: "warn",
      message: "Cubic GitHub App not found in installations",
      critical: false,
      diagnostic:
        "Install Cubic from https://github.com/apps/cubic-bot",
    };
  } catch (error) {
    return {
      service: "cubic",
      status: "warn",
      message: "Could not verify Cubic installation",
      critical: false,
      diagnostic:
        "Ensure GitHub token has read:org scope, then install Cubic from https://github.com/apps/cubic-bot",
    };
  }
}

export function validateSlack(exec: ExecRunner): ValidationResult {
  try {
    const output = exec("slack auth status 2>&1 || true");
    if (output.includes("authenticated")) {
      return {
        service: "slack",
        status: "pass",
        message: "Slack connected",
        critical: false,
      };
    }
    return {
      service: "slack",
      status: "warn",
      message: "Slack not authenticated",
      critical: false,
      diagnostic: "Run `slack auth` or check SLACK_BOT_TOKEN env var",
    };
  } catch (error) {
    return {
      service: "slack",
      status: "warn",
      message: "Slack check failed",
      critical: false,
      diagnostic: "Install Slack CLI or set SLACK_BOT_TOKEN env var",
    };
  }
}

export function validateFigma(exec: ExecRunner): ValidationResult {
  try {
    const output = exec("figma whoami");
    return {
      service: "figma",
      status: "pass",
      message: `Figma authenticated as ${output.trim()}`,
      critical: false,
    };
  } catch (error) {
    return {
      service: "figma",
      status: "warn",
      message: "Figma authentication failed",
      critical: false,
      diagnostic:
        "Set FIGMA_PERSONAL_ACCESS_TOKEN env var or run `figma auth`",
    };
  }
}

export const ALL_VALIDATORS = [
  validateGitHub,
  validateVercel,
  validateRailway,
  validateConvex,
  validateCubic,
  validateSlack,
  validateFigma,
] as const;
