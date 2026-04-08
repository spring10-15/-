Original prompt: 我计划在这个文件夹下创建一个游戏，不是简单的小游戏，而是中型的游戏，我现在还在 idea 阶段，你先补全制作游戏需要的技能，等会我们一起来头脑风暴

## 2026-03-19

- Established the preproduction skill `game-preproduction` under `~/.codex/skills`.
- Created `design-baseline.md` with the vertical-slice rules for the bar poker extraction game.
- Locked the current vertical-slice scope:
  - 1 bar hub
  - 2 poker tables
  - 2 opponents per table
  - fixed-value items
  - stash, heat, and extraction systems
- Current implementation direction:
  - browser-based prototype
  - search -> cargo table -> search -> mirror hall -> extraction
- Immediate next steps:
  - scaffold the web prototype
  - implement the first playable search and table loop
  - verify it with the web-game Playwright loop

## 2026-03-19 Implementation Update

- Scaffolded a playable browser prototype:
  - `index.html`
  - `styles.css`
  - `src/data.js`
  - `src/poker.js`
  - `src/ai.js`
  - `src/game.js`
  - `src/main.js`
- Implemented the current vertical-slice loop:
  - menu -> start run
  - search phase with stash, intel, buying, selling, heat control, fixed-route reservation
  - cargo table with 2 opponents and 3-hand cap
  - mirror hall with optional collateral and better rewards
  - general, fixed, and drop-bag extraction
  - summary screen with persistent vault settlement
- Added local persistence via `localStorage` for the long-term vault.
- Added debug exposure in browser:
  - `window.__blacklightGame`
  - `window.render_game_to_text()`
  - `window.advanceTime(ms)`
- Verified current behavior:
  - syntax checks pass on all source files
  - Playwright client reaches the search phase and captures canvas output
  - custom browser verification can complete a full run from menu to successful extraction
- Fixed concrete issues during verification:
  - canvas/UI click interception
  - unstable rerendering during automated clicks
  - turn order skipping the player on some streets
  - zero-stack deadlock in the capped betting slice

## Next Build Priorities

- Add more robust player-facing feedback inside tables:
  - clearer hand resolution
  - better reward reveal
  - stronger opponent tells
- Bring more of the search and table HUD into the canvas layer so automated screenshots reflect the real game state better.
- Validate usable items in real flows:
  - Marked Lens
  - Signal Lighter
  - Steadying Drink
  - Disposable Phone
- Start tightening the visual language:
  - card hierarchy
  - felt/readability
  - extraction-end feedback

## Current Project Status

- Prototype status: playable vertical slice
- Current playable loop:
  - main menu
  - start run
  - search phase
  - cargo table
  - search phase
  - mirror hall
  - extraction
  - summary
- Current systems working:
  - persistent vault
  - bankroll and cash-on-hand
  - stashed cash with deferred settlement
  - heat
  - fixed-value valuables
  - usable item inventory
  - fixed route reservation
  - three extraction types
  - table AI archetypes
  - capped-stakes Hold'em flow
- Current known limitations:
  - table visuals are functional but still prototype-grade
  - search and table screens are still more UI-heavy than scene-heavy
  - item interactions are not all deeply surfaced in the presentation yet
  - opponent tells exist in logic, but not yet in expressive audiovisual form

## 2026-03-19 Presentation Architecture Update

- Added `visual-direction.md` to lock the current visual identity:
  - pixel-noir bar
  - restrained mirror-hall surrealism
  - scene-first tactical presentation
- Added `presentation-architecture.md` to define the screen stack and UI/scene split:
  - scene layer
  - interaction layer
  - feedback layer
- Locked the current presentation strategy:
  - do not solve the game's feel through free movement
  - do not turn extraction into a separate action mode
  - use fixed scene compositions with strong interaction overlays
- Current visual implementation note:
  - some UI structure work has started in `src/main.js`
  - next pass should align CSS and canvas rendering to the new presentation architecture

## 2026-03-19 Pixel UI Pass

- Shifted the prototype toward a unified pixel-noir presentation:
  - pixel-font-driven UI hierarchy
  - square pixel borders and cards
  - pixel-style buttons, pills, and metric blocks
  - pixel-art canvas backgrounds for menu, search, table, and summary
- Added scene-level pixel framing and heat-reactive edge treatment to the canvas renderer.
- Verified new screenshots for:
  - menu
  - search phase
  - cargo table
- Current visual result:
  - much closer to a coherent style
  - still leaves room for later custom character art and composition design

## 2026-03-19 Pixel UI Pass 2

- Added a second polish pass to reinforce the pixel-noir look:
  - mode-specific card accents
  - extraction/table/item visual categorization
  - summary result stamp
  - richer pixel scene props in the canvas layer
- Extended the canvas renderer with stronger room identity:
  - bottle shelves and signage in menu/search
  - more explicit route and room markers in search
  - chip piles, card slots, and room-specific props in table scenes
  - stronger vault/settlement props in summary
- Re-ran verification:
  - `node --check` passes
  - custom Playwright screenshots pass with no console or page errors
  - web-game Playwright client still works against the new canvas

## Current Visual Baseline

- The prototype now reads as:
  - pixel-noir bar UI
  - fixed-composition scene-first screens
  - tactical overlay with explicit readability
- Best current references for the latest build:
  - `output/menu-pixel-pass2.png`
  - `output/search-pixel-pass2.png`
  - `output/table-pixel-pass2.png`
  - `output/web-game/shot-0.png`

## Recommended Next Visual Work

- Differentiate Mirror Hall even harder from Cargo Table
- Add placeholder pixel stand-ins for opponent bodies or silhouettes
- Give extraction cards stronger route-specific iconography
- Tighten in-table feedback for showdown and reward reveal

## 2026-03-19 Table Feedback Pass

- Added stateful feedback for recent play:
  - `lastTableResult` now records the previous room's outcome
  - `lastHandSummary` now records how the latest hand ended
- Surfaced that feedback in the UI:
  - search phase now shows a `Last Room` recap card
  - table phase can display a `Last Hand` summary card
  - opponent rows now include placeholder pixel portraits and pressure-state pills
- Improved search-phase continuity:
  - run-level notes now capture stash, intel, purchases, route reservations, heat control, and table outcomes
  - the `Tonight's Trail` panel is now actually useful instead of decorative
- Re-verified the updated flow:
  - played Cargo Table into a return-to-search state
  - confirmed recap data appears in search
  - entered Mirror Hall and confirmed the cooler room identity still holds
  - no console or page errors in validation

## Updated Best Current References

- `output/search-after-cargo-pass3.png`
- `output/mirror-hall-pass3.png`
- `output/web-game/shot-0.png`

