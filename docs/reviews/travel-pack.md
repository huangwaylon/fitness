# りょこう もちもの: the packing list's visual QA (2026-11-06)

`components/travel/PackList.svelte` on `/dev/pack?demo` (WebKit, iPhone 15 profile at 393 × 852, `data-tod` day and
night, as A, B and G, ✎, the confirm sheet, the とりけす banner, the stamp). Shots: `/tmp/travel-pack-shots/r1-*` and
`r2-*` (script: `/tmp/travel-pack-scripts/shoot.mjs`), `settings-units.png` (SHOTS= on e2e/travel-pack.spec.ts).

## Round 1

- **The list ran off the right edge.** Grid tracks sized to the longest unbreakable line (`word-break: keep-all` on
  「ショートパンツ+薄手のロングパンツ」). Fixed: `minmax(0, 1fr)` tracks, and the guide's own text breaks as normal
  Japanese (`word-break: normal`, as design.md §Trips allows for guide text).
- **The stamp covered my progress.** It sat absolutely over the bar and the count. Now it's inline after 「19 / 19」,
  tilted, so the bar and the number stay readable; Orville's line hangs under it with its tail pointing up at it.
- **Night: the empty bubbles glared** (fixed cream on navy). They take the control fill (`--ctl` / `--edge`) now; the
  packed bubble stays leaf green either way.
- **✎ squeezed the notes into three lines** beside ↑ ↓ 🗑. In edit mode a note is one line with an ellipsis (it's read
  in the list, not edited here).
- **Hollow chips were loud** (two outlines on every row). Fainter (55 %, a lighter edge); a lit chip is its person's
  tag colour, full strength.

## Round 2

- The header reads at a glance: the suitcase, 「わたしの じゅんび」, the leaf bar, 「1 / 36 あと 35こ」, ✎ at the right
  (yuzu with a ✓ while editing). The category pills turn leaf when that category is all mine.
- The confirm sheet is NH's: the category's icon, 「「服装」を けしますか？」, how many items go with it, いいえ / はい;
  an item's 🗑 is instant with しずえ's banner and とりけす (the removal is sent after 5 s).
- The guest in ✎ sees the seed greyed with no controls and 「かえられるのは じぶんで ついかした ものだけ」.
- The stamp's slam (520 ms, bounce) and the bubble's rise land as one beat; the miles chime plays once.

## Open

- Chips show the よびな (`villagerNameOf`): a long name is cut at 72 px with an ellipsis.
- Category icons are NH catalogue icons mapped from the guides' lucide names (`packView.ts ICON_ART`): the trips
  sheet's teammate may want one shared map.
- A new category's icon is always the shopping bag (no picker), an item's note can't be edited in the app, and items
  move only within their category (the store's `move(…, cat)` exists; no UI yet).
