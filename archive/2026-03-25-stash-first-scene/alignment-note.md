# Alignment Note

Date: 2026-03-25

## Intent Checked

- The user asked to focus on the first scene:
  - personal assets
  - stash / hideout
  - services
  - case folder
- The scene should be independently editable and fit the root-by-scene folder layout.

## What Changed

- `search` mode now has two sub-scenes:
  - `stash`
  - `tavern`
- Starting a run lands in `stash`.
- Returning from a cleared table lands in `tavern`.
- `scenes/stash/` now owns the first-scene presentation instead of only exporting modal fragments.

## Conflict Check

- No system-flow conflict found with the authored vertical slice:
  - menu
  - stash
  - tavern
  - cargo table
  - tavern
  - mirror hall
  - extraction / summary
- A real documentation conflict was found and corrected:
  - `development-plan.md` still referenced deleted `src/scenes/*.js` files
  - replaced those references with the canonical root `scenes/*/index.js` files

## Remaining Follow-Up

- keep trimming tavern-floor prep behavior if it starts to drift back out of the stash scene
- if Blender integration starts, treat `scenes/stash/` as the first target for hideout replacement
