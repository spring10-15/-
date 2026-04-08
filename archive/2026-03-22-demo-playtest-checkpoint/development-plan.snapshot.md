# Development Plan

## Current Phase

Phase: vertical-slice readability pass, noir illustration scene migration, and noir shell reskin

Current goal:
- prove the game loop is worth polishing before expanding content
- make extraction and reward decisions readable without outside explanation
- keep the demo authored and stable without losing the overall roguelike direction

Current proven pieces:
- search -> play -> search -> play -> extract structure
- two-table run pacing
- fixed authored demo path standing in for a future roguelike run structure
- money, stash, heat, and valuables as the main tension sources
- fixed-value economy for early balancing
- live extraction previews in the search phase
- room reward lanes for Cargo Table and Mirror Hall
- noir illustration scene plates wired into menu, search, table, and summary
- noir artifact UI shell layered over the illustrated scene plates
- extraction review -> commit -> summary flow working in the live build
- first-person framing is now a formal rule for playable scenes

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
- current chosen lane: noir illustration tavern with pseudo-2.5D scene plates and dossier-like overlays
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
- move from fixed demo content toward seeded roguelike variation in a controlled way
- deepen item behavior and counterplay
- improve opponent behavior variety
- improve table rule variation
- tune heat and extraction pressure
- refine stash tradeoffs
- define room/template pools so authored rooms can be selected into a run instead of always appearing in one order

Exit criteria:
- multiple runs feel meaningfully different
- item use creates real tactical decisions
- table and extraction choices create varied risk profiles
- the game still feels curated even after room/order variation is introduced

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
- keep the current demo path fixed until the presentation and pacing are strong enough to survive variation
- treat the current two-room run as one authored roguelike template, not the final structure of the game

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

## Updated After Pass 15

Completed in this pass:
- the project formally switched target art direction from finished-target pixel-noir to noir illustration 2.5D
- scene-layer migration has begun in the live build:
  - menu/search now use the tavern reference scene
  - table now uses the card-table reference scene
  - summary now uses the extraction alley reference scene
- `visual-direction.md` and `presentation-architecture.md` now reflect the new route
- a dedicated direction-shift archive checkpoint now exists at:
  - `archive/2026-03-20-noir-direction-shift/`

New immediate next work:

1. reskin the current UI shell so it feels less like a pixel prototype and more like noir physical artifacts
2. make search and table overlays react more naturally to the illustrated scene plates
3. add more extraction commitment ceremony now that route identity and scene framing are stronger
4. keep deepening table pressure and tell readability before moving into broader system depth work

## Updated After Pass 18

Completed in these passes:
- the UI shell has been reskinned away from the old pixel-prototype look:
  - local serif/sans stacks
  - softer dossier/paper panel treatment
  - buttons and cards that feel more like noir physical artifacts
- the extraction choice point now has a real commit layer:
  - review route
  - commit or stand down
  - verified handoff into summary
- a real offline-loading regression was discovered and fixed:
  - removed remote font dependency from the shell so automated and offline builds load reliably

New immediate next work:

1. keep tightening the relationship between carry state, stash pressure, and the reviewed extraction choice
2. reduce search-screen friction so extraction stays visible and intentional without becoming a buried lower panel
3. deepen in-table pressure and opponent tell feedback before expanding into broader system depth work
4. prepare the first post-presentation checkpoint once the noir shell and extraction ceremony feel stable enough to lock

## Updated After Pass 19

Completed in this pass:
- the project did a fresh priority review instead of blindly following the previous queue:
  - confirmed search-mode decision clarity is still the highest-leverage next step
  - archived that review at `archive/2026-03-20-search-priority-recheck/next-step-review.md`
- search-mode right rail now reacts to run state more intelligently:
  - safe opening states still foreground destinations
  - post-room / risk-bearing states foreground extraction first
- added a compact `Risk Ledger` block to make the core choice legible:
  - best current settle
  - exposed carry
  - stash still waiting on extraction
  - next room pressure
- compressed destination cards so they behave more like a departure board and less like a second intel wall
- corrected stale planning text so Milestone 2 matches the current noir illustration direction

New immediate next work:

