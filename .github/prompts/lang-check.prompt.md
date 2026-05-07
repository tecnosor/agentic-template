---
mode: agent
description: Check all files for non-English content and propose LANG-NNN fixes.
---

Check all code, documentation, and kanban files for non-English content.

Read the skill first: [lang-enforcer](../mission-control/skills/lang-enforcer/SKILL.md)

Scope:
1. Scan source code comments for non-English text
2. Scan documentation (`README.md`, `docs/`, `AGENTS.md`) for non-English paragraphs
3. Scan kanban task titles and descriptions
4. Scan agent and skill files

**Never scan or modify:**
- `i18n/`, `locales/`, `translations/` directories
- `*.po` / `*.pot` translation files
- Language-specific JSON files (e.g., `es.json`, `fr.json`)

Output:
- `LANG-NNN` violation entries with `file:line` references
- Auto-fix documentation and comments (after confirmation)
- Report-only for identifier renames (requires human approval)
- Propose `LANG-NNN` backlog task files for unresolved violations
