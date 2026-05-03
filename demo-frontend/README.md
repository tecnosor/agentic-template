# Demo Frontend

Vue 3 SPA demonstrating the enterprise template's frontend conventions: DDD bounded contexts, accessible components, i18n, and Pinia state management.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3.5 (Composition API only) |
| Language | TypeScript strict |
| Build | Vite 5 |
| Routing | Vue Router 4 |
| State | Pinia |
| i18n | Vue I18n 9 |
| Testing | Vitest + @vue/test-utils |

## Getting Started

```bash
npm install
npm run dev       # Dev server → http://localhost:5173
npm run build     # Production build (type-check + vite build)
npm run test      # Run unit tests
npm run lint      # ESLint check
npm run lint:fix  # Auto-fix lint issues
```

## Project Structure

```
src/
├── App.vue                    # Root component (layout wrapper)
├── main.ts                    # App entry — createApp, plugins
├── components/
│   ├── common/                # Shared UI primitives
│   │   └── BaseButton.vue     # Accessible button with variants
│   └── layout/                # Layout components
│       ├── AppHeader.vue      # Site header + nav
│       └── AppFooter.vue      # Site footer
├── composables/
│   └── useNotification.ts     # Notification composable
├── i18n/
│   ├── index.ts               # Vue I18n configuration
│   └── locales/
│       └── en.json            # English translations (default)
├── pages/
│   ├── HomePage.vue           # / — hero + features
│   ├── AboutPage.vue          # /about
│   └── NotFoundPage.vue       # 404 catch-all
├── router/
│   └── index.ts               # Routes (lazy-loaded pages)
└── stores/
    └── user.ts                # User profile store (Pinia)
```

## Architecture Conventions

### Components
- Always `<script setup lang="ts">` — no Options API
- Props typed with `defineProps<Props>()` and `withDefaults`
- Emit events typed with `defineEmits<{...}>()`
- No `any` types

### Accessibility (WCAG 2.1 AA)
- Skip link to `#main-content` in `index.html`
- All interactive elements have visible focus states (`focus-visible`)
- Touch targets minimum 44×44 px
- Semantic HTML (`<header>`, `<nav>`, `<main>`, `<footer>`, `aria-*`)
- Language declared in `<html lang="en">`

### Internationalization
- All user-facing text via `t()` from `useI18n()` — no hardcoded strings
- Translation keys: `pages.{page}.{section}.{key}`, `components.{name}.{key}`, `common.{key}`
- English is the default and fallback locale
- Add new languages by creating `src/i18n/locales/{locale}.json`

### State Management
- Pinia stores use the Composition API style (`defineStore('id', () => { ... })`)
- Stores are lean — business logic lives in composables or use cases

## Adding a New Page

1. Create `src/pages/MyPage.vue` with `<script setup lang="ts">`
2. Add route in `src/router/index.ts` (lazy-loaded)
3. Add all text as keys in `src/i18n/locales/en.json`
4. Verify WCAG: headings hierarchy, focus states, ARIA labels

## Adding a New Component

1. Create in `src/components/{category}/MyComponent.vue`
2. Use `withDefaults(defineProps<Props>(), {...})` for all props
3. Include `focus-visible` styles for interactive elements
4. Write a test in `tests/unit/components/`

## Running Tests

```bash
npm run test               # Watch mode
npm run test -- --run      # Single pass (CI)
npm run test -- --coverage # With coverage report
```

Coverage thresholds: **80%** lines / functions / branches / statements.
