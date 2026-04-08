# Visual Direction v2

## Core Direction

- Visual identity: noir tavern illustration with pseudo-2.5D scene staging
- Goal: make the game feel like a dangerous illustrated crime drama first, and a systems game second
- Mood split:
  - search scenes feel warm, smoky, crowded, and conspiratorial
  - table scenes feel intimate, pressured, and psychologically exposing
  - extraction and summary scenes feel colder, emptier, and more final

## Direction Shift

The project is no longer aiming for a finished `pixel-noir` look.

The pixel build remains valuable as a prototype shell for:
- layout testing
- screen hierarchy
- system readability
- automation stability

The new target look is:

- painted noir environments
- fixed cinematic camera compositions
- layered UI on top of illustrative scenes
- restrained 2.5D motion through lighting, smoke, parallax, and selective foreground separation

## Pillars

1. The bar is one coherent place
   - Search, tables, extraction, and settlement should feel like different views of the same world.
2. Every mode has a camera identity
   - Search is a wide strategic room view.
   - Table is a close, pressured gambling view.
   - Extraction is a corridor/alley commitment view.
3. Risk is visible in the frame
   - Heat should change light color, threat presence, edge severity, and the sense of exposure.
4. Information stays readable
   - The art can be moody and dense, but key game values must always win over atmosphere when they conflict.

## Reference Lens

Current visual references supplied by the user:

- [德扑酒馆全貌.png](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/output/德扑酒馆全貌.png)
- [德扑牌桌视角.png](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/output/德扑牌桌视角.png)
- [德扑撤离视角.png](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/output/德扑撤离视角.png)

These references establish:

- a black-film tavern mood
- strong practical lighting
- smoke, brass, wood, and wet-street materials
- cinematic, mode-specific camera placement
- a slightly heightened but still grounded crime-fiction tone

## Color Script

- Base shadow:
  - coal black
  - plum-black
  - deep tobacco brown
- Warm interiors:
  - amber lamp light
  - tarnished gold
  - dark mahogany
  - old leather
- Cool pressure:
  - silver-blue reflections
  - cyan street spill
  - rain-soaked slate
- Danger:
  - lacquer red
  - police-light blue
  - bruised magenta accents used sparingly

## Materials

- aged wood bar tops
- green felt and brass chips
- leather briefcases and wallets
- smoky glass and mirrored trims
- wet stone and alley brick for exits
- paper route slips, ledgers, notices, and wanted posters

UI surfaces should feel like:

- ledger paper
- clipped route packets
- tabletop dossiers
- cash trays
- marked evidence cards

## Camera Strategy

### Search

- wide room view
- player reads the whole floor at once
- good for stash, intel, shop, and destination orchestration

### Table

- close, almost first-person table view
- pressure comes from faces, hands, chips, cards, and what is within arm's reach
- this mode should feel the most immediate and least “menu-like”

### Extraction / Summary

- alley or service-path framing
- directional commitment
- the world should feel like it is closing behind the player

## Interaction Language

- UI should remain explicit but feel embedded in the fiction
- major panels should read like:
  - ledgers
  - room placards
  - route slips
  - settlement records
- buttons should feel like committing to a move, not tapping a modern app

## Motion

Preferred motion:

- lamp flicker
- smoke drift
- street-light shimmer
- selective parallax between scene planes
- slight pressure breathing in high-heat states

Avoid:

- exaggerated arcade motion
- full character animation requirements too early
- camera roaming that turns the project into a 3D exploration game

## Technical Interpretation

The current implementation target is:

- static illustrated background plates per mode
- layered overlays and camera-specific crops
- DOM UI above the scene plate
- light grading, tinting, and heat overlays on top

Later upgrades can include:

- foreground object planes
- animated smoke layers
- light sweeps
- partial character cutouts

without changing the game loop.

## Current Build Rule

For now:

- use the supplied illustrations as scene-direction anchors
- preserve current system readability
- migrate scene layer first
- migrate UI skin second
- defer full bespoke character art until the scene grammar is locked

## Deferred

- music and sound
- custom final character renders
- animated cinematics
- free-roam navigation
