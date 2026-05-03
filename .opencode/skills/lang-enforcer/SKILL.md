---
name: lang-enforcer
description: >-
  Detects and fixes non-English content in source code, documentation, kanban files,
  agent files, and skill files. Reports violations as LANG-NNN entries. Auto-fixes
  comments and documentation after confirmation. Requires explicit confirmation for
  identifier renames (variable, method, class names). Never modifies i18n files,
  locales, or translation keys. Bilingual exception: agent/skill description fields
  may be bilingual for searchability. Keywords: English, language, Spanish, translation,
  comment, identifier, naming, idioma, inglés, español, comentarios, identificadores,
  nomenclatura.
allowed-tools:
  - run_in_terminal
  - read_file
  - replace_string_in_file
  - file_search
  - grep_search
---

# Lang Enforcer Skill

## Language Standard

**English is mandatory** for all code, comments, documentation, kanban tasks, agent
files, and skill files in this workspace.

**Exceptions (do NOT modify)**:
- Files under `*/i18n/*`, `*/locales/*`, `*.po`, `*.pot`
- Explicitly marked translation files (any file containing i18n keys as values)
- The `description:` field in agent/skill YAML frontmatter (may be bilingual for searchability)
- User-facing test fixtures that test i18n behavior

---

## Step 1 — Scan for Violations

### Source code comments
```bash
# Detect non-English single-line comments
grep -rn "//.*[áéíóúñüÁÉÍÓÚÑÜ¿¡àèìòùâêîôûäëïöüçğ]" \
  src/ --include="*.ts" --include="*.js" --include="*.vue" 2>/dev/null | head -30

# Detect non-English block comments
grep -rn "/\*.*[áéíóúñüÁÉÍÓÚÑÜàèìòùâêîôûäëïöüçğ].*\*/" \
  src/ --include="*.ts" --include="*.js" 2>/dev/null | head -30
```

### Documentation files
```bash
grep -rn "[áéíóúñüÁÉÍÓÚÑÜàèìòùâêîôûäëïöüçğ]" \
  docs/ README.md CHANGELOG.md CONTRIBUTING.md \
  --include="*.md" 2>/dev/null | head -30
```

### Kanban files
```bash
grep -rn "[áéíóúñüÁÉÍÓÚÑÜàèìòùâêîôûäëïöüçğ]" \
  kanban/ --include="*.md" 2>/dev/null | head -30
```

### Variable/function/class identifiers
```bash
# Camelcase Spanish identifiers (harder to detect — scan for common Spanish words)
grep -rn "\b\(crearUsuario\|obtenerDatos\|procesarPago\|validarEntrada\|guardarRegistro\)\b" \
  src/ --include="*.ts" 2>/dev/null | head -20

# Also look for snake_case Spanish
grep -rn "\b[a-z]*_[a-z]*\b" src/ --include="*.ts" 2>/dev/null | \
  grep -iE "(nombre|apellido|usuario|correo|contraseña|pagos|datos)" | head -20
```

---

## Step 2 — Report Violations

For each violation found, create a LANG-NNN entry:

```markdown
### LANG-042
- **File**: `src/application/features/user/CreateUserCommandHandler.ts:15`
- **Type**: comment
- **Found**: `// Crear el usuario en la base de datos`
- **Fix**: `// Create the user in the database`
- **Auto-fix**: ✅ Safe to apply automatically
```

Violation types:
| Type | Auto-fix Safe? | Requires Confirmation? |
|------|---------------|----------------------|
| Comment | ✅ Yes | No |
| Documentation (`.md`) | ✅ Yes | Brief confirmation |
| Kanban task title/description | ✅ Yes | Brief confirmation |
| Variable / function name | ❌ No | **Explicit confirmation required** |
| Class / interface name | ❌ No | **Explicit confirmation required** |

---

## Step 3 — Apply Fixes

### Auto-fix comments and docs
After reporting, ask: "Apply auto-fixes to comments and documentation? (yes/no)"

If yes, update each file using `replace_string_in_file`.

### Identifier renames
For each identifier violation:
- Show exact location and current name
- Propose English equivalent
- Ask: "Rename `{current}` → `{proposed}` in `{file}`? This will affect N references."
- **Never rename without explicit user confirmation**
- After confirmation, use `vscode_renameSymbol` if available, otherwise `sed` + manual verification

---

## Step 4 — Kanban Log

Create a LANG-NNN kanban task for tracking:

```markdown
---
id: LANG-042
title: Fix non-English comments in CreateUserCommandHandler
status: done
origin: "🤖 Agent"
priority: low
repo: demo-backend
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

## Violations Found and Fixed
- `src/application/features/user/CreateUserCommandHandler.ts:15`
  - Old: `// Crear el usuario en la base de datos`
  - New: `// Create the user in the database`
```

---

## Scope Options

Run on a specific scope by adjusting paths:

```bash
# Single file
grep -n "[áéíóúñü...]" src/path/to/file.ts

# Entire src/ directory
grep -rn "[áéíóúñü...]" src/ --include="*.ts"

# Docs only
grep -rn "[áéíóúñü...]" docs/ --include="*.md"

# All (excluding node_modules, dist, i18n)
grep -rn "[áéíóúñü...]" . \
  --include="*.ts" --include="*.md" --include="*.vue" \
  --exclude-dir="node_modules" \
  --exclude-dir="dist" \
  --exclude-dir="i18n" \
  --exclude-dir="locales" \
  2>/dev/null
```
