---
name: new-component
description: Scaffold a new Vue 3 page, component, or composable with i18n and accessibility
---

# Scaffold New Vue Component / Page

Use the `/page-component` skill to scaffold a new Vue 3 component, page, or composable.

## Usage

Tell me what you need:
- **Page** — a new route page under `src/pages/`
- **Component** — a reusable UI component under `src/components/{category}/`
- **Composable** — a shared composable under `src/composables/`

Provide:
1. **Type**: page / component / composable
2. **Name**: PascalCase for components/pages, `useXxx` for composables
3. **Purpose**: brief description (guides prop generation and i18n keys)

The skill will generate the file with:
- `<script setup lang="ts">` with proper typing
- i18n keys added to `src/i18n/locales/en.json`
- WCAG 2.1 AA accessibility attributes
- `focus-visible:` Tailwind focus states
- `prefers-reduced-motion` for any animations

## Read the skill for full templates and rules

@/mission-control/skills/page-component/SKILL.md
