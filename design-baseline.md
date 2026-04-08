# Design Baseline

## Project Frame

- Scope: medium-sized indie game
- Target: single-player, PC-first
- Presentation: stylized 2D or 2.5D
- Overall structure target: roguelike runs with modular room, item, and exit variation
- Core fantasy: enter a dangerous bar, win money through short-table poker, and decide how much risk to carry before escaping
- Core structure: search -> play -> search -> play -> extract
- Demo rule: the current vertical slice uses one fixed authored run path so pacing and presentation can be proven before run variation is expanded

## Non-Negotiable Early Constraints

- Poker tables use Texas Hold'em as the base ruleset
- Each table has at most 3 opponents
- Vertical slice uses exactly 2 opponents per table
- Each table has at most 3 hands
- Search phase uses a point-and-click bar UI, not free movement
- Each search phase has exactly 2 action points
- Entering a table does not consume an action point
- Attempting extraction does not consume an action point
- Item values are fixed in early development
- No dynamic item pricing in the vertical slice
- The final game should behave like a roguelike, but the current demo may keep room order, shop stock, and route rhythm partially fixed

## Roguelike Direction Rules

- The full game is not meant to be a single fixed sequence
- A run should eventually be assembled from seeded content pools:
  - table/room pool
  - opponent pair pool
  - search stock pool
  - extraction offer pool
  - event or pressure modifier pool
- The current vertical slice intentionally locks:
  - room order
  - baseline table pair
  - most reward lanes
  - most search stock rhythm
- That lock is only for demo clarity; future implementation should treat the current slice as one authored run template inside a larger roguelike structure
- Long-term vault progression is persistent meta progress across runs and is part of the roguelike frame, not a separate mode

## Core Resources

- Cash on hand: can be spent, bet, lost, or stashed
- Stashed cash: locked during the current run; only settles on successful extraction
- Long-term vault: persistent money across runs
- Heat: run risk meter that affects table danger and extraction options
- Items: tactical tools and valuables

## Run Structure

### Full-Game Intention

- A complete run should support variation in:
  - which opening room appears first
  - which pressure room follows
  - which search stock and route offers appear between rooms
  - which opponent pairs and reward hooks are attached to each room

### Demo Path

1. Take money from the long-term vault as the run bankroll
2. Enter the bar and use 2 search actions
3. Play table 1
4. Return to the bar and use 2 search actions
5. Play table 2
6. Return to the bar and decide whether to extract
7. Extract successfully to settle value into the long-term vault

- The demo path is fixed on purpose
- The full game should eventually support multiple authored room templates selected into this same run structure

## Search Phase Rules

- Search phase is the bar hub between tables
- The player always has 2 action points per search phase
- Each search phase can include at most 1 stash action
- Search actions currently include:
  - Stash cash
  - Gather table intel
  - Buy one usable item
  - Sell valuables
  - Reduce heat
  - Reserve a fixed extraction route
  - Use a search-phase item

## Search Screen Structure v1

### Screen Layout

- Left panel: current run status
  - cash on hand
  - stashed cash
  - projected stash fee band
  - heat
  - free inventory slots
- Center panel: current bar actions
  - stash
  - buy usable item
  - sell valuables
  - reduce heat
  - reserve extraction
  - use search-phase item
- Right panel: destination choices
  - currently available tables
  - currently available extraction routes
- Top bar: action points remaining in this search phase

### Search Choice Presentation

- Tables and extraction routes are always visible as destinations
- A destination can be:
  - available
  - locked by heat
  - locked by missing reservation
  - already resolved
- Entering a table or using an extraction route does not consume an action point
- The player chooses either:
  - spend remaining action points first, then leave, or
  - leave early with unused action points

### Intel Reveal Model

- Each table has 3 info layers:
  - public layer:
    - buy-in
    - risk label
  - hidden layer:
    - special table rule
    - opponent pair
    - reward hook
- A single gather-intel action reveals exactly 1 hidden layer for 1 table
- A Disposable Phone reveals all hidden layers for 1 chosen table

### Shop Model v1

- The bar offers up to 3 usable items in any search phase
- The vertical slice can use a fixed shop inventory instead of rolling random stock
- Final intent: shop stock should come from a seeded pool, even if the current demo uses a stable offering
- Buying an item:
  - costs 1 action point
  - buys exactly 1 item
  - fails if there is no inventory space
- The shop does not sell valuables in the vertical slice

### Selling Model v1

- Selling valuables costs 1 action point
- A single sell action can sell any number of carried valuables
- Sold valuables convert to cash on hand at fixed values
- Sold valuables do not interact with stash until the player chooses to stash later

### Heat Reduction Model v1

- Base heat reduction action:
  - cost: 1 action point + 30 cash
  - effect: heat -1
- Steadying Drink:
  - cost: 1 action point
  - effect: heat -1
- Each search phase can include at most 1 direct heat reduction action

### Reservation Model v1

