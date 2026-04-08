# Scene-First Sparse UI Recheck

Date: 2026-03-23

## Why this pass happened

The latest user feedback was not asking for more systems. It was asking for less surface noise:

- too many visible content boxes
- too much stacked information
- incomplete / uneven Chinese copy
- a stronger layout target for future Blender / 3D scene replacement

That means the correct move was a composition pass, not a content pass.

## What changed

- `search`
  - moved from multi-panel information wall to:
    - compact top HUD
    - anchored scene hotspots
    - one bottom drawer with tabbed content
- `table`
  - moved from multiple always-open support blocks to:
    - slim top HUD
    - compact dossier
    - one bottom drawer
    - one action bar
- `summary`
  - moved from dashboard-like settlement layout to:
    - cinematic result hero
    - compact stat strip
    - one tabbed drawer for debrief/details

## What was intentionally preserved

- authored demo path
- current run structure
- no new mechanics
- no early roguelike pool expansion

## Validation

- syntax:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
  - `node --check src/i18n.js`
- browser capture sets:
  - `output/pass43-sparse-ui/`
  - `output/pass44-sparse-ui-refine/`
  - `output/pass45-search-tight.png`
  - `output/pass45-table-tight.png`
  - `output/web-game-pass43/`

## Current read

- the build is materially closer to the user's reference compositions
- `search` now reads as a room with anchor points instead of a report page
- `table` is much closer to a first-person poker scene with one support drawer
- `summary` now feels like a result screen first

## Remaining tension

- `search` still has one large objective block that may want one more reduction
- `table` still has a visible bottom drawer band; if that reads as too present during playtest, the right next move is reducing resting height, not adding more panels
- Chinese proofreading is improved but should continue during real user play
