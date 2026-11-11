# The island's bulletin board (けいじばん)

NH's island board (`EvtobjBbs`, the green one outside Resident Services; the bird that perches on it, `BbsBirdDay` by
day and `BbsBirdNight` at night) near the front of the beach: everyone on the island walks up to it, writes short
notes on it, and everyone sees them at once. The camera zooms up to it, so it's read and edited in 3D.

## Files

| Part | Where |
|---|---|
| The posts (contract, merge, sanitising, caps, permissions) | `app/src/lib/contract/board.ts` |
| The record's rules (a `board` event) | `relay/src/store.ts` (via the contract) |
| The phone's posts, the badge, the UI (the zoomed view's controls, the write field, the sheet), the face's drawing | `app/src/lib/components/board/` |
| Its spot: a layout object `board` (`layout/catalog.ts`: furniture, 2 × 1 tiles, `fixed`, `turns`, `front`: the tile before it kept clear to read it), movable in the editor | `app/src/lib/layout/` |
| The camera's focus and the face on the 3D model | `app/src/lib/components/world3d/` (engine.ts `frame` / `restore`, wired as `focus` / `unfocus` by Island3D; things.ts `attach`) |

## The 3D hooks

On `world.three` (camera.svelte.ts `Proj3`, filled by Island3D from the engine; `board/spot.ts` `BoardProj`), all
optional: without `focus` the board opens as a sheet over the island.

- `focus(f, ms = 600)`: dolly and zoom to look at a rect face-on (`f`: its middle x, z on the ground, `y` u above it,
  `w` × `h` u, `yaw` its face's way, `top` / `bottom` screen px to keep it between, `fill` the share of the free screen,
  0.9 by default), along a cubic in-out ease; the camera's x leaves MID_X for this only (the one exception to "x
  kept centred, no automatic camera moves"); the gestures are off while focused; called again it re-frames from where
  it is (the keyboard opening: a new `bottom`).
- `unfocus(ms = 600)`: back to exactly the view the first focus left, then the gestures on again. While focused, a
  villager between the camera and the board fades out of the way (220 ms), and back as it unfocuses.
- `attach(id, obj)`: a three.js object on a model instance (things.ts), in that model's units with its origin, placed,
  turned, scaled and bent with it, lit as the things are; null takes it off. The face and the bird ride on the board.

The face (`board/face3d.ts`: its header has the model's cork coordinates and the focus rect) is a plane over the
model's cork with the face's CanvasTexture. Its instance id is `board` (the bird's `board-bird`, turning its yaw every
few seconds while the island is seen); the board follows `world.rest.three` (`world.three` isn't reactive).

## Behaviour

- **Placement:** the layout's `board` object, by default on the sand at the lawn's front edge (tiles 7–8 × 6, its
  middle x 150, z 105), facing the sea-side camera; before the layout's applied, that same spot (`board/spot.ts`).
- **Walk up:** a tap on the board walks my villager to the spot in front of it (the tent door's way: the deliberate
  exception to "interactables act in place"), then the board opens.
- **The board view:** in 3D the camera dollies and zooms to the face (≈600 ms); the back control (「もどる」, top left
  under the HUD: `--hud-top` + 44 + the lip + 10 px, never over it) returns it to exactly where it was. Without `focus`:
  a sheet over the island showing the same face (the very canvas the 3D texture is drawn from) with the same controls.
- **Posts:** the newest first, four to a page as NH's notes (the author's villager name and icon, the date), 「‹」「›」
  and a swipe on the board page through older ones.
- **Writing:** 「かきこむ」 opens a field over the board (the board stays visible above the keyboard). At most
  **100 characters** (code points) and **4 lines**; plain text only, rendered as text (canvas `fillText`, never HTML).
  The note is on the face as it's typed (`face.draft`: a new one first on page 1, its paper picked; an edit in its own
  place), so the field and the note as it'll be are both in sight. While writing 「もどる」 steps aside (やめる and Esc
  go back) and the face takes its room, from the safe area's foot down to the field.
- **The keyboard (iOS):** the view is the visible part of the screen, not the layout viewport
  (`ui/keyboardInset.svelte.ts`, its header: why), the controls in flow at its foot just above the keyboard. On the 3D
  island `focus`'s `top` and `bottom` are measured from the canvas's rect to the controls', so iOS scrolling the page to
  the field moves nothing out of sight. Fields are ≥ 16 px (no zoom on focus); `focus({ preventScroll })`.
- **Editing:** an author edits their own; anyone deletes anyone's, the guest as ウェイ and うめ.
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
- The phone (`boardFold`): the record's rows taken as they are (merged: an edited post is only its edit's row, its
  first posting replaced), only this phone's queued ops judged by the record's rules (`boardAccept`), as the packing
  list's `packFold`.
- Live: a post goes to the record at once; the record's notice reaches every open phone over the room, which fetch it
  (the room's 256-byte messages are too small for a post's text, so there is no live intent of its own).
- The dump carries the `board` rows like every event.

Checked by `app/e2e/board.spec.ts` (its header lists what).
