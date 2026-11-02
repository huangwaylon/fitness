# The island's bulletin board (けいじばん)

NH's island board (`EvtobjBbs`, the green one outside Resident Services; the bird that perches on it, `BbsBirdDay` by
day and `BbsBirdNight` at night): everyone on the island writes short notes on it, and everyone sees them at once.

Status: **landed** (the record, the models, the board on the island, the 2D sheet; relay deployed). **Waiting on:** the
layout's `board` kind and default object, and the 3D lead's `focus` / `unfocus` / `attach` (below). This file is the
contract between the board's files, the 3D integration lead and the layout.

## What the user asked

"I want users to be able to walk up to it to update its contents for everyone to see. The camera should zoom up to it so
that we see it clearly in 3D space and allow editing it." Then: "put the sign up near the front of the beach."

## Who owns what

| Part | Where | Owner |
|---|---|---|
| The posts (contract, merge, sanitising, caps, permissions) | `app/src/lib/contract/board.ts` | the board |
| The record's rules (a `board` event: permissions, the cap, the export) | `relay/src/store.ts` (via the contract) | the board |
| The phone's posts, the badge, the UI (the zoomed view's controls, the write field, the 2D sheet), the face's drawing | `app/src/lib/components/board/` | the board |
| The board's spot on the island (a layout object `board`, movable in the editor) | `app/src/lib/layout/` | **the layout agent** (request below) |
| The camera dolly and the face on the 3D model | `app/src/lib/components/world3d/` | **the 3D lead** (request below) |

## Requests

### To the layout agent: the board as a layout object

- A catalog kind `board` (`layout/catalog.ts`): `{ k: 'board', group: 'structure', ja: 'けいじばん', en: 'Bulletin board',
  w: 2, d: 1, block: true, foot: [56, 12], on: 'land', h: 60, icon: 'deco/bulletin-board', fixed: true }` (one on the
  island, never deleted, moved and turned freely; `f` turns only its look: its face is its front).
- A default object `{ id: 'board', k: 'board', x: 7, z: 6, f: 0 }` (tiles 7–8 × 6, its middle x 150, z 105: on the sand
  at the lawn's front edge, between the white plumeria and the path, behind the shells' sand (world.ts BEACH_BOX z
  −18…90) and clear of Gulliver's spot (Visitor.svelte [96, 30]), the sandcastle and the beach chair, facing the sea-side
  camera, so the front stays clean). The tiles in front of it and to its right (z 5, x 7–9) must stay walkable: a villager stands there to read it.
- Until it lands the board reads `layout.pos('board') ?? BOARD_SPOT` (`board/spot.ts`), the same spot, so nothing moves
  when it does.

### To the 3D lead: a camera focus and an attachment

The board needs three things on `world.three` (camera.svelte.ts `Proj3`, which Island3D fills from the engine), all
optional so the board works without them (it falls back to the 2D sheet over the island):

```ts
interface Focus {
  /** The rect to frame, in world units: its middle (x, z) on the ground, `y` u above the ground there, `w` × `h` u. */
  x: number; z: number; y: number; w: number; h: number;
  /** Which way its face looks (radians about the up axis; 0 = toward the camera, −z, as a layout `f` of 0). */
  yaw?: number;
  /** Screen px at the top to keep it under (the HUD's ribbon's bottom + 10: BoardView), default 0. */
  top?: number;
  /** Screen px at the bottom to keep it above (the write field and the keyboard: visualViewport), default 0. */
  bottom?: number;
  /** Share of the free screen it fills (default 0.9). */
  fill?: number;
}
interface Proj3 {
  // …
  /** Dolly and zoom the camera to look at `f` face-on (the camera's x leaves MID_X for this only: the user's exception
   *  to "x kept centred, no automatic camera moves"), along an ease (cubic in-out) over `ms` (600). The scroll, pinch and
   *  fling gestures are off while focused. Resolves once there. Called again while focused it re-frames from where it is
   *  (the keyboard opening: a new `bottom`). The first call remembers the view it left. */
  focus?(f: Focus, ms?: number): Promise<void>;
  /** Back to exactly the view the first focus left (camZ, zoom, pitch, its x) over `ms` (600), then the gestures
   *  are on again. Resolves once there. While focused, a villager between the camera and the board (mine, who walked
   *  up to it) fades out of the way (220 ms), and back as it unfocuses. */
  unfocus?(ms?: number): Promise<void>;
  /** A three.js object on a thing (a model instance by its id, things.ts), in that model's own units with its origin at
   *  the model's: placed, turned, scaled and bent (bend.ts) with the instance, lit as the things are; null takes it off.
   *  The board's face (a plane with a CanvasTexture) and the bird ride on the board this way. */
  attach?(id: string, obj: Object3D | null): void;
}
```

