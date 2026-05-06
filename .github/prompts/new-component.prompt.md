---
mode: agent
description: Scaffold a new Vue 3 page, component, or composable with i18n and accessibility.
---

Scaffold a new Vue 3 component, page, or composable.

Read the skill first: [page-component](../mission-control/skills/page-component/SKILL.md)

To proceed, provide:
1. **Type**: `page` / `component` / `composable`
2. **Name**: PascalCase for components/pages, `useXxx` for composables
3. **Purpose**: brief description (guides prop generation and i18n keys)

Output locations:
- Pages → `src/pages/`
- Components → `src/components/{category}/`
- Composables → `src/composables/`

Every generated file includes:
- `<script setup lang="ts">` with typed props/emits
- i18n keys added to `src/i18n/locales/en.json`
- WCAG 2.1 AA accessibility attributes (`role`, `aria-*`, `tabindex`)
- `focus-visible:` Tailwind focus states
- `prefers-reduced-motion` guard for animations
