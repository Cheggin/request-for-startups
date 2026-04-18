#!/usr/bin/env bash
set -euo pipefail
# Runtime-agnostic command logger — logs to .harness/command-log.txt
cmd=$(jq -r '.tool_input.command // ""')
printf '%s %s\n' "$(date '+%Y-%m-%dT%H:%M:%S%z')" "$cmd" >> .harness/command-log.txt
exit 0
