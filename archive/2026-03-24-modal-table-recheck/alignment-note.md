# 2026-03-24 Modal / Table Recheck

Focus of this pass:

- reduce flat stacked panels in `search`
- align `table` with poker-first interaction:
  - hidden opponent info until seat click
  - hidden action log until toggle
  - bottom rail only for legal actions + items
- fix visible Chinese rough edges
- fix card presentation so it reads like poker, not debug data

What was checked:

- current authored demo path still intact
- `search` no longer reveals deep authored-path content too early
- `table` keeps first-person emphasis while reducing always-open support UI
- action rail is visible inside the live viewport
- no new console / page errors

Resolved this pass:

- `search` hotspots now open modal overlays with backdrop instead of always-open lower panes
- routes modal now focuses on current route review rather than broad future-facing support content
- search-item reveal buttons now respect currently visible rooms
- player info is click-to-open
- action log is hidden by default
- bottom rail shows only legal actions
- card face rendering now uses suit glyphs and `J/Q/K/A`

Still intentionally deferred:

- true centered cinematic popup staging for all search modals
- further top-HUD compression in table if the next user playtest still feels box-heavy
- broader roguelike pool expansion
- Blender scene replacement work
