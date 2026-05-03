#!/usr/bin/env bash
# install-shared-skills.sh
# Copies shared skills from mission-control/skills/ into .opencode/skills/
# Safe to run multiple times (idempotent).

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

ok()   { echo -e "${GREEN}✅  $*${RESET}"; }
warn() { echo -e "${YELLOW}⚠️  $*${RESET}"; }
err()  { echo -e "${RED}❌  $*${RESET}" >&2; }

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

mkdir -p "${SKILLS_DST}"

# ── Copy skills ───────────────────────────────────────────────────────────────
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
    # Overwrite only if source is newer
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
