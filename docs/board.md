# The island's bulletin board (けいじばん)

NH's board (`EvtobjBbs`, with its bird) on the beach: everyone writes short notes, everyone sees them at once, read and
edited in 3D. Contract `app/src/lib/contract/board.ts`; record rules `relay/src/store.ts`; UI and face drawing
`app/src/lib/components/board/`; tests `relay/test/board.test.ts`, `app/e2e/board.spec.ts`.

## The 3D hooks
On `world.three` (`board/spot.ts` `BoardProj`), all optional (without `focus` the board opens as a sheet with the same
face): `focus(f, ms)` eases the camera face-on (engine.ts `frame`; the one exception to "x centred, no automatic camera
moves"); `unfocus(ms)` restores the exact view; `attach(id, obj)` rides an object on a model instance (the face,
`board/face3d.ts`, and the bird).

## Behaviour
- **Placement**: the layout's `board` (catalog: 2 × 1, `fixed`, front tile kept clear); default spot in `board/spot.ts`.
  A tap walks up to it first (like the tent door, an exception to acting in place).
- **The board view** (`board/BoardView.svelte`): ‹ 戻る returns the camera; keyboard handled by
  `components/ui/keyboardInset.svelte.ts`.
- **Posts** (`board/face.ts`): newest first, four a page; ≤ 100 characters and 4 lines (`BOARD_CHARS`, `BOARD_LINES`),
  plain text via `fillText`. Authors edit their own; anyone deletes any. A 「！」 marks others' new posts.

## The data
A `board` event per change ([backend.md](backend.md#events)): `{id, at, p, t}` or `{id, at, rm: true}` (final). Removal
wins, then later `at`, then G > B > A (`mergeBoard`). The record sanitises (`cleanText`), keeps ≤ 50 posts
(`BOARD_MAX`, oldest by `p` dropped). No live intent: the room's notice makes phones fetch.