## Updated Next Priorities

- Align `styles.css` and canvas scene rendering with `presentation-architecture.md`
- Make menu, search, table, and summary all follow one consistent screen hierarchy
- Push more high-level state into the scene layer:
  - room identity
  - heat pressure
  - table identity
  - extraction tone
- Continue deferring final character design, composition paintovers, music, and sound until the presentation structure is stable

## 2026-03-20 Extraction Readability Pass

- Added live extraction settlement previews to the search phase:
  - `Settlement Snapshot` now tells the player what the best currently available exit would bank
  - extraction cards now show projected carry-out cash, stash net, valuables value, and total settlement
  - drop-bag extraction now previews both sacrifice variants separately
- Added a table-side `Reward Lane` panel:
  - Cargo Table now clearly communicates the Ivory Chip premium and fallback reward line
  - Mirror Hall now clearly communicates the Antique Coin premium line and fallback reward line
  - collateral state, hand index, and current room payout posture are now visible without digging through rules text
- Pushed more presentation into the canvas scene layer:
  - search backdrop now includes route-state indicators for public exit, fixed route, and emergency cut-out
  - table backdrop now includes opponent seat silhouettes with archetype-specific shapes
  - Cargo Table and Mirror Hall now show stronger room-specific reward props on the right side of the stage
- Updated debug-readable state for tooling:
  - `render_game_to_text()` now includes search settlement previews
  - table text state now includes reward-lane context

## 2026-03-20 Verification

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
- Real browser verification completed with updated screenshots:
  - `output/search-pass5-ui.png`
  - `output/cargo-pass5-ui.png`
  - `output/search-after-cargo-pass5-ui.png`
  - `output/mirror-hall-pass5-ui.png`
  - `output/summary-pass5-ui.png`
- The `develop-web-game` Playwright client still runs against the latest build.
- No console errors or page errors surfaced during this pass.

## 2026-03-20 Summary Slip Pass

- The summary screen now carries the run through to the end instead of dropping back to a raw prototype results page.
- Successful exits now show:
  - chosen extraction route
  - cleared rooms
  - settled valuables manifest
  - explicit payout costs
- Failed runs now preserve:
  - cleared rooms before collapse
  - which valuables were left behind

## 2026-03-20 Search Density And Tell Pass

- Added a `Room Settlement` banner when returning from a table:
  - net result
  - reward won or missed
  - collateral result
  - final-hand read
- Compressed extraction cards so more strategic information fits on screen at once:
  - general and fixed routes now emphasize `settles now` and `fee/cost`
  - drop-bag options now emphasize `settles now` versus the sacrifice
- Added explicit tell text to opponent rows:
  - each archetype now has stronger readable behavior phrases
  - the table stage now communicates more than stack sizes and status pills

## 2026-03-20 Latest Verification

- Additional screenshots captured for the density/tell pass:
  - `output/search-pass6-ui.png`
  - `output/cargo-pass6-ui.png`
  - `output/search-after-cargo-pass6-ui.png`
  - `output/summary-pass6-ui.png`
- `develop-web-game` Playwright client re-run successfully after the latest UI changes.

## 2026-03-20 Table Cue And Reward Ceremony Pass

- Added stage-level table cues:
  - item use now creates visible in-table cue cards
  - final-hand state now surfaces as a room-level cue, especially in Mirror Hall
- Strengthened reward ceremony on the return-to-search transition:
  - the `Room Settlement` panel now shows reward/collateral chips as a mini manifest
  - payout outcomes read more like a handoff than a raw recap block
- Strengthened Mirror Hall identity:
  - colder table-stage treatment in CSS
  - additional mirror sigils and reflected floor accents in the canvas scene
- Fixed a real gameplay bug found during verification:
  - `Marked Lens` previously referenced a missing `getNextCommunityPreview` helper
  - the helper now exists and the full item flow works in live play

## 2026-03-20 New Verification Assets

- `output/cargo-marked-lens-pass7.png`
- `output/search-room-settlement-pass7.png`
- `output/mirror-stage-pass7.png`
- `output/web-game/shot-0.png`

## Current Readability Wins

- Search phase now answers the question:
  - if I leave right now, what actually reaches the vault?
- Table phase now answers the question:
  - what am I really trying to win in this room?
- Mirror Hall now feels more like a premium table and less like a recolored Cargo Table.

## Next Priorities

- tighten the right-rail extraction stack so more of it fits above the fold on common laptop heights
- make reward acquisition and carried valuables feel more ceremonial when a room ends
- add stronger per-opponent tells inside the table stage, not just in the sidebar rows
- improve summary presentation so the chosen exit route and settled valuables read like a final settlement slip

## 2026-03-20 Signal Lighter And Carry Pass

- Brought `Signal Lighter` into the actual two-room slice flow:
  - search phase 2 shop stock now includes `Signal Lighter`
  - the item is no longer stranded in a later shop that the current slice never reaches
- Added stronger carry-object presentation across the UI:
  - search ledger now has a dedicated `Carry on hand` panel
  - extraction route cards now preview the valuables currently riding in the coat
  - reward lanes now show reward previews as physical carry objects instead of text-only prize names
- Tightened semantics after visual review:
  - reward preview panels no longer claim the preview item is already being carried
- Pushed the menu scene a little closer to a mood piece:
  - added extra bar-patron silhouettes into the pixel scene layer behind the menu card
  - kept the UI layout stable so future key art can still replace the current placeholder scene

## 2026-03-20 Verification Update

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- Real browser verification now confirms `Signal Lighter` in the current slice:
  - enter Cargo Table
  - return to search phase 2
  - buy `Signal Lighter`
  - enter Mirror Hall
  - use it on Calm Widow
- Latest screenshots from this pass:
  - `output/menu-pass9-ui.png`
  - `output/search-pass9-signal-shop.png`
  - `output/mirror-pass9-signal-lighter.png`
  - `output/web-game/shot-0.png`
- No console errors or page errors surfaced in the pass-9 verification flow.

## Updated Next Priorities

- add a post-use `spent tool` state in table items so powerful reads still leave a visual trace after the item is consumed
- make carried valuables appear more directly in the scene layer, not only in UI panels
- add a lightweight transition beat between room close and return-to-search so rewards land harder
- keep tightening search/extraction density now that carry previews occupy real screen space

## 2026-03-20 Handoff And Spent-Tool Pass

- Added a short-lived `Room Handoff` overlay when a table closes and the run returns to search:
  - room name
  - net result
  - reward line
  - collateral line
  - next-stop framing back to the search floor
- Added persistent room-local traces for consumed table items:
  - `Signal Lighter`
  - `Marked Lens`
  - `Sleeve Clip`
