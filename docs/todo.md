# やること (to-do lists)

Shared to-do lists in the leaf menu (pill やること, a checklist; [design](design.md#island) "Menu"): several lists,
each a title and items, an item a line of text, done or not. Everyone edits everything, the guest too, live on every
phone, queued offline like any event.

## Files

| Part | Where |
|---|---|
| The op, its checks, the merge, the cap, the fold, the lists | `app/src/lib/contract/todo.ts` |
| The record's rules (a `todo` event), a list's removal dropping its items, the load | `relay/src/store.ts` (via the contract) |
| The sheet, its store, its strings | `app/src/lib/components/todo/`, `app/src/lib/i18n/todo.*` |

## The sheet

A full-height kit sheet (`TodoSheet.svelte`), two levels under one NavBar:
- **The lists:** a row each (its title, done / all) → the list; 「＋ 新しいリスト」 (a form sheet, 作成). Empty: a line
  saying what it's for.
- **A list:** ‹ back; ⋯ 名前を変更 · リストを削除 (asked first: a Sheet confirm naming how many items go, then 取り消す on the
  banner). A row an item: its Tick (everyone's: one done state, not per person) and its text; the text tapped opens
  編集 · 上へ · 下へ · 削除 (削除 at once with 取り消す). The field at the foot adds an item on 追加 or the return key and
  keeps the keyboard up for the next. 「完了した項目を削除（N件）」 (a `.text-link`) removes the done ones, one 取り消す
  for all. A list removed on another phone takes this one back to the lists.
- Reorder is 上へ / 下へ, not a drag (as the packing list: no drag fighting the sheet's scroll). Item text isn't
  `.selectable`: a tap acts, and 編集's field holds the text to copy.

## The data (docs/backend.md#events `todo`)

- One `todo` event per change, the thing's whole state: a list `{id, at, title, ord}`, an item
  `{id, at, list, text, ord, done}` (`done` 0 / 1), a removal `{id, at, rm: true}` (final). `id` is `d` + 6–24 of
  `[0-9a-z]`; titles ≤ 40 and texts ≤ 200 characters, one clean line (`todoClean`); `ord` a float (`ordBetween`, the
  packing list's).
- The merge (`TodoBook`, contract/book.ts): per id, the later `at`, then G over B over A; a removal beats everything.
  So a tick and a rename of the same item at once: the later one wins whole (last write wins per item).
- The record: only a creation makes a row (an edit or removal of an id it doesn't hold is acknowledged, dropped); an
  item only in a list it holds, and its list never changes (`todo moved`); a list's removal deletes its items' rows;
  **at most 500** lists and items standing (`todo full`). Anyone writes (`guestMayWrite`).
- Live: not `calm` (a shared list is used together: a partner's change is fetched at once, not after 10 s).
- Backups: rows in `events`, so in every dump; a load takes them as they were and drops a removed list's items.
- Due dates and reminders: below.

## Due dates and reminders

An item may carry a due and, only with one, a reminder (`app/src/lib/contract/todoDue.ts`, read alike by the record,
the relay's alarm and the sheet):
- `due`: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM`, the Tokyo wall clock (abroad too), a real date in 2024–2099.
- `rem`: with a timed due `at` (the time) · `b10` (10 min before) · `b60` (1 h before) · `eve` (20:00 the day before);
  with a date-only one `am` (08:00 that day) · `eve`. Absent: no reminder. Never on by default; a date alone never
  schedules anything.
- `to`: who gets it, 1–3 distinct of A / B / G, required with `rem` (anyone may address anyone; a phone only receives
  if it opted in).
- Refused (`todo bad`): `rem` without `due`, `to` without `rem`, a `rem` that doesn't fit the due's kind. Whole state
  as the rest: every item write carries the three forward, and one without them clears them. A phone from before
  them refuses such an item (it shows after its reload).

### Reminders

The relay sends them (the record's object): Web Push with its-bot's VAPID pair, one phone's
subscription serving both ([its/README.md](../its/README.md) "Keys").
- **Opt-in per phone:** `POST /api/push/subscribe` (any key; the guest's phone too), kept in the object's `pushsub`
  table (device state: not an event, not in dumps): at most 5 per person, 30 days unrefreshed dropped (the app
  refreshes weekly), one its push service answers 404 / 410 deleted at once. The routes and replies:
  `app/src/lib/contract/push.ts` (`subs`: who has a live phone, for 「この端末は通知オフ」).
- **When:** the object's alarm is the earliest of the backup's and the next reminder's minute (`fireAt`); every
  accepted `todo` row re-arms it. At fire time the item is read again: gone, done, re-dated or the reminder changed
  (its `fireAt` no longer the one due) → nothing; more than 10 min late (`LATE_MS`: the relay asleep, an op queued
  offline) → skipped (`todo.push` `skip late`). No cancel messages, no quiet hours.
- **Once:** a ledger `id|fireAt|who` (kept 7 days) stops a re-arm sending twice; an edited time is a new key, so it
  fires again at the new time. A push service's 429 / 5xx: tried again 30 s later, doubling, never past 10 min late.
- **The message:** title the item's text, body `{when} · {list}` (「明日 9:30 · 家のこと」), `tag` the item's id,
  `open` the list and item; logged as `todo.push` with counts, the outcome and `ep` (6 hex of the endpoint's SHA-256),
  never the text or the endpoint.

Checked by `relay/test/todo.test.ts`, `app/src/lib/contract/todo.test.ts` and `app/e2e/todo.spec.ts` (its header lists what).
