# りょこう UI: visual review (2026-11-06)

WebKit (Playwright, iPhone 15, 393×852), the logic tier, `?demo&critter=none&visitor=none`, day (12:00) and night
(21:30), Japanese and English. Pictures: `SHOTS=<dir> npm run e2e -- e2e/travel.spec.ts --project=webkit -g pictures`
(round 1 `/tmp/travel-ui-shots/r1`, round 2 `r2`, round 3 `r3`).

## UI/UX

- **The list** reads at a glance: one focal stub per pass (the countdown), the airline strip and the photo make each
  trip recognisable before a word is read; おもいで is clearly second (muted photo, stamp instead of a number).
- **A trip:** the sticky Segmented keeps the four pages in reach on an 18-day guide; the yuzu day plate is the scan
  line down the page. The timeline's time column (Fredoka, right-aligned) and the leaf dots read like a ticket.
- **Density:** a day card open is one long reading card by design (docs/design.md §Trips); closed, a day is one
  72 px row, so a whole trip fits a screen and a half.

## Game design (NH)

- Dodo Airlines is the frame: Orville at the counter with one line a day, his head on the menu pill, the airport on the
  map's placeholder; the pass's notches, tear and barcode; the 「いってきた」 stamp like a passport stamp.
- The cream pass stays cream at night (a game object, like the HUD and dialogue); the panel and cards go navy.

## Round 1 → 2

- The stamp's text ran past its ring: the ring 70 → 80 px.
- The day plate's 「にちめ」 touched its edge: 48 → 56 px.
- Day titles wrapped a word early (「南 / へ」) beside the icon disc and the chevron: the icon moved onto the date
  line, the head has one free column more.
- Single-glyph last lines in guide text (「プー / ル」): `text-wrap: pretty` with the guide's normal line breaking.
- キャンプ: the long intro pushed the filter half a screen down: the filter first, the intro folded to three lines
  with 「もっと よむ」; the drive row's emoji label replaced by 「くるまで」 (it sat apart from its value).
- The hero's line was hard to read over a busy photo: a deeper shade at its foot.
- Switching pages while scrolled left the new page mid-way: it starts under the stuck tabs.
- The pictures caught the fold and the level's slide mid-motion (a washed-out card): the picture waits for the
  sheet's own animations.

## Round 2 → 3

- The stamp still crowded its ring in Japanese: 「いってきた」 (no ！), the year bigger; English 「Visited」 and the
  plate's 「DAY」.
- The intro's fold button left an empty band: tightened.

## Open items

- ちず is a placeholder slot (map/TripMap.svelte from the map branch); the stop list and its selected / day state are
  in `MapPane.svelte`, ready for it. Okinawa's layer chips and the camp pin's card are the map's.
- もちもの is the guide's list read only (PackList.svelte from the packing branch drops into `PackPane.svelte`).
- `units.ts` is a stand-in (localStorage `travel.units`); `{m:}` / `{c:}` follow the same key in `text.ts`. The せってい
  switch is the packing branch's.
- Long Japanese titles wrap in the NavBar (「ニュージーランド / 2027」): balanced, acceptable; a shorter title would
  be a content change.
- Photos aren't prefetched for an upcoming trip yet (docs/travel.md "Photos": within 14 days); they lazy-load.
- Not yet looked at on a real iPhone (iOS Safari's own text-wrap: pretty, the hero's photo crops).