- Table items now leave a `Spent Tool` card in the left rail after use instead of disappearing from the player's memory.
- Added scene-layer carry hooks for valuables:
  - search backdrop can now stage carried goods
  - summary backdrop can now stage settled or lost goods
- Current honest note:
  - the carry scene props work, but they still read subtly behind heavy UI panels and likely need one more contrast/composition pass

## 2026-03-20 Verification Update 2

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- Real browser verification covered:
  - Cargo Table back to search with the new `Room Handoff` overlay
  - Mirror Hall after using `Signal Lighter`, confirming the new `Spent Tool` residue card
- Targeted visual captures for this pass:
  - `output/search-pass10-handoff.png`
  - `output/mirror-pass10-spent-tool.png`
  - `output/search-pass10-carry-scene.png`
  - `output/summary-pass10-carry-scene.png`
  - `output/web-game/shot-0.png`
- No console errors or page errors surfaced in the pass-10 verification run.

## Updated Next Priorities 2

- raise the contrast and placement of scene-layer carry props so they read more clearly behind the UI shell
- add a stronger room-close payout beat between the overlay and the persistent search recap
- keep building a visual memory for used tools and recent table events
- continue improving room identity without expanding content scope yet

## 2026-03-20 Handoff Memory And Carry Stage Pass

- Deepened the room-close handoff so it reads more like a settlement ritual than a toast:
  - `Room Handoff` now includes a reward/collateral mini manifest
  - the last hand's name and text now survive into the return-to-search beat
- Extended table-memory persistence:
  - used `Marked Lens`, `Signal Lighter`, and `Sleeve Clip` now leave a room-local `Spent Tool` residue card
- Strengthened carry-object staging outside the table:
  - summary backdrops now stage settled or seized valuables as left/right side showcases
  - search backdrops gained the first `coat check` carry staging hook
- Honest read after the first visual check:
  - summary carry staging landed well
  - the search carry staging was still too subtle behind the UI shell and needed another pass

## 2026-03-20 Search Carry Visibility Pass

- Promoted carry state higher in the search screen hierarchy:
  - search header now includes a compact `Coat Check` carry strip with live valuables and total carried value
  - the strip gives immediate above-the-fold confirmation of what is still riding in the coat
- Reworked the search scene prop from a boxed showcase into a lighter `coat check` rig:
  - the scene layer now keeps an atmospheric carry anchor in the bar itself
  - the explicit readable carry state now lives in the header, not only in the left ledger
- Loosened the search-mode banner shell slightly:
  - top-of-screen UI is a bit more transparent in search mode so the scene can breathe through it
- Current result:
  - carry is now readable immediately on entry to search
  - scene-layer carry still works best as atmosphere rather than literal inventory display

## 2026-03-20 Verification Update 3

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- Real browser verification re-ran the current slice with no console errors or page errors:
  - Cargo Table -> search handoff
  - search phase 2 buy `Signal Lighter`
  - Mirror Hall use `Signal Lighter`
- Latest screenshots for the new carry-visibility pass:
  - `output/search-pass12-carry-header.png`
  - `output/search-pass11-handoff.png`
  - `output/mirror-pass11-spent-tool.png`
  - `output/summary-pass11-carry-scene.png`
  - `output/web-game/shot-pass12.png`
- The `develop-web-game` Playwright client still runs cleanly against the latest build.

## Updated Next Priorities 3

- make extraction routes feel more visually distinct at the decision point, not just in labels and cost lines
- extend room-memory beyond spent tools so showdown, collateral, and reward moments leave stronger traces
- keep refining how carry goods surface across search, extraction, and summary without overcrowding the screen
- continue tightening the search and table presentation before expanding content scope

## 2026-03-20 Extraction Identity Pass

- Reworked the three extraction routes so they read like different exit philosophies instead of near-identical forms:
  - `General Extraction` now presents as a `Taxed Walkout`
  - `Fixed Route` now presents as a `Runner Hand-Off`
  - `Drop-Bag` now presents as a `Break Glass Exit`
- Added a new route-identity block to every extraction card:
  - short posture title
  - one-sentence summary of the route's real tradeoff
  - three pixel trait tags that tell the player how this route behaves before they parse the numbers
- Pushed more route-specific presentation into the shell:
  - warm public-exit treatment for general extraction
  - colder runner/whisper treatment for fixed routes
  - harder crimson pressure treatment for drop-bag
- Tightened route action language:
  - `Walk Front`
  - `Meet Runner`
  - `Burn Cash`
  - `Dump Goods`

## 2026-03-20 Verification Update 4

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
- Targeted browser verification used a primed search state with stash, valuables, heat, and a live reserved route.
- The `develop-web-game` Playwright client still runs cleanly against the latest build.
- No console errors or page errors surfaced in the pass-13 verification flow.
- New focused captures for this pass:
  - `output/extract-general-pass13.png`
  - `output/extract-fixed-pass13.png`
  - `output/extract-dropbag-pass13.png`
  - `output/search-pass13-extraction-full.png`
  - `output/search-pass13-extraction-panel.png`

## Updated Next Priorities 4

- extend room-memory beyond used tools so reward, collateral, and showdown outcomes leave stronger visual traces
- give the extraction decision point a little more route-specific ceremony once the current readability gains settle
- keep tightening the relationship between search recap, carry state, and exit choice
- continue polishing table-pressure and opponent tell feedback before expanding content scope

## 2026-03-20 Room Trace Pass

- Extended `room memory` beyond spent items:
  - `Room Settlement` now includes a three-part trace strip for reward, collateral, and last-hand outcome
  - `Last Room` recap now keeps the same trace language in a compact stacked version for the narrow left rail
- The goal of the trace strip is to make a closed room feel like it left behind artifacts, not just numbers:
  - what prize came off the table
  - what collateral stayed behind or returned
  - what kind of final hand actually closed the room
- This pass gives search mode a stronger memory bridge between:
  - table play
  - handoff overlay
  - left-rail recap
  - center settlement banner

## 2026-03-20 Verification Update 5

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
- Targeted UI verification used a synthetic settled-room state to verify reward, collateral, and showdown traces together.
- The `develop-web-game` Playwright client still runs cleanly against the latest build.
- No console errors or page errors surfaced in the pass-14 verification flow.
- New focused captures for this pass:
  - `output/search-pass14-room-settlement.png`
  - `output/search-pass14-last-room.png`
  - `output/search-pass14-room-traces-full.png`

## 2026-03-20 Plan Review And Archive

- Reviewed the current project plan against the actual implementation status.
- Created a dedicated checkpoint archive with:
  - a checked plan review
  - a snapshot of `progress.md`
  - a snapshot of `development-plan.md`
