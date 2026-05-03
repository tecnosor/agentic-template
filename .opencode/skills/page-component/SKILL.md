---
name: page-component
description: >-
  Scaffolds a new Vue 3 page, component, or composable with i18n, accessibility (WCAG
  2.1 AA), TypeScript strict, and Tailwind CSS 4. Use when implementing new UI views,
  reusable components, or shared composables. Keywords: Vue, component, page, composable,
  i18n, accessibility, a11y, WCAG, TypeScript, Tailwind, scaffold, componente, página,
  accesibilidad.
allowed-tools:
  - create_file
  - read_file
  - file_search
  - run_in_terminal
---

# Page Component Skill

## Purpose

Scaffold new **Vue 3** pages, components, or composables following:
- `<script setup lang="ts">` (no Options API)
- All text via `$t()` / `useI18n()` (no hardcoded strings)
- WCAG 2.1 AA accessibility
- Tailwind CSS 4 for styling
- TypeScript strict mode

---

## Page Template

```vue
<!-- src/pages/{PageName}Page.vue -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <main class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-semibold text-gray-900">
      {{ t('pages.{pageName}.title') }}
    </h1>
    <p class="mt-4 text-base text-gray-600">
      {{ t('pages.{pageName}.description') }}
    </p>
  </main>
</template>
```

---

## Component Template

```vue
<!-- src/components/{category}/{ComponentName}.vue -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

interface Props {
  label: string;
  disabled?: boolean;
}

interface Emits {
  (event: 'click'): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<Emits>();

const { t } = useI18n();

function handleClick(): void {
  if (!props.disabled) {
    emit('click');
  }
}
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md
           focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
           disabled:opacity-50 disabled:cursor-not-allowed"
    :aria-label="props.label"
    :disabled="props.disabled"
    @click="handleClick"
  >
    <span>{{ props.label }}</span>
  </button>
</template>
```

---

## Composable Template

```typescript
// src/composables/use{Name}.ts
import { ref, computed } from 'vue';

export interface {Name}Options {
  // options
}

export function use{Name}(options?: {Name}Options) {
  // Reactive state
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const hasError = computed(() => error.value !== null);

  // Methods
  async function doSomething(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      // Implementation
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    hasError,
    doSomething,
  };
}
```

---

## i18n Key Convention

```json
{
  "pages": {
    "home": {
      "title": "Welcome",
      "description": "Get started"
    }
  },
  "components": {
    "header": {
      "nav": {
        "home": "Home",
        "about": "About"
      }
    }
  },
  "common": {
    "buttons": {
      "submit": "Submit",
      "cancel": "Cancel",
      "save": "Save"
    },
    "labels": {
      "loading": "Loading...",
      "error": "An error occurred"
    }
  }
}
```

**Rules:**
- English is the default locale (`en.json`)
- All user-facing text must have an `en.json` key
- Never show raw translation keys to users
- Add new keys to `en.json` before creating the component

---

## Accessibility Checklist (WCAG 2.1 AA)

- [ ] Contrast ratio ≥ 4.5:1 for normal text
- [ ] Contrast ratio ≥ 3:1 for large text (≥18px bold or ≥24px regular)
- [ ] Interactive elements have `:focus-visible` styles
- [ ] Touch targets ≥ 44×44px
- [ ] Semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<header>`, `<footer>`)
- [ ] ARIA attributes only when semantic HTML is insufficient
- [ ] Images have `alt` text (empty `alt=""` for decorative images)
- [ ] Language declared in `<html lang="en">`
- [ ] Skip link to main content: `<a href="#main-content">Skip to main content</a>`

---

## Animation Rules

```css
/* Always wrap animations in prefers-reduced-motion check */
@media (prefers-reduced-motion: no-preference) {
  .animate-fade-in {
    animation: fadeIn 200ms ease-out;
  }
}
```

Or in Tailwind:
```html
<div class="motion-safe:animate-fade-in">...</div>
```

---

## Accessibility Focus State (Tailwind)

```html
<!-- Visible focus state for keyboard navigation -->
<button class="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
  Click me
</button>
```

---

## After Creating a Component

Run validation:

```bash
# Type check
npx vue-tsc --noEmit

# Lint
npm run lint

# Build check
npm run build
```

---

## Scaffold Checklist

When creating a new page/component, collect:

1. **Type**: Page / Component / Composable?
2. **Name**: PascalCase for components, camelCase for composables
3. **Category** (for components): `common/`, `layout/`, `{feature}/`
4. **Props**: names, types, required/optional
5. **Emits**: event names and payload types
6. **i18n keys**: what text does it contain?
7. **Accessibility**: what semantic role does it have?

Then generate the files and add i18n keys to `src/i18n/locales/en.json`.
