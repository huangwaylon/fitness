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
| 編集's 期限 and 通知; the dates in words; the menu's panel | `todo/DueFields.svelte`, `todo/dueLabel.ts`, `todo/DuePanel.svelte` |
| This phone's opt-in; the phone's one subscription (ITS's too); a tap's routing | `todo/push.svelte.ts`, `TodoNotify.svelte`; `lib/push/phone.ts`; `service-worker/notify.ts` |

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
- **Quick chips:** while the add field is focused, 今日 · 明日 · 日付… under it (日付…: a transparent native date input over
  the chip's whole 44px hit, as a direct tap is what opens WebKit's picker). A pick dates the next adds, held while the
  keyboard stays up and named in the placeholder (「今日のやることを追加」); a blur or leaving the list drops it. A tap
  on a chip or 追加 keeps the focus on the field (its mousedown held back; WebKit's blur waits for the tap's click).
- **Row chip:** a dated item's `.tag` at the row's end: 「今日 15:00」 in leaf text, 「明日 9:30」, 「11/24（火）」; past or done
  soft (no red, ×, or 期限切れ); a bell when the reminder names me. A tap opens 編集 at 期限 (no keyboard).
- **編集:** the text, then 期限 (なし · 今日 · 明日 · 日付…, a 時刻 switch: the next full hour today, 23:59 at most,
  else 9:00; 「日本時間」 off Tokyo's offset) and, with a due, 通知: なし by default; 時刻 · 10分前 · 1時間前 · 前日 timed, 当日朝
  · 前日夜 dated. On: the people (me pressed), 「11/23（月）20:00 に通知」 (or that it's past), 「うめ：端末の通知がオフ」 for a
  chosen person with no live phone, and for me on a phone that's off its opt-in in the tap. Timed → dated maps
  `at|b10|b60` → `am`; 期限 なし drops the reminder. Every write carries due / rem / to (`todo.svelte.ts`).
- **「この端末に通知」** (`TodoNotify`) at the lists' foot: the permission asked in the tap, then the subscription
  handed to `/api/push/subscribe`; on only once taken; テスト通知; a line says why not (a Safari tab, refused,
  準備中). Each opening reads `POST /api/push` (presence) and refreshes the subscription weekly. One subscription per
  phone (`lib/push/phone.ts`): 保養所's switch and this one each keep their own pref; the browser lets go only when
  the last one is off.
- **A reminder's tap** (`notify.ts`): an open window told `{k: 'open', to: 'todo', list, item}`, else
  `?open=todo&list=…&item=…` (Hud reads it once); the sheet opens on the list, the item in view and flashed 1 s.

### The panel

`DuePanel.svelte`, mounted by `HudMenu` while the menu is open (its chunk fetched on the leaf's touch-down): left of
the pills, top-aligned with the first, 12 px clear, an always-cream world-kit card, kanji (the menu's copy). 今日 then
明日: undone items due, timed first by time, then the rest in list order; each row its Tick (on the left, away from the
pills), its text (one line, ellipsis), its time. The past undone fold into one soft 「前の日 N件 ›」; what doesn't fit
the pills' height becomes 「ほか N件 ›」 (「明日ほか N件 ›」 when only 明日's are cut): never an inner scroll. A tick
stays struck through until the menu folds (tap again to undo). A text: the menu folds, the sheet opens at the item.
Hidden in edit mode, with やること's pill hidden, and with nothing due today, tomorrow or before.

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

The record's object sends them (`relay/src/pusher.ts`, the pure rules `remind.ts`): Web Push with its-bot's VAPID pair
(`VAPID_PUBLIC` in wrangler.toml, the secret `VAPID_PRIVATE`: one subscription per phone serves both,
[its/README.md](../its/README.md) "Keys"; either missing, push is off).
- **Routes** (`relay/src/pushRoute.ts`; bodies and replies `app/src/lib/contract/push.ts`): `POST /api/push`
  `{endpoint?}` (the state), `/api/push/subscribe` `{endpoint, keys: {p256dh, auth}, lang}`, `/unsubscribe`
  `{endpoint}`, `/test` `{endpoint}` (5 s apart); any of the three keys as `Authorization: Bearer`, CORS for our
  origins; each answers `{ok, push: {vapidPublic, on, subs}}` (`subs`: who has a live phone, `{A, B, G}` booleans, for
  「この端末は通知オフ」) or `{ok: false, error}` with its status.
- **Subscriptions:** the object's `pushsub` table (device state: not an event, never in a dump): an endpoint moves to
  whoever subscribes it, at most 5 a person (a sixth replaces the oldest), 30 days unrefreshed dropped (the app
  refreshes weekly), one its push service answers 404 / 410 deleted at once.
- **When:** the object's one alarm is the earlier of the backup's (archive.ts: due after 03:00, or a retry) and the
  next pending reminder's minute (`fireAt`); every kept `todo` row, a subscription and the alarm itself re-arm it. At
  its minute the item is read again: gone, done, re-dated or its reminder changed → not among the reminders, nothing
  sent (no cancel messages). Up to 10 min late (`LATE_MS`: an op queued offline) it still goes; later it is skipped and
  said once (`todo.push` `skip late`). No quiet hours.
- **Once:** the ledger `push_sent` (`id|fireAt|phone`, kept 7 days) stops a re-arm sending twice; an edited time is a
  new key, so it fires again then. A 429 / 5xx / no answer: again 30 s later, doubling (`push_retry`), never past 10
  min late; a 401 / 403 (the key refused) an error line, not retried.
- **The message:** title the item's text (≤ 80), body `{when} · {list}` (「明日 9:30 · 家のこと」, 「15:00（10分後） · 買い物」),
  `tag` the item's id, `open: {to: 'todo', list, item}`; urgency high, kept an hour for a phone that's off. Logged as
  `todo.push` (op, code, status, who, `ep` = 6 hex of the endpoint's SHA-256), never the text or the endpoint.

Checked by `relay/test/todo.test.ts`, `relay/test/push.test.ts`, `app/src/lib/contract/todo.test.ts`, `todoDue.test.ts` and `app/e2e/todo.spec.ts` (its header lists what).