- Archive location:
  - `archive/2026-03-20-plan-checkpoint/`

## Updated Next Priorities 5

- add a little more ceremony and motion to the extraction choice point now that route identity is clearer
- keep tightening the connection between search recap, carry state, and exit choice
- deepen table-pressure and opponent tell feedback before expanding content
- begin planning the first true system-depth pass after the current readability layer feels stable

## 2026-03-20 Noir Illustration Direction Shift

- Accepted a formal direction change away from the old finished-target pixel look.
- New target presentation is now:
  - noir tavern illustration
  - pseudo-2.5D scene plates
  - fixed cinematic cameras by mode
  - tactical UI layered above the scene
- Updated the core direction documents:
  - `visual-direction.md`
  - `presentation-architecture.md`
- Repositioned the pixel build:
  - still useful as a prototype shell and readability scaffold
  - no longer the intended shipping art direction

## 2026-03-20 Illustration Scene Migration Pass

- Wired the user-supplied reference images into the live build as scene-layer anchors:
  - menu and search now use the tavern overview reference
  - table now uses the table-view reference
  - summary now uses the extraction/alley reference
- Added scene cropping and grading in canvas so the references behave more like integrated backgrounds than pasted full images.
- Updated in-build copy to reflect the new route:
  - the build focus now references noir illustration scenes
  - the top scene label now reads `NOIR 2.5D`
- Kept the existing UI shell and systems intact so the migration stays low-risk while we validate the new direction.

## 2026-03-20 Verification Update 6

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
- Real browser verification now covers all four major presentation modes under the new scene direction:
  - `output/menu-pass15-noir-scene.png`
  - `output/search-pass15-noir-scene.png`
  - `output/table-pass15-noir-scene.png`
  - `output/summary-pass15-noir-scene.png`
- The `develop-web-game` Playwright client still runs cleanly against the latest build.
- No console errors or page errors surfaced in the pass-15 verification flow.

## 2026-03-20 Direction Shift Archive

- Created a dedicated archive checkpoint for the new visual route:
  - `archive/2026-03-20-noir-direction-shift/`

## Updated Next Priorities 6

- reskin the current UI shell so panels, buttons, and cards feel less pixel-prototype and more like noir physical artifacts
- make the search and table screens react more naturally to the new illustrated scene plates
- add more extraction commitment ceremony now that the route identity and scene framing are stronger
- keep deepening table pressure and tell readability before moving into broader system depth work

## 2026-03-20 Noir Shell Reskin And Extraction Commit Pass

- Reskinned the interaction shell away from the old pixel-prototype feel:
  - panels, cards, pills, buttons, and inputs now read more like noir paper artifacts
  - display typography now uses a local serif stack instead of the previous pixel-font shell
  - menu, search, table, and summary overlays sit more naturally on the illustrated scene plates
- Added an extraction review / commit layer to search mode:
  - extraction cards now first move into a reviewed state
  - a dedicated commit panel appears with route posture, route summary, and settlement metrics
  - the player can now stand down before actually closing the run
- Updated debug-readable state:
  - `render_game_to_text()` now reports the currently armed extraction review when one is active

## 2026-03-20 Verification Update 7

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- Fixed a real integration regression during this pass:
  - remote web-font loading could stall page load in automated verification
  - the shell now uses a local font stack so the build loads cleanly offline
- The `develop-web-game` Playwright client runs cleanly again after the shell reskin.
- Targeted browser verification covered the new extraction review flow end-to-end:
  - search idle
  - route reviewed
  - extraction committed
  - summary reached successfully
- New captures for this pass:
  - `output/menu-pass18-noir-shell-verified.png`
  - `output/search-pass18-noir-shell-verified.png`
  - `output/table-pass18-noir-shell-verified.png`
  - `output/summary-pass18-noir-shell-verified.png`
  - `output/search-pass17-extract-review-idle.png`
  - `output/search-pass17-extract-review-armed.png`
  - `output/summary-pass17-extract-review-commit.png`
- No console errors or page errors surfaced in the pass-17 / pass-18 verification flow.

## Updated Next Priorities 7

- keep tightening the link between carry state, stash pressure, and extraction choice now that the commit step exists
- reduce search-mode friction so the extraction rail feels strong without becoming a buried lower panel
- deepen in-table pressure and opponent tell readability before broadening system depth
- prepare the first post-presentation checkpoint once the current noir shell and extraction flow feel fully stable

## 2026-03-20 Search Priority Recheck

- Re-read the current progress and planning docs after the noir shell reskin and extraction commit pass.
- Corrected stale planning language that still referenced the old pixel-noir target in `development-plan.md`.
- Recorded a dedicated next-step review at:
  - `archive/2026-03-20-search-priority-recheck/next-step-review.md`
- New decision:
  - do not open new content or broader system depth yet
  - prioritize search-mode decision clarity first
  - make the player's `leave now vs stay` risk read obvious in one glance

## 2026-03-20 Search Decision Rail Pass

- Reworked the search screen's right rail so it behaves more like a live departure board once the run has meaningful risk on it.
- Added a new `Risk Ledger` block that makes four things explicit:
  - best current settle
  - exposed carry
  - stash still waiting on extraction
  - what the next room would demand in cash and heat
- Search mode now dynamically reorders the right rail:
  - early safe states still lead with destinations
  - once a run has carry / stash / heat / a cleared room, extraction moves to the top
- Destination cards were compressed so the rail no longer duplicates full intel-card detail:
  - intel progress chips
  - short room summary
  - clear status pill
- Updated debug-readable state again:
  - `render_game_to_text()` now exposes a compact `riskLedger` block during search mode

## 2026-03-20 Verification Update 8

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs cleanly after the search-screen rework.
- Targeted browser verification covered three important search states:
  - opening search board
  - risk-weighted search board after a cleared room
  - reviewed extraction state with the new right-rail emphasis
- New captures for this pass:
  - `output/search-pass19-opening-viewport.png`
  - `output/search-pass19-risk-viewport.png`
  - `output/search-pass19-risk-review-viewport.png`
- No console errors or page errors surfaced in the pass-19 verification flow.

## Updated Next Priorities 8

- keep tightening the search decision rail until extraction and destination choice both read cleanly without scrolling
- return to in-table pressure and opponent tell readability once the search screen no longer feels overloaded
- keep stress-testing the link between stash pressure, carried goods, and route choice before expanding systems
- prepare the first post-presentation checkpoint after one more stable pass on search/table readability

## 2026-03-20 First-Person Presentation Constraint

- Locked a new presentation rule from the latest user direction:
  - playable scenes should be first-person as much as possible
  - scene changes, handoffs, extraction aftermath, and similar beats may use outsider framing
