# 2026-03-25 Scene-Center Recheck

## Why this pass happened

The shell still had two problems that were directly conflicting with the current demo goals:

- too many persistent boxes were competing with the actual scene
- search modals still felt like lower drawers instead of focused popups

The user also asked for the live title to be unified as `德扑酒馆：赢了就撤!` and for the interface style to follow stricter scene-direction rules.

## What was checked

- the live title and brand copy
- whether search / table still violated the single-center rule
- whether modal overlays were actually centered in the browser, not just in CSS intent
- whether the latest shell changes introduced any runtime issues

## What changed

- unified the visible title to `德扑酒馆：赢了就撤!`
- updated the visual docs to v3 scene-center rules
- reduced the search top rail to:
  - phase chip
  - suspicion meter
  - cash / action points
- reduced the table top rail to:
  - room phase chip
  - pot / current call / heat
- simplified table opponent tags so they advertise inspection instead of surfacing extra info immediately
- centered the search modal layer and confirmed its geometry in-browser
- reduced toast clutter to the newest message only

## Validation summary

- `node --check src/main.js`
- `node --check src/game.js`
- `node --check src/i18n.js`
- browser run:
  - menu
  - search
  - routes modal
  - services modal
  - table
  - dossier / log side panels
- console errors: none
- page errors: none

## Result

The search phase now reads much closer to the intended structure:

- one strong center action
- smaller supporting anchors
- centered masked modals for detail work

The table phase is improved but is still the next most likely place to compress if user playtest says the felt is not dominant enough.

## Next recommendation

- get another playtest pass on this build
- only if the table still feels heavy:
  - reduce seat-tag prominence
  - shrink the utility buttons further
  - lower the visual weight of the bottom action shell
