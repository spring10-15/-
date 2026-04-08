# Plan Review Checkpoint

Date: 2026-03-20

Current read:
- The project now has a stable, readable vertical slice with a coherent presentation language.
- The best next move is still polish and depth, not content expansion.
- We should keep squeezing clarity and tension out of the current two-room loop before adding more rooms, systems, or economy complexity.

## Done And Archived

### Foundation

- [x] Lock the game concept, scope, and baseline rules in [design-baseline.md](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/design-baseline.md)
- [x] Build the first playable browser prototype loop
- [x] Support the current run flow: `menu -> search -> cargo table -> search -> mirror hall -> extract -> summary`
- [x] Add persistent vault settlement with local storage
- [x] Ship the fixed-value valuables, stash, heat, and extraction economy for the current slice
- [x] Keep the poker scope controlled with two opponents per table and capped-stakes Hold'em

### Presentation And Readability

- [x] Lock one visual direction: pixel-noir bar with restrained mirror weirdness
- [x] Define the presentation architecture in [presentation-architecture.md](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/presentation-architecture.md)
- [x] Build stable menu, search, table, and summary screen structures
- [x] Add live extraction settlement previews in search
- [x] Add room reward lanes for Cargo Table and Mirror Hall
- [x] Differentiate Cargo Table and Mirror Hall in both UI shell and scene layer
- [x] Add opponent stand-ins, tell text, and stage cues
- [x] Add room-close handoff overlay on the return to search
- [x] Add `Spent Tool` memory for used table items
- [x] Surface carry valuables more clearly across search, extraction, and summary
- [x] Give extraction routes distinct identities and route posture blocks
- [x] Add `room trace` visuals for reward, collateral, and the final hand outcome

### Verification Workflow

- [x] Keep `window.render_game_to_text()` and `window.advanceTime(ms)` working for tooling
- [x] Maintain syntax checks on the main source files
- [x] Keep the `develop-web-game` Playwright client in the loop after meaningful changes
- [x] Maintain screenshot-based validation in `output/`

## Not Done Yet

### Current Phase: Readability And Presentation Polish

- [ ] Add a little more ceremony and motion to the extraction choice point
Next:
give each route a stronger “commit” moment with selected-route emphasis or a short transition treatment

- [ ] Tighten the relationship between carry state, stash pressure, and exit choice
Next:
show more directly what is safe, what is exposed, and what the player is still gambling by staying

- [ ] Deepen table-pressure and opponent tell feedback during active hands
Next:
make posture shifts, pressure ramps, and player-facing reads change more clearly from street to street

### System Depth Pass

- [ ] Deepen item behavior and counterplay
Next:
make the current tool set richer before adding more items

- [ ] Improve opponent behavior variety
Next:
add clearer per-archetype pressure patterns and more visible reactions to the player's line

- [ ] Improve table rule variation
Next:
introduce a small second layer of room variation only after the current two rooms feel fully legible

- [ ] Tune heat and extraction pressure
Next:
stress-test edge cases around high heat, route denial, and bad-cash emergency exits

- [ ] Refine stash tradeoffs
Next:
keep testing whether stash is meaningful tension rather than just a correct habit

### Content Expansion

- [ ] Add more tables or bar states
- [ ] Add more valuables and usable items
- [ ] Add more extraction routes
- [ ] Add more opponent archetypes
- [ ] Add event-driven search choices if needed

Current recommendation:
do not start these until the current vertical slice feels obviously polished and self-explanatory

## Intentionally Deferred

- [ ] Dynamic market pricing for valuables
- [ ] More complex Hold'em layers like all-in and side pots
- [ ] Audio and music implementation
- [ ] Final character art and bespoke composition paintovers

Reason:
all four are valuable later, but they are still lower leverage than tightening the current slice

## Archive Contents

- [progress.snapshot.md](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/archive/2026-03-20-plan-checkpoint/progress.snapshot.md)
- [development-plan.snapshot.md](/Users/springwater/Desktop/Codex/Gen%20项目集群/1、德扑酒馆：落袋为安/archive/2026-03-20-plan-checkpoint/development-plan.snapshot.md)

## Recommended Next Step

1. Add a small but high-impact extraction commitment treatment.
2. Revisit search-state decision clarity: what is safe, what is exposed, what is still at risk.
3. Return to in-hand pressure feedback before opening any new content track.
