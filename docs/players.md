# Players

How each person looks: an NH human player dressed from an NH-style closet, or a roster villager. The record side
(the `look` and `savedLooks` prefs) is in [backend.md "Events"](backend.md#events); the 3D pipeline in
[world3d-assets.md "Players"](world3d-assets.md#players); the sheet's place in the menu in
[design.md "すがた"](design.md#sugata).

## Who is drawn

- A person is a **player** (NH's human: `player3d/player3d.ts` createPlayer) or a **villager** (a roster villager,
  `villager3d` createVillager, named by the `villager` pref). `person3d/person3d.ts` is the one seam: a scene asks it
  for the model of a person's effective look (`store/look.ts` lookOf) and swaps it in place when the look's key
  changes (on leaving すがた, or the partner's phone sending theirs).
- Both kinds are the same `Villager3D`: states, actions, faces and blinks, seats, a tool in the hand, the eyes for
  first person. The island, the rooms, the museum and the shop don't care which kind stands there.
- The members wear their player by default; the villager look stays an option (the 住民 tab). The guest wears its
  villager until it picks a player look ([the guest](design.md#the-guest): its own look and コーデ, the same closet).
- Visitors are always NH villagers. 2D heads (`<Avatar>` everywhere a person is listed) are the look's portrait
  ("Portraits") or the villager's official icon.

## The look

`contract/look.ts` (shared with the relay; pure):

- **`PlayerLook` v1:** `hair` + `hairColor`, `eye` + `eyeColor`, `mouth` + `mouthFrame` (0–8, its resting frame),
  `skin`, `cheek` and `nose` (0/1/2 shapes), `top` (a top or a one-piece: then `bottom` is null), `bottom`, `socks`,
  `shoes`, `glasses`, `ornament`, `hat`. Colours are `#rrggbb` tints; every part is a part id of its slot
  (`PART_SLOTS`: the dump's folder families, `PlayerHair…`, `TopsTex…`, `CapHat…`).
- **Prefs, each the sender's own** (members and guest alike): `look` (`{kind: 'player', look}` or `{kind:
  'villager'}`; none = いつもの) and `savedLooks` (the whole コーデ list).
- **いつもの is code, never stored** (`DEFAULT_LOOKS`): A's and B's are the signed-off players
  (`app/design/avatar/render/outfits/a.json`, `b.json`, pinned by `look.test.ts`); the guest's is its villager. No
  `look` pref means いつもの, so it can't be deleted or drift.
- **Limits** (`LOOK_LIMITS`): 20 コーデ, names 1–12 characters (trimmed, plain text), part ids ≤ 40 characters, 9
  mouth frames. A look is ~350 characters of JSON; 20 コーデ fit well under the record's event size.
- **Checks:** the record keeps the form (`lookPrefOk`, `savedLooksOk`: every field, no other key, a one-piece with no
  bottom, hex colours, each id its slot's prefix). The phone also has the part table (`contract/partIds.json`, via
  `usePartTable` in `store/look.ts`): an id it doesn't have (a newer app's, one dropped) reads as いつもの's part for
  that slot, and the phone never sends one. The relay keeps the form check only, so a newer phone's part survives an
  older relay.
- **Presentation only.** No part is gated by anything about the person; sex and birth live on the record's profile
  alone, never in the repo.

## The closet

`look/closet.ts` (the grid's one interface) over the part table (`player3d/parts.json`, made by
`scripts/players3d-models.ts`):

- **Everything is free and open to everyone,** the guest too, from the start: no ベル, no かいがら, no unlocks, no
  ownership. A saved コーデ always wears as saved. The shop sells no clothing (decisions.md).
- **Kinds:** 目, 口, 髪型 (one shape each, colours as tints) and the garments: トップス, ワンピース, ボトムス, 靴下, 靴,
  帽子, メガネ, 髪飾り (a colour line each).
- **Wear rules, NH's:** a one-piece clears the bottoms and a bottom clears a one-piece; socks show under what the
  bottoms leave; glasses and a hair ornament together; なし first for the optional kinds.
- **Colours:** a garment's colour variants come from its own textures (the table's swatches); the hair, eye and skin
  swatches are a curated palette (`closet.ts` COLOURS). The colour filter's buckets: すべて, 赤, 黄色, 緑, 青, 紫,
  ピンク, 茶, 白, 黒.
- **No search** in the closet (NH's wardrobe has none). A grid is built a slice per frame; icons load as they near the
  view.
- **What's in it:** every part that rendered cleanly on both bodies (standing, seated, walking) in the closet sweep; a
  shape that clipped is out with all its variants (`app/design/avatar/closet/excluded.json`). Not in it: full-face
  pieces, helmets, costumes, wigs, masks, mouth accessories, My Design shapes.

## Portraits

- A player's 2D head is drawn from its look (`player3d/portrait.ts`) by a renderer the page already has (the すがた
  preview's while it's open, else the island's): never a second WebGL context.
- `look/portraits.svelte.ts` keeps each by the look's hash in localStorage (the latest 24), so the コーデ chips and the
  設定 row show heads without a renderer of their own; a look with none yet shows the caller's stand-in.

## The dresser

設定 → 姿 pushes one level, title すがた, ‹ ✕ (`look/LookPage.svelte`): the stage on top, the six tabs, the panel under
them scrolling to the screen's foot. No foot bar.

### The stage

`look/LookStage.svelte` (over `LookPreview.svelte` and `preview3d.ts`):

- **The final form, always:** the 3D player filling the stage, or a villager's official render. A drag turns it, a
  tap hops it; 「回せます」 shows until the first drag.
- **The status pill** (words, never only a colour): いつもの, a コーデ's name, 「{name} · アレンジ中」 once changed,
  「コーデなし」, or 「住民 · {name}」.
- **元に戻す** under the pill once anything changed this visit (the look and the villager as they were on opening).
- **The nameplate** 「ウェイ ✎」 opens the name sheet.
- **The colour dots** of the item last tapped (or the sub-tab's colour: 目の色, 髪の色, 肌) along the bottom edge, 44 px
  targets; they never move the grid.
- **Heights:** 262 px, 150 once the panel scrolls, a 76 px strip while the villager search has the keyboard. The
  figure scales with a transform (no new frame buffer); no scroll snapping, no camera moves.
- The preview's renderer is made when the level opens and disposed when it closes; leaving frees what was browsed but
  isn't worn.

### The tabs

`look/tabs.ts` (pure): コーデ · 顔 · 髪 · 服 · 小物 · 住民 (`look.tab.*`), a roving tablist. It opens on コーデ if any is
saved, else 服.

| Tab | Sub-row | Panel |
|---|---|---|
| コーデ | — | ★いつもの, the saved looks newest first, 保存. Selecting one shows its card: 今の姿で上書き (only when edited), 名前, 削除 (with a confirm and 取り消す). At 20, 保存 says it's full; a villager look can't be saved |
| 顔 | 目 · 口 · 鼻 · 頬 · 肌 | numbered tiles for 目 and 口; three chips for 鼻 and 頬; 肌's swatches |
| 髪 | — | the hairstyles; 髪の色 on the stage's dots |
| 服 | トップス · ボトムス · ワンピース · 靴下 · 靴 · 帽子 | the colour filter, then the grid |
| 小物 | メガネ · 髪飾り | the grid, なし first |
| 住民 | — | `look/VillagerGrid.svelte`: the search field, then the special characters and the villagers |

### Villagers

- A villager picked in 住民 is worn on the stage like any piece; a human tab opened while it's worn says so
  (「今は{name}の姿です。服を選ぶと人間に戻ります」), and the first human pick goes back to the player with this
  visit's edits kept.
- The guest's ★いつもの is its villager; its saved コーデ are human looks.

### Saving

- **Dress as you go, kept when you leave** (‹, ✕, Esc, the backdrop, the app hidden): `look` sent once (and
  `villager` first when a villager was picked). No 決定 button.
- Leaving with a change shows 「姿を変えました」 with 取り消す (it re-sends what was worn on opening).
- コーデ edits (保存, 上書き, 名前, 削除) go out as they're made, as one `savedLooks`.

## Assets

The facts live with the code:
- the body, the parts' binding by joint name and the head's anchors (head joint, hat brim, face front, crown):
  `player3d/player3d.ts`;
- what a player does its own way over a villager's poses (wrists, skirt chains, ponytail, seats, lying) and its 16
  eye and 9 mouth frames: `player3d/tune.ts`;
- the conversion, packs and the first closet's lines: `scripts/players3d-models.ts`; sizes in
  [world3d-assets.md "Players"](world3d-assets.md#players). A look's bytes: the body once a page, ~60 KB an outfit
  (`player3d/parts.test.ts`).
- The study harness that assembled the signed-off renders stays in `app/design/avatar/render/` (the outfits are
  read by `look.test.ts`).
