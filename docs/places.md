# 保存した場所 (saved places)

The couple's Google Maps list (~3,400 places) as a searchable map. The list is the relay's (docs/backend.md "Saved
places"), the payload `contract/places.ts`. Code: `lib/places/`, `components/places/`.

## Entry

The menu's 地図 (`places` in `contract/menu.ts`) opens it, a full sheet (own chunk), not kept between openings.

## Data

`lib/places/store.svelte.ts`: this phone's copy (IndexedDB `island-places`, by person), then `GET /places`,
`?since=<ver>` deltas, at most once a minute and back online, no timer (the list is places-pull.yml's to refresh).
Offline: the copy, else LoadError. Meta: 「12 / 3,412件 · 同期 2時間前」, a coral
dot past 24 h. Logs: the endpoint and the failure, never a place.

**Vendored details** (`static/places/`, `lib/places/vendored.ts`): the 11-23 scrape, kept for older builds.

## Details

On the relay (runbook §9): `det` in `GET /places` (`PlaceDet`), `GET /places/pics?id=` the photo tokens
(`picUrl`). `places-details.yml` daily: `lib/places/refresh.ts` picks (new first, then the oldest look-ups), one
request a place; counts only logged.

## Screen

The map under ✕, the location disc, the attribution; the drag-up sheet (map/sheet.svelte.ts; peek: head +
~2.5 rows) holds the field, the chips, the meta, then virtualised 56 px rows: badge, name, NEW (3 days), ★ (≥ 5
reviews); 「kind · area · distance」 (kind: Google's, else the sub) or the hit's 「メモ：…」 / 「説明：…」; hours (the
facets': vendored only; none 「営業時間は不明」, never open in a chip). A row flies there and opens the card, a marker opens it, a cluster zooms. **Browse** (no
text or typed chip, no where-chip): the list is the map above the peek, on moveend (held mid-scroll), 「この範囲 214 / 3,412件」 (tap:
fit all; none: 「この範囲 0 · 全体 N件」 + 全体を見る; world-wide: its home). Typed: global; このあたりで探す → 地図の中心; a long press: この地点の周辺 (1.5 km).
近い順 from that, an area, me, else the opening centre.

## Search

The field reads each keystroke (`query.ts`) into chips plus text: 営業中, 今日営業, 日曜, 土曜19時 / sat 7pm, ★4 /
4.5+, 1km以内, 最近, うめが保存, メモあり, -ラーメン, 近く, an area, a category's or kind's words (JA, EN). Time words
are taken as typed; a category, area or Latin word waits for a space, a particle or 検索. Backspace on an empty field
drops the last chip. A word nothing has is left out, said (「“デート”は無視しました」); a compound read in pieces (古民家カフェ); an area with none of the outdoors reaches 100 km, said. Rank:
name, kind/category, area, note, description, fuzzy; then 近い順 / 評価順 (prior-weighted) / 保存が新しい順.

Chips: ⇅ sort and 条件を全部外す (from 2) pinned left, the active ones (yuzu, ×, as added), quick 営業中 and ★4.5以上
with counts, a picked top's subs (not one under 以外), the tops with counts. **絞り込み** (PlacesFilter, live, map controls
hidden): 並び順, 営業 (日時を指定: a day, an hour or 終日), 評価, 距離, 保存日, メモあり (members), ジャンル. None
found: the best 2 chips to drop with counts (`relax`), キーワードだけで探す.
The focused empty field: 入力の例.

## Areas

`area.ts`: 都道府県 / 市区町村 from a Japanese address (a row shows 渋谷; the town 神南 searchable), else comma parts (the
country dropped, the city before a state). An area chip matches its places and anything within 1.5 km of their centre.

## Hours

`hours.ts`, in the place's zone: 「営業中 · 21:00まで」 (leaf), 「まもなく閉店 · 21:30まで」 (≤ 60 min, coral),
「営業時間外 · 17:00から」, 「本日定休 · 明日 11:00から」, 「24時間営業」, 「営業時間は不明」. Past midnight merges. A tap:
the week (today yuzu, 定休日 coral).

## Card

A level in the sheet, its head sticky (a line once scrolled): ‹, the name (15 bold, 2 lines), ⋯ (website, この周辺で探す,
電話 if vendored); no ✕ (the bar's). Vendored: the band, ★, a 2-line description (band and line held till it lands);
icon + 「subtype · area · distance」, NEW; hours (vendored: the facets', else the detail's); the note (members) with
「メモはGoogleマップで編集」; 経路, Googleマップ (cid, ftid, else name), コピー (name + address;
「住所をコピーしました」); 保存日.

## Categories

The contract's 13 tops and subs; colour, shape, glyph: `cats.ts` CAT_STYLE.

## Map

`map/engine.ts` (own chunk): one clustered source (radius 40, to z14); 8 px dots, from z14 22 px badges
(`map/icons.ts`); the chosen one 28 px, a yuzu ring, its name above; clusters cream discs. The last view kept (fresh: about me if allowed, else all, or over 90° wide the 300 km about the median). Location: the core's
disc (a sky icon while on), sky dot and halo; refused: MS.refused + 「地図を長押しで地点を選べます」.
Offline: 「地図はオフラインです（場所のみ表示）」. The layer: docs/hiking.md "Saved places", docs/travel.md "Maps".