1. keep refining search-mode above-the-fold clarity until extraction and destination choice both read well without scrolling
2. return to in-table pressure and opponent tell readability once the search screen is no longer the biggest friction point
3. stress-test stash pressure and carry exposure against real route choices before broadening system depth
4. prepare the first post-presentation checkpoint after one more stable readability pass across search and table

## Updated After Pass 20

Completed in this pass:
- locked a new presentation rule:
  - search and table should be first-person as much as possible
  - transitions, handoffs, extraction aftermath, and summary can lean more outsider/cinematic
- search mode now starts to feel more spatial and less modal:
  - large central admin block split into smaller floor stations
  - new in-world presence strip for bar state
- playable scenes now include subtle first-person foreground framing:
  - bar edge / coat / glass in search
  - table edge / sleeves / chip foreground in table
- table mode has a first pass on more embodied character presence through animated seat stand-ins

New immediate next work:

1. keep pushing search and table toward first-person scene anchoring so fewer interactions read like detached floating panels
2. make opponent presence and pressure more readable from the table edge, not just from side-rail text
3. keep preserving readability while reducing the “dashboard” feeling in playable scenes
4. use outsider framing more deliberately in future transition beats so the camera grammar stays coherent

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

## Updated After Pass 22

Completed in this pass:
- table mode now respects the first-person rule more concretely in layout, not only in art direction:
  - the main action rail is surfaced before the felt instead of hiding below a tall content stack
  - support information was demoted into a lower support grid
  - opponent presence now reads more like two seats across the table than a long stacked dashboard
- outsider framing is now visible in actual presentation, not only in docs:
  - summary gained a proper outsider matte / cutaway shell
  - room handoff language now explicitly marks those beats as cutaways
- the current camera grammar is now stronger:
  - playable scenes = first-person biased
  - summary / handoff / aftermath = outsider-biased

New immediate next work:

1. keep pushing search mode away from “background plus organized panels” and toward anchored bar interactions
2. strengthen table embodiment further with better seat motion, stronger tell silhouettes, and more tactile table-edge feedback
3. turn handoff / extraction review into shorter transition beats with more cinematic clarity and less static overlay feel
4. preserve the now-improved action readability while continuing to reduce the remaining dashboard-like UI weight

## Updated After Pass 23

Completed in this pass:
- did a fresh plan reconfirm before starting implementation:
  - archived at `archive/2026-03-20-search-anchor-reconfirm/alignment-note.md`
  - confirmed the project is still following the presentation-first roadmap instead of drifting into new systems
- search mode now follows the camera rule more faithfully in structure:
  - the primary row is the playable search camera
  - support ledgers and recap material were moved into a secondary lower row
  - the route rail remains visible, but bookkeeping no longer owns the opening read of the scene

New immediate next work:

1. keep converting search interactions from generic cards into more scene-anchored bar fixtures and service points
2. continue improving table embodiment with stronger opponent motion, silhouette variation, and tactile seat-side feedback
3. evolve extraction review / handoff into shorter cutaway beats with clearer cinematic flow
4. keep doing plan checkpoints before broadening scope so presentation polish does not quietly turn into unplanned system growth

## Updated After Pass 24

Completed in this pass:
- ran another explicit plan recheck before continuing:
  - archived at `archive/2026-03-21-plan-recheck/alignment-note.md`
  - confirmed the work should keep narrowing into presentation grammar, not system expansion
- search mode is now split more intentionally by depth:
  - near-hand fixture row for the most immediate utility interactions
  - deeper board / shelf row for intel and stock
  - lower support row for ledgers, inventory, and recap material

New immediate next work:

1. keep pushing search fixtures to feel more like anchored bar props and less like generic cards
2. shift back to table embodiment next so opponent presence and felt-side pressure catch up with the improved search staging
3. reduce the static-overlay feel in extraction review / handoff with shorter, more cinematic transition treatment
4. continue plan rechecks as part of the workflow so each pass clearly serves the same demo direction

## Updated After Pass 25

Completed in this pass:
- continued following the existing roadmap without expanding scope:
  - no contradictions found against the current presentation-first plan
  - no new system growth was introduced
- added atmosphere and motion layers so the illustrated build feels more like a live demo and less like static plates:
  - search scene glow / smoke / observation accents
  - table seat focus / pot shimmer / final-hand pulse
  - summary street sweep
