---
id: FEAT-001
title: "Add a client-side Snake mini-game tab"
status: HUMAN_VALIDATION
origin: "👤 Human"
priority: MEDIUM
repo: mission-control
created: 2026-05-06
updated: 2026-05-06
---

## Description

Add a fully client-side Snake mini-game to the Mission Control UI.

Implement it inside `mission-control/ui/app` using the existing Vue + TypeScript stack, with no server calls, no backend persistence, and no external gameplay libraries.

The feature should feel like an intentional playground panel inside the existing dashboard rather than a disconnected demo page.

## Scope

- Add a dedicated entry point in the main tab bar.
- Render the game board, current score, best score, and current game state.
- Support keyboard controls with arrow keys and WASD.
- Handle start, restart, pause/resume, food spawning, score growth, and collision detection.
- Persist only the best score in browser storage.

## Delivery Plan

- [x] Add a new client-only tab and mount a self-contained Snake component.
- [x] Implement the game loop, controls, collision detection, and score tracking.
- [x] Add lightweight instructions and visual polish so the feature is understandable without reading code.
- [x] Validate the frontend build.

## Acceptance Criteria

- User can open the Snake game from the Mission Control UI without any backend dependency.
- Game works with arrow keys and WASD.
- Snake grows after eating food and the run ends on wall or self collision.
- UI shows current score, best score, and current state.
- User can start, pause/resume, and restart the game.
- Frontend build passes.

