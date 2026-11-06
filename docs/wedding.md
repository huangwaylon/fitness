# けっこんしき (the wedding board)

The wedding planning board from `~/Documents/other/wedding` (React + an Apps Script / Google Sheet backend) moves into
the app as one area. Branch `wedding` (worktree `.claude/worktrees/wedding`); the relay's part lands on main first.

## Decisions (the user, 2026-11-06)

- Readers: the two members and the guest. A key-less read-only share link may come later, not now.
- The guest sees the board; it never ticks or edits (server-enforced).
- Host: Harvey, with the wedding arch (`static/art/deco/wedding-arch.webp`).
- The leaf menu keeps six pills (ベル, ずかん, えいご, りょこう, けっこんしき, せってい).
- The couple's photo (the old `public/hero.jpg`) may be committed.
- The Sheet's content is final: export it and move it.
- No ベル tie-in.

## What it does

- **Plan:** tasks with a required due date and an optional start, a category, and a one-level checklist (subtasks
  have no date). Filters: すべて / 期限切れ / もうすぐ (≤ 14 days) / あとで / 完了, each with a count. Overdue and this
  month lifted to the top, then one group per month (`done / total`), the wedding month marked, undated last.
- **Progress:** each task's percent (its subtasks' share, or done / not); the board's percent = the mean over top-level
  tasks; the countdown in days to the date, in the board's time zone (default Asia/Tokyo).
- **Notes:** one shared markdown document (headings, lists, bold, italic, http/https links).
- **Settings (members):** the two names, the date, the venue, the time zone, the categories. Deleted tasks listed with
  Restore; Purge removes them for good.
- Dropped: the accent colours, the edit link and read-only toggle (the app's keys replace them), the starter templates.

Pure rules (progress, "this month", tz-based today) port from the old `src/lib/progress.js` and `src/lib/time.js`.

## The record (relay)

| type | data | slot | who writes |
|---|---|---|---|
| `wtask` | `{id, at, title, cat, due?, start?, parent?, del?}` (`del`: deleted-at ms, restorable) or `{id, at, rm: true}` (purge, final) | `wtask\|<id>` | members |
| `wdone` | `{id, at, v: 0 \| 1}` | `wdone\|<id>` | members (shared, as today) |
| `wconf` | `{k, at, v}` (`k` one of names, date, venue, tz, cats) | `wconf\|<k>` | members |
| `wnote` | `{at, md, base?}` (`base`: the `at` it was edited from) | `wnote` | members |

Latest `at` (relay clock) wins, then who; a removal is final. The guest reads all four and writes none. `wnote` may be
up to 64,000 characters (its own cap; others keep 20,000). Saving a note whose `base` isn't the held note's `at` is
kept, and the phone shows both versions to choose from.

## Migration

The Sheet (`tasks`: `id, title, category, due, done_at, created_at, updated_at, deleted_at, parent_id, start`;
`config`: key / value, incl. `notes`) is final. Steps:

1. The user's `.xlsx` export (File › Download) in `~/Documents/island-backups/` (mode 600), plus a Sheet copy.
2. `relay/scripts/wedding-import.ts <xlsx>` converts it to a `load` file and a report: counts, duplicate or missing
   ids, orphans, cells Sheets turned into dates or numbers, formulas, timestamp formats, the notes' length. Nothing
   loads until the report is clean (or each finding has a rule).
   - `at` = `updated_at` (else `created_at`); `wdone` from `done_at`; `del` from `deleted_at`; person `A` with
     `imported: true` (the Sheet never recorded who).
3. Test relay: bookmark, load, parity (per id: title, category, due, start, done, deleted, parent; every setting; the
   notes byte for byte), load again (nothing changes).
4. Production: bookmark, load, parity, both phones check.
5. Rotate the old Apps Script `APP_KEY` so the Sheet can't be written; the user takes the old site down.

## Open questions

- (none)