- strengthened opponent character feel through differentiated motion on portraits and seat busts

New immediate next work:

1. keep pushing table embodiment and active-opponent emphasis until the felt has stronger dramatic pressure
2. turn extraction review and handoff into shorter, more cinematic beats for the near-term demo target
3. only return to search fixture polish after the table and transition passes catch up
4. continue explicit plan checks before any scope shift so tomorrow’s demo remains coherent and buildable

## Updated After Pass 26

Completed in this pass:
- ran another explicit plan recheck before implementation:
  - archived at `archive/2026-03-22-table-cutaway-recheck/alignment-note.md`
  - confirmed the project should keep tightening presentation grammar instead of adding systems
- table mode now has a dedicated pressure read above the felt:
  - actor ownership
  - call pressure
  - reward-lane state
  - heat posture
  - one opponent spotlight that tells the player who currently owns the room
- acting-opponent emphasis is stronger inside the seat cards:
  - threat chip
  - active “under the lamp” treatment
  - clearer accent copy about whether a seat is covering, acting, or waiting
- extraction review and handoff both moved closer to cinematic transition beats:
  - commit sequence strip for exits
  - stronger route consequence copy
  - cutaway styling carried into room handoff
- debug-readable table state now includes the current pressure focus so future verification can target these beats directly

New immediate next work:

1. make showdown / final-hand resolution land as strongly as the new pressure setup so the room payoff matches the room buildup
2. keep trimming search support density so the first-person bar floor remains dominant above the fold
3. extend the new cutaway / commit language into extraction aftermath and summary polish before broadening content
4. keep running plan checks before scope changes so the demo remains coherent and ready for the first external playtest

## Updated After Pass 27

Completed in this pass:
- ran another explicit plan recheck before implementation:
  - archived at `archive/2026-03-22-finale-recheck/alignment-note.md`
  - confirmed the right next move was payoff polish, not new content
- table mode now gives the closing hand its own presentation beat:
  - `Last Hand Live` shell
  - visible primary / secondary reward lane
  - stack and collateral callout near the felt
- room-resolution surfaces now use a stronger verdict grammar:
  - final hand
  - prize line
  - collateral line
- this verdict grammar is now shared across:
  - search settlement banner
  - room handoff cutaway

New immediate next work:

1. keep reducing search support density so the scene-first search floor reads clearly on first glance
2. extend the newer verdict / cutaway treatment into summary so exit, payout, and aftermath all feel like one system
3. decide whether table still needs one more tactile showdown/reveal pass before the demo handoff
4. continue explicit plan checks before any scope growth so the demo remains coherent

## Updated After Roguelike Baseline Check

Completed in this pass:
- formally locked the higher-level game identity as roguelike:
  - seeded variation is the long-term target
  - the current build remains a fixed authored demo path
- updated baseline docs so the current two-room slice is treated as:
  - a demo template
  - not the final content model
- updated data-layer terminology so the current fixed path is explicitly named as demo-only structure

New immediate next work:

1. keep polishing the fixed demo path until it is strong enough to survive future variation
2. avoid introducing run randomization before presentation, pacing, and feedback are stable
3. when system-depth work starts, prioritize seeded room/search/route pools over adding unrelated mechanics
4. keep checking new work against the roguelike target so the project does not quietly harden into a linear one-off sequence

## Updated After Pass 29

Completed in these passes:
- corrected the working-directory rename without losing thread continuity:
  - the real project root is now `1、德扑酒馆：落袋为安`
  - a compatibility symlink keeps the older path usable for existing tool-relative flows
- search and summary now share a cleaner presentation rhythm:
  - compressed support ledger in search
  - shorter trail snapshot
  - summary route topline and aftermath strip
- the illustrated scene shell now extends through the whole page more reliably:
  - per-mode page-shell backdrop fill
  - scene shells hold tall viewports more gracefully
  - search / table / summary no longer fall back to large dead dark zones as easily

New immediate next work:

1. keep turning search-floor utilities into more embedded first-person fixtures and less repeated card stacks
2. decide whether table still needs one final tactile showdown / reveal pass before the demo handoff
3. prepare a demo-checkpoint polish pass focused on clarity, atmosphere, and presentation consistency rather than new content
4. keep the fixed demo path authored and stable while preserving the future seeded roguelike architecture

