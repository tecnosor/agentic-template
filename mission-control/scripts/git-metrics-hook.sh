#!/usr/bin/env bash
# Git post-commit hook: records commits as metric events in Mission Control.
# Install with: ./mission-control/scripts/setup-git-hooks.sh

set -euo pipefail

API="http://localhost:3099/api/metrics/events"

WORKSPACE="$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" 2>/dev/null || echo unknown)"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
AUTHOR="$(git log -1 --pretty=format:'%an' 2>/dev/null | head -c 50 || echo unknown)"
MSG="$(git log -1 --pretty=format:'%s' 2>/dev/null | head -c 100 || echo '')"

# Silently skip if Mission Control server is not running
curl -sf --max-time 1 "http://localhost:3099/health" >/dev/null 2>&1 || exit 0

# Use node to safely build and POST valid JSON
WS="$WORKSPACE" BR="$BRANCH" CO="$COMMIT" AU="$AUTHOR" MG="$MSG" \
node -e "
const p = JSON.stringify({
  session_id: 'git-hook',
  timestamp: new Date().toISOString(),
  event_type: 'git_commit',
  workspace: process.env.WS,
  status: 'success',
  metadata: JSON.stringify({
    source: 'git-hook',
    branch: process.env.BR,
    commit: process.env.CO,
    author: process.env.AU,
    message: process.env.MG,
  }),
});
process.stdout.write(p);
" 2>/dev/null \
  | curl -sf -X POST "$API" -H 'Content-Type: application/json' -d @- >/dev/null 2>&1 \
  || true
