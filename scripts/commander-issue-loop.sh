#!/usr/bin/env bash

set -euo pipefail

interval="${1:-60}"

if ! [[ "$interval" =~ ^[0-9]+$ ]] || [ "$interval" -lt 1 ]; then
  echo "usage: $0 [seconds]" >&2
  exit 1
fi

for cmd in gh jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "missing required command: $cmd" >&2
    exit 1
  fi
done

prev_file="$(mktemp)"
curr_file="$(mktemp)"

cleanup() {
  rm -f "$prev_file" "$curr_file"
}

stop_loop() {
  echo
  echo "commander issue loop stopped"
  cleanup
  exit 0
}

trap cleanup EXIT
trap stop_loop INT TERM

fetch_snapshot() {
  gh issue list --state open --limit 100 \
    --json number,title,updatedAt,url,body,labels,assignees \
    | jq '
        def severity_rank:
          if . == "P0" then 0
          elif . == "P1" then 1
          elif . == "P2" then 2
          elif . == "P3" then 3
          else 4
          end;

        def extract_severity:
          (try (.body | capture("## Severity\\n(?<sev>P[0-3])").sev) catch empty)
          // ([.labels[]?.name | select(test("^P[0-3]$"))][0] // "UNK");

        def extract_type:
          (
            try (.body | capture("## Type\\n(?<type>[A-Za-z0-9_-]+)").type | ascii_downcase) catch empty
          )
          // (
            try (.title | capture("^\\[(?<type>[A-Za-z0-9_-]+)\\]").type | ascii_downcase) catch empty
          )
          // ([.labels[]?.name | ascii_downcase | select(test("^(feat|fix|refactor|docs|chore)$"))][0] // "unknown");

        map({
          number,
          title,
          updatedAt,
          url,
          severity: extract_severity,
          type: extract_type
        })
        | sort_by([(.severity | severity_rank), .number])
      '
}

render_full_report() {
  local ts="$1"

  jq -r --arg ts "$ts" '
    def sev_count($sev): map(select(.severity == $sev)) | length;
    def type_count($type): map(select(.type == $type)) | length;

    "=== commander issue report @ \($ts) ===",
    "open: \(length)",
    "severity: P0=\(sev_count("P0")) P1=\(sev_count("P1")) P2=\(sev_count("P2")) P3=\(sev_count("P3")) UNK=\(sev_count("UNK"))",
    "types: feat=\(type_count("feat")) fix=\(type_count("fix")) refactor=\(type_count("refactor")) other=\(map(select(.type != "feat" and .type != "fix" and .type != "refactor")) | length)",
    "",
    (
      if length == 0 then
        "no open issues"
      else
        .[] | "[\(.severity)] [\(.type)] #\(.number) \(.title) | updated \(.updatedAt) | \(.url)"
      end
    ),
    ""
  ' "$curr_file"
}

render_delta_report() {
  local ts="$1"

  jq -n -r --arg ts "$ts" --slurpfile prev "$prev_file" --slurpfile curr "$curr_file" '
    def sev_count($items; $sev): $items | map(select(.severity == $sev)) | length;
    def index_by_number($items):
      reduce $items[] as $item ({}; .[$item.number | tostring] = $item);

    ($prev[0] // []) as $prev_items
    | ($curr[0] // []) as $curr_items
    | (index_by_number($prev_items)) as $prev_index
    | (index_by_number($curr_items)) as $curr_index
    | ($curr_items | map(select(($prev_index[.number | tostring] | not)))) as $new_items
    | ($prev_items | map(select(($curr_index[.number | tostring] | not)))) as $closed_items
    | (
        $curr_items
        | map(
            select(
              ($prev_index[.number | tostring] // null) as $old
              | $old != null
              and (
                .updatedAt != $old.updatedAt
                or .severity != $old.severity
                or .type != $old.type
                or .title != $old.title
              )
            )
          )
      ) as $updated_items
    | "=== commander issue delta @ \($ts) ===",
      "open: \($curr_items | length) | new: \($new_items | length) | updated: \($updated_items | length) | closed: \($closed_items | length)",
      "severity: P0=\(sev_count($curr_items; "P0")) P1=\(sev_count($curr_items; "P1")) P2=\(sev_count($curr_items; "P2")) P3=\(sev_count($curr_items; "P3")) UNK=\(sev_count($curr_items; "UNK"))",
      (
        if (($new_items | length) + ($updated_items | length) + ($closed_items | length)) == 0 then
          "no changes"
        else
          empty
        end
      ),
      ($new_items[]? | "NEW    [\(.severity)] [\(.type)] #\(.number) \(.title) | \(.url)"),
      ($updated_items[]? | "UPDATE [\(.severity)] [\(.type)] #\(.number) \(.title) | updated \(.updatedAt) | \(.url)"),
      ($closed_items[]? | "CLOSED [\(.severity)] [\(.type)] #\(.number) \(.title) | last seen \(.updatedAt) | \(.url)"),
      ""
  '
}

echo "commander issue loop polling every ${interval}s"
echo

while true; do
  timestamp="$(date '+%Y-%m-%d %H:%M:%S %Z')"

  if ! fetch_snapshot >"$curr_file"; then
    echo "=== commander issue fetch failed @ ${timestamp} ==="
    echo "gh issue list failed"
    echo
    sleep "$interval"
    continue
  fi

  if [ ! -s "$prev_file" ]; then
    render_full_report "$timestamp"
  else
    render_delta_report "$timestamp"
  fi

  cp "$curr_file" "$prev_file"
  sleep "$interval"
done
