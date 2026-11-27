# 保存した場所 (saved places)

Our Google Maps list (~3,400 places) as a searchable map. The list lives on the relay ([backend](backend.md) "Saved
places"); payload `contract/places.ts`; code `lib/places/`, `components/places/`.

## Entry
The menu's 地図 (`places` in `contract/menu.ts`): a full sheet in its own chunk, not kept between openings.

## Data
`lib/places/store.svelte.ts`: the phone's copy (IndexedDB `island-places`), then `GET /places?since=<ver>` deltas, at
most once a minute and on reconnect; `places-pull.yml` refreshes the list. A coral dot when synced over 24 h ago. Logs
never name a place.

## Details
On the relay (runbook §9): `det` in `GET /places`, up to 10 photo tokens (`PICS_MAX`) from `GET /places/pics?id=`
(also counts openings, `place_opens`). Refreshed daily by `places-details.yml` (`app/scripts/places-details.ts`; new
first, then oldest, `lib/places/refresh.ts`); a run skips when the last 20 h already did a run's worth (`dueToday`).

## Screen
The map under a drag-up sheet (`components/map/sheet.svelte.ts`): field, chips, then virtualised rows (NEW for 3 days,
kind · area · distance, hours). A long press sets a point (この地点の周辺, 1.5 km).

## Scope
The last act decides: a search is global and the map fits its matches once typing settles (not mid-IME or with a card
open); a pan or pinch narrows the list to the view; chip taps keep the view. 「この範囲 N | 全体 M件」 shows and flips it.

## Search
`lib/places/query.ts` reads keystrokes into chips + text: hours (営業中, 土曜19時), ★4, 1km以内, 最近, うめが保存, メモあり,
-word, areas, categories (JA, EN); unknown words are dropped and said. Ranking `lib/places/search.ts` (閉業 last);
**絞り込み** (`PlacesFilter.svelte`) edits the same chips; no hit → `relax` offers chips to drop.

## Areas
`area.ts`: 都道府県 / 市区町村 from the address; an area chip matches within 1.5 km of its places' centre.

## Hours
`hours.ts`, in the place's zone: 営業中 · まもなく閉店 · 営業時間外 · 本日定休 · 24時間営業 · 不明; past-midnight merged.

## Card
`PlaceCard.svelte`: name, ⋯ (website, この周辺で探す, phone), rating, description, photos (`PlacePhotos.svelte`, a tap
opens `PhotoViewer.svelte`), hours, the note (members only), 経路, Googleマップ, コピー, 保存日. Photos seen kept in IndexedDB
`placePic` (300 / 40 MB, LRU: `PLACE_PIC_CAP_N`).

## Categories
13 top categories and subs; style in `cats.ts CAT_STYLE`.

## Map
`components/places/map/engine.ts` (own chunk): one clustered source, badges from z14 (`map/icons.ts`); the last view
kept; offline, places only. The layer on other maps: [hiking](hiking.md) "Saved places", [travel](travel.md) "Maps".
