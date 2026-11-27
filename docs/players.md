# Players

How each person looks: an NH human player dressed from an NH-style closet, or a roster villager. Prefs `look` and
`savedLooks`: [backend.md "Events"](backend.md#events); 3D pipeline: [world3d-assets.md "Players"](world3d-assets.md#players);
menu entry: [design.md "すがた"](design.md#sugata).

## Who is drawn
A person is a **player** (`player3d/player3d.ts` createPlayer) or a **villager** (`villager3d` createVillager, the
`villager` pref); both are a `Villager3D`, so scenes don't care. `person3d/person3d.ts` is the seam: it builds a
person's effective look (`store/look.ts` lookOf) and swaps it when the look's key changes. Members wear their player by
default; the guest wears its villager until it picks a player look ([the guest](design.md#the-guest)). Visitors are
always villagers.

## The look
`contract/look.ts` (pure, shared with the relay):
- **`PlayerLook` v1**: hair, eye, mouth (+ resting frame), skin, cheek, nose, top (or one-piece, then `bottom` null),
  bottom, socks, shoes, glasses, ornament, hat; colours `#rrggbb`; part ids carry their slot prefix (`PART_SLOTS`).
- **Prefs**, each the sender's own: `look` (`{kind: 'player', look}` / `{kind: 'villager'}`; none = いつもの) and
  `savedLooks` (the コーデ list).
- **いつもの is code, never stored** (`DEFAULT_LOOKS`; A's and B's from `app/design/avatar/render/outfits/`, pinned by
  `look.test.ts`; the guest's is its villager).
- **Limits** (`LOOK_LIMITS`): 20 コーデ, names ≤ 12 characters.
- **Checks**: the record checks form only (`lookPrefOk`, `savedLooksOk`); the phone maps unknown part ids to いつもの's
  (`contract/partIds.json`, `usePartTable`) and never sends one.
- Presentation only: no part is gated by anything about the person.

## The closet
`look/closet.ts` over `player3d/parts.json`. Everything is free to everyone (no ベル, no unlocks; the shop sells no
clothing). NH's wear rules (one-piece clears bottoms); curated palette for hair, eye, skin (`closet.ts` COLOURS); no
search. Parts that clipped on either body are out (`app/design/avatar/closet/excluded.json`).

## Portraits
`player3d/portrait.ts` draws a head with a renderer the page already has (never a second WebGL context);
`look/portraits.svelte.ts` keeps the latest 24 in localStorage.

## The dresser
設定 → 姿 opens すがた (`look/LookPage.svelte`): the stage, six tabs, no foot bar.
- **The stage** (`look/LookStage.svelte`, `LookPreview.svelte`, `preview3d.ts`): the final form, drag to turn; a status
  pill in words (いつもの, a コーデ, アレンジ中, 住民); 元に戻す once changed; colour dots of the last item; the renderer
  (the level's only WebGL context) lives while the level is open.
- **The tabs** (`look/tabs.ts`): コーデ · 顔 · 髪 · 服 · 小物 · 住民; opens on コーデ if any is saved, else 服. 住民 is
  `look/VillagerGrid.svelte`.
- **Villagers**: a villager is worn like a piece; the first human pick returns to the player with this visit's edits.
- **Saving**: on leaving (‹, ✕, Esc, hide) `look` is sent once, with 取り消す in the toast; コーデ edits go out as made.

## Assets
Body, joint binding and head anchors: `player3d/player3d.ts`; player-specific poses and the 16 eye / 9 mouth frames:
`player3d/tune.ts`; conversion `scripts/players3d-models.ts`; render harness `app/design/avatar/render/`.
