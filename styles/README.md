# Styles Folder

This folder now holds the shared CSS layers.

## Order

1. `foundation.css`
   - legacy global baseline and shared components
2. `shared-scene.css`
   - shared scene-shell timing and HUD rules

`/styles.css` is now only the entry file that imports:

- shared layers from this folder
- scene-local layers from `scenes/*/style.css`

## Editing Guidance

- For a single-scene visual pass, start in that scene folder's `style.css`.
- Only edit `foundation.css` when the change is truly global or component-wide.
- Keep scene-specific visual experiments out of `foundation.css` whenever possible.
