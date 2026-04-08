# Alignment Note

Date: 2026-03-25

## Intent Checked

- The user provided a dedicated folder / dossier modal image.
- The first scene should keep separating its sub-surfaces instead of sharing one generic modal background.

## What Changed

- `scenes/stash/style.css` now gives `.scene-modal.folder-modal` its own art treatment using:
  - `assets/scene-plates/案件夹弹窗.png`
- The stash scene cluster now has distinct art contracts for:
  - hideout scene
  - personal-assets modal
  - folder modal

## Conflict Check

- No system-flow conflict found.
- No scene routing changes were required; only stash-local presentation changed.
- This reduced a presentation ambiguity:
  - folder modal no longer feels like the same surface as personal-assets modal

## Follow-Up

- if the dossier UI gets expanded, keep that work scene-local in `scenes/stash/`
- avoid reusing the folder plate for service or stash interactions
