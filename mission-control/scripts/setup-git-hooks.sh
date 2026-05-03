#!/usr/bin/env bash
# Installs git post-commit hooks in all workspace repos.
# Run once after cloning: ./mission-control/scripts/setup-git-hooks.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HOOK_SRC="$SCRIPT_DIR/git-metrics-hook.sh"
REPOS=("demo-backend" "demo-frontend" "mission-control" ".")

echo "Installing git metrics hooks..."

for repo in "${REPOS[@]}"; do
  if [[ "$repo" == "." ]]; then
    GIT_DIR="$REPO_ROOT/.git"
    LABEL="root repo"
  else
    GIT_DIR="$REPO_ROOT/$repo/.git"
    LABEL="$repo"
  fi

  if [[ -d "$GIT_DIR/hooks" ]]; then
    cp "$HOOK_SRC" "$GIT_DIR/hooks/post-commit"
    chmod +x "$GIT_DIR/hooks/post-commit"
    echo "  ✓ Installed in $LABEL"
  else
    echo "  ⚠ Skipped $LABEL — no .git/hooks directory"
  fi
done

echo ""
echo "Done. Commits will now auto-report to Mission Control (when server is running)."
