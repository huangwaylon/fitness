# 結婚式 (the wedding board)

The wedding planning board (ported from an Apps Script / Google Sheet app), the HUD menu's 結婚式 pill
([design](design.md#island)). Anyone edits, the guest too. No share link, no ベル tie-in.

The board's `date` setting drives the island's countdown, wedding-day events and music (`time/holidays.ts`
`weddingDate`; `WEDDING` until the record has one).

## The sheet

`components/wedding/` ([unified kit](design.md#unified-kit)), a `lazySheet` (`open.svelte.ts`), the island paused under
it. Tabs プラン / メモ / 設定. Rules: `lib/wedding/progress.ts`, `time/zone.ts`; store `board.svelte.ts`, view rules
`view.ts`. Demo board `store/demo/rows.ts`, driven by `e2e/wedding-board.spec.ts`.

- **Plan** (`Head`, `Plan`, `TaskRow`, `TaskForm`): tasks with a due date (required on new ones), optional start,
  category and one-level checklist; filters すべて / 期限切れ / もうすぐ (≤ 14 days) / あとで / 完了; grouped by month. The
  board's progress is the mean of its tasks'.
- **Notes** (`Notes`): one shared markdown note; the draft lives in memory (`notepad.svelte.ts`). Crossed saves show
  both versions with これにする and ふたつ合わせる.
- **Categories** (`lib/contract/wedCats.ts`): a Japanese starter list; free text allowed.
- **設定:** names, date, time, venue, categories; deleted tasks with 元に戻す and 完全に削除.

## The record (relay)

`contract/wedding.ts`, shared by the record and the phone ([backend.md](backend.md#events) has the shapes):

| type | data | slot |
|---|---|---|
| `wtask` | `{id, at, c, title, cat, due?, start?, parent?, del?}` or `{id, at, rm: true}` | `wtask\|<id>` |
| `wdone` | `{id, at, v: 0 \| 1}` | `wdone\|<id>` |
| `wconf` | `{k, at, v}`, `k` one of `p1`, `p2`, `date`, `time`, `venue`, `tz`, `cats` | `wconf\|<k>` |
| `wnote` | `{at, md, base?}`, kept with `was?` | `wnote` |

- Latest `at` wins, then who. `rm` is final (drops the tick); `del` is a soft delete.
- A subtask's `parent` must be a held top-level task (one level).
- Caps: constants at the top of `contract/wedding.ts` (2,000 `wtask` rows: `wedding full`; note 64,000 chars).
- Note conflicts: a save names its `base`; a mismatch keeps the replaced note as `was: {at, md, who}`, so neither is
  lost.
- `imported: true` marks rows from the Sheet; a phone may not set it.
- The phone judges only its queued rows (`wedFold`); the admin `load` restores a dump faithfully.

## Migration

Loaded once from the old board (tools at git tag `wedding-import`); `relay/test/wedding.test.ts` "the imported shapes"
keeps those rows valid. Still to do: rotate the Apps Script `APP_KEY`, archive the `/exec` deployment and the old repo.
