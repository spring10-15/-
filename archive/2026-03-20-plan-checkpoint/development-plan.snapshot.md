# Development Plan

## Current Phase

Phase: vertical-slice prototype readability and presentation pass

Current goal:
- prove the game loop is worth polishing before expanding content
- make extraction and reward decisions readable without outside explanation

Current proven pieces:
- search -> play -> search -> play -> extract structure
- two-table run pacing
- money, stash, heat, and valuables as the main tension sources
- fixed-value economy for early balancing
- live extraction previews in the search phase
- room reward lanes for Cargo Table and Mirror Hall
- pixel-noir presentation with room-specific scene props and seat silhouettes

## Near-Term Plan

### Milestone 1: Strengthen the Vertical Slice

Goal:
- make the existing playable loop feel clearer, more stylish, and more understandable

Tasks:
- improve table feedback for bets, calls, folds, and showdowns
- surface item use results more clearly
- make reward acquisition and loss easier to read
- improve extraction decision feedback
- tighten search-screen readability and flow
- improve above-the-fold density on search and summary screens

Exit criteria:
- a first-time player can understand the full run loop without external explanation
- table outcomes feel legible and satisfying
- extraction choices feel like real strategic decisions
- room reward logic reads clearly before the player commits to a table

### Milestone 2: Presentation Direction

Goal:
- define the game's presentation architecture before adding more content

Tasks:
- lock one visual direction for the bar, tables, and UI
- current chosen lane: pixel-noir bar with restrained mirror weirdness
- define the screen architecture for menu, search, table, extraction, and summary
- decide how much of the game is scene-driven versus UI-driven
- establish a stable split between:
  - scene layer
  - interaction layer
  - feedback layer
- define how heat changes presentation across all modes
- reserve audio hooks, but defer music and sound implementation

Exit criteria:
- one clear visual language
- one clear presentation architecture
- one clear interaction language for search, table play, and extraction
- art can be added later without changing the screen structure

### Milestone 3: System Depth Pass

Goal:
- make the prototype systems richer without exploding scope

Tasks:
- deepen item behavior and counterplay
- improve opponent behavior variety
- improve table rule variation
- tune heat and extraction pressure
- refine stash tradeoffs

Exit criteria:
- multiple runs feel meaningfully different
- item use creates real tactical decisions
- table and extraction choices create varied risk profiles

### Milestone 4: Content Expansion

Goal:
- expand beyond the first playable loop only after the core identity is stable

Tasks:
- add more tables or bar states
- add more valuables and usable items
- add more extraction routes
- add more opponent archetypes
- add event-driven search choices if needed

Exit criteria:
- content expands on the established fantasy instead of diluting it
- every new system clearly supports the core loop

## Scope Rules

- keep opponents to 2 per table for the current slice
- keep item values fixed until the core economy feels good
- avoid adding dynamic market pricing until later
- avoid adding extra tables before the current two-table loop feels strong
- avoid adding more complex Hold'em rules like all-in and side pots in the early prototype

## Recommended Next Work

1. compress the search and extraction right rail so more strategic information fits at common laptop heights
2. make room-end rewards and losses feel ceremonial instead of just informational
3. deepen opponent tells and in-table read feedback
4. improve the settlement summary before expanding content

## Updated Immediate Next Work

1. make reward acquisition visually land harder inside the table-to-search transition
2. add richer in-table read feedback for items like Marked Lens and Signal Lighter
3. strengthen Mirror Hall's unique scene identity and high-stakes feel
4. start shaping a more final main menu and title presentation once the core run screens stabilize

## Refreshed Immediate Next Work

1. add an equally strong visible feedback path for `Signal Lighter`, not just `Marked Lens`
2. make reward carry items feel more physical in search, summary, and future extraction moments
3. push the menu/title scene closer to a final mood piece
4. consider a lightweight animated room-transition treatment between search and table once current clarity holds

## Updated After Pass 9

Completed in this pass:
- `Signal Lighter` now exists in the reachable two-room slice and has a verified live-use path
- carry objects now show up more physically in:
  - search ledger
  - extraction route cards
  - room reward previews
- the title scene got a small additional mood pass without changing the screen architecture

New immediate next work:

1. keep a visible `spent tool` residue after table items are used so powerful item moments do not disappear from the left rail
2. bring carried valuables into the scene layer itself, especially in search and extraction-adjacent moments
3. add a room-close transition beat so the move from table back to search feels more like a handoff
4. continue compressing search and extraction density after the added carry-preview components

## Updated After Pass 10

Completed in this pass:
- room close now has a lightweight handoff overlay on the return to search
- consumed table tools now leave a persistent room-local residue card
- search and summary backdrops now have hooks for staged carry props

New immediate next work:

1. increase the contrast and composition strength of carry props in the scene layer so they read through the current UI shell
2. connect the handoff overlay more tightly to reward ceremony and room recap
3. extend the spent-tool memory language to more table events, not only item use
4. keep refining presentation density before expanding systems or content

## Updated After Pass 12

Completed in these passes:
- the room-close handoff now carries more memory:
  - reward/collateral manifest
  - last-hand recap line
- carried goods now surface in two clearer ways during search:
  - a scene-level `coat check` anchor in the bar
  - a compact header carry strip that keeps live valuables above the fold
- search-mode top-shell opacity was eased slightly so the scene can read through more cleanly
- summary-side carry showcases remain the strongest end-of-run physicalization of valuables

New immediate next work:

1. give extraction choices more distinct visual identity so each route feels like a different kind of exit, not just a different fee model
2. extend room-memory beyond used items so reward, collateral, and showdown outcomes leave stronger visible traces
3. keep improving how valuables appear across search, extraction, and summary without turning the screen into a second inventory wall
4. continue tightening table-pressure feedback and opponent tell readability before adding new content

## Updated After Pass 13

Completed in this pass:
- extraction decisions now have clearer route identities:
  - public exit / taxed walkout
  - reserved hand-off / runner line
  - emergency cut-out / break glass exit
- route cards now communicate their personality before the player reads the fine print:
  - posture title
  - summary line
  - trait tags
- route-specific button language and shell treatment now better match the fiction of each exit

New immediate next work:

1. extend room-memory beyond spent items so reward, collateral, and showdown outcomes leave stronger traces after a table closes
2. add a bit more ceremony to the extraction decision point now that route readability is stronger
3. keep improving the link between carry state, stash pressure, and exit choice
4. continue tightening table-pressure feedback and opponent tells before expanding content

## Updated After Pass 14

Completed in this pass:
- room-close memory now extends beyond spent tools:
  - reward trace
  - collateral trace
  - last-hand trace
- the search screen now keeps one consistent room-memory language across:
  - center settlement banner
  - left-rail last-room recap
  - previous handoff work

New immediate next work:

1. add a little more ceremony and motion to the extraction choice point now that route identity and room memory are stronger
2. keep improving the relationship between carry state, stash pressure, and exit choice
3. deepen table-pressure and opponent tell feedback before starting broader system depth work
4. prepare the first true system-depth checkpoint once the current readability/presentation layer feels stable

## 2026-03-20 Plan Review Checkpoint

- A checked project review is archived at:
  - `archive/2026-03-20-plan-checkpoint/plan-review.md`
- Snapshot copies of the working planning docs are archived alongside it.

## Presentation Topics for the Next Discussion

- screen architecture by mode
- how much of the bar is represented as a scene versus interface
- what belongs in the scene layer versus the interaction layer
- what later art should be allowed to replace without rewiring the game
- the color script for safe, pressured, and dangerous states
- the shape of interactions in each mode:
  - search
  - table play
  - extraction
