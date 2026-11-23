# 保存した場所 (saved places)

The couple's Google Maps list (~3,400 places) as a searchable map. The list is the relay's (docs/backend.md "Saved
places"), the payload `contract/places.ts`. Code: `lib/places/`, `components/places/`.

## Entry

The menu's 地図 (after 登山; `places` in `contract/menu.ts`) opens 保存した場所, a full sheet
(its own chunk), not kept between openings.

## Data

`lib/places/store.svelte.ts`: this phone's copy (IndexedDB `island-places`, by person), then `GET /places`,
`?since=<ver>` deltas (an empty one keeps the index), at most once a minute and back online, no timer; an opening
with the relay's list over 2 h old asks `POST /places/sync` once, quietly. Offline: the copy (「オフライン · 同期
2時間前」), else LoadError. Meta: 「3,412件 · 同期 2時間前」 (filtered 「12 / 3,412件」), a coral dot past 24 h. Logs: the endpoint and the failure, never a place.

**Vendored details** (`static/places/`): Google's details and ≤ 3 photos a place, scraped and packed on the Mac
(`npm run places:details`, its header), read by `lib/places/vendored.ts` (never precached); the join the id only.

## Screen

The map under ✕, ＋ −, the location disc, the attribution; the drag-up sheet (the trail's: map/sheet.svelte.ts;
peek: head + ~2.5 rows, which drag it) holds the field (a tap raises it), the chips, the meta, then a virtualised list of 56 px rows (badge, name, NEW
for 3 days, 「subtype · area · distance」, hours). A row flies there and opens the card, a marker opens it, a cluster
zooms. **Browse** (no text, no where-chip; category / time chips keep it): the list is the map above the peek, on
moveend (held mid-scroll), 近い順 from its centre, 「この範囲 214 / 3,412件」 (tap: fit all); none:
「この範囲に保存した場所はありません」 + 全体を見る. The map draws every match. A search is global; このあたりで探す
→ 「地図の中心」; a long press: 「この地点の周辺」 (1.5 km). 近い順 from that, an area, me, else the opening centre.

## Search

One field (「店名・エリア・メモで検索」), read each keystroke (`query.ts`) into removable yuzu chips plus free text:
営業中 / 開いてる; 今日開いてる → 今日営業; 日曜 / 日曜日 / 日曜に → 日曜営業 (祝日: Sunday's hours); 近く / 周辺 →
現在地周辺; an area (+駅) → {エリア}周辺; a category's words (`cats.ts`: らーめん, 拉麺, ramen; スイーツ). Time and near
words are taken as typed (近く + の too); a category, an area or a Latin word waits for a space, a particle (渋谷の)
or 検索, so パン屋まるき stays text; 本 or 山 only alone (山本). A typed chip also finds names with it. Backspace on an
empty field drops the last chip. Keys: `text.ts`. Ranking: name prefix, substring, category, area, note, fuzzy;
then the sort. Chips: sort, typed, categories with counts (picked first, subs after; empty
hidden). Index built once a payload; ~1 ms a search over 3,500, no debounce.

## Areas

`area.ts`: 都道府県 / 市区町村 from a Japanese address (a row shows 渋谷; the town 神南 searchable), else comma parts (the
country dropped, the city before a state). An area chip matches its places and anything within 1.5 km of their centre.

## Hours

`hours.ts`, in the place's zone (Intl, a formatter per zone): 「営業中 · 21:00まで」 (leaf), 「まもなく閉店 · 21:30まで」
(≤ 60 min, coral), 「営業時間外 · 17:00から」 (明日 / 月曜 …), 「本日定休 · 明日 11:00から」, 「24時間営業」; unknown a
quiet 「営業時間は不明」. Past midnight and Saturday into Sunday merge. A tap: the week (today yuzu, 定休日
coral).

## Card

A level in the sheet: ‹ back, the name (15 bold), ⋯ (website, この周辺で探す, 電話 when vendored), no ✕ (the bar's);
the photo band and ★ rating when vendored; icon + 「subtype · area · distance」, NEW; a 2-line description; the
hours line (the relay's, else the vendored); the note (members only) with 「メモはGoogleマップで編集」; 経路 (leaf; Google Maps'
directions URL), Googleマップ (cid, ftid, else by name), コピー (name + address; 「住所をコピーしました」); 保存日.

## Categories

The contract's 13 tops and subs; colour, shape, glyph: `cats.ts` CAT_STYLE.

## Map

`map/engine.ts` (own chunk): one clustered source (radius 40, to z14). Under z14 8 px dots,
from z14 22 px canvas badges (`map/icons.ts`, lazy); the chosen one 28 px, a yuzu ring, its name above; clusters
cream discs, the count in Fredoka. The last view kept (a fresh phone: all fitted). Location: the core's
disc (a sky icon while on), sky dot and halo; refused: MS.refused + 「地図を長押しで地点を選べます」.
Offline: 「地図はオフラインです（場所のみ表示）」. The layer: docs/hiking.md "Saved places", docs/travel.md "Maps".