- Updated the presentation docs so this rule is part of the project baseline instead of a temporary chat note:
  - `visual-direction.md`
  - `presentation-architecture.md`

## 2026-03-20 First-Person Floor And Presence Pass

- Search mode now starts moving away from pure background-plus-panels:
  - the central interaction area is broken into smaller bar-floor stations instead of one large modal-feeling block
  - a new scene-presence strip anchors the current bar state in-world:
    - ledger counter
    - back shelf
    - service gate
    - coat check
- Added first-person foreground framing to playable modes:
  - search now has a subtle bar / coat / glass foreground treatment
  - table now has a subtle table-edge / sleeve / chip foreground treatment
- Added a first pass on more embodied character presence in table mode:
  - a new seat-presence strip gives opponents and the player animated bust stand-ins
  - existing portrait parts now have idle motion instead of reading as totally static blocks
- Scene changes now reset the overlay scroll position so search/table transitions feel more like camera cuts than leftover scrolled pages
- Goal of this pass:
  - make the game feel more like the player is physically in the room
  - reduce the sense that the game is only a background image plus floating admin panels

## 2026-03-20 Verification Update 9

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs cleanly after the first-person presentation pass.
- Targeted browser verification covered:
  - opening first-person search state
  - a risk-bearing search state after the first room
  - first-person table entry into Mirror Hall
- New captures for this pass:
  - `output/search-pass20-first-person-opening.png`
  - `output/search-pass20-first-person-risk.png`
  - `output/table-pass20-first-person-presence.png`
  - `output/table-pass20-first-person-presence-top.png`
- No console errors or page errors surfaced in the pass-20 verification flow.

## Updated Next Priorities 9

- keep converting playable scenes away from large observer-style panels and toward first-person scene anchors
- strengthen the table-side first-person presentation until opponent presence is readable without feeling like a dashboard
- keep search readable while making stations feel more spatial and less like floating cards
- use outsider framing more deliberately in future handoff / extraction transition beats

## 2026-03-20 Table Rail And Cutaway Pass

- Pushed the playable camera split further into implementation:
  - search and table remain the player-facing modes
  - summary now explicitly carries outsider framing through a new cutaway shell
- Rebuilt table mode around a stronger first-person reading:
  - the table is no longer presented as a large left sidebar plus a main panel
  - the action panel now sits at the front of the table view so the first read is “what can I do right now?”
  - room stakes, tools, and the action log were pushed into a secondary support grid below the felt instead of dominating the primary camera view
- Tightened seat readability at the felt:
  - opponent seats now run side-by-side in the main stage instead of reading as a long stacked dashboard
  - the goal is to keep the table closer to “I am seated here” rather than “I opened a control panel”
- Strengthened outsider camera language for non-playable beats:
  - summary now uses a visible outsider matte / cutaway frame
  - the room handoff beat now explicitly labels itself as a cutaway moment

## 2026-03-20 Verification Update 10

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs cleanly after the table-layout and outsider-frame pass.
- Targeted browser verification covered:
  - opening search floor after the first-person station pass
  - entering Cargo Table with the new forward action rail visible in the initial viewport
  - reviewed extraction state
  - outsider-framed summary state after committing a route
- New captures for this pass:
  - `output/search-pass21-first-person-floor.png`
  - `output/table-pass21-first-person-layout.png`
  - `output/summary-pass21-outsider-frame.png`
  - `output/search-pass22-first-person-floor.png`
  - `output/table-pass22-first-person-viewport.png`
  - `output/search-pass22-extract-review.png`
  - `output/summary-pass22-outsider-frame.png`
- Visual read from the pass:
  - table mode now surfaces decision buttons early enough to feel like a playable seat, not a hidden lower panel
  - summary reads more like a deliberate external look at the exit scene
  - search still benefits from the new first-person floor stations, but it is still the most panel-heavy playable mode
- No console errors or page errors surfaced in the targeted verification flow.

## Updated Next Priorities 10

- keep reducing the search screen’s remaining “overlay board” feel so more actions read like anchored bar interactions
- deepen the first-person table presentation with stronger seat presence, more embodied opponent motion, and fewer flat info slabs
- start turning handoff and extraction beats into clearer short transition moments, not only UI overlays
- preserve current readability while moving more of the interaction shell into scene-anchored props and rails

## 2026-03-20 Search Anchor Reconfirm

- Did a fresh alignment check before touching implementation again.
- Archived the current plan re-check at:
  - `archive/2026-03-20-search-anchor-reconfirm/alignment-note.md`
- Confirmed the build is still on-plan:
  - no new systems
  - no extra room/content expansion
  - current highest-priority work is still reducing search mode’s detached panel feeling

## 2026-03-20 Search Primary / Support Split Pass

- Reworked search mode so the primary camera view no longer starts with a full-height support ledger on the left.
- Search now reads in two levels:
  - primary row:
    - main bar-floor interaction field
    - route / extraction rail
  - support row:
    - ledger / exposure support
    - inventory / notes / last-room recap support
- Goal of this change:
  - let the first read be “what can I do on this floor right now?”
  - push lower-priority bookkeeping into support space instead of letting it dominate the playable camera
- The new layout keeps the route rail visible while making the central bar-floor interactions more obviously primary.

## 2026-03-20 Verification Update 11

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs cleanly after the search primary/support split.
- Targeted browser verification covered:
  - fresh search opening state after the layout split
  - reviewed extraction state after the split
  - table entry to confirm search changes did not regress the forward action rail
- New captures for this pass:
  - `output/search-pass23-anchored-primary.png`
  - `output/search-pass23-anchored-review.png`
  - `output/table-pass23-post-search-check.png`
- Visual read from the pass:
  - search opening state now foregrounds the bar floor and route board more clearly
  - search support information is no longer the first structural block the eye lands on
  - reviewed extraction still pulls strong focus on the right rail, which is acceptable for now because that state is intentionally about committing to leave
  - table readability remained intact after the search-side changes
- No console errors or page errors surfaced in the verification flow.

## Updated Next Priorities 11

- continue reducing the search mode’s remaining “organized overlay board” feel by turning more utilities into scene-anchored bar fixtures
- strengthen first-person embodiment in table mode with better seat motion and more tactile opponent presence
- make extraction review / handoff feel more like short transition beats and less like static UI interruption
- keep validating every presentation change against the current plan so the project stays presentation-first without drifting into system sprawl

## 2026-03-21 Plan Recheck

- Reconfirmed the roadmap before continuing implementation.
- Archived the new alignment note at:
  - `archive/2026-03-21-plan-recheck/alignment-note.md`
