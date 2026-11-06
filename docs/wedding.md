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
- **Settings (members):** the two names, the date and its time, the venue, the time zone, the categories. Deleted tasks listed with
  Restore; Purge removes them for good.
- Dropped: the accent colours, the edit link and read-only toggle (the app's keys replace them), the starter templates.

Pure rules (progress, "this month", tz-based today) port from the old `src/lib/progress.js` and `src/lib/time.js`.

## The record (relay)

`contract/wedding.ts` (the record, the model and the board's store share it; [backend.md](backend.md#events) has the
exact shapes):

| type | data | slot |
|---|---|---|
| `wtask` | `{id, at, c, title, cat, due?, start?, parent?, del?}` or `{id, at, rm: true}` | `wtask\|<id>` |
| `wdone` | `{id, at, v: 0 \| 1}` | `wdone\|<id>` |
| `wconf` | `{k, at, v}`, `k` one of `p1`, `p2`, `date`, `time`, `venue`, `tz`, `cats` | `wconf\|<k>` |
| `wnote` | `{at, md, base?}`, kept with `was?` | `wnote` |

- Members write all four; the guest reads them and writes none (`forbidden`; its phone's methods refuse).
- The latest `at` (the sender's relay clock in ms) wins, then who; a purge (`rm`) is final and takes the task's tick
  with it. Soft delete is `del` (when, in ms) on the task's set; restore is a set without it.
- `c`: when the task was created (a checklist reads in the order it was typed). A subtask names its `parent`, one
  level (the record holds the parent as a task that has none), and has no dates. A task's dates are real
  `YYYY-MM-DD`s; the phone requires `due` on a new task, the record doesn't (the Sheet's undated rows).
- Titles ≤ 500 code points (the Sheet's longest is a 269-character subtask with a link), categories ≤ 40 (free text;
  `cats` is only the picker's list), names ≤ 40, venue ≤ 200, all one clean line; `time` `HH:MM` (the old board's
  `wedding_time`, from before its 2026-08 cut); `tz` an IANA name (an unknown one reads as Asia/Tokyo); `cats` ≤ 30.
- `wnote` ≤ 64,000 characters, kept exactly as sent, its own data cap (140,000 as JSON; every other type keeps 20,000).
  A save names the note it was edited from (`base`); one whose `base` isn't the held note's `at` is kept with the
  replaced note beside it (`was: {at, md, who}`, written by the record), and the phones show both until someone saves
  again from the new one (one level: a third crossing save keeps only the last one it replaced).
- `imported: true` marks a row the admin's load brought from the Sheet; a phone's is refused, and the next edit drops
  it. The sheet shows 「むかしの きろく」 for a tick from the Sheet (which never recorded who: `WedTask.doneBy` is '')
  and on the Sheet's note until it's saved again.
- The phone folds the record's rows as they are and judges only its queued ones by the record's rules (`wedFold`), as
  the packing list and the board do. The admin's `load` takes these rows as the record had them too (only a row its slot
  holds that beats it stops one), so a dump restores faithfully; that fix covers the board and the packing list, which
  until 2026-11-06 lost edited posts and items on a restore into an empty record.

On the phone, `components/wedding/board.svelte.ts`: `tasks` (live top-level, each with its subtasks and progress),
`overall`, `countdown`, `today` (the board's zone), `config` (over the defaults: `lib/wedding/config.ts`), `note`,
`conflict`, `deleted`; `addTask`, `editTask`, `addSub`, `tick`, `remove` (a task and its live subtasks), `restore`
(and the subtasks deleted with it), `purge` (one deleted task, or all), `setConfig`, `saveNote(md, from)`. The rules
are `lib/wedding/progress.ts` and `time.ts`, ported from the old board with their tests.

The sheet (`components/wedding/WeddingSheet.svelte`, the menu's けっこんしき pill): `WeddingHost` loads it and the store
as one chunk on the first opening and hands it the store as its `board` and, on a member's phone, its `actions`
(`view.ts`: `Board` and `WeddingActions` are picks of the store's own getters and methods; `Task` is the store's
`WithProgress<WedTask>`). The components read the store's shapes as they are (`category`, `doneAt`, `doneBy`,
`progress.state / days / thisMonth / tally`, the overall's counts and percent); `view.ts` keeps only the plan's own
rules (the filters, the held rows, the lifted sections and month groups, the deleted list: a subtask deleted with its
task isn't listed apart). The note's conflict shows the held version (`current`) and the one it was saved over
(`other`, the record's `was`), each under its writer's name; これに する saves from the held one, which settles it. The
guest's sheet has no ✓, ✎, ＋, ⚙ or かく and no actions; its store refuses anyway. The demo (`?demo`, `?demo&as=G`)
draws its own invented board (`store/demo/rows.ts`), which the e2e (`e2e/wedding-board.spec.ts`) drives from the menu.

## Migration

The source is the old Apps Script's `doGet` reply (`{ok, tasks, config, sheetTimeZone}`, every cell a string),
`~/Documents/island-backups/wedding-doget-2026-11-06.json` (mode 600): it matches the user's CSV export of both tabs
byte for byte (52 rows, 10 columns, 8 config keys), so no `.xlsx` is needed. Steps:

1. Convert: `cd relay && node scripts/wedding-import.ts ~/Documents/island-backups/wedding-doget-2026-11-06.json`
   writes `…/wedding-doget-2026-11-06.load.json` (mode 600) and prints the report (counts; findings by rule, row,
   column and id, never a value). It exits 1 until every finding is a note (`(info)`). The rules
   (`scripts/wedding-sheet.ts`):
   - a task's `at` = `updated_at`, else `created_at`; `c` = `created_at`; person `A`, `imported: true`; `wdone` (v 1)
     at `done_at`; `del` = `deleted_at`; the old reader's trimmed cells; dates as its `normalizeDay`;
   - a row without an id, a repeated id (the first wins), a row without a title: not loaded;
   - a subtask with a date: under a live task its dates go; else (the old board showed it as a task) its parent goes;
   - the config's keys to `p1`, `p2`, `date`, `time`, `venue`, `tz`, `cats` (comma-separated, trimmed, deduplicated),
     a blank one left to the default; `notes` → the `wnote` byte for byte; their `at` the Sheet's newest timestamp;
   - event ids `wed-<id>-wtask`, `wed-<id>-wdone`, `wed-conf-<key>`, `wed-note`: a load again adds nothing.
   The real Sheet (2026-11-06): 63 events (52 `wtask`, 3 `wdone`, 7 `wconf`, 1 `wnote`), the report clean.
2. Test relay: `node scripts/record.ts bookmark --test`, `node scripts/record.ts load <load.json> --test`,
   `node scripts/record.ts dump --test > <dump.json>` (mode 600, off the repo), then
   `node scripts/wedding-parity.ts <doget.json> <dump.json>`: per id title, category, due, start, done, deleted,
   parent; every setting; the notes byte for byte; mismatches by id and field (a conversion rule's named), exit 1 on
   one without a rule. Load again: `loaded {… "events":0 …}`.
3. Production: the same without `--test`, then both phones check.
4. Rotate the old Apps Script `APP_KEY` so the Sheet can't be written; the user takes the old site down.

## Open questions

- (none)
