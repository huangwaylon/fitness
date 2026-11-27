# 結婚式 (the wedding board)

The wedding planning board, the menu's 結婚式 ([design](design.md#island)). Anyone edits, the guest too; no share link,
no ベル tie-in. Its `date` drives the island's countdown, wedding-day events and music (`time/holidays.ts weddingDate`).

## The sheet
`components/wedding/` (a `lazySheet`; store `board.svelte.ts`, view rules `view.ts`, progress `lib/wedding/progress.ts`;
e2e `wedding-board.spec.ts`). Tabs プラン / メモ / 設定.
- **Plan**: tasks with a due date, optional start, category and one-level checklist; filters すべて / 期限切れ / もうすぐ
  (≤ 14 days) / あとで / 完了; by month; ＋ in the title bar. Progress is the mean of the tasks'.
- **Notes**: one shared markdown note; crossed saves show both with これにする and ふたつ合わせる.
- **Categories** (`lib/contract/wedCats.ts`): a starter list; free text allowed.
- **設定:** names, date, time, venue, categories; deleted tasks with 元に戻す and 完全に削除.

## The record (relay)
`contract/wedding.ts` (caps at its top: 2,000 `wtask`, note 64,000 chars); shapes in [backend](backend.md#events).

| type | data | slot |
|---|---|---|
| `wtask` | `{id, at, c, title, cat, due?, start?, parent?, del?}` or `{id, at, rm: true}` | `wtask\|<id>` |
| `wdone` | `{id, at, v: 0 \| 1}` | `wdone\|<id>` |
| `wconf` | `{k, at, v}`, `k` in `p1`, `p2`, `date`, `time`, `venue`, `tz`, `cats` | `wconf\|<k>` |
| `wnote` | `{at, md, base?}`, kept with `was?` | `wnote` |

Latest `at` wins, then who; `rm` final, `del` soft; a `parent` must be a held top-level task. A note save names its
`base`; a mismatch keeps the replaced note as `was`. `imported: true` (from the old Sheet) a phone may not set.

## Migration
Loaded once from the old board (tools at git tag `wedding-import`; `relay/test/wedding.test.ts` keeps those shapes
valid). Open, outside the repo: rotate the Apps Script `APP_KEY`, archive the old deployment and repo.
