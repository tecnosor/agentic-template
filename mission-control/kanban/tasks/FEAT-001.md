---
id: FEAT-001
title: "Create standalone Snake mini-game (HTML + JS)"
status: DONE
origin: "👤 Human"
priority: MEDIUM
repo: snake-game
created: 2026-05-06
updated: 2026-05-06
branch: feature/FEAT-001-snake-game
---

## Description

Build a fully client-side Snake mini-game as a standalone project in a new top-level folder `snake-game/`.

**Not** part of Mission Control — this is its own mini-project with no framework dependency, no build step, and no server.
It must run by opening `index.html` directly in any modern browser.

## Feedback Applied

> "lo del snake... deberia ser un proyecto diferente que no esta en mission control si no en una nueva carpeta, y no necesita ser de vue, solo html y JS"

- Removed the Arcade tab and `SnakeGame.vue` component from the Mission Control UI.
- New `snake-game/` folder at workspace root with vanilla HTML + JS only.

## Scope

- Single `index.html` + one `game.js` file — zero dependencies.
- 16×16 grid rendered on a `<canvas>` element.
- Arrow keys and WASD controls.
- Start, pause/resume (Space), and restart (Enter or button).
- Score and best score (persisted in `localStorage`).
- Game ends on wall or self collision.
- Dark-themed, readable without any CSS framework.

## Delivery Plan

- [x] Revert `SnakeGame.vue` and Arcade tab from mission-control UI.
- [x] Create `snake-game/index.html` — layout, canvas, score panel, instructions.
- [x] Create `snake-game/game.js` — game loop, input, rendering, localStorage best score.
- [x] Manual smoke-test: open in browser, play a full run.

## Acceptance Criteria

- `snake-game/index.html` opens directly in the browser with no server.
- Game works with arrow keys and WASD.
- Snake grows after eating food; run ends on wall or self collision.
- Score and best score visible at all times.
- Start, pause/resume, and restart work correctly.
- No Vue, no npm, no build step required.

