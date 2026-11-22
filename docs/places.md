# 保存した場所 (saved places)

The couple's Google Maps list (~3,400 places) as a searchable map. The list is the relay's (docs/backend.md "Saved
places"), the payload `contract/places.ts`. Code: `lib/places/`, `components/places/`.

## Entry

The menu's 地図 (a pin, after 登山; `places` in `contract/menu.ts`: the relay first) opens 保存した場所, a full sheet
(its own chunk), not kept between openings.

## Data

`lib/places/store.svelte.ts`: this phone's copy (IndexedDB `island-places`, the last payload; another person's isn't
read), then `GET /places` with the key, `?since=<ver>` deltas (`applyPlaces`), at most once a minute and on coming
back online; an opening with the relay's list over 2 h old asks `POST /places/sync` once, quietly, then the delta.
Offline with a copy it all works (「オフライン · 同期 2時間前」); with none: LoadError + もう一度. Meta: 「3,412件 · 同期
2時間前」 (filtered 「12 / 3,412件」), a coral dot past 24 h. Logs: the endpoint and the failure's kind, never a place.

## Screen

As a trail's view: the map under ✕, ＋ −, the location disc, the attribution; the drag-up sheet (peek: head + ~2.5
rows) holds the field (a tap raises it), the chips, the meta, then a virtualised list of 56 px rows (badge, name, NEW
for 3 days, 「subtype · area · distance」, hours). List and map show the same matches; a row flies there and opens
the card, a marker opens it, a cluster zooms. Panning never filters: このあたりで探す sets 「地図の中心」; a long press
drops a pin, 「この地点の周辺」 (1.5 km). 近い順 from that point, an area, my location, else the opening view's centre.

## Search

One field (「店名・エリア・メモで検索」), read each keystroke (`query.ts`) into removable yuzu chips plus free text:
営業中 / 開いてる; 今日開いてる → 今日営業; 日曜 / 日曜日 / 日曜に → 日曜営業 (祝日: Sunday's hours); 近く / 周辺 →
現在地周辺; an area (+駅) → {エリア}周辺; a category's words (`cats.ts`: らーめん, 拉麺, ramen; スイーツ). Time and near
words are taken as typed (近く + の goes into the chip); a category or area waits for a space, a particle (渋谷の) or
検索, so パン屋まるき stays text. Backspace on an empty field drops the last chip. Keys (`text.ts`): food's
searchKey, long vowels dropped, small kana full size. Ranking: a name's prefix, substring, category, area, note,
fuzzy name; then the sort. Chips: the sort, the typed ones, the categories with counts (picked first, subs after;
empty hidden). Index built once a payload; ~1 ms a search over 3,500 (`places-perf.spec.ts`), no debounce.

## Areas

`area.ts`: 都道府県 / 市区町村 from a Japanese address (a row shows 渋谷; the town 神南 searchable), else comma parts. An
area chip matches its places and anything within 1.5 km of their centre.

## Hours

`hours.ts`, in the place's zone (Intl, a formatter per zone): 「営業中 · 21:00まで」 (leaf), 「まもなく閉店 · 21:30まで」
(≤ 60 min, coral), 「営業時間外 · 17:00から」 (明日 / 月曜 …), 「本日定休 · 明日 11:00から」, 「24時間営業」; unknown (~9 in
10: OSM's) a quiet 「営業時間は不明」. Past midnight and Saturday into Sunday merge. A tap: the week (today yuzu, 定休日
coral). The filters read a minute of the week once per zone (`openIn`; the contract's openAt makes a formatter a call).

## Card

A level in the sheet: ‹ back, the name (15 bold), ⋯ (website, この周辺で探す), ✕; icon + 「subtype · area · distance」,
NEW; the hours line; the note (members only) with 「メモはGoogleマップで編集」; ルート (Google Maps' directions URL),
Googleマップ (by cid, ftid, else a name search), コピー (name + address; 「住所をコピーしました」); 保存日. No rating
(none in the list); free links only.

## Categories

The contract's 13 tops and their subs; each top's family colour, marker shape and glyph: `cats.ts` CAT_STYLE.

## Map

`map/engine.ts` (own chunk, the trip map's basemap): one clustered GeoJSON source (radius 40, to z14), setData per
search. Under z14 8 px dots with a cream rim; from z14 22 px badges; the chosen one 28 px
with a yuzu ring and its name; clusters cream discs, brown edge, the count in Fredoka (24 / 30 / 36 px). Badges: canvas images (`map/icons.ts`). The last view is kept. Tiles offline: 「地図はオフラインです（場所のみ
表示）」, the list unchanged. The trail map's layer: docs/hiking.md "Saved places".
