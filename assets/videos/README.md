# Video Background Layout

Put generated looping scene videos in this folder. After adding or replacing files, run:

```bash
node scripts/sync_video_manifest.mjs
```

The sync script records the exact available file for each scene. If both `.webm` and `.mp4` exist for the same scene, `.webm` is preferred; otherwise the game uses the available `.mp4` directly. Any scene that is not listed in `manifest.json` falls back to the existing PNG scene plate.

Recommended export:

- Aspect ratio: 16:10 if possible, or 16:9 with important content centered.
- Resolution: 1440x900 or 1920x1200 for 16:10; 1920x1080 is acceptable.
- Duration: 8-20 second seamless loops for primary scenes.
- Audio: keep muted or remove audio tracks; BGM is handled separately in `assets/audio/bgm/`.
- Motion: slow ambient movement, light, smoke, rain, crowd shadow, chip glints. Avoid big camera moves because UI hotspots are fixed to the scene composition.

Required filenames:

- `menu-title-bg.webm` / `menu-title-bg.mp4`
- `stash-loop.webm` / `stash-loop.mp4`
- `tavern-smoky-den-bg.webm` / `tavern-smoky-den-bg.mp4`
- `tavern-high-rise-suite-bg.webm` / `tavern-high-rise-suite-bg.mp4`
- `tavern-rooftop-club-bg.webm` / `tavern-rooftop-club-bg.mp4`
- `tavern-neon-poker-club-bg.webm` / `tavern-neon-poker-club-bg.mp4`
- `poker-table-normal.webm` / `poker-table-normal.mp4`
- `poker-table-highstakes.webm` / `poker-table-highstakes.mp4`
- `poker-table-allin.webm` / `poker-table-allin.mp4`
- `poker-table-showdown.webm` / `poker-table-showdown.mp4`
- `extraction-success.webm` / `extraction-success.mp4`
- `extraction-failure.webm` / `extraction-failure.mp4`

Poker state mapping:

- `poker-table-normal`: default hand state.
- `poker-table-highstakes`: pot reaches a room-scaled pressure threshold.
- `poker-table-allin`: at least one live player is all-in.
- `poker-table-showdown`: hand result or room conclusion is being shown.

If you only want to test the pipeline first, add just `menu-title-bg.webm`, run the sync script, and refresh the page.
