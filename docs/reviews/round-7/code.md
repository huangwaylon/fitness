# Round 7: code review (senior engineer)

Scope: `e4eee42..f3e68e5`, read-only, against `docs/design/history-and-editing.md`.

**Checks run:** `npx vitest run` gives **206/206** (17 files, including `gas/bundle.test.ts`, so `Code.js` matches the source). `npm run check` gives **0 errors / 0 warnings** (454 files). `npm run build` is OK. JS is 27 files, **135 KB gz** (r5: 117 KB), and CSS is **37 KB gz** (r5: 34 KB). The golden fixtures changed only in `df8dbcb` (names/privacy, verified then). `b111130` did not touch them.

## What holds

Backend: `validEditData` (`gas/main.ts:280-303`) shape-checks every new type after the 20 KB data cap and before the lock, so it never throws. Person comes only from the key, and dedupe by `id` is tested. Model: the sender is always the subject (`state.ts:342-366`, a test covers a crafted `person`). `spend_void` is limited to the spender. The lock is exact: `editableAt` (`t < finalMs`) matches `isLockedAt`, and `finalMs` is the following Wednesday 04:00 JST. Paid yen never go down: `paidAt = max(prov, final)` reads only rows up to each cutoff, and lowering, top-up and post-lock cases are all tested. Purse and transfer replay are correct. Privacy and alerts are fully removed apart from L3.

## Findings

| ID | Sev | What | Evidence | Fix |
|---|---|---|---|---|
| M1 | Medium | **Held edits near the lock show as accepted, then vanish silently.** The optimistic `at` is the tap time, but the server stamps the send time: 5 s later, up to 10 min while the banner is hovered, or hours later if the edit was queued offline. An edit tapped at Wed 03:59:57, or queued offline on Tuesday night, shows on screen and is then refused at reconcile with no message. | `gas.ts:149` (`queuedAt: now`, `nextAt: now+holdMs`), `view.ts:29`, `week.svelte.ts` `HOLD_MAX_MS`; `DayDetail.svelte:25` uses `d.open` at `now` | Close the edit controls at `lockAt − (UNDO_MS + 60 s)`, and send an edit unheld when it is that close to the lock. After reconcile, if an edit id is in the cache but produced no `EditLog` entry, toast "週が締まったので保存されませんでした". |
| M2 | Medium | **Held events are skipped while later unheld ones are sent, so the server order can differ from the screen order.** Example: a きろく check-in fix (held 5 s), then within 5 s the same habit ticked on the island (sent at once). The server stores island-then-fix, the screen showed fix-then-island, and the tick flips after reconcile. The same can happen between `workout_edit` and `confirm`. | `gas.ts:204` (`find(... !isHeld)`), `view.ts:25-30` assigns `at` in queue order | In `composeModel`, order queued events by `max(queuedAt, nextAt)` to match the send order. Or let a held event block the events queued after it (true FIFO). |
| L1 | Low | The demo generator and きろく ship in the live bundle (part of the +18 KB gz). | `week.svelte.ts:12` static `demoCache`; `ShimaPhone.svelte:12` static `Kiroku` | `await import('./demoRows.ts')` only in demo mode, and lazy-load `Kiroku` when the tile is opened. |
| L2 | Low | The demo calendar is a module global, and a demo-only `person` field is honoured on the live compose path. Today neither leaks (demo mode is sticky per tab, and live never sets the global), but the coupling is easy to break. | `state.ts:30-41`, `view.ts:31`, `gas.ts:134` | Call `setDemoCalendar(null)` in `init()` when not in demo mode. Ignore `ev.person` unless `cache` is a demo cache, or pass the calendar explicitly. |
| L3 | Low | `share` is still accepted by GAS (a dead event type: the rows are stored but never read). | `sheet-api.ts:24` | Remove it from `EVENT_TYPES` (the reducer already ignores old rows) and rebuild `Code.js`. |
| L4 | Low | The minutes-source logic is duplicated with different null handling. `'edit'` is guessed by value equality, so a sync with the same value reads as an edit. | `history.ts:190` vs `history.ts:288` | Use one `minutesSource(s,p,date,t)` helper that compares `set.at` with the newest ingest row's `at`. |
| L5 | Low | `editLog` is recomputed many times. Each `weekDetail` calls it twice (`editedDates`), `Kiroku` calls `dayDetail` three times per render, and every workout edit runs `activityAsOf` twice (which re-derives visits). All of this re-runs on the 60 s clock tick. | `history.ts:161-163, 305-340`; `Kiroku.svelte:125,130,136` | Memoise `editLog` per `State` (WeakMap). Use one `{@const}` per day in `Kiroku`. |
| L6 | Low | Some state is redundant. `workoutEdits` duplicates `workoutStrength` + `workoutExcluded`. `isLockedAt` is redundant next to `editableAt`. `provisionalMs` is re-exported but unused. | `state.ts:110-113, 263`; `history.ts:54, 405` | Derive the two maps from `workoutEdits`, drop the redundant checks and delete the re-export. |
| L7 | Low | GAS `workout_add` accepts any 60-char type, but the model accepts only `WORKOUT_TYPES`, so a bad type is stored and then dropped without any error. | `main.ts:292`, `state.ts:337` | Check `WORKOUT_TYPES` in GAS too (it is in the shared bundle). |
| L8 | Low | A `metric_set` logs even when before = after, which is inconsistent with check-ins. For example, re-setting the value a previous edit already gave appears in へんこう履歴. | `history.ts:310` vs `315` | Push only when `before !== after`. |
| L9 | Low | Boundary tests are missing: an edit at exactly `finalMs` (must be refused) and at `finalMs − 1`; an edit at 00:00 JST Monday for Sunday and for Monday; a held edit that crosses the lock (client). | `history.test.ts` uses only mid-week, MON_AFTER and THU_AFTER | Add 3–4 cases. |

## Acceptance criteria (§7)

1. **Met in code** (`historyWeeks`, 9 demo weeks tested). The 320×568 no-scroll check was not run in a browser; that belongs to the UX review.
2. **Met**: `dayDetail` returns both people.
3. **Met**: recompute plus hold/undo, with the M1/M2 edge cases.
4. **Met**: model rules plus tests.
5. **Met**: derived from rows (L8 is cosmetic).
6. **Met**: tested.
7. **Met**: 206/206, and the editing commit did not touch the goldens.

## Sign-off

**Approved with fixes.** There are no blocking or high findings. The rule engine is sound: own data is enforced in the model, the lock boundary is exact and the payout cannot be clawed back. Fix M1 (honest lock UX and refused-edit feedback) before Phase 0 use. M2 and L1–L9 can follow in the next pass.
