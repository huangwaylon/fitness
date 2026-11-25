# やること (to-do lists)

Shared to-do lists from the leaf menu's やること pill ([design](design.md#island) "Menu"): lists of one-line items, done
or not. Everyone edits everything, the guest too, live on every phone, queued offline.

## Files

| Part | Where |
|---|---|
| Op, checks, merge, cap, fold | `app/src/lib/contract/todo.ts`, due/reminder rules `contract/todoDue.ts` |
| The record's side | `relay/src/store.ts` (via the contract); reminders `relay/src/pusher.ts`, `remind.ts`, `pushRoute.ts` |
| Sheet, store, strings | `app/src/lib/components/todo/`, `app/src/lib/i18n/todo.*` |
| Push opt-in; one subscription a phone; a tap's routing | `todo/push.svelte.ts`, `TodoNotify.svelte`; `lib/push/phone.ts`; `service-worker/notify.ts` |

## The sheet

`TodoSheet.svelte`: the lists → a list (‹, ⋯ rename / delete with 取り消す). An item's Tick is shared (one done state);
tapping its text opens 編集 · 上へ · 下へ · 削除 (reorder by buttons, not drag, so it never fights the sheet's scroll).
While the add field is focused, 今日 · 明日 · 日付… chips date the next adds. 編集 (`DueFields.svelte`) sets 期限 and,
with one, 通知 (whom, when). 「この端末に通知」 (`TodoNotify`) subscribes this phone; one subscription per phone serves
保養所 too, released only when both prefs are off. A reminder's tap opens the sheet at the item
(`?open=todo&list=…&item=…`). A reopening within 10 min of the close shows the list it closed on (kept in localStorage, so a PWA relaunch
remembers too), a later one the lists. An empty list shows no 「0 / 0」.

### The panel

No longer in the menu (the grid: [design](design.md#island)); what is due shows on the HUD's todo disc.
`dueLabel.ts` `duePanelOf` keeps the rows' rules.

## The data

`todo` events ([backend.md#events](backend.md#events)), each the thing's whole state: a list `{id, at, title, ord}`, an
item `{id, at, list, text, ord, done, due?, rem?, to?}`, a removal `{id, at, rm: true}` (final). Titles ≤ 40, texts ≤ 200 chars.

- Merge (`TodoBook`): per id the later `at`, then G over B over A; a removal beats everything.
- The record makes a row only on creation; an item's list never changes (`todo moved`); a list's removal deletes its
  items; **at most 500** lists and items standing (`todo full`). Not `calm`: changes are fetched at once.

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
- **Message:** title the item's text, body `{when} · {list}`, tag the item's id. Log `todo.push`, never the text or
  endpoint.

Tests: `relay/test/todo.test.ts`, `relay/test/push.test.ts`, `app/src/lib/contract/todo.test.ts`, `todoDue.test.ts`,
`app/e2e/todo.spec.ts`, `app/e2e/todo-due.spec.ts`.
