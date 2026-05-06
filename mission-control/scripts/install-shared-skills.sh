#!/usr/bin/env bash
# install-shared-skills.sh
# Installs shared skills from mission-control/skills/ into .opencode/skills/.
#
# Strategy (in order):
#   1. Symlink (preferred) — .opencode/skills → ../mission-control/skills
#      Zero maintenance: always in sync, no drift possible.
#   2. Copy fallback — used on Windows/Docker/NFS where symlinks aren't supported.
#      Pass --copy to force copy mode.
#
# Usage:
#   ./install-shared-skills.sh          # symlink (default)
#   ./install-shared-skills.sh --copy   # force copy instead of symlink

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}✅  $*${RESET}"; }
warn() { echo -e "${YELLOW}⚠️  $*${RESET}"; }
err()  { echo -e "${RED}❌  $*${RESET}" >&2; }

# ── Args ──────────────────────────────────────────────────────────────────────
FORCE_COPY=false
for arg in "$@"; do
  [[ "$arg" == "--copy" ]] && FORCE_COPY=true
done

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MC_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"         # mission-control/
REPO_ROOT="$(cd "${MC_ROOT}/.." && pwd)"           # workspace root (contains .opencode/)
SKILLS_SRC="${MC_ROOT}/skills"
SKILLS_DST="${REPO_ROOT}/.opencode/skills"

# ── Preflight ─────────────────────────────────────────────────────────────────
if [[ ! -d "${SKILLS_SRC}" ]]; then
  err "Source skills directory not found: ${SKILLS_SRC}"
  exit 1
fi

# ── Strategy 1: Symlink ───────────────────────────────────────────────────────
if [[ "$FORCE_COPY" == false ]]; then
  # Remove existing directory or broken symlink, create fresh symlink
  if [[ -L "${SKILLS_DST}" ]]; then
    ok "Symlink already in place: ${SKILLS_DST} → $(readlink "${SKILLS_DST}")"
    exit 0
  fi

  if [[ -d "${SKILLS_DST}" ]]; then
    warn "Physical copy found at ${SKILLS_DST} — replacing with symlink"
    rm -rf "${SKILLS_DST}"
  fi

  # Compute relative path from .opencode/ to mission-control/skills
  ln -s "../mission-control/skills" "${SKILLS_DST}"
  ok "Symlink created: ${SKILLS_DST} → ../mission-control/skills"
  ok "Skills are now always in sync — no manual updates needed."
  exit 0
fi

# ── Strategy 2: Copy fallback (--copy mode) ───────────────────────────────────
warn "Running in --copy mode (symlinks disabled)"
warn "You must re-run this script whenever mission-control/skills/ changes."

if [[ -L "${SKILLS_DST}" ]]; then
  warn "Removing symlink to replace with physical copies"
  rm "${SKILLS_DST}"
fi

mkdir -p "${SKILLS_DST}"

COPIED=0
SKIPPED=0

for skill_dir in "${SKILLS_SRC}"/*/; do
  skill_name="$(basename "${skill_dir}")"
  skill_file="${skill_dir}SKILL.md"
  target_dir="${SKILLS_DST}/${skill_name}"
  target_file="${target_dir}/SKILL.md"

  if [[ ! -f "${skill_file}" ]]; then
    warn "No SKILL.md in ${skill_name} — skipping"
    continue
  fi

  mkdir -p "${target_dir}"

  if [[ -f "${target_file}" ]]; then
    if [[ "${skill_file}" -nt "${target_file}" ]]; then
      cp "${skill_file}" "${target_file}"
      ok "Updated ${skill_name}"
      COPIED=$((COPIED + 1))
    else
      SKIPPED=$((SKIPPED + 1))
    fi
  else
    cp "${skill_file}" "${target_file}"
    ok "Installed ${skill_name}"
    COPIED=$((COPIED + 1))
  fi
done

echo ""
echo "────────────────────────────────────────"
ok "Skills installed: ${COPIED}"
[[ ${SKIPPED} -gt 0 ]] && echo -e "${YELLOW}Skills up-to-date (skipped): ${SKIPPED}${RESET}"
echo "────────────────────────────────────────"
