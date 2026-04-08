# Visual Direction v3

## Core Direction

- Visual identity: noir tavern illustration with pseudo-2.5D scene staging
- Goal: make the game feel like a dangerous illustrated crime drama first, and a systems game second
- Official title: `德扑酒馆：赢了就撤!`
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
   - Search should feel like the player has stepped onto the floor, not like an observer reading a distant wall display.
   - Table should be as close to first-person as readability allows.
   - Extraction and summary can become more outside-looking and cinematic during commitment and aftermath.
3. Risk is visible in the frame
   - Heat should change light color, threat presence, edge severity, and the sense of exposure.
4. Information stays readable
   - The art can be moody and dense, but key game values must always win over atmosphere when they conflict.

## Single Focus Rules

1. Every screen gets one visual center
   - Menu: one title stack
   - Search: one playable room view with hotspot anchors
   - Table: one felt center
   - Summary: one outcome hero
2. Do not distribute modules evenly
   - Supporting information should collapse into tabs, drawers, dossiers, or modal overlays.
3. Scale contrast must be obvious
   - One dominant headline or scene object
   - One secondary guidance layer
   - Everything else should read as utility, not co-equal content
4. Motion must enter in sequence
   - focal scene first
   - guidance second
   - controls last
5. Avoid panel carpeting
   - if a block is not needed for the current decision, it should be hidden, tucked into a tab, or deferred until click

## Reference Lens

Current visual references supplied by the user:

- [德扑酒馆全貌.png](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/assets/scene-plates/德扑酒馆全貌.png)
- [德扑牌桌视角.png](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/assets/scene-plates/德扑牌桌视角.png)
- [德扑撤离视角.png](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/assets/scene-plates/德扑撤离视角.png)

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

- first-person-on-the-floor view
- the player should feel physically present at the bar rail or between stations
- still readable enough for stash, intel, shop, and destination orchestration

### Table

- close, almost first-person table view
- pressure comes from faces, hands, chips, cards, and what is within arm's reach
- this mode should feel the most immediate and least “menu-like”

### Extraction / Summary

- outsider cinematic framing is allowed here
- alley or service-path commitment shots can step away from strict first-person
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
- first-person foreground motion such as sleeves, tabletop edge, coat weight, or objects within reach

Hard motion rules for the production-facing shell:

- animate with `transform` and `opacity` only
- short beats only:
  - 120-180ms for button and chip feedback
  - 180-260ms for small reveals and drawer shifts
  - 260-420ms for modal, scene, or outcome entrances
- do not animate dense reading surfaces while the player is deciding
- if a surface contains numbers, legal actions, or route costs, keep it mostly still once visible

Avoid:

- exaggerated arcade motion
- full character animation requirements too early
- camera roaming that turns the project into a 3D exploration game

## Scene Effect Allocation

### 3D / Blender Priority

- Search:
  - bar counter
  - deposit vault window
  - room doorframes
  - first-person foreground sleeves or hands
- Table:
  - felt rim
  - chip piles
  - lamp cone
  - opponent seat silhouettes
- Summary / Extraction:
  - optional for hero doorway and alley depth only
  - flatter composition is acceptable after the result lands

### Particle Backgrounds

- Search:
  - smoke drift
  - dust in lamp cones
- Table:
  - lamp smoke
  - very light felt haze
- Summary:
  - rain mist
  - street vapor

### Opening Animation

- Menu: yes, strongest opening animation
- Search: light scene settle-in only
- Table: subtle reveal pacing when entering a hand or a new street
- Summary: one strong result entrance, then calm down quickly

### Reduced Motion Zones

- route review
- dossier reading
- inventory / case folder
- legal action rail
- any text-dense modal

## Color Guardrails

Avoid these combinations in the main shell:

- neon purple + cyan gradients
- saturated red + saturated green used as equal UI weights
- clean white on bright cyan
- pure black + pure red everywhere at once
- flat gold-on-beige low-contrast paper surfaces

Prefer:

- tobacco browns
- brass gold
- muted ivory
- restrained blue-gray pressure accents
- red only as a high-danger marker

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

Current implementation bias after the latest pass:

- search and table should keep primary actions in the player’s forward view instead of burying them behind side dashboards
- table decisions should sit near the player’s table edge, with support information dropping below the primary felt view
- summary and similar aftermath beats are allowed to use stronger outsider mattes or cutaway framing than playable scenes

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
