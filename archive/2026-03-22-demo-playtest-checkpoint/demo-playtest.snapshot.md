# Demo Playtest Notes

Checkpoint: `2026-03-22 / demo-playtest`

Launch:
- Local dev server target: `http://127.0.0.1:4173`
- If the server is not already running, use `npm run dev`

Current authored path:
- Menu
- Search floor
- Cargo Table
- Search floor
- Mirror Hall
- Extraction
- Summary

What to do on a first run:
- On the first search floor, make one prep move, then open `Cargo Table`.
- After Cargo Table, compare `Mirror Hall` against the available exit routes.
- If money, stash, or valuables feel exposed, check the extraction rail before committing deeper.
- The menu now includes a `Demo Brief`, so the first screen should already point you toward the intended opening rhythm.

What this checkpoint is testing:
- Whether the overall `search -> table -> search -> table -> extract` loop reads cleanly on a first play
- Whether table pressure, reward lines, and reveal beats are understandable without outside explanation
- Whether the current objective strips help the player choose a sensible next step
- Whether the noir shell and first-person scene framing feel like one consistent playable presentation

Intentional limits of this checkpoint:
- The run path is still authored and fixed
- Roguelike variation is a later phase, not part of this playtest build
- This build is focused on clarity, atmosphere, and decision readability over content breadth

Best current verification captures:
- `output/demo-readiness-pass35/menu.png`
- `output/demo-readiness-pass35/search-opening.png`
- `output/demo-readiness-pass35/cargo-opening.png`
- `output/demo-readiness-pass35/search-after-mirror.png`
- `output/demo-readiness-pass35/search-extraction-review.png`
- `output/demo-readiness-pass35/summary.png`
