# Style Split And Folder Cleanup Checkpoint

Date: 2026-03-25

## Goal

Continue the scene split into the style layer and clean the project structure so scene work can be edited more independently.

## What Changed

- converted root `styles.css` into an import-only entry file
- added scene-oriented style files:
  - `styles/shared-scene.css`
  - `styles/menu-scene.css`
  - `styles/tavern-scene.css`
  - `styles/poker-scene.css`
  - `styles/extraction-scene.css`
- kept `styles/foundation.css` as the shared baseline to avoid breaking the current demo while splitting
- moved the three live scene plates from `output/` to `assets/scene-plates/`
- updated runtime and documentation paths to the new asset location
- added structure docs for the new style and asset folders
- later in the same cleanup line, promoted root `scenes/` to the canonical scene workspace and removed the duplicate `src/scenes/` source layer

## Verification

- syntax checks passed on all active source files
- browser smoke path passed:
  - menu
  - search
  - tavern play modal
  - cargo table
- no console or page errors in the smoke run

## Cleanup Notes

- source art was removed from `output/`
- historical generated screenshots were intentionally kept because progress and archive notes still reference them
- if a future cleanup pass is needed, treat output-history cleanup as a separate archival task rather than mixing it into scene refactors