## Milestone Status Check

- Milestone 1: active
  - the project is still inside vertical-slice clarity and feel polish
- Milestone 2: mostly locked, still being refined
  - presentation direction is no longer exploratory
  - current work is about polish and consistency, not choosing a new visual lane
- Milestone 3: intentionally deferred
  - seeded roguelike variation remains the next system-depth target, but not before the demo checkpoint feels strong
- Milestone 4: deferred
  - no content expansion should start before the current demo checkpoint is convincing

## Updated After Pass 30

Completed in this pass:
- did another explicit milestone / progress check before implementation:
  - archived at `archive/2026-03-22-milestone-status-recheck/alignment-note.md`
  - confirmed the correct next work is still search-floor embodiment, not new mechanics
- search mode now behaves better in common laptop / portrait captures:
  - presence strip stays multi-column longer
  - fixture row stays multi-column longer
  - deep row and support row also avoid collapsing into a single long stack too early
- the two nearest search-floor utility stations now read more like actual operating points:
  - stash status pills
  - route / heat / coat posture pills
  - cleaner station-local action row

New immediate next work:

1. decide whether table still needs one last tactile showdown / reveal-impact pass before the demo checkpoint
2. keep pushing the lower search-floor modules toward more scene-anchored fixtures and less generic grid-wall presentation
3. prepare a demo-checkpoint polish pass centered on onboarding, atmosphere, and run readability
4. keep deferring new content and roguelike variation until the current authored demo is strong enough to represent the target game

## Updated After Pass 31

Completed in this pass:
- the table board area now has a clearer reveal grammar:
  - dedicated reveal rail
  - street status boxes
  - stronger felt shell around the community cards
- street progression now leaves more readable cues in live play:
  - flop reveal cue
  - turn reveal cue
  - river / final river cue
- this addresses one of the remaining table-side clarity gaps without adding any new mechanics

New immediate next work:

1. start a demo-checkpoint polish pass instead of another major presentation rewrite
2. keep improving the lower search-floor modules so the remaining deep rows feel more like physical bar fixtures
3. run a full authored-path clarity pass from menu to summary with first-time-player readability in mind
4. continue deferring new rooms, new systems, and roguelike variation until the current demo is presentation-stable

## Updated After Pass 32

Completed in this pass:
- demo-checkpoint polish is now actively underway
- added embedded onboarding / objective guidance without changing core structure:
  - search `Current Objective`
  - table `Table Objective`
  - summary `Demo Read`
- debug-readable state now includes the current objective layer so verification can assert against the same guidance the player sees

New immediate next work:

1. run one full authored-path demo readiness pass from menu to summary and note any remaining first-play confusion
2. keep improving the remaining lower search-floor modules so they feel more like bar fixtures and less like generic support cards
3. do a final clarity / atmosphere sweep before handing the demo over for user play
4. continue holding scope until the current demo checkpoint feels stable and worth testing

## Updated After Pass 33

Completed in this pass:
- finished the first full demo-readiness handoff sweep
- added a menu-level `Demo Brief` so the authored demo path starts teaching before the player enters the first search floor
- verified the full authored path in a real browser from menu to summary:
  - search opening
  - one prep move
  - Cargo Table
  - return to search
  - Mirror Hall
  - extraction review
  - summary
- wrote a dedicated handoff note in `demo-playtest.md`
- captured a fresh full-page verification set in `output/demo-readiness-pass35/`

New immediate next work:

1. let the user playtest this checkpoint and gather the first outside friction report
2. fix the highest-friction first-run readability or pacing issues before any new content work
3. re-evaluate whether Milestone 1 exit criteria are close after user feedback comes in
4. keep Milestone 3 and broader roguelike variation deferred until the authored demo survives testing cleanly

## Demo Checkpoint Status

- Current build status: ready for demo playtest
- Milestone 1 remains active:
  - the build is now strong enough for user testing
  - the next decision should come from real friction notes, not more speculative system growth
- Milestone 2 remains effectively locked:
  - no new presentation direction shift is needed before feedback
- Milestone 3 remains intentionally deferred:
  - future seeded roguelike variation should wait until this authored demo proves its readability and feel