- Current conclusion remains unchanged:
  - keep working on presentation grammar first
  - do not broaden systems yet
  - search is still the highest-leverage place to improve next

## 2026-03-21 Search Fixture Layer Pass

- Pushed search mode one step closer to a bar-floor interaction space:
  - split the playable search field into a near-hand fixture row and a deeper info / shelf row
  - stash and asset conversion now sit in the front layer as the most immediate bar fixtures
  - intel and shelf stock now read as deeper-room reference surfaces
- This keeps the player’s first read closer to:
  - what is in reach right now
  - what room information and supplies sit a little deeper in the space
- The support ledger row below the main search view remains intact, so readability was preserved while the top of the screen became more spatial.

## 2026-03-21 Verification Update 12

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs cleanly after the search fixture-row pass.
- Targeted browser verification covered:
  - opening search state with the new fixture split
  - reviewed extraction state after the split
- New captures for this pass:
  - `output/search-pass24-fixture-row.png`
  - `output/search-pass24-fixture-review.png`
- Visual read from the pass:
  - opening search now reads more clearly as “front fixtures first, deeper boards second”
  - the main decision surface feels less like one uniform matrix of cards
  - reviewed extraction remains strongly right-rail dominated, which still fits the “commit to leave” state for now
- No console errors or page errors surfaced in the verification flow.

## Updated Next Priorities 12

- keep converting search interactions into stronger scene fixtures so the top of the mode feels less like floating panels
- return to table embodiment next, especially opponent motion / presence and more tactile edge-of-table feedback
- improve extraction review and handoff flow so those moments feel like short cutaways instead of large static overlays
- keep using plan checkpoints before each new chunk so the demo grows in one deliberate direction

## 2026-03-22 Table Motion And Atmosphere Pass

- Continued the current plan without broadening systems.
- No new roadmap conflicts were found in this pass:
  - still presentation-first
  - still no system expansion
  - still focused on getting the demo to feel more alive
- Added live motion / atmosphere layers to the illustrated scenes:
  - search now gets lamp glow, smoke drift, and high-heat observation sweep accents
  - table now gets lamp glow, smoke, active-seat focus, pot shimmer, and final-hand pulse
  - summary now gets a subtle street sweep / headlight-style motion pass
- Added more character-specific table embodiment through motion differences:
  - Braggart now leans and pushes more
  - Clerk moves less and nods more conservatively
  - Calm Widow floats more quietly with a colder halo
  - Smiling Knife gets a more nervous twitch / lean rhythm
  - active seats now pulse more clearly

## 2026-03-22 Verification Update 13

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs cleanly after the atmosphere and motion pass.
- Targeted browser verification covered:
  - opening search after the new motion-layer pass
  - first table entry after adding active-seat focus and pot shimmer
  - summary after the street-sweep pass
- New captures for this pass:
  - `output/search-pass25-motion-layer.png`
  - `output/table-pass25-motion-layer.png`
  - `output/summary-pass25-street-sweep.png`
- Visual read from the pass:
  - screenshots still only capture one instant, so they do not fully show the new animation value
  - however, the live build now has more atmosphere and seat pressure even before adding more systems
  - current table view remains readable while feeling less static
- No console errors or page errors surfaced during verification.

## Updated Next Priorities 13

- keep pushing table embodiment next, especially stronger felt-side pressure and more readable active-opponent emphasis
- keep converting extraction review and handoff into shorter, more cinematic beats for tomorrow’s demo feel
- do one more pass on search fixtures only if needed after table/handoff improvements, not before
- keep checking for plan conflicts before any scope changes so the demo stays coherent

## 2026-03-22 Plan Recheck 2

- Rechecked the working roadmap before changing presentation again.
- Archived the alignment note at:
  - `archive/2026-03-22-table-cutaway-recheck/alignment-note.md`
- Current conclusion still holds:
  - keep demo work presentation-first
  - do not broaden the rules or add new rooms
  - next leverage is still table pressure plus better transition ceremony

## 2026-03-22 Table Pressure And Cutaway Pass

- Continued the current plan without broadening the game rules.
- Added a new `Under The Light` pressure strip to table mode:
  - surfaces who currently owns the room
  - calls out whether the player is being answered or answering
  - ties actor, call amount, reward lane, and heat into one first-person pressure read
- Strengthened opponent pressure language inside each seat card:
  - new threat chips
  - more explicit seat-pressure accent copy
  - clearer “under the lamp” treatment for the acting opponent
- Reworked extraction review so it feels more like a commit beat than a plain summary card:
  - new review -> commit -> settle sequence strip
  - stronger consequence copy per route
  - noir matte treatment inside the commit shell
- Reworked room handoff so it reads more like a brief cutaway:
  - room badge
  - stronger good/bad posture label
  - handoff footer that clearly returns the camera to the search floor
- Extended debug-readable state:
  - table text state now includes the current pressure focus summary

## 2026-03-22 Verification Update 14

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs after the pressure / cutaway pass.
- Targeted browser verification covered:
  - fresh search opening state after the latest scene-first changes
  - first table entry with the new `Under The Light` pressure strip
  - return-to-search handoff state after clearing out of Cargo Table
  - reviewed extraction state with the new commit sequence shell
- New captures for this pass:
  - `output/search-pass26-first-person-floor.png`
  - `output/table-pass26-pressure-shell.png`
  - `output/search-pass26-handoff-cutaway.png`
  - `output/search-pass26-extraction-commit.png`
- Visual read from the pass:
  - table mode now has a much clearer focal read before the player scans the rest of the support grid
  - acting-opponent pressure is easier to feel without relying only on the lower action log
  - handoff and extraction review now feel closer to short transition beats and less like generic overlays
  - no new conflicts appeared against the current first-person / outsider camera grammar
- No console errors or page errors surfaced during verification.

## Updated Next Priorities 14

- keep tightening the table-side dramatic read so showdowns, folds, and reward outcomes land harder near the felt
- keep compressing search mode’s support rows so the first-person floor remains the opening focus on common laptop heights
- carry the new cutaway language into extraction aftermath and summary polish before adding any new content
- keep doing explicit plan checks before scope changes so the demo stays coherent for the first playable handoff

## 2026-03-22 Plan Recheck 3

- Rechecked the current roadmap before touching table payoff and room-resolution presentation.
- Archived the alignment note at:
  - `archive/2026-03-22-finale-recheck/alignment-note.md`
- Conclusion stayed stable:
  - no new systems
  - no new rooms
  - focus on making the existing two-room slice land better at the moment it resolves

## 2026-03-22 Final Hand And Verdict Pass

