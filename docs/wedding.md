# けっこんしき (the wedding board)

The wedding planning board of `~/Documents/other/wedding` (React over an Apps Script / Google Sheet), moved into the
app: the HUD menu's けっこんしき pill.

## Decisions (the user, 2026-11-06)

- The two members edit; the guest reads only (server-enforced). No key-less share link for now.
- No host villager on the board (the redesign, 2026-11-06: Harvey and the arch removed; normal Japanese labels).
- The leaf menu has six pills: ベル, ずかん, えいご, りょこう, けっこんしき, せってい.
- No ベル tie-in.
- One wedding date: the board's `date` setting drives the island's countdown, its wedding-day events and music
  (`time/holidays.ts` `weddingDate`, fed by the model's rows, the guest's too; 2027-10-08 until the record has one).
- The couple's photo (the old `public/hero.jpg`) may be committed.

## What it does

- **Plan:** tasks with a due date (required on a new one) and an optional start, a category, a one-level checklist
  (no dates). Filters すべて / 期限切れ / もうすぐ (≤ 14 days) / あとで / 完了 with counts; overdue and 今月 first,
  then a group per month (`done / total`, the wedding's month marked), undated last.
- **Progress:** a task's percent (its checklist's share, or done / not), the board's the mean over tasks; the
  countdown in days in the board's time zone (default Asia/Tokyo).
- **Notes:** one shared markdown note (headings, lists, bold, italic, http(s) links).
- **Settings (members):** the names, the date and time, the venue, the time zone, the categories; the deleted tasks
  with もどす, and ぜんぶ けす (final).
- Dropped from the old board: the accent colours, the edit link and read-only toggle (the keys replace them), the
  starter templates.

