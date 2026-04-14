---
name: stack-extend
description: Add a new tool to the project stack at runtime. Reads the tool catalog for known configs, installs the package, updates stacks.yml and .env, generates boilerplate, creates a tracking Issue, and posts an investor update. Use when an agent discovers it needs a new integration (analytics, payments, auth, email, monitoring, etc.) or when the user requests adding a tool.
user-invocable: true
---

# Stack Extend

Add a new tool or integration to the running project stack. Handles everything from package installation to configuration to tracking.

## Inputs

- **tool_name**: The tool to add (e.g., "posthog", "stripe", "clerk", "resend", "sentry")
- **category**: The tool category (e.g., "analytics", "payments", "auth", "email", "error-tracking"). Optional if tool is in the catalog.
- **reason**: Why this tool is being added (used in the GitHub Issue and investor update)

## Steps

### 1. Check the Tool Catalog

Read `.harness/tool-catalog.yml` and search for `tool_name` across all categories.

- **If found**: Extract the pre-built config — `package`, `env_vars`, `setup`, `docs`, `description`, `when`.
- **If not found**: Use WebSearch to research the tool. Determine: npm package name, required environment variables, setup command, documentation URL, and a one-line description. Confirm findings with the user before proceeding.

Store the resolved config as `resolved_config` for subsequent steps.

### 2. Verify Not Already Installed

Read `.harness/stacks.yml` and check if the tool is already listed under any category.

- **If already present**: Inform the agent/user that the tool is already in the stack. Offer to reconfigure if needed. Stop here unless reconfiguration is requested.
- **If not present**: Continue.

Also check `package.json` to see if the npm package is already installed. If installed but not in stacks.yml, skip to step 4 (configuration).

### 3. Install the Package

Run the setup command from the resolved config:

```bash
# For npm packages
npm install <resolved_config.package>

# If there's a dedicated setup command (e.g., npx @sentry/wizard)
<resolved_config.setup>
```

If the tool has no npm package (e.g., BetterUptime is SaaS-only), skip installation and note this in the output.

Verify installation succeeded by checking the exit code. On failure, read the error output and attempt to resolve (common fixes: clear node_modules, retry with --legacy-peer-deps).

### 4. Update .env

Read the current `.env` file. For each entry in `resolved_config.env_vars`:

- If the variable already exists in `.env`, leave it unchanged.
- If the variable does not exist, append it with a placeholder value:

```
# Added by stack-extend: <tool_name>
<VAR_NAME>=your_<var_name_lowercase>_here
```

Never overwrite existing environment variable values.

### 5. Update stacks.yml

Read `.harness/stacks.yml`. Add the tool under the appropriate top-level category:

- `analytics` tools go under `website.analytics` or a new `analytics` key
- `payments` tools go under `backend.payments`
- `auth` tools go under `backend.authentication`
- `email` tools go under `backend.email`
- `error-tracking` tools go under `quality.error_tracking`
- `monitoring` tools go under `quality.monitoring`
- `file-storage` tools go under `backend.file_storage`
- `cms` tools go under `backend.cms`

Format: `<category_key>: <tool_name>  # <description>`

If the category key does not exist in stacks.yml, add it under the most logical parent section.

### 6. Generate Boilerplate Config

Create initialization code based on the tool type. Place files in the project source directory.

**For tools with MCP servers** (check `resolved_config.mcp_server`):
- Add the MCP server entry to `.mcp.json`
- Note in output that agents can now use this MCP directly

**For npm packages**, generate a provider/init file:

```
lib/<tool_name>.ts
```

The file should:
- Import the package
- Read config from environment variables
- Export an initialized client or provider
- Include a comment linking to the tool's documentation

**For React providers** (auth, analytics):
- Generate a provider wrapper component at `components/providers/<tool_name>-provider.tsx`
- Note that it needs to be added to the app's root layout

### 7. Create GitHub Issue

Create a GitHub Issue to track the integration:

```
Title: [Stack] Add <tool_name> integration
Labels: stack, integration
Body:
## Tool Added
- **Name**: <tool_name>
- **Package**: <resolved_config.package>
- **Category**: <category>
- **Reason**: <reason>

## Setup Checklist
- [x] Package installed
- [x] Environment variables added to .env
- [x] stacks.yml updated
- [x] Boilerplate config generated
- [ ] API keys configured with real values
- [ ] Integration tested end-to-end
- [ ] Documentation updated

## Docs
<resolved_config.docs>
```

Use `gh issue create` to create the issue.

### 8. Post Investor Update

Invoke the `investor-updates` skill pattern to post a Slack message:

```
Stack Update: Added <tool_name>
Reason: <reason>
Category: <category>
Status: Installed and configured, pending API key setup
```

If Slack is not configured, write the update to `.harness/updates/stack-extend-<tool_name>-<timestamp>.md` instead.

### 9. Validate

Perform a basic validation that the tool is properly integrated:

- **Import check**: Verify the package can be imported without errors by checking that the generated init file has no TypeScript errors.
- **Config check**: Verify all required env vars are present in `.env` (even as placeholders).
- **stacks.yml check**: Verify the tool appears in the updated stacks.yml.

Report the validation results.

## Removing a Tool (stack-reduce)

To remove a tool, reverse the process:

1. Remove the entry from `.harness/stacks.yml`
2. Remove env var placeholders from `.env` (only if they still have placeholder values — never remove configured keys)
3. Uninstall the npm package: `npm uninstall <package>`
4. Remove generated boilerplate files (`lib/<tool_name>.ts`, `components/providers/<tool_name>-provider.tsx`)
5. Remove MCP entry from `.mcp.json` if applicable
6. Create a GitHub Issue noting the removal and reason
7. Post an investor update about the removal

## Anti-Patterns

- Installing a tool without adding it to stacks.yml (creates drift between declared and actual stack)
- Overwriting existing .env values (could destroy working API keys)
- Hardcoding API keys in generated boilerplate (keys belong in .env only)
- Adding a tool that duplicates functionality already in the stack (e.g., adding SendGrid when Resend is already configured)
- Skipping the catalog check and manually configuring a known tool (wastes time, risks misconfiguration)
- Installing without verifying — always run the validation step

## Validation

- Tool appears in `.harness/stacks.yml` after execution
- All required env vars exist in `.env`
- npm package is in `package.json` dependencies
- Generated boilerplate files exist and contain correct imports
- GitHub Issue was created with correct labels and body
- Investor update was posted or saved to disk