- Reserving a fixed extraction route costs:
  - 1 action point
  - 50 cash
- Only 1 fixed extraction reservation can be active at a time
- The reservation expires the next time the player returns to the bar if unused
- Final intent: route offers should come from a broader extraction-offer pool, while the current demo only exposes a tightly controlled subset

## Stash Rules

- Stash can only be used in search phases
- Each search phase allows at most 1 stash action
- Stashed cash cannot be withdrawn during the current run
- Stashed cash cannot be used for betting or purchases
- Stashed cash only settles after successful extraction
- If the run fails before extraction, stashed cash does not settle
- Stash fees are applied only on successful extraction
- Fee bands are based on total stashed cash during the full run:
  - 1-100: 20%
  - 101-250: 30%
  - 251+: 40%

## Extraction Rules

- Extraction is the only way to convert current-run value into persistent progress
- On successful extraction, the following settle into the long-term vault:
  - cash on hand
  - stashed cash after fees
  - carried valuables at fixed values
- If the run fails before extraction, none of the above settle

### Extraction Types

#### General Extraction

- Always available unless heat reaches 6
- Cost: 30 + 15% of cash on hand
- Available at heat 0-5
- If heat is 5, add an extra 60 fee

#### Fixed Extraction

- Must be reserved in an earlier search phase
- Reservation cost: 50
- Final cost on use: 10
- Only valid on the next return to the bar
- Only available at heat 0-4

#### Drop-Bag Extraction

- Always available
- Works at heat 0-6
- Cost: 10 plus one forced sacrifice
- Sacrifice options:
  - lose all valuables, or
  - lose 40% of cash on hand
- Guaranteed success

## Vertical Slice Tables

- Cargo Table and Mirror Hall are the current demo rooms
- They should be treated as authored room templates, not proof that the final game only contains two fixed tables

### Table 1: Cargo Table

- Role: onboarding, first profit, first meaningful read
- Buy-in: 60
- Risk: low
- Base heat gain: +1
- Rule: the first active raise of each hand costs 10 less
- Typical reward band:
  - cash profit
  - low or mid-tier valuables
- Signature valuable: Ivory Chip, fixed value 60

### Table 2: Mirror Hall Table

- Role: main risk/reward table for the slice
- Buy-in: 120
- Risk: medium-high
- Base heat gain: +2
- Rule: the player may bring at most 1 valuable as collateral
- Rule: bringing collateral unlocks the table's best bonus reward
- Rule: the final hand has a higher reward weight
- Typical reward band:
  - larger cash profit
  - higher-tier valuables
- Signature valuable: Antique Commemorative Coin, fixed value 140

## Play Phase Rules v1

### Table Format

- Vertical slice tables always seat:
  - the player
  - exactly 2 opponents
- Once the player sits at a table, the table plays to completion
- The player cannot leave mid-table in the vertical slice
- A table lasts at most 3 hands
- Dealer position rotates each hand

### Hold'em Core

- Use standard Texas Hold'em hand rankings
- Each seated participant receives 2 hidden hole cards
- Community cards reveal in the normal order:
  - flop: 3 cards
  - turn: 1 card
  - river: 1 card
- A hand ends when:
  - all but 1 player fold, or
  - the river betting round ends and the remaining players go to showdown

### Vertical Slice Betting Model

- Use a capped-stakes Hold'em variant for the first playable
- Allowed actions are:
  - fold
  - check
  - call
  - raise
- Vertical slice does not support:
  - all-in actions
  - side pots
  - split pots beyond a simple tied showdown
- Any legal call or raise must leave the acting player with at least 1 chip
- Each betting street allows at most 1 raise after the first committed bet
- Raise amounts are fixed by table, not freely typed by the player
- If a player cannot cover the current call amount in the slice ruleset, that player must fold

### Table Stakes

#### Cargo Table Stakes

- Starting table stack for the player: 60
- Standard call step: 10
- Standard raise step: 20
- Goal: keep the first table readable and low-pressure

#### Mirror Hall Table Stakes

- Starting table stack for the player: 120
- Standard call step: 20
- Standard raise step: 40
- Goal: create visible pressure without needing deep-stack simulation

### Table Result Conversion

- The table stack is the player's spendable chip total for that table
- When the table ends, remaining table stack converts back into cash on hand
- Net table result = ending table stack minus starting table stack
- Table-specific rewards are granted after stack conversion
- A positive table result does not settle into the long-term vault until extraction succeeds

### Collateral Rule v1

- Only valuables can be used as collateral
- Only the Mirror Hall Table supports collateral in the vertical slice
- The player may bring 0 or 1 valuable into Mirror Hall as collateral
- If collateral is brought:
  - the final hand grants access to the best table reward
  - losing the final hand forfeits the collateral
- If no collateral is brought:
  - the player can still play Mirror Hall
  - the player cannot earn the top collateral-gated reward

### Information Rules

- The player always sees:
  - own hole cards
  - revealed community cards
  - current pot value
  - current call amount
  - remaining table stack for all seated players
  - current hand number out of 3
  - known table rules
