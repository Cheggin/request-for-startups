export interface ExecRunner {
  (command: string, options?: { cwd?: string }): string;
}

export interface ServiceConfig {
  projectDir: string;
  vercelTeam?: string;
  railwayProject?: string;
  cubicWebhookUrl?: string;
}

export interface ConfigureResult {
  service: string;
  success: boolean;
  message: string;
}

export function linkVercel(
  config: ServiceConfig,
  exec: ExecRunner
): ConfigureResult {
  try {
    const args = config.vercelTeam
      ? `--yes --scope ${config.vercelTeam}`
      : "--yes";
    exec(`vercel link ${args}`, { cwd: config.projectDir });
    return {
      service: "vercel",
      success: true,
      message: "Vercel project linked",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      service: "vercel",
      success: false,
      message: `Failed to link Vercel: ${msg}`,
    };
  }
}

export function linkRailway(
  config: ServiceConfig,
  exec: ExecRunner
): ConfigureResult {
  try {
    exec("railway link", { cwd: config.projectDir });
    return {
      service: "railway",
      success: true,
      message: "Railway project linked",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      service: "railway",
      success: false,
      message: `Failed to link Railway: ${msg}`,
    };
  }
}

export function initConvex(
  config: ServiceConfig,
  exec: ExecRunner
): ConfigureResult {
  try {
    exec("npx convex dev --once", { cwd: config.projectDir });
    return {
      service: "convex",
      success: true,
      message: "Convex project initialized",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      service: "convex",
      success: false,
      message: `Failed to init Convex: ${msg}`,
    };
  }
}

export function configureGitHubWebhook(
  repoName: string,
  webhookUrl: string,
  exec: ExecRunner
): ConfigureResult {
  try {
    exec(
      `gh api repos/${repoName}/hooks --method POST -f url="${webhookUrl}" -f content_type=json -f 'events[]=push' -f 'events[]=pull_request'`
    );
    return {
      service: "github-webhook",
      success: true,
      message: "GitHub webhook configured for Cubic channel",
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      service: "github-webhook",
      success: false,
      message: `Failed to configure webhook: ${msg}`,
    };
  }
}

export function configureServices(
  config: ServiceConfig,
  repoName: string,
  exec: ExecRunner
): ConfigureResult[] {
  const results: ConfigureResult[] = [];

  results.push(linkVercel(config, exec));
  results.push(linkRailway(config, exec));
  results.push(initConvex(config, exec));

  if (config.cubicWebhookUrl) {
    results.push(
      configureGitHubWebhook(repoName, config.cubicWebhookUrl, exec)
    );
  }

  return results;
}
