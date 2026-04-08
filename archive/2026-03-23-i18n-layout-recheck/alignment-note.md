## 2026-03-23 I18n / Layout Recheck

Focus of this checkpoint:
- keep the authored demo stable
- add bilingual usability without introducing new systems
- push the shell closer to a single-page, tab-folded presentation

What was completed:
- persistent `中文 / EN` toggle added to the live demo shell
- state, notifications, and high-visibility UI now follow the selected language
- canvas scene-frame labels were localized and the top-right noir label was widened so Chinese no longer clips
- search / table support areas were folded harder behind tabs and internal scroll regions
- right-side search route rail now behaves more like a bounded decision column than a page-stretching block

What was intentionally not touched:
- no new roguelike room pools
- no new tables
- no new resource systems
- no changes to the authored demo path structure

Current read:
- this is a stronger user-playtest checkpoint than the previous one
- bilingual presentation is now real enough to test instead of remaining a promise
- the search page is improved, but remains the first surface to revisit if the player reports that the page still feels too tall or too report-like
