# やること (the to-do list)

One shared to-do list, from the leaf menu's やること pill and the HUD's disc ([design](design.md#island)): one-line
items, each with an optional note, due date and reminder, done or not. Everyone edits everything, the guest too, live on
every phone, queued offline.

## Files

| Part | Where |
|---|---|
| Op, checks, merge, cap, fold | `app/src/lib/contract/todo.ts`, due/reminder rules and the disc's count `contract/todoDue.ts` |
| The record's side | `relay/src/store.ts` (via the contract); reminders `relay/src/pusher.ts`, `remind.ts`, `pushRoute.ts`; the move `relay/src/todoMigrate.ts` |
| Sheet, disc, peek, store, strings | `app/src/lib/components/todo/`, `app/src/lib/i18n/todo.*` |
| Push opt-in; one subscription a phone; a tap's routing | `todo/push.svelte.ts`, `TodoNotify.svelte`; `lib/push/phone.ts`; `service-worker/notify.ts` |

## The sheet

`TodoSheet.svelte`: the items in order. An item's Tick is shared (one done state); tapping its text opens 編集 · 上へ ·
下へ · 削除 (reorder by buttons, not drag, so it never fights the sheet's scroll; 削除 with 取り消す). A note shows its first
3 lines, soft, under the text. While the add field is focused, 今日 · 明日 · 日付… chips date the next adds. 編集
(`DueFields.svelte`) sets the text, メモ, 期限 and, with one, 通知 (whom, when). A row's date: today in leaf text, overdue
in coral text. 「完了した項目を削除」 takes the done ones (one 取り消す). 「この端末に通知」 (`TodoNotify`) subscribes this phone;
one subscription per phone serves 保養所 too, released only when both prefs are off. `todoSheet.show({item})` (the peek,
a reminder's tap: `?open=todo&item=…`) flashes the item.

## The disc and the peek

`TodoDisc.svelte`, left of the dumbbell in the HUD row (in the first load; its count folded from the model's rows, not
through the sheet's store): a 44 px cream disc with the checklist icon and a badge, the undone items due today or before
(yuzu; coral with anything overdue). Nothing due today or before: nothing drawn (tomorrow's alone never lights it). The
badge pops once when its number changes, never loops; nothing per frame. The disc has no text but the number (VoiceOver:
`island.todoDue`, kana: the HUD zone).

A tap opens `TodoPeek.svelte` (its own chunk, fetched once something is due) under it, the disc yuzu: 前の日 (dates in
coral text) / 今日 / 明日 rows in kanji, each with its Tick (sent after the undo snackbar's 4 s; 取り消す or a second tap
takes it back; the row stays struck through until the peek shuts), its text (opens the sheet at the item) and its time;
at most 6 rows, then 「ほか N件」; 「やることを開く ›」. A second tap, a tap elsewhere (not the snackbar), Esc or a sheet
shuts it.

## The data

`todo` events ([backend.md#events](backend.md#events)), each the item's whole state: `{id, at, text, note?, ord, done,
due?, rem?, to?}`, a removal `{id, at, rm: true}` (final). Texts ≤ 200 chars (one clean line), notes ≤ 2000 (lines kept,
`cleanNote`).

- Merge (`TodoBook`): per id the later `at`, then G over B over A; a removal beats everything.
- The record makes a row only on creation; **at most 500** items standing (`todo full`). Not `calm`: changes are
  fetched at once.
- An older build's list op (`{title}` or `{list}`, `todoLegacy`) is acknowledged and dropped; phones never read one.

### The move from lists

The old lists (`{id, at, title, ord}` and items `{…, list}`) were folded once by `todo-migrate` (`relay/scripts/record.ts`,
admin op `todo_migrate` over `relay/src/todoMigrate.ts`; `dry` counts only, a second run changes nothing): each list
became one item under the list's id, its items the note (open first, done as 「✓ 」 lines), carrying the earliest open
due and its reminder. A `load` of an older dump keeps its lists: run it again after.

## Due dates and reminders

`contract/todoDue.ts`, read alike by the record, the alarm and the sheet:
- `due`: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM`, Tokyo wall clock, years 2024-2099.
- `rem`: timed due `at` · `b10` · `b60` · `eve` (20:00 the day before); date-only `am` (08:00) · `eve`. Never on by
  default.
- `to`: 1-3 of A / B / G, required with `rem`. Refused (`todo bad`): `rem` without `due`, `to` without `rem`, a `rem`
  that doesn't fit. Every item write carries all three forward.

### Reminders

Web Push from the record's object with its-bot's VAPID pair (`VAPID_PUBLIC` in wrangler.toml, secret `VAPID_PRIVATE`;
[its/README.md](../its/README.md) "Keys"; either missing, push is off).
- **Routes** (bodies `app/src/lib/contract/push.ts`): `POST /api/push` (state), `/api/push/subscribe`, `/unsubscribe`,
  `/test` (5 s apart); any key as Bearer.
- **Subscriptions:** table `pushsub` (device state, never in a dump): 5 a person, dropped after 30 days unrefreshed
  or on a 404 / 410.
- **When:** the object's one alarm is the earliest of the 03:00 backup and the next reminder; at its minute the item is
  re-read (gone, done or changed: nothing sent). Up to 10 min late (`LATE_MS`) it still goes, else `skip late`.
- **Once:** `push_sent` (kept 7 days) stops repeats; failures retry from 30 s, doubling (`push_retry`), within
  `LATE_MS`.
- **Message:** title the item's text, body `{when}`, tag the item's id, `open {to: 'todo', item}`. Log `todo.push`,
  never the text or endpoint.

Tests: `relay/test/todo.test.ts` (with the move), `relay/test/push.test.ts`, `app/src/lib/contract/todo.test.ts`,
`todoDue.test.ts`, `components/todo/*.test.ts`, `app/e2e/todo.spec.ts`, `app/e2e/todo-due.spec.ts` (the disc and peek).
