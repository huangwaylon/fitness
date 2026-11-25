# 保存した場所 (saved places)

Our Google Maps list (~3,400 places) as a searchable map. The list lives on the relay (docs/backend.md "Saved places");
payload `contract/places.ts`. Code: `lib/places/`, `components/places/`.

## Entry

The menu's 地図 (`places` in `contract/menu.ts`): a full sheet in its own chunk, not kept between openings.

## Data

`lib/places/store.svelte.ts`: this phone's copy (IndexedDB `island-places`, `lib/places/cache.ts`), then `GET /places`
with `?since=<ver>` deltas, at most once a minute and on coming back online; no timer (places-pull.yml refreshes the
list). Offline: the copy, else LoadError. A coral dot when synced over 24 h ago. Logs never name a place.

## Details

On the relay (runbook §9): `det` in `GET /places` (`PlaceDet`), up to 10 photo tokens (`PICS_MAX`) from
`GET /places/pics?id=`, which also counts the card's openings (`place_opens`, not dumped). Refreshed by
`places-details.yml` daily (`app/scripts/places-details.ts daily`, picks by `lib/places/refresh.ts`: new first, then the
oldest look-ups); counts only in the log. A run skips when the last 20 h already hold a run's worth of look-ups
(`dueToday`), so a night the relay or Google refused is made up by the next trigger.

## Screen

The map under a drag-up sheet (`components/map/sheet.svelte.ts`): field, chips, meta, then virtualised rows (badge,
name, NEW for 3 days, kind · area · distance, hours). A row or marker opens the card; a cluster zooms. A long press
sets a point (この地点の周辺, 1.5 km).

## Scope

The last thing done decides what the list holds:
- A search (typed words or typed chips, a where-chip) is global, and the map fits its matches once typing settles
  (600 ms, or Enter). It doesn't fit mid-IME, with a card open or for a long press's point.
- A person's own pan or pinch narrows the list to the map above the peek, a search's too.
- Chip taps from the row keep the view. When one leaves nothing in view, the map fits its matches.
- The meta line's switch 「この範囲 N | 全体 M件」 shows the scope and flips it. Clearing the search returns to the view
  without moving the camera.

## Search

`lib/places/query.ts` reads each keystroke into chips plus text: hours (営業中, 土曜19時), rating (★4), distance (1km以内),
最近, うめが保存, メモあり, -word, areas, category and kind words (JA, EN). Words nothing has are dropped and said. Ranking
in `lib/places/search.ts` (閉業 places last); sorts 近い順 / 評価順 / 保存が新しい順. **絞り込み** (`PlacesFilter.svelte`) edits the same
chips; with no hit, `relax` offers the best chips to drop.

## Areas

`area.ts`: 都道府県 / 市区町村 from a Japanese address, else comma parts. An area chip matches its places and anything
within 1.5 km of their centre.

## Hours

`hours.ts`, in the place's zone: 営業中 · まもなく閉店 (≤ 60 min) · 営業時間外 · 本日定休 · 24時間営業 · 営業時間は不明.
Past-midnight periods merge. A tap shows the week.

## Card

`PlaceCard.svelte`, a level in the sheet: name, ⋯ (website, この周辺で探す, phone), rating, description, photos
(`PlacePhotos.svelte`: a scroll-snap strip, the first alone till it loads, then those in view plus one; a tap opens
`PhotoViewer.svelte`), hours, the note (members only, edited in Google Maps), 経路, Googleマップ, コピー, 保存日.
The service worker keeps the photos seen (lh3 `grass-cs/`) in their own IndexedDB store, `placePic`: 300 / 40 MB,
least recently used out (`PLACE_PIC_CAP_N`), so they never push out other pictures; offline with
none kept, a 504 (the placeholder).

## Categories

The contract's 13 top categories and subs; colour, shape, glyph in `cats.ts` `CAT_STYLE`.

## Map

`components/places/map/engine.ts` (own chunk): one clustered source; dots, badges from z14 (`map/icons.ts`), the chosen
one ringed and named. The last view is kept. Location from the maps' core; refused: long-press to pick a point.
Offline: places only. The layer on other maps: docs/hiking.md "Saved places", docs/travel.md "Maps".
