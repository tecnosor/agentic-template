---
name: history-scan
description: >-
  Exhaustively inspects a repository's git history, documentation, database migrations,
  and test files to map completed work into kanban task files (status: done). Normalizes
  all entries to English. Creates backlog task files for incomplete work. Use
  when initializing kanban for a repo, onboarding, or auditing past work. Keywords:
  history, done, completed, git log, migrations, commits, audit, onboarding, initialize
  kanban, historial, completado, trabajo previo, auditoría.
allowed-tools:
  - run_in_terminal
  - read_file
  - replace_string_in_file
  - file_search
---

# History Scan Skill

## Purpose

Scan a repository exhaustively to map **already completed work** into `kanban/tasks/DONE-NNN.md` files (`status: done`).
Also identify **incomplete or partially completed work** and create `kanban/tasks/BACKLOG-NNN.md` files (`status: backlog`).

All output must be in **English**.

---

## Step 1 — Git History Analysis

```bash
# Summarize all commits grouped by type
git log --oneline --no-merges | head -100

# Count commits by type
git log --oneline --no-merges --format="%s" | \
  grep -oE "^(feat|fix|refactor|test|chore|docs|style|perf|ci)" | \
  sort | uniq -c | sort -rn

# Authors and activity
git shortlog -sn --no-merges | head -20

# Date range of work
git log --format="%ad" --date=short | sort | head -1
git log --format="%ad" --date=short | sort | tail -1
```

---

## Step 2 — Feature Detection via Commits

```bash
# List feat commits (completed features)
git log --oneline --no-merges --format="%ad %s" --date=short | grep "^.*feat(" | head -50

# List fix commits (bugs resolved)
git log --oneline --no-merges --format="%ad %s" --date=short | grep "^.*fix(" | head -50

# Group by scope
git log --oneline --no-merges --format="%s" | \
  grep -oE "\((.*?)\)" | sort | uniq -c | sort -rn | head -20
```

---

## Step 3 — Database Migration Detection

```bash
# Look for migration files (any common format)
find . -path "*/migrations/*" -name "*.sql" 2>/dev/null | sort | head -30
find . -path "*/db/changelog/*" -name "*.xml" -o -name "*.sql" 2>/dev/null | sort | head -30
find . -path "*prisma*" -name "*.prisma" 2>/dev/null | head -10
find . -name "*.migration.ts" -o -name "*_migration.ts" 2>/dev/null | head -20
```

---

## Step 4 — Test Coverage as Completeness Signal

```bash
# Count test files as proxy for completed features
find . -path "*/test*" -name "*.test.ts" -o -name "*.spec.ts" 2>/dev/null | wc -l
find . -path "*/test*" -name "*.test.ts" | head -30

# Count Java test files if applicable
find . -name "*Test.java" 2>/dev/null | head -30
```

---

## Step 5 — Documentation Scan

```bash
# Check changelog
cat CHANGELOG.md 2>/dev/null | head -100

# Check README sections
grep -n "^## " README.md 2>/dev/null | head -20

# Check any ADRs
find . -path "*/docs/adr*" -o -path "*/docs/decisions*" | head -10
```

---

## Step 6 — TODO / FIXME Detection (incomplete work)

```bash
# These should become backlog task files, not done task files
grep -rn "TODO\|FIXME\|HACK\|XXX\|NOT IMPLEMENTED\|placeholder" \
  src/ --include="*.ts" --include="*.java" 2>/dev/null | head -30

# Check for stub implementations
grep -rn "throw new Error.*not implemented\|throw new Error.*TODO" \
  src/ --include="*.ts" 2>/dev/null | head -20
```

---

## Mapping Rules

### → Done task files (completed work)

Create `kanban/tasks/DONE-NNN.md` when:
- `feat(scope): ...` commit exists
- Corresponding test file exists
- No open TODO/FIXME markers in that area
- Migration was applied (if DB changes)

File format:
```yaml
---
id: DONE-001
title: {Feature Title}
status: done
origin: "🤖 Agent"
priority: medium
repo: {repo-name}
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

## Summary
What was implemented. 1-2 sentences max. English only.

## Source
- Detected from: git log / migration / test file
- PR: N/A (pre-kanban) or #{number}
```

### → Backlog task files (incomplete/partial work)

Create `kanban/tasks/BACKLOG-NNN.md` when:
- `TODO` or `FIXME` in source code
- Stub/placeholder implementation found
- Feature commits exist but test coverage is missing
- Documentation mentions "planned" or "future" features

File format:
```yaml
---
id: BACKLOG-001
title: {Task Title}
status: backlog
origin: "🤖 Agent"
priority: medium
repo: {repo-name}
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

## Description
Why this is incomplete.

## Type
technical-debt | missing-test | stub-implementation | planned-feature

## Location
`src/path/to/file.ts:42`
```

---

## Output

After scanning, produce:
1. **Summary statistics**: commits analyzed, features found, migrations detected, tests found
2. **Done task files**: create one `DONE-NNN.md` per completed feature found
3. **Backlog task files**: create one `BACKLOG-NNN.md` per incomplete item found
4. **Scan report**: brief markdown table showing what was found

---

## Important Constraints

- **English only**: Normalize all commit messages and descriptions to English
- **Deduplicate**: Check existing task files before creating (compare by title)
- **Accuracy over completeness**: If uncertain whether work is done, create as `status: backlog` not `status: done`
- **Numbering**: Use sequential IDs — check existing files to find the next number