- The board's model (`deco/bulletin-board`, `static/room/world3d/deco/bulletin-board.glb`, centred on its origin by the
  conversion) has its **cork face** at model x −6.85…6.80, y 3.49…13.52, z +0.30 (facing +z, toward the camera at
  yaw 0): NH's cork quad in `mBbs` (UV u 0.011…0.352, v 0.683…0.933 of `mBbs_Alb`; NH's own pinned notes sit just in
  front of it, curled off the cork with their pins to z +1.02; the frame's front is at z +1.10 … +1.24). There is no
  separate material for it: the board's face is a plane laid over it at z +1.08, in front of NH's notes and inside the
  frame (`board/face3d.ts` `faceMesh(canvas)`: a `PlaneGeometry(13.6, 10)` translated to (0, 8.5, 1.08) **in its
  geometry**, with the CanvasTexture), handed to `attach('board', mesh)`. `attach` sets the object's matrix to the
  instance's, so a `position` on the mesh would be dropped: the offset lives in the geometry.
- The board is drawn at 3.5 u a model unit (60u tall, two tiles wide: `BOARD_S`). The focus rect the board asks for:
  the face's middle (1.08 × 3.5 u in front of the board's middle), `y` = 8.5 × 3.5 = 29.75 u, `w` = 13.6 × 3.5 = 47.6,
  `h` = 10 × 3.5 = 35, `yaw` from the layout's `f`, `bottom` the controls' and the keyboard's height, `fill` 0.92.
- The board's m3 instance id is `board` (the bird's `board-bird`); `attach('board', mesh)` is called once the 3D island
  is up, `attach('board', null)` when it goes. (`world.three` isn't reactive: the board follows `world.rest.three`, the
  flag that is, since the 3D island always comes up after the board.)
- The bird (`deco/bbs-bird-day` / `deco/bbs-bird-night`) is an ordinary m3 node on the board's top (lift ≈ 65 u), its
  idle a turn of its yaw every few seconds.

## Behaviour

- **Placement:** near the front of the beach, facing the sea-side camera (see the layout request).
- **Walk up:** a tap on the board walks my villager to the spot in front of it (the tent door's way: the deliberate
  exception to "interactables act in place"), then the board opens.
- **The board view:** in 3D the camera dollies and zooms to the face (≈600 ms); the back control (「もどる」, top left
  under the HUD's ribbon: `--hud-top` + 44 + the lip + 10 px, never over the ribbon) returns it to exactly where it was. On the 2D island (and in 3D before `focus` exists): a sheet over the island showing the same
  face (the very canvas the 3D texture is drawn from) with the same controls.
- **Posts:** the newest first, four to a page as NH's notes (the author's villager name and icon, the date), 「‹」「›」
  and a swipe on the board page through older ones.
- **Writing:** 「かきこむ」 opens a field over the board (the board stays visible above the keyboard). At most
  **100 characters** (code points) and **4 lines**; plain text only, rendered as text (canvas `fillText`, never HTML).
- **Editing:** an author edits or deletes their own; ウェイ and うめ may delete anyone's; the guest posts and edits or
  deletes their own, nothing else.
- **Notices:** a post by someone else since I last opened the board puts a 「！」 over it, cleared when I open it.

## The data (docs/backend.md#events `board`)

- One `board` event per change: a post set `{id, at, p, t}` (`p` when it was first posted; a new post has `p = at`, an
  edit the post's `p`) or removed `{id, at, rm: true}` (final). `id` is `b` + 6–24 of `[0-9a-z]`.
- The merge (`contract/board.ts`): a removal beats everything; else the later `at`, then G over B over A. The record keeps
  each post's latest row (slot `board|<id>`).
- The record (server-enforced, `relay/test/board.test.ts`): sanitises `t` (trim, control characters stripped, ≤ 4 lines,
  ≤ 100 characters); an edit only by the post's author; a removal by its author or a member; an op on a post it doesn't
  hold is acknowledged and dropped unless it is a new post; **at most 50 posts** kept: a new one past them drops the
  oldest (by `p`). The phones show the same 50.
- Live: a post goes to the record at once; the record's notice reaches every open phone over the room, which fetch it
  (the room's 256-byte messages are too small for a post's text, so there is no live intent of its own).
- The Sheet export carries the `board` rows like every event.

## Checked (`app/e2e/board.spec.ts`)

- The face's notes are a canvas: the specs read what it drew through `window.__board.drawn()` (the page's texts) and a
  pixel of the 2D sheet's canvas (a note's paper, not bare cork), and `__board.face3()` (the 3D face's box in the scene:
  on the cork, in front of NH's notes). A note shows at once when written, after a reload, and from the record's
  snapshot (the relay mocked); 「もどる」 is under the ribbon and the face under both, on the 2D and the 3D island.
