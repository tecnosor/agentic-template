---
name: project-status
description: >-
  Generates a structured read-only project status report from kanban files and code
  inspection. Provides health metrics, backlog depth, DOING count, recent completions,
  and blocked task summary. Does NOT write to kanban files. Use when asked for status,
  project health, sprint overview, or progress summaries. Keywords: status, health,
  progress, backlog, overview, metrics, sprint, blocked, report, estado, progreso,
  salud del proyecto, revisión, informe de estado.
allowed-tools:
  - read_file
  - file_search
  - run_in_terminal
  - semantic_search
---

# Project Status Skill

**This skill is read-only. It does NOT modify any kanban files.**

## Step 1 — Read Kanban State

```bash
# Scope to the relevant kanban path first:
# - service repo: ./kanban/tasks/*.md
# - workspace repo: ./mission-control/kanban/tasks/*.md
TASK_GLOB="kanban/tasks/*.md"
[ -d "mission-control/kanban/tasks" ] && TASK_GLOB="mission-control/kanban/tasks/*.md"

echo "=== KANBAN HEALTH ==="
for f in $TASK_GLOB; do
  grep "^status:" "$f" 2>/dev/null
done | awk -F': ' '{print toupper($2)}' | sort | uniq -c | sort -rn

echo "=== DOING TASKS ==="
for f in $TASK_GLOB; do
  if grep -Eq "^status: (DOING|doing)$" "$f" 2>/dev/null; then
    echo "- $(grep "^id:" "$f" | cut -d' ' -f2): $(grep "^title:" "$f" | cut -d': ' -f2-)"
  fi
done

echo "=== TOTAL ==="
ls $TASK_GLOB 2>/dev/null | wc -l
```

---

## Step 2 — Read Recent Completions

```bash
# List recently completed tasks (sorted by updated date)
grep -Erl "status: (DONE|done)" kanban/tasks/ mission-control/kanban/tasks/ 2>/dev/null \
  | xargs grep -l "updated:" 2>/dev/null \
  | xargs grep -h "^title:\|^updated:" 2>/dev/null \
  | paste - - | sort -t$'\t' -k2 -r | head -10
```

---

## Step 3 — Check Build Status (optional — if CI available)

```bash
# Check last GitHub Actions run
gh run list --limit 5 2>/dev/null || echo "gh CLI not available"
```

---

## Step 4 — Check Technical Debt Indicators

```bash
# TODOs and FIXMEs in common code roots (count only)
echo "=== TECHNICAL DEBT MARKERS ==="
echo "TODOs: $(grep -rn "TODO\|FIXME\|HACK\|XXX" src/ app/ server/ demo-backend/src/ demo-frontend/src/ --include="*.ts" --include="*.vue" 2>/dev/null | wc -l)"
```

---

## Status Report Format

```
📊 Project Status Report
========================
Generated: YYYY-MM-DD
Repo: [repo-name]

## Kanban Health

| Column | Count | Health |
|--------|-------|--------|
| Backlog | 12 | ✅ |
| TODO | 3 | ✅ |
| Ready | 2 | ✅ |
| Doing | 1 | ✅ (max: 2) |
| Testing | 0 | ✅ |
| Human Validation | 1 | ✅ |
| Done | 24 | — |

🟢 DOING: 1/2 — capacity available

## Currently In Progress

- **FEAT-042** — Add user onboarding flow (in progress 3 days)
- *(capacity for 1 more task)*

## Recently Completed (last 5)

- FEAT-039 — Password reset flow
- FIX-041 — Fix token expiry edge case
- CHORE-040 — Upgrade TypeScript to 5.7

## Blockers / Risks

None identified.

## Technical Debt

- 7 TODO markers in source code
- 2 known dependency warnings (non-critical)

## Recommendations

1. FEAT-043 (backlog) ready for refinement — high priority
2. Consider addressing 2 HIGH npm audit warnings

---
🟢 Overall Health: GOOD
```

---

## Health Thresholds

| Indicator | Healthy | Warning | Critical |
|-----------|---------|---------|----------|
| DOING count | ≤ 2 | N/A | > 2 |
| Backlog depth | < 20 | 20-40 | > 40 |
| Tasks stuck in DOING | < 5 days | 5-10 days | > 10 days |
| Build status | Green | N/A | Red |
| CRITICAL CVEs | 0 | N/A | > 0 |

---

## Scope Options

- **Local repo**: Run from the specific repo's `kanban/tasks/`
- **Workspace-wide**: Run from `mission-control/kanban/tasks/` for cross-repo view
- **Specific service**: Pass repo name as argument to scope the report
