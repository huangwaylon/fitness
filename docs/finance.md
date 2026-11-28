# The shared money

The couple's shared expenses (ported from the old shared-expense app): entries, recurring templates and one config,
members only. The contract is `app/src/lib/contract/finance.ts` (types, bounds, the split and the balance); the
client's model `app/src/lib/finance/`. This page is the relay's half: `relay/src/finance.ts`, with
[backend](backend.md) for the record in general.

## The record
Three event types, each a slot per id (the latest op to arrive kept, as any slot):

| type | data | slot |
|---|---|---|
| `fin_e` | an entry: `{id, k: 'x'·'s', d, amt, payer, ps, desc, cat, del?, imp?}` (`ps` basis points, `amt` integer yen) | `fin_e\|<id>` |
| `fin_t` | a recurring template: `{id, desc, cat, payer, amt\|null, ps\|null, months, day, from, to\|null, del?}` | `fin_t\|<id>` |
| `fin_c` | the config: `{id: 'cfg', cats, split: {A, B}, notes}` | `fin_c\|cfg` |

- **Soft delete:** `del` (ms) set by an edit, cleared by the next; never the record's removal, so
  `contract/tomb.ts` neither prunes a `fin_*` row nor drops a late op on one (the rows are kept for good).
- **`imp`:** the import's mark, set only by `fin_import`. A phone's op carrying it is `bad_request`; a phone's edit of
  an imported entry keeps it (the relay carries it over from the stored row).
- Texts are cleaned (`finClean`) and checked (`finEntryOf`, `finTemplateOf`, `finConfigOf`) as any op is.

## Members only
The guest (`KEY_C`) never reads, writes or hears of the money, at two layers:
1. **The gate** (`relay/src/storeRoute.ts finGate`): a body with the guest's key that names a `fin_*` type, the
   money's snapshot, `finlog` or `paircode` is refused `forbidden` (`detail: 'members only'`) in the Worker, before the
   record parses it. JSON escapes are matched too.
2. **The record** (`contract/guest.ts`): `membersOnly` (every type named `fin_*`) makes `guestMayWrite` false and
   `rowsFor` drop the rows from the guest's snapshots and deltas; a write of the money alone tells the room
   `guest: false`, so the guest's socket gets no `changed`; no share kind reads them.

`contract/guest.test.ts` enumerates every `fin_*` type of `EVENT_TYPES`, so a type added later is covered.

## fin_log
Append-only: `(seq, at, who, type, id, before, after)`, a row per op kept (`who` the sender, `imp` for the import;
`before` the slot's data before, null for its first op), written in the op's transaction. Never pruned; in the
nightly encrypted dump and `record.ts dump` / `load` (by `seq`, idempotent). Its own index `fin_log_id`; none on
`events`.

## API
On `/api` (members; the guest `forbidden`):

| `action` | Request | Reply |
|---|---|---|
| `event` / `events` | `fin_e` · `fin_t` · `fin_c` ops | as any op |
| `snapshot` | `kinds: 'fin'`, with `since?`, `page?`, `after?` as the whole one | `{ok, me, now, rev, rows: {metrics: [], events}, next?}`: the money's rows only, no wallets or ledgers |
| `finlog` | `id?`, `type?`, `after?` (a `seq`), `desc?`, `limit?` (≤ 500, 100) | `{ok, rows: [[seq, at, who, type, id, before, after]], next?}` |
| `paircode` | | `{ok, code: 'ABCD-EFGH', exp}` |
| `pairredeem` | `code` (no key) | `{ok, me, key}`, or `forbidden` `code` (wrong, used or expired), `busy` |

A full money snapshot reads by `events_type_person`, a poll since a time by `events_at`.

## Pairing
A member mints a code (8 letters of 32: no 0 O 1 I), valid 5 minutes, once, bound to them; at most 3 live a member.
Stored only as a SHA-256 keyed with the members' keys (`fin_pair`, never dumped). A new device redeems it without a key
for that member's key; redeems are 10 a minute in all (in memory). Refusals log `fin.pair`.

## The nightly check
`fincheck`, a job of the 03:00 run (`relay/src/nightly.ts`): the live entries' count and the all-time balance
(`finNet`) from the slots, against fin_log's replay (each entry's last `after`). A drift logs `fin.check` as an
error and sets `/health/log`'s `finDrift`, which opens the `alert` issue (health.yml). By hand: `record.ts fincheck`
(its reply carries the balance; the terminal's only).

## Import
`node scripts/record.ts fin-import [dry] <file.json>` (from `relay/`, the admin's keys): the file is a JSON array of
`{type, data}`, `type` a `fin_*` type and `data` its contract payload (no `imp`: the relay adds it to entries).
```json
[{"type": "fin_c", "data": {"id": "cfg", "cats": ["Groceries"], "split": {"A": 8000, "B": 5000}, "notes": []}},
 {"type": "fin_e", "data": {"id": "…", "k": "x", "d": "2026-11-01", "amt": 1200, "payer": "A", "ps": 8000, "desc": "", "cat": "Groceries"}}]
```
- Checked locally first: one row the contract refuses and nothing is sent.
- Sent 200 rows a signed `fin_import` (an optional op: shed by the budget guards, never in `ESSENTIAL_OPS`), each
  chunk refused `budget` past 50 % of the day's rows written: run it early in the UTC day (~10 rows written a row).
- Idempotent by id (event id `fin-imp-<slot>`): a re-run is all duplicates, and a slot a phone has written is never
  written over.
- Prints counts and the file's balance per person on the terminal; the log keeps counts only (`fin.import`).
- The data file is never committed (the repo is public), nor its figures in a commit message.

## Budget
Steady use is ~30 rows written a day. An import of 3,000 rows writes ~30k of the account's 100k. `finlog` reads a
page; the nightly check reads the money's rows twice.