- Added a dedicated `Last Hand Live` shell to table mode when the room is on its closing hand:
  - premium or fallback lane is now called out above the felt
  - player stack, collateral state, and likely closing reward are visible in one place
  - this helps the room payoff match the pressure setup from the previous pass
- Upgraded `Last Hand` recap cards so they read more like verdict cards:
  - winner callout
  - stronger tone class
  - clearer split between showdown / fold pressure / broken hand
- Added a reusable `room verdict strip` to the payoff surfaces:
  - final hand verdict
  - prize line verdict
  - collateral verdict
- Wired the verdict strip into:
  - search-mode `Room Settlement`
  - `Room Handoff` cutaway
- Extended handoff state so these payoff surfaces can use:
  - last hand type
  - last hand winners

## 2026-03-22 Verification Update 15

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs cleanly after the final-hand / verdict pass.
- Targeted browser verification covered:
  - Cargo Table with a forced final-hand state to verify the new `Last Hand Live` shell
  - return-to-search handoff with the new verdict strip
  - search settlement banner with the same verdict language
- New captures for this pass:
  - `output/table-pass27-final-hand-live.png`
  - `output/search-pass27-handoff-verdict.png`
  - `output/search-pass27-room-settlement-verdict.png`
- Visual read from the pass:
  - final-hand stakes are now much clearer before the room closes
  - the search-side payoff surfaces now show what happened in the room with more conviction instead of only listing recap facts
  - no contradictions showed up against the current first-person scenes / outsider cutaway camera rule
- No console errors or page errors surfaced during verification.

## Updated Next Priorities 15

- keep trimming search support density so the bar floor and route board stay dominant without hiding key economy information
- extend the newer verdict / cutaway language into summary polish so the whole run ends with one consistent presentation grammar
- strengthen table-side showdown feedback a bit further if the final demo still needs more tactile “impact” on card reveal
- continue explicit plan checks before any scope change so the demo remains on one coherent vertical-slice path

## 2026-03-22 Roguelike Baseline Check

- Added the user’s new constraint into the project baseline:
  - the full game should be treated as roguelike
  - the current demo is allowed to stay fixed and authored for now
- Updated the design baseline so the current slice is explicitly framed as:
  - one demo run template
  - not the final content model
- Updated the development plan so future system-depth work points toward:
  - seeded room pools
  - seeded search stock pools
  - seeded route-offer pools
  - authored room templates assembled into runs
- Added a small data-layer anchor so the current `TABLE_ORDER` is clearly described as the demo path rather than the final game structure

## 2026-03-22 Verification Update 16

- Syntax checks pass:
  - `node --check src/data.js`
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs after the roguelike-baseline update.
- No console errors or page errors surfaced in the verification flow.

## Updated Next Priorities 16

- keep polishing the fixed demo path until it is strong enough to stand in for the later roguelike loop
- continue summary and search-density polish before introducing run variation
- when system-depth work begins, expand through seeded content pools instead of turning the project into a longer fixed script
- keep cross-checking implementation work against the roguelike target so demo-only shortcuts do not become accidental final architecture

## 2026-03-22 Path Correction And Search/Summary Continuity Pass

- Corrected the live working path after the project directory rename:
  - real project root is now `1、德扑酒馆：落袋为安`
  - normalized legacy path references so the project now resolves through one canonical root
- Landed the pending search / summary continuity pass that had already been verified in code:
  - compressed the search support ledger into a tighter six-cell read
  - shortened `Tonight's Trail` into a more compact `Trail Snapshot`
  - added summary route topline treatment and a dedicated aftermath strip so the end screen uses the same verdict language as room handoff and settlement
- Continued the live demo presentation pass instead of branching into new systems:
  - the full page shell now carries per-mode illustrated scene fill
  - search, table, and summary shells now hold the scene across tall viewports more cleanly
  - the earlier black dead-zone feeling on laptop / portrait captures is materially reduced

## 2026-03-22 Verification Update 17

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs cleanly after the continuity and scene-fill pass.
- Targeted browser verification covered:
  - search support-density pass on the renamed project root
  - summary aftermath strip presentation
  - fresh search opening with the new full-shell scene fill
  - Cargo Table with the same shell treatment
  - forced summary render after the shell-fill work
- New captures for these passes:
  - `output/search-pass28-support-density.png`
  - `output/summary-pass28-aftermath-strip.png`
  - `output/search-pass29-scene-fill.png`
  - `output/table-pass29-scene-fill.png`
  - `output/summary-pass29-scene-fill-fixed.png`
- Visual read from the pass:
  - search mode now reads less like it is floating over a black page and more like it belongs to one continuous bar scene
  - table mode keeps the illustrated room alive farther down the viewport
  - summary now ends on the same presentation grammar as the newer verdict / handoff surfaces
  - no new contradictions appeared against the current first-person playable scenes / outsider transition rule
- No console errors or page errors surfaced during verification.

## Updated Next Priorities 17

- keep reducing the “background plus organized cards” feeling on the search floor by embedding utility interactions more directly into first-person fixtures
- decide whether the table still needs one last tactile showdown / card-reveal punch before the demo handoff
- prepare a demo checkpoint pass that focuses on polish, atmosphere, and clarity instead of new systems
- keep the current authored demo path stable while preserving the future roguelike architecture based on seeded pools

## 2026-03-22 Plan Node Check 4

- Rechecked the project against the current milestone stack before continuing implementation.
- Archived the check at:
  - `archive/2026-03-22-milestone-status-recheck/alignment-note.md`
- Current node status is:
  - Milestone 1 / vertical-slice clarity: still active
  - Milestone 2 / presentation direction: mostly locked, now in polish rather than discovery
  - Milestone 3 / system depth: intentionally deferred until the demo checkpoint is stronger
  - Milestone 4 / content expansion: not started by design
- Conclusion stayed consistent:
  - keep polishing the authored demo
  - do not add new rooms or mechanics
  - keep turning search into a more scene-anchored first-person interaction surface

## 2026-03-22 Search Fixture Layout Pass

- Reduced a real layout problem in common portrait / laptop captures:
  - search mode was collapsing too early into a long one-column panel wall
  - the presence strip, fixture row, deep row, and support row now stay in healthier multi-column layouts for longer
- Made the two nearest search-floor stations read more like actual bar-side operating points:
  - `Stash Cash` now shows parked/net/status pills
  - `Asset Conversion` now shows heat/route/carry posture pills
  - service actions now live in a clearer station-specific action row
- This keeps the first-person bar floor feeling stronger without changing the underlying systems.

## 2026-03-22 Verification Update 18

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs cleanly after the search fixture layout pass.
- Targeted browser verification covered:
  - fresh search state at `768x1024` to confirm the new multi-column anchor layout
  - Cargo Table entry to confirm the table shell still reads correctly after responsive changes
