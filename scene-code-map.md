# Scene Code Map

This project is now split around four scene modules plus shared system logic, so a single scene can be edited without reworking the whole prototype.

## Scene Modules

- `scenes/stash/`
  - personal assets / stash / folder related UI
  - first playable search-mode landing scene
  - files:
    - `index.js`
    - `style.css`
    - `README.md`

- `scenes/tavern/`
  - tavern floor scene
  - files:
    - `index.js`
    - `style.css`
    - `README.md`

- `scenes/poker/`
  - Texas Hold'em table scene
  - files:
    - `index.js`
    - `style.css`
    - `README.md`

- `scenes/extraction/`
  - extraction + run resolution scene
  - files:
    - `index.js`
    - `style.css`
    - `README.md`

- `scenes/menu/`
  - title / run-start scene
  - files:
    - `index.js`
    - `style.css`
    - `README.md`

## Shared System Logic

- `src/main.js`
  - top-level scene router
  - DOM event wiring
  - shared scene helpers
  - canvas draw loop
  - stitches the scene modules together

- `src/game.js`
  - game state
  - dispatch / reducer-like flow
  - run progression
  - search / table / extraction mechanics

- `src/data.js`
  - authored content definitions
  - items
  - tables
  - routes
  - constants

- `src/poker.js`
  - card formatting and Hold'em utility helpers

- `src/ai.js`
  - opponent behavior helpers

- `src/i18n.js`
  - Chinese / English localization

## Scene Style Modules

- `styles.css`
  - CSS entry file only
  - imports shared base styles plus scene-local styles from `scenes/*/style.css`

- `styles/foundation.css`
  - existing shared baseline
  - old global and component rules live here

- `styles/shared-scene.css`
  - shared scene-shell timing, phase chips, and top-line presentation

- scene-local styles now live alongside the scene folders:
  - `scenes/menu/style.css`
  - `scenes/tavern/style.css`
  - `scenes/poker/style.css`
  - `scenes/extraction/style.css`
  - `scenes/stash/style.css`

## Source Art

- `assets/scene-plates/`
  - source scene plates used by the live build
  - these were moved out of `output/` so generated test artifacts and source art are no longer mixed together

## Edit Contract

If you want to modify a single scene and keep the rest of the game working, keep these exports stable:

- `scenes/menu/index.js`
  - `renderMenuScene(state, helpers)`

- `scenes/stash/index.js`
  - `renderStashScene(state, helpers)`
  - `renderStashServicesModal(run, extractionPreview, searchItems, helpers)`
  - `renderStashFolderModal(run, extractionPreview, helpers)`

- `scenes/tavern/index.js`
  - `renderTavernScene(state, helpers)`
  - `getVisibleDestinationIds(run, helpers)`

- `scenes/poker/index.js`
  - `renderPokerScene(state, helpers)`

- `scenes/extraction/index.js`
  - `renderSummaryScene(state, helpers)`
  - `getVisibleRouteCards(run, preview)`

As long as those stay callable, `src/main.js` can keep composing the scenes back into one working build.
