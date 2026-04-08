# Alignment Note

Date: 2026-03-22

## Recheck Result

- No conflict found between the current demo plan and the newly clarified roguelike target.
- The right interpretation is:
  - full game = roguelike
  - current demo = fixed authored slice used to prove pacing, presentation, and risk structure

## Decision

- Keep the current playable path stable for now:
  - search
  - Cargo Table
  - search
  - Mirror Hall
  - extraction
- Do not add run randomization yet.
- Do update the baseline so future implementation treats the current path as one template inside a larger seeded-content model.

## Guardrails Reconfirmed

- Demo shortcuts are allowed if they improve clarity.
- Demo shortcuts should not redefine the project as linear.
- Future system-depth work should favor:
  - room pools
  - offer pools
  - opponent composition pools
  - seeded authored variation
