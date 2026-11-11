# Players

How each person looks: an NH human player dressed from an NH-style closet, or a roster villager. The `look` and
`savedLooks` prefs: [backend.md "Events"](backend.md#events); the 3D pipeline: [world3d-assets.md
"Players"](world3d-assets.md#players); the menu entry: [design.md "すがた"](design.md#sugata).

## Who is drawn

- A person is a **player** (`player3d/player3d.ts` createPlayer) or a **villager** (`villager3d` createVillager, named
  by the `villager` pref). `person3d/person3d.ts` is the one seam: a scene asks it for the model of a person's
  effective look (`store/look.ts` lookOf) and swaps it in place when the look's key changes.
- Both are the same `Villager3D` (states, actions, faces, seats, a held tool, first-person eyes), so no scene cares
  which kind stands there.
- Members wear their player by default (a villager look stays an option: 住民). The guest wears its villager until it
  picks a player look ([the guest](design.md#the-guest): the same closet).
- Visitors are always NH villagers. 2D heads (`<Avatar>`) are the look's portrait or the villager's official icon.

## The look

`contract/look.ts` (shared with the relay; pure):

- **`PlayerLook` v1:** `hair` + `hairColor`, `eye` + `eyeColor`, `mouth` + `mouthFrame` (its resting frame), `skin`,
  `cheek` and `nose` (0/1/2), `top` (a top or a one-piece: then `bottom` is null), `bottom`, `socks`, `shoes`,
  `glasses`, `ornament`, `hat`. Colours are `#rrggbb` tints; each part id carries its slot's prefix (`PART_SLOTS`).
- **Prefs, each the sender's own** (guest too): `look` (`{kind: 'player', look}` or `{kind: 'villager'}`; none =
  いつもの) and `savedLooks` (the whole コーデ list).
- **いつもの is code, never stored** (`DEFAULT_LOOKS`): A's and B's are the signed-off players
  (`app/design/avatar/render/outfits/a.json`, `b.json`, pinned by `look.test.ts`); the guest's is its villager. So it
  can't be deleted or drift.
- **Limits** (`LOOK_LIMITS`): 20 コーデ, names 1–12 characters, part ids ≤ 40 characters, 9 mouth frames; 20 コーデ
  fit well under the record's event size.
- **Checks:** the record checks the form only (`lookPrefOk`, `savedLooksOk`), so a newer phone's part survives an
  older relay. The phone also has the part table (`contract/partIds.json`, `usePartTable`): an id it doesn't know
  reads as いつもの's part for that slot, and it never sends one.
- **Presentation only:** no part is gated by anything about the person; sex and birth live on the record's profile
  alone, never in the repo.

## The closet

`look/closet.ts` (the grid's one interface) over the part table (`player3d/parts.json`, from
`scripts/players3d-models.ts`):

- **Everything is free to everyone,** the guest too: no ベル, no unlocks, no ownership; the shop sells no clothing.
- **Kinds:** 目, 口, 髪型 (one shape each, colours as tints) and the garments トップス, ワンピース, ボトムス, 靴下, 靴,
  帽子, メガネ, 髪飾り (a colour line each).
- **NH's wear rules:** a one-piece clears the bottoms and vice versa; glasses and a hair ornament together; なし first
  for the optional kinds.
- **Colours:** a garment's variants are its own textures; hair, eye and skin use a curated palette (`closet.ts`
  COLOURS). Filter buckets: すべて, 赤, 黄色, 緑, 青, 紫, ピンク, 茶, 白, 黒.
- **No search** (NH's wardrobe has none). The grid builds a slice per frame; icons load near the view.
- **What's in it:** every part that rendered cleanly on both bodies (standing, seated, walking); a shape that clipped
  is out with all its variants (`app/design/avatar/closet/excluded.json`). Never: full-face pieces, helmets,
  costumes, wigs, masks, mouth accessories, My Design shapes.

## Portraits

- A player's 2D head is drawn from its look (`player3d/portrait.ts`) by a renderer the page already has (the すがた
  preview's, else the island's): never a second WebGL context.
- `look/portraits.svelte.ts` keeps the latest 24 by look hash in localStorage, so コーデ chips and the 設定 row show
  heads without a renderer; a look with none yet shows the caller's stand-in.

## The dresser

設定 → 姿 pushes one level, title すがた, ‹ ✕ (`look/LookPage.svelte`): the stage, the six tabs, the panel scrolling to
the screen's foot. No foot bar.

### The stage

`look/LookStage.svelte` (over `LookPreview.svelte`, `preview3d.ts`):

- **The final form, always:** the 3D player, or a villager's official render. A drag turns it, a tap hops it;
  「回せます」 until the first drag.
- **The status pill** (words, never only a colour): いつもの, a コーデ's name, 「{name} · アレンジ中」, 「コーデなし」, or
  「住民 · {name}」. **元に戻す** under it once anything changed this visit.
- **The nameplate** 「ウェイ ✎」 opens the name sheet.
- **The colour dots** of the item last tapped (or 目の色, 髪の色, 肌) along the bottom edge, 44 px targets; they never
  move the grid.
- **Heights:** 262 px, 150 once the panel scrolls, a 76 px strip while the villager search has the keyboard; the figure
  scales by transform (no new frame buffer).
- The preview's renderer lives while the level is open; leaving frees what was browsed but isn't worn.

### The tabs

`look/tabs.ts` (pure): コーデ · 顔 · 髪 · 服 · 小物 · 住民, a roving tablist; it opens on コーデ if any is saved, else 服.

| Tab | Sub-row | Panel |
|---|---|---|
| コーデ | — | ★いつもの, saved looks newest first, 保存. A selected one's card: 今の姿で上書き (only when edited), 名前, 削除 (confirm, 取り消す). At 20, 保存 says it's full; a villager look can't be saved |
| 顔 | 目 · 口 · 鼻 · 頬 · 肌 | numbered tiles for 目 and 口; three chips for 鼻 and 頬; 肌's swatches |
| 髪 | — | the hairstyles; 髪の色 on the stage's dots |
| 服 | トップス · ボトムス · ワンピース · 靴下 · 靴 · 帽子 | the colour filter, then the grid |
| 小物 | メガネ · 髪飾り | the grid, なし first |
| 住民 | — | `look/VillagerGrid.svelte`: search, then the special characters and the villagers |

### Villagers

- A villager picked in 住民 is worn like any piece; a human tab opened meanwhile says
  「今は{name}の姿です。服を選ぶと人間に戻ります」, and the first human pick returns to the player with this visit's
  edits kept.
- The guest's ★いつもの is its villager; its saved コーデ are human looks.

### Saving

- **Kept when you leave** (‹, ✕, Esc, the backdrop, the app hidden): `look` sent once (`villager` first when one was
  picked). No 決定 button. A change shows 「姿を変えました」 with 取り消す (re-sends what was worn on opening).
- コーデ edits (保存, 上書き, 名前, 削除) go out as they're made, as one `savedLooks`.

## Assets

- The body, the parts' binding by joint name and the head's anchors: `player3d/player3d.ts`.
- What a player does its own way over a villager's poses (wrists, skirts, ponytail, seats, lying) and its 16 eye and
  9 mouth frames: `player3d/tune.ts`.
- Conversion and packs: `scripts/players3d-models.ts`; sizes in [world3d-assets.md "Players"](world3d-assets.md#players).
  A look's bytes: the body once a page, ~60 KB an outfit (`player3d/parts.test.ts`).
- The harness behind the signed-off renders: `app/design/avatar/render/` (its outfits are read by `look.test.ts`).