- The player does not automatically see:
  - hidden table rewards
  - hidden opponent archetype details
  - unrevealed community cards
- Search-phase intel or usable items can reveal hidden information

### Heat and Cheating Rules

- Sitting at a table immediately applies that table's base heat gain
- Legal betting actions do not increase heat on their own
- Heat mainly rises from:
  - table entry
  - cheating tools
  - future special table events
- Vertical slice cheating tools use fixed heat costs:
  - Marked Lens: +1
  - Sleeve Clip: +2
- Search-phase tools can reduce or manage heat outside the table
- Heat thresholds matter during and after play:
  - 0-2: safe
  - 3-4: pressured
  - 5: dangerous
  - 6: lockdown

### Usable Item Timing v1

- Marked Lens:
  - usable once per table
  - use after the flop is revealed and before the next community card appears
- Signal Lighter:
  - usable once per table
  - use at the start of a hand before major betting information is revealed
- Sleeve Clip:
  - usable once per table
  - use after receiving hole cards and before the first betting decision
- False-Bottom Wallet:
  - passive
  - triggers only on run failure

### Table Reward Hooks

- Cargo Table:
  - if the player finishes with a positive net result, the table can grant a low or mid-tier valuable
  - vertical slice first clear should strongly bias toward the Ivory Chip
- Mirror Hall Table:
  - if the player finishes with a positive net result, the table can grant a high-tier valuable
  - if the player also wins the final hand with collateral active, the table grants the Antique Commemorative Coin reward

## Vertical Slice Item Pool

### Usable Items

- Marked Lens
  - Buy: 40
  - Sell: 20
  - Effect: peek 1 unrevealed community card
  - Heat: +1

- Signal Lighter
  - Buy: 35
  - Sell: 15
  - Effect: reveal one opponent tendency as weak, medium, or strong
  - Heat: +0

- Steadying Drink
  - Buy: 30
  - Sell: 10
  - Effect: reduce heat by 1 during a search phase
  - Heat: +0

- Disposable Phone
  - Buy: 50
  - Sell: 20
  - Effect: reveal all hidden info on one table, or refresh one extraction option
  - Heat: +0

- False-Bottom Wallet
  - Buy: 70
  - Sell: 30
  - Effect: on bust or capture, preserve the first 80 cash
  - Heat: +0

- Sleeve Clip
  - Buy: 80
  - Sell: 30
  - Effect: redraw 1 hole card at the start of a hand
  - Heat: +2

### Valuables

- Old Silver Lighter
  - Value: 45
  - Slots: 1
  - Can be used as collateral: yes

- Ivory Chip
  - Value: 60
  - Slots: 1
  - Can be used as collateral: yes

- Ruby Cufflink
  - Value: 90
  - Slots: 1
  - Can be used as collateral: yes

- Gold-Cased Watch
  - Value: 120
  - Slots: 1
  - Can be used as collateral: yes

- Antique Commemorative Coin
  - Value: 140
  - Slots: 1
  - Can be used as collateral: yes

- Sealed Bond
  - Value: 180
  - Slots: 2
  - Can be used as collateral: yes

## Opponent Archetypes v1

### 1. Dock Braggart

- Primary table: Cargo Table
- Style: bluffs too often, especially with weak or middling hands
- Purpose: teaches the player not to overreact to aggression
- Readable tells:
  - raises early with inconsistent timing
  - keeps pushing after small wins
- Counterplay:
  - call more often with stable medium strength
  - avoid folding too easily to table noise

### 2. Ledger Clerk

- Primary table: Cargo Table
- Style: tight, conservative, rarely commits without real strength
- Purpose: gives the player a stable baseline opponent
- Readable tells:
  - checks or calls often before strong turns
  - large raises usually mean real value
- Counterplay:
  - steal small pots
  - respect late strength

### 3. Calm Widow

- Primary table: Mirror Hall Table
- Style: patient, observational, punishes obvious patterns
- Purpose: raises the pressure and tests whether the player varies lines
- Readable tells:
  - enters fewer pots
  - commits harder once she has mapped the table
- Counterplay:
  - do not repeat the same bluff pattern
  - protect stronger hands for higher-value spots

### 4. Smiling Knife

- Primary table: Mirror Hall Table
- Style: manipulates table mood, pressures the final hand, attacks hesitation
- Purpose: creates the end-of-table spike in tension
- Readable tells:
  - plays lightly in the first two hands
  - increases bet pressure in the final hand
- Counterplay:
  - keep reserve cash for the last hand
  - do not overcommit early just to prove confidence

## Current Vertical Slice Goal

- Validate a 20-minute run built around:
  - search
  - cargo table
  - search
  - mirror hall table
  - extraction
- Prove that money, heat, and valuables create real risk tradeoffs
- Prove that stash is useful but does not replace extraction
- Prove that 2 opponents per table are enough for tension without overload
