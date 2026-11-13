# The island's bulletin board (けいじばん)

NH's island board (`EvtobjBbs`, with its bird `BbsBirdDay` / `BbsBirdNight`) at the front of the beach: everyone
writes short notes on it and everyone sees them at once. The camera zooms up to it, so it's read and edited in 3D.

## Files

| Part | Where |
|---|---|
| The posts (contract, merge, sanitising, caps, permissions) | `app/src/lib/contract/board.ts` |
| The record's rules (a `board` event) | `relay/src/store.ts` (via the contract) |
| The posts, the badge, the UI, the face's drawing | `app/src/lib/components/board/` |
| Its spot: layout object `board` (`layout/catalog.ts`: 2 × 1, `fixed`, `turns`, `front` keeps the tile before it clear), movable in the editor | `app/src/lib/layout/` |
| The camera's focus and the face on the model | `app/src/lib/components/world3d/` (engine.ts `frame` / `restore`, wired as `focus` / `unfocus` by Island3D; things.ts `attach`) |

## The 3D hooks

On `world.three` (`island/camera.svelte.ts` `Proj3`; `board/spot.ts` `BoardProj`), all optional: without `focus` the
board opens as a sheet over the island showing the same face (the very canvas the 3D texture is drawn from).

- `focus(f, ms)`: ease to look at a rect face-on (engine.ts `frame`: its fields). The camera's x leaves MID_X for this
  only (the one exception to "x kept centred, no automatic camera moves"); gestures are off while focused; called
  again it re-frames from where it is (the keyboard opening: a new `bottom`).
- `unfocus(ms)`: back to exactly the view the first focus left, gestures on again. While focused, a villager between
  the camera and the board fades out of the way.
- `attach(id, obj)`: a three.js object riding a model instance (its units and origin; placed, turned, bent and lit
  with it). The face (`board/face3d.ts`: the cork coordinates and the focus rect) and the bird (`board-bird`) ride on
  instance `board`. Board.svelte follows `world.rest.three`, since `world.three` isn't reactive.

## Behaviour

- **Placement:** the layout's `board`, by default on the sand at the lawn's front edge (tiles 7–8 × 6, middle 150, 105:
  `board/spot.ts`, also used before the layout's applied).
- **Walk up:** a tap walks my villager to the spot in front of it (as the tent door: the deliberate exception to
  "interactables act in place"), then the board opens.
- **The board view:** ‹ 戻る (top left under the HUD, never over it) returns the camera to exactly where it was.
- **Posts:** newest first, four to a page as NH's notes (author's villager name and icon, the date); 「‹」「›」 and a
  swipe page through older ones.
- **Writing:** 「書き込む」 opens a field over the board, which stays visible above the keyboard. At most **100
  characters** (code points) and **4 lines** (`BOARD_CHARS`, `BOARD_LINES`); plain text, drawn with canvas `fillText`,
  never HTML. The note shows on the face as it's typed (`face.ts` `DRAFT_ID`). While writing ‹ 戻る steps aside
  (キャンセル and Esc go back).
- **The keyboard (iOS):** the view is the visible part of the screen, not the layout viewport
  (`components/ui/keyboardInset.svelte.ts`, its header: why); `focus`'s `top` / `bottom` are measured from the canvas's
  rect to the controls', so iOS scrolling the page to the field hides nothing. Fields are ≥ 16 px (no zoom on focus);
  `focus({ preventScroll })`.
- **Editing:** an author edits their own; anyone deletes anyone's, the guest as ウェイ and うめ.
- **Notices:** a post by someone else since I last opened the board puts a 「！」 over it.

## The data (docs/backend.md#events `board`)

- One `board` event per change: a post set `{id, at, p, t}` (`p` first posted: a new post's `p = at`, an edit keeps
  it) or removed `{id, at, rm: true}` (final). `id` is `b` + 6–24 of `[0-9a-z]`.
- The merge (`mergeBoard`): a removal beats everything; else the later `at`, then G over B over A. The record keeps each
  post's latest row (slot `board|<id>`).
- The record (server-enforced, `relay/test/board.test.ts`): sanitises `t` (`cleanText`); an edit only by the author; a
  removal by its author or a member; an op on a post it doesn't hold is dropped unless it's a new post; **at most 50
  posts** (`BOARD_MAX`): a new one past them drops the oldest by `p`.
- The phone (`boardFold`): the record's rows as they are, only its own queued ops judged by the record's rules
  (`boardAccept`), as the packing list's `packFold`.
- Live: a post goes to the record at once; the record's notice reaches every open phone over the room, which fetches
  it (a room message's 256 bytes are too small for the text, so no live intent of its own).

Checked by `app/e2e/board.spec.ts` (its header lists what).
