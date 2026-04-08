# Scene Module Refactor Checkpoint

Date: 2026-03-25

## Goal

Restructure the project so scene code can be edited in isolation and still plug back into one working build.

## What Changed

- replaced the older mixed split with a clearer scene map:
  - `src/scenes/stashScene.js`
  - `src/scenes/tavernScene.js`
  - `src/scenes/pokerScene.js`
  - `src/scenes/extractionScene.js`
  - `src/scenes/menuScene.js`
- reduced `src/main.js` back to:
  - event wiring
  - shared helper composition
  - scene routing
  - UI/canvas orchestration
- moved tavern modal composition into `tavernScene.js`
- kept poker-side UI ownership inside `pokerScene.js`
- renamed the old `assetsScene` concept into the clearer `stashScene`
- added `scene-code-map.md` to make future scene edits safer

## Verification

- `node --check src/main.js`
- `node --check src/game.js`
- `node --check src/data.js`
- `node --check src/i18n.js`
- `node --check src/scenes/menuScene.js`
- `node --check src/scenes/stashScene.js`
- `node --check src/scenes/tavernScene.js`
- `node --check src/scenes/pokerScene.js`
- `node --check src/scenes/extractionScene.js`
- ran the `develop-web-game` Playwright client against the live build
- ran a direct browser smoke path:
  - start run
  - open tavern play modal
  - enter Cargo Table
  - no console errors
  - no page errors

## Current Recommendation

- If the next goal is scene-local iteration speed, split `styles.css` by the same scene boundaries.
- Keep shared runtime changes out of scene modules unless they are truly presentation-related.