- New captures for this pass:
  - `output/search-pass30-anchor-grid.png`
  - `output/table-pass30-check.png`
- Visual read from the pass:
  - search now holds a more believable 2x2 anchor structure in the first-person floor instead of turning into a long stacked form too early
  - stash and service stations read more like actual operating points on the bar rail
  - no regressions showed up in table mode
- No console errors or page errors surfaced during verification.

## Updated Next Priorities 18

- decide whether the demo still needs one more tactile table-reveal / showdown-impact pass before checkpointing it
- keep refining search-floor fixtures so the remaining lower cards feel more like bar props and less like generic inventory panels
- prepare a demo-checkpoint pass focused on atmosphere, onboarding clarity, and overall playtest readiness
- keep the current authored path stable while preserving the later seeded roguelike expansion route

## 2026-03-22 Table Reveal Rail Pass

- Gave the table board area a stronger reveal grammar without expanding rules:
  - added a dedicated `Reveal Rail`
  - each street now has a visible `Seen / Live / Ahead` posture
  - the board area now has a more explicit felt shell instead of just a loose card row
- Added stronger street-level stage cues in live table logic:
  - flop reveal cue
  - turn reveal cue
  - river / final river cue
- This makes the table feel more like it is advancing through visible beats instead of silently updating the community cards behind the rest of the shell.

## 2026-03-22 Verification Update 19

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs cleanly after the reveal-rail pass.
- Targeted browser verification covered:
  - standard Cargo Table entry with the new board presentation
  - forced final-river state to verify the `Seen / Live / Ahead` rail and final cue behavior
  - element-level screenshots of the `board-strip` to confirm the new UI actually reads in-frame
- New captures for this pass:
  - `output/table-pass31-reveal-rail.png`
  - `output/table-pass31-final-river.png`
  - `output/table-pass31-board-element.png`
  - `output/table-pass31-board-element-river.png`
- Visual read from the pass:
  - the board no longer feels like a flat appendage below the pressure shell
  - final-river posture is much easier to read at a glance
  - the current table now better communicates that the room resolves through reveal beats, not just betting buttons
- No console errors or page errors surfaced during verification.

## Updated Next Priorities 19

- move into a demo-checkpoint polish pass rather than another big presentation swing
- keep refining lower search-floor modules so the remaining deep-row cards feel more like bar fixtures
- do one full-path demo readiness pass focused on onboarding clarity, atmosphere, and first-play comprehension
- keep the authored two-room demo stable while preserving the later seeded roguelike expansion path

## 2026-03-22 Demo Checkpoint Onboarding Pass

- Started the actual demo-checkpoint polish phase instead of another large presentation rewrite.
- Added lightweight objective strips inside the existing shell rather than using tutorial popups:
  - search now tells the player the current run objective and the best next move
  - table now tells the player what the room is asking for, what prize line matters, and what the immediate read is
  - summary now ends with a `Demo Read` block that turns success/failure into a concrete next-run lesson
- Also pushed this guidance into `render_game_to_text()` so future automated checks can read the same objective layer the player sees.

## 2026-03-22 Verification Update 20

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs cleanly after the onboarding pass.
- Targeted browser verification covered:
  - search opening with the new `Current Objective` strip
  - Cargo Table with the new `Table Objective` strip
  - forced summary collapse state to verify the `Demo Read` lesson panel
  - `render_game_to_text()` now exposing the current objective payload
- New captures for this pass:
  - `output/search-pass32-objective-strip.png`
  - `output/table-pass32-objective-strip.png`
  - `output/summary-pass32-next-step.png`
- Visual read from the pass:
  - search now tells a first-time player what the authored demo expects before they get lost in the floor fixtures
  - table now frames the room as a concrete objective rather than only a list of legal actions
  - summary does a better job of teaching the next run instead of only showing success/failure bookkeeping
- No console errors or page errors surfaced during verification.

## Updated Next Priorities 20

- run a full authored-path demo readiness pass from menu to summary and tighten any remaining first-play confusion
- keep refining the remaining lower search-floor modules so they feel more like physical bar fixtures
- do a final checkpoint sweep for atmosphere and clarity before calling the demo ready for user play
- continue holding scope: no new rooms, no new systems, no early roguelike variation yet

## 2026-03-22 Demo Playtest Handoff Pass

- Added a clearer menu-side `Demo Brief` so the authored slice explains its intended first-run rhythm before the player enters the bar floor.
- Wrote and updated `demo-playtest.md` as the handoff document for user testing:
  - launch target
  - first-run path
  - what this checkpoint is testing
  - current intentional limits
- Ran a full browser playthrough from:
  - menu
  - opening search floor
  - Cargo Table
  - return to search
  - Mirror Hall
  - extraction review
  - summary
- Captured a fresh full-page demo-readiness set under:
  - `output/demo-readiness-pass35/`
- Current checkpoint judgment:
  - the vertical slice is ready for user playtest
  - first-play guidance now exists in menu, search, table, and summary
  - no new system work was added in this pass; the goal was handoff confidence, not scope growth

## 2026-03-22 Verification Update 21

- Syntax checks pass:
  - `node --check src/main.js`
  - `node --check src/game.js`
  - `node --check src/data.js`
  - `node --check src/ai.js`
- The `develop-web-game` Playwright client still runs cleanly after the handoff additions.
- Additional full-page browser verification now covers the whole authored run:
  - `menu`
  - `search-opening`
  - `search-after-prep`
  - `cargo-opening`
  - `search-after-cargo`
  - `mirror-opening`
  - `search-after-mirror`
  - `search-extraction-review`
  - `summary`
- New captures for this pass:
  - `output/demo-readiness-pass35/menu.png`
  - `output/demo-readiness-pass35/search-opening.png`
  - `output/demo-readiness-pass35/cargo-opening.png`
  - `output/demo-readiness-pass35/search-after-mirror.png`
  - `output/demo-readiness-pass35/search-extraction-review.png`
  - `output/demo-readiness-pass35/summary.png`
- Visual read from the pass:
  - the menu now frames the demo path before the player starts
  - search reads as a first-person decision floor rather than only a stack of abstract cards
  - table pressure, reveal beats, and room reward posture all survive real browser playthrough
  - extraction review and summary now feel like a coherent closing chain
- No console errors or page errors surfaced during the full-path verification run.

## Updated Next Priorities 21

- hand the build over for user playtest and gather friction points from a real first run
- fix the highest-friction readability issues before adding more content or variation
- keep the current authored path stable while evaluating whether Milestone 1 exit criteria are now close
- defer roguelike variation, new rooms, and new systems until feedback confirms the demo loop is worth deepening
