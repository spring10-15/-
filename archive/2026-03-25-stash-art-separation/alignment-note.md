# Alignment Note

Date: 2026-03-25

## Intent Checked

- The user explicitly wanted the stash / hideout scene to stop using the tavern background.
- The user also supplied a dedicated personal-assets modal image.

## What Changed

- `search` illustration routing now distinguishes between:
  - stash / hideout
  - tavern floor
- the stash scene uses:
  - `assets/scene-plates/藏匿点场景.png`
- the stash services / personal-assets modal uses:
  - `assets/scene-plates/个人资产弹窗.png`
- the tavern floor keeps using the tavern plate

## Conflict Check

- No authored-flow conflict found:
  - menu still enters stash first
  - tavern remains the room-selection scene
  - poker and extraction are untouched
- This change reduced a previous presentation conflict:
  - stash and tavern no longer shared one background plate, which had been visually misleading

## Follow-Up

- if the user adds a dedicated dossier / folder plate, wire it into `scenes/stash/` next
- keep future scene plates scene-local; avoid reusing tavern art for hideout UI again
