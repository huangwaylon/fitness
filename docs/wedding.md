# 結婚式 (the wedding board)

The wedding planning board, ported from the old `~/Documents/other/wedding` app (React over an Apps Script / Google
Sheet): the HUD menu's 結婚式 pill (the menu: [design](design.md#island)).

## Decisions

- The two members edit; the guest reads only (server-enforced). No key-less share link.
- No host villager on the board; normal Japanese labels.
- No ベル tie-in.
- One wedding date: the board's `date` setting drives the island's countdown, its wedding-day events and music
  (`time/holidays.ts` `weddingDate`, fed by the model's rows, the guest's too; 2027-10-08 until the record has one).

## What it does

- **Plan:** tasks with a due date (required on a new one) and an optional start, a category, a one-level checklist
  (no dates). Filters すべて / 期限切れ / もうすぐ (≤ 14 days) / あとで / 完了 with counts; overdue and 今月 first,
  then a group per month (`done / total`, the wedding's month marked), undated last.
- **Progress:** a task's percent (its checklist's share, or done / not), the board's the mean over tasks; the
  countdown in days in the board's time zone (default Asia/Tokyo).
- **Notes:** one shared markdown note (headings, lists, bold, italic, http(s) links).
- **Settings (members):** the names, the date and time, the venue, the categories; the deleted tasks with 戻す, and
  完全に削除 (final). No time zone row (one wedding, in Japan; a `tz` the record holds still applies).
- **Categories** (`lib/contract/wedCats.ts`): the starter list in Japanese, 予算 · 会場 · 招待客 · 業者 · 衣装 · 料理 ·
  ペーパーアイテム · 写真 · 音楽 · 美容 · ギフト · 手続き · 新婚旅行 · その他 (free text: a typed one as typed).
- Dropped from the old board: the accent colours, the edit link and read-only toggle (the keys replace them), the
  starter templates.

UI (`components/wedding/`, the [unified kit](design.md#unified-kit), following the time of day): its own chunk, a
`lazySheet` (`wedding/open.svelte.ts`: offline before it's cached, a banner with もういちど) on Sheet's `full` variant;
the island is paused under it. The title bar (NavBar: 結婚式, ✕), the TabBar プラン / メモ / 設定 (設定 a member's only),
＋ on プラン (a member's).

- **プラン** (`Head`, `Plan`, `TaskRow`): the banner (our photo, the countdown, the names, day · venue, the progress
  ring); the filters; pinned month heads over one dense card a month. A row opens in place: its checklist Ticks (who
  ticked each), who finished it, 編集 / 完了.
- **The form** (`TaskForm`): title, start, due, category, the checklist; its edits apply on 保存; 削除 with 取り消す.
- **メモ** (`Notes`): the note as a letter; 編集 turns it into a ruled field with a small toolbar. The draft is held in
  memory on the phone (`notepad.svelte.ts`): it outlives a tab and ✕. Two crossed saves show both versions under their
  writers, with これにする (取り消す on its banner) and ふたつを合わせる.
- **設定** (`Settings`): 完全に削除 asks first. The guest's sheet has no tick, 編集, ＋ or 設定 tab.

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
  Sheet tick (who unknown) reads 「前のボードで完了」 on its page, the Sheet's note 「前のボードから移したメモ」 until saved
  again.
- The phone folds the record's rows as they are and judges only its queued ones by the rules (`wedFold`). The admin's
  `load` takes rows as the record had them (unless the row its slot holds beats one), so a dump restores faithfully,
  then drops what the live path would have: a purged task's tick (and a removed packing item's ticks, the board's
  removals past its cap).

## Migration

Loaded once from the old board (`imported: true`; tools at the git tag `wedding-import`); `relay/test/wedding.test.ts`
"the imported shapes" keeps those rows valid.

## Open

- The date inputs and the note's field with the keyboard up (`--kb`): check on a real iPhone.
- Retiring the old app: rotate the Apps Script `APP_KEY`, archive the `/exec` deployment, give the old site a
  "moved" notice and archive its repo. The Sheet is kept.
