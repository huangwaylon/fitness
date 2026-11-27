# やること (the to-do list)

One shared to-do list, from the leaf menu's やること and the HUD's disc ([design](design.md#island)): one-line items,
each with an optional note, due date and reminder. Everyone edits everything, the guest too, live, queued offline
([decisions](decisions.md#no-notifications)).

## Files
| Part | Where |
|---|---|
| Op, checks, merge, cap; due rules and the disc's count | `app/src/lib/contract/todo.ts`, `contract/todoDue.ts` |
| The record's side | `relay/src/store.ts`; reminders `relay/src/pusher.ts`, `remind.ts`, `pushRoute.ts` |
| Sheet, disc, peek, store, strings | `app/src/lib/components/todo/`, `app/src/lib/i18n/todo.*` |
| Push opt-in, one subscription a phone, a tap's routing | `todo/push.svelte.ts`, `TodoNotify.svelte`, `lib/push/phone.ts`, `service-worker/notify.ts` |

## The sheet
`TodoSheet.svelte`: a shared Tick per item; tapping the text opens 編集 · 上へ · 下へ · 削除 (buttons, not drag; 削除 with
取り消す). A note's first 3 lines show under it. While adding, 今日 · 明日 · 日付… date the next adds; 編集
(`DueFields.svelte`) sets text, メモ, 期限 and 通知. Today in leaf text, overdue in coral. 「完了した項目を削除」 (one
取り消す). 「この端末に通知」 subscribes this phone (one subscription also serves 保養所). `todoSheet.show({item})` flashes an
item (`?open=todo&item=…`).

## The disc and the peek
`TodoDisc.svelte` in the HUD row (first load, counted from the model's rows): a 44 px disc with a badge of undone items
due today or before (yuzu; coral if overdue); nothing due, nothing drawn. The badge pops once on a change, never loops.
A tap opens `TodoPeek.svelte` (own chunk): 前の日 / 今日 / 明日 rows with Ticks (sent after the 4 s undo snackbar), ≤ 6
rows then 「ほか N件」, 「やることを開く ›」; a second tap, a tap elsewhere, Esc or a sheet shuts it.

## The data
`todo` events ([backend](backend.md#events)), each the item's whole state `{id, at, text, note?, ord, done, due?, rem?,
to?}`; a removal `{id, at, rm: true}` is final. Text ≤ 200 chars, note ≤ 2000. Merge (`TodoBook`): later `at`, then
G > B > A; removal wins. ≤ 500 items standing (`todo full`); not `calm`. An older build's list op (`todoLegacy`) is
acknowledged and dropped.

### The move from lists
The old lists were folded once by `todo-migrate` (`relay/scripts/record.ts`, `relay/src/todoMigrate.ts`; `dry` counts,
reruns change nothing): a list became one item, its items the note. A `load` of an older dump needs it run again.

## Due dates and reminders
`contract/todoDue.ts`, alike for the record, the alarm and the sheet: `due` `YYYY-MM-DD[THH:MM]` Tokyo time; `rem`
timed `at` · `b10` · `b60` · `eve` (20:00 the day before), date-only `am` (08:00) · `eve`, never on by default; `to` 1–3
of A / B / G, required with `rem` (else `todo bad`).

### Reminders
Web Push from the record's object with its-bot's VAPID pair (`VAPID_PUBLIC`, secret `VAPID_PRIVATE`;
[its/README.md](../its/README.md) "Keys"; either missing, push is off).
- **Routes** (`contract/push.ts`): `POST /api/push`, `/subscribe`, `/unsubscribe`, `/test`; any key as Bearer.
- **Subscriptions:** table `pushsub` (never dumped), 5 a person, dropped after 30 days or on 404 / 410.
- **When:** the object's one alarm is the earliest of the 03:00 backup and the next reminder; the item is re-read at
  its minute; up to 10 min late (`LATE_MS`) it still goes. `push_sent` (7 days) stops repeats; failures retry doubling.
- **Message:** title the item's text, tag its id; log `todo.push` without text or endpoint.

Tests: `relay/test/todo.test.ts`, `relay/test/push.test.ts`, `contract/todo.test.ts`, `todoDue.test.ts`,
`app/e2e/todo.spec.ts`, `app/e2e/todo-due.spec.ts`.
