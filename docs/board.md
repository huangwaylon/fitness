# The island's bulletin board (けいじばん)

NH's board (`EvtobjBbs`, with its bird) on the beach: short notes everyone sees at once, read and edited in 3D.
Contract `app/src/lib/contract/board.ts`; record `relay/src/store.ts`; UI `app/src/lib/components/board/`; tests
`relay/test/board.test.ts`, `app/e2e/board.spec.ts`.

## The 3D hooks
`world.three` (`board/spot.ts` `BoardProj`), all optional (without `focus` it opens as a sheet): `focus(f, ms)` eases
the camera face-on (the one automatic camera move); `unfocus(ms)` restores the view; `attach(id, obj)` rides the face
(`board/face3d.ts`) and the bird on the model.

## Behaviour
- **Placement**: layout `board` (2 × 1, `fixed`, front tile clear; default in `board/spot.ts`); a tap walks up first.
- **The board view** (`board/BoardView.svelte`): ‹ 戻る returns the camera.
- **Posts** (`board/face.ts`): newest first, four a page, ≤ 100 chars and 4 lines (`BOARD_CHARS`, `BOARD_LINES`);
  authors edit their own, anyone deletes any; 「！」 marks others' new posts.

## The data
A `board` event per change ([backend.md](backend.md#events)): `{id, at, p, t}` or `{id, at, rm: true}`; removal wins,
then later `at`, then G > B > A (`mergeBoard`). The record cleans (`cleanText`) and keeps ≤ 50 (`BOARD_MAX`). No live
intent: the room's notice makes phones fetch.
