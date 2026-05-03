---
description: Invoke the lang-enforcer agent to check all files in the current repository for non-English content.
---

# Lang Check

Check all code, documentation, and kanban files for non-English content.

Invoke `@lang-enforcer` with the following scope:

1. Scan source code comments for non-English text
2. Scan documentation (README, docs/, AGENTS.md) for non-English paragraphs
3. Scan kanban task titles and descriptions
4. Scan agent and skill files

NEVER scan or modify:
- `i18n/`, `locales/`, `translations/` directories
- `*.po` / `*.pot` translation files
- Language-specific JSON files (e.g., `es.json`, `fr.json`)

Output:
- LANG-NNN violation entries with file:line references
- Auto-fix documentation and comments (after confirmation)
- Report-only for identifier renames (requires human approval)