UI (`components/wedding/`, the [quiet kit](design.md#quiet-sheets), following the time of day): its own chunk, a
`lazySheet` (`wedding/open.svelte.ts`, like りょこう's: offline before it's cached, a banner with もういちど), on Sheet's
`quiet` variant; the island is paused under it. The title bar (けっこんしき, ✕), a bottom tab bar プラン / メモ, ＋ over it
(a member's).

- **プラン** (`Head`, `Plan`, `TaskRow`): our photo as a band (`static/wedding/hero.webp`: the names, the day · venue,
  「あと336日」, a member's ⚙ 設定); the strip (the rose ring, the percent, 「8件中2件完了」); one row of filter chips;
  pinned month headings (期限切れ coral, 今月 green, the year only where it changes) over one card per month, each row
  tick · month over day · title, category tag, checklist count · the relative due. A row opens in place: its checklist
  ticks, who finished it (「うめ が完了」; the old Sheet's 「まえの ボードで おわった」), 編集 / 完了.
- **The form** (`TaskForm`, a BottomSheet for ＋ and 編集): title, start, due, category chips, the checklist renamed /
  removed / added (applied on 保存), 削除 with the banner's とりけす.
- **メモ** (`Notes`): a document (16/1.65); 編集 in the title bar turns it into the field with 見出し / 太字 / リスト /
  リンク and 完了 at its foot, over the keyboard. The draft is held in memory on the phone (`notepad.svelte.ts`): it
  outlives a level, a tab and ✕. Two crossed saves show both versions under their writers (mine あなた), with これに
  する (とりけす on its banner) and ふたつ あわせる (both in the editor).
- **設定** (`Settings`): a grouped list, a level with ‹. The guest's sheet has no tick, 編集, ＋ or ⚙.

Rules: `lib/wedding/progress.ts`, `time/zone.ts` (ported from the old board); the store `board.svelte.ts`; the plan's
view rules `view.ts`. The demo (`?demo`, `?demo&as=G`) draws an invented board (`store/demo/rows.ts`, its day the
fallback 2027-10-08), driven by `e2e/wedding-board.spec.ts`.

## The record (relay)

`contract/wedding.ts`, shared by the record, the model and the store ([backend.md](backend.md#events) has the shapes):

| type | data | slot |
|---|---|---|
| `wtask` | `{id, at, c, title, cat, due?, start?, parent?, del?}` or `{id, at, rm: true}` | `wtask\|<id>` |
| `wdone` | `{id, at, v: 0 \| 1}` | `wdone\|<id>` |
| `wconf` | `{k, at, v}`, `k` one of `p1`, `p2`, `date`, `time`, `venue`, `tz`, `cats` | `wconf\|<k>` |
| `wnote` | `{at, md, base?}`, kept with `was?` | `wnote` |

- Members write all four; the guest's are `forbidden` (its phone's methods refuse too).
- The latest `at` (the sender's relay clock, ms, ≤ a day ahead) wins, then who. A purge (`rm`) is final and drops the
  task's tick; soft delete is `del` on the task's set, restore a set without it.
- `c` is the creation time (the checklist's order). A subtask names its `parent` (one level, no dates); the record
  refuses one whose parent it doesn't hold as a top-level task, except a set keeping the parent its held row already
  names, so a subtask whose parent was purged stays editable. The phone's purge makes such a live subtask a task of
  its own. The phone requires `due` on a new task; the record doesn't (the Sheet's undated rows).
- Caps: titles ≤ 500 code points, categories ≤ 40, names ≤ 40, venue ≤ 200, each one clean line; `time` `HH:MM`;
  `tz` an IANA name (an unknown one reads as Asia/Tokyo); `cats` ≤ 30; ≤ 2,000 `wtask` rows (`wedding full`). The note
  ≤ 64,000 characters, kept exactly, its data ≤ 140,000 as JSON (every other type 20,000).
- Note conflicts: a save names the note it was edited from (`base`). One whose `base` isn't the held note's `at` is
  kept with the replaced note beside it (`was: {at, md, who}`, the record's own), shown on both phones until a save
  from the new one (one level). A save that loses on `at` to a note it wasn't edited from (offline, or crossing in
  flight) and differs from it is restamped the held `at` + 1 and kept the same way, so neither is lost.
- `imported: true` marks the admin's load's rows from the Sheet; a phone's is refused and a phone's edit drops it. A
  Sheet tick (who unknown) reads 「まえの ボードで おわった」 on its page, the Sheet's note 「まえの ボードから うつした
  メモ」 until saved again.
- The phone folds the record's rows as they are and judges only its queued ones by the rules (`wedFold`). The admin's
  `load` takes rows as the record had them (unless the row its slot holds beats one), so a dump restores faithfully,
  then drops what the live path would have: a purged task's tick (and a removed packing item's ticks, the board's
  removals past its cap).

## Migration

Done 2026-11-06: the old Apps Script's `doGet` reply, converted and loaded into PRODUCTION: 63 events (52 `wtask`, 3 `wdone`, 7
`wconf`, 1 `wnote`), each `imported: true`, person `A`, ids `wed-<id>-wtask`, `wed-<id>-wdone`, `wed-conf-<key>`,
`wed-note` (a load again adds nothing). Parity: 52 tasks, 364 fields, 7 settings, the note byte-equal. The tools
(`relay/scripts/wedding-import.ts`, `wedding-sheet.ts`, `wedding-parity.ts`, their test and invented fixture) live at
the git tag `wedding-import`. To audit: check out the tag, `node scripts/record.ts dump > dump.json` (mode 600), then
`node scripts/wedding-parity.ts <doget.json> dump.json` (prints mismatches by id and field, never a value). The
record must keep those rows valid: `relay/test/wedding.test.ts` "the imported shapes".

## Open

- The date inputs and the note's field with the keyboard up (`--kb`): check on a real iPhone.
- Retiring the old app (approved): once the new screens are live, the user rotates the Apps Script `APP_KEY` and
  archives the `/exec` deployment; then the old site gets a "moved" notice and its repo is archived. The Sheet is kept.
