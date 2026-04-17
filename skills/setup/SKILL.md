---
name: setup
description: Use first for install/update routing — sends setup, doctor, or MCP requests to the correct OMC setup flow
level: 2
---

# Setup

Use `/startup-harness:setup` as the unified setup/configuration entrypoint.

## Usage

```bash
/startup-harness:setup                # full setup wizard
/startup-harness:setup doctor         # installation diagnostics
/startup-harness:setup mcp            # MCP server configuration
/startup-harness:setup wizard --local # explicit wizard path
```

## Routing

Process the request by the **first argument only** so install/setup questions land on the right flow immediately:

- No argument, `wizard`, `local`, `global`, or `--force` -> route to `/startup-harness:omc-setup` with the same remaining args
- `doctor` -> route to `/startup-harness:omc-doctor` with everything after the `doctor` token
- `mcp` -> route to `/startup-harness:mcp-setup` with everything after the `mcp` token

Examples:

```bash
/startup-harness:setup --local          # => /startup-harness:omc-setup --local
/startup-harness:setup doctor --json    # => /startup-harness:omc-doctor --json
/startup-harness:setup mcp github       # => /startup-harness:mcp-setup github
```

## Notes

- `/startup-harness:omc-setup`, `/startup-harness:omc-doctor`, and `/startup-harness:mcp-setup` remain valid compatibility entrypoints.
- Prefer `/startup-harness:setup` in new documentation and user guidance.

Task: {{ARGUMENTS}}
