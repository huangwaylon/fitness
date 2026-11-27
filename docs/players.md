# Players

How each person looks: an NH human player from an NH-style closet, or a roster villager. Prefs `look` and
`savedLooks`: [backend.md "Events"](backend.md#events); pipeline: [world3d-assets.md "Players"](world3d-assets.md#players);
menu entry: [design.md "すがた"](design.md#sugata).

## Who is drawn
A **player** (`player3d/player3d.ts` createPlayer) or a **villager** (`villager3d` createVillager, the `villager`
pref); both are a `Villager3D`. `person3d/person3d.ts` builds a person's look (`store/look.ts` lookOf) and swaps it when
the key changes. Members wear their player by default, the guest its villager until it picks a player look; visitors
are always villagers.

## The look
`contract/look.ts` (pure, shared with the relay):
- **`PlayerLook` v1**: hair, eye, mouth (+ resting frame), skin, cheek, nose, top (or one-piece, `bottom` null),
  bottom, socks, shoes, glasses, ornament, hat; colours `#rrggbb`; ids carry their slot prefix (`PART_SLOTS`).
- **Prefs**, each the sender's own: `look` (`{kind: 'player', look}` / `{kind: 'villager'}`; none = いつもの) and
  `savedLooks` (コーデ).
- **いつもの is code, never stored** (`DEFAULT_LOOKS`; A's and B's from `app/design/avatar/render/outfits/`, pinned by
  `look.test.ts`; the guest's is its villager).
- **Limits** (`LOOK_LIMITS`): 20 コーデ, names ≤ 12 characters.
- **Checks**: the record checks form (`lookPrefOk`, `savedLooksOk`); the phone maps unknown ids to いつもの's
  (`contract/partIds.json`, `usePartTable`) and never sends one. No part is gated.

## The closet
`look/closet.ts` over `player3d/parts.json`: all free (the shop sells no clothing); NH's wear rules; curated colours
(`closet.ts` COLOURS); parts that clipped are out (`app/design/avatar/closet/excluded.json`).

## Portraits
`player3d/portrait.ts` draws a head with a renderer the page already has (never a second WebGL context);
`look/portraits.svelte.ts` keeps 24 in localStorage.

## The dresser
設定 → 姿 opens すがた (`look/LookPage.svelte`): the stage, six tabs, no foot bar.
- **The stage** (`look/LookStage.svelte`, `LookPreview.svelte`, `preview3d.ts`): drag to turn; a status pill (いつもの, a
  コーデ, アレンジ中, 住民); 元に戻す once changed; the level's only WebGL context, alive while it is open.
- **The tabs** (`look/tabs.ts`): コーデ · 顔 · 髪 · 服 · 小物 · 住民 (`look/VillagerGrid.svelte`); opens on コーデ if any,
  else 服.
- **Villagers**: worn like a piece; the first human pick returns to the player with this visit's edits.
- **Saving**: `look` sent once on leaving (‹, ✕, Esc, hide) with 取り消す; コーデ edits go out as made.

## Assets
Body, joints, head anchors: `player3d/player3d.ts`; poses and the 16 eye / 9 mouth frames: `player3d/tune.ts`;
conversion `scripts/players3d-models.ts`; render harness `app/design/avatar/render/`.
