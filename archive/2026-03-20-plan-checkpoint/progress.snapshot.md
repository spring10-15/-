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
