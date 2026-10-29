# History and editing: きろく (records) app

UX designer + data architect, 2026-10-29. User: "see all recorded data over time and allow editing as needed." Bound by ADR 0015 (append-only, compute-on-read), ADR 0016 (all visible, no alerts), v5 (no tab bar, NookPhone apps).

## 1. What is recorded and shown

| Scope | Data | Source |
|---|---|---|
| Person × day | steps; exercise minutes (Watch, or step-derived when larger); workouts (type, minutes, strength ✓/✗); gym visits (dwell, confirmed); 3 eating check-ins | `metrics`, `workouts`, `presence`, `checkin`/`confirm` events |
| Person × week | score, 4 fruits (actual/target), strength days, rest days | `scoreWeek` |
| Week | yen per layer (A, B, team, purses), harvest, locked | `settledWeeks`, `paidAt` |
| Money | jar over time, spends (done/waiting/refused/voided), transfers ✓ | `replayPurse` |
| Audit | every edit: who, when, before → after | event rows |

## 2. Where it lives

- **NookPhone app `きろく`** on the official `phone/miles` tile (NH's Nook Miles app is the "what you did" log with stamp cards), first in the grid, phone-frame takeover.
- Shortcuts: **ribbon tap** → this week's detail; **jar total** → the `お金` tab.
- `◀` goes up one level. Two pills on top: `からだ` | `お金`.

## 3. Screens (393×852; 320×568 notes)

**3.1 Week list.** Newest first, all weeks since `firstWeek()`, one cream Nook Miles+ card each: per person the villager, score and 7 day stamps (● activity, ★ strength day, ○ none).

```
┌ ◀  きろく ─────────────────────┐
│ ( からだ )  お金                │
│ ┌ 今週 10/27–11/2   ≈¥5,860 ─┐ │
│ │ 🐱 43  ● ●★ ○ ● · · ·       │ │
│ │ 🐶 51  ●★● ● ○ · · ·        │ │
│ └─────────────────────────────┘ │
│ ┌ 10/20–10/26  ¥7,240  収穫✓ ─┐ │
│ │ 🐱 78  ●★●●★●○  🔒          │ │
│ │ 🐶 64  ●●★○●●●              │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```
320: 14px stamps; yen wraps; `収穫✓` → ✓.

**3.2 Week detail.** Header: yen (or `≈`) and `🔒` or `あと2日 修正できます`. Me left, partner right: score + 4 flat fruit bars (actual/target). A 7-row day table; tap a row → day.

```
┌ ◀  10/20–10/26        ¥7,240 🔒┐
│   🐱 78            🐶 64        │
│ 🍑 ███████░ 120/135  ██████ 80/85│
│ 🥥 ██████   2/2      ███░  1/2  │
│ 🍎 ██████░  4/4      ████  3/4  │
│ 🍐 ████░   11/15     ██████15/15│
│ ─────────────────────────────── │
│ 月 8,120 32分 ★ ●●○ │ 6,900 20分 ●○○│
│ 火 12,4k 61分   ●●● │ 7,010 ✎45分 ★ │
│ …                                │
│ 内訳: 🐱¥2,610 🐶¥2,130 みんな¥1,500│
└─────────────────────────────────┘
```
320: table keeps steps, minutes, ★; check-ins move to the day. ✎ marks edited values.

**3.3 Day detail.** Two stacked cards (both sizes). ✎ only on mine, only while unlocked. `へんこう履歴` (change log) at the bottom.

```
┌ ◀  10/21(火)          あと2日 ✎ ┐
│ ┌ 🐱 あなた ─────────────────┐ │
│ │ 歩数   12,410        ✎      │ │
│ │ 運動   61分 (Watch)  ✎      │ │
│ │ ヨガ 18:02 40分 筋トレ✓  ✎  │ │
│ │ ジム 19:10 55分 ✓           │ │
│ │ 定食ランチ ✓ 減塩 ✓ 野菜 ○  │ │
│ │ ＋ ワークアウトを追加        │ │
│ └─────────────────────────────┘ │
│ ┌ 🐶 パートナー (read-only) ──┐ │
│ │ 歩数 7,010   運動 45分 ✎済   │ │
│ └─────────────────────────────┘ │
│ へんこう履歴                     │
│ 10/22 21:04 🐶 運動 30→45分      │
└─────────────────────────────────┘
```

**3.4 Edit.** Numbers: the Nook Stop ATM bell keypad (old value grey, new in Fredoka 44) + `▶ けってい / やめる` choice list. Workouts: choice list only (`筋トレに数える / 数えない / 記録から外す / やめる`). Optimistic; the undo banner sends a reverse edit.

```
┌─────────────────────────────┐
│  歩数  10/21     (12,410)   │
│          9,800              │
│  [1][2][3]                  │
│  [4][5][6]     ▶ けってい   │
│  [7][8][9]       やめる     │
│  [⌫][0][C]                  │
└─────────────────────────────┘
```

**3.5 お金.** A jar-total step line on top (no axes, rung labels only). Then months: weekly yen lines, `振替 ¥28,900 ✓/未` (tap → `取り消す`), spends with status (my own → `取り消す`).

## 4. Editing model

### 4.1 New event types (in the `events` tab; append-only, deduped by `id`)
| type | data | Effect |
|---|---|---|
| `metric_set` | `{date, metric:'steps'\|'exercise_min', value}` | Overrides the day's value, **including lowering it** |
| `workout_edit` | `{id, strength?: boolean\|null, excluded?: boolean}` | Overrides strength counting (any type; `null` = automatic) and/or removes the workout from scoring |
| `workout_add` | `{id:'m:<uuid>', date, type, durationMin}` | A manual workout (Watch forgotten), editable later with `workout_edit` |
| `checkin` | existing, plus `edit:true` | `edit:true` widens the 48 h window to any day ≤ today in an unlocked week |
| `confirm` | existing (visits) | Already "latest wins" |
| `spend_void` | `{spendId}` | Voids a spend (a waiting one is cancelled) |
| `transfer_undo` | `{month}` | Un-ticks a transfer ✓ |

**Latest edit wins, by server `at`.** Metric as of T: S = latest `metric_set` with `at ≤ T`; none → max of ingest rows (today); else `max(S.value, ingest rows with S.at < at ≤ T)`. A later, higher sync still wins (more walking); a stale re-send can't revive a wrong value (GAS appends only above the sheet max).

### 4.2 Who may edit what (recommendation: **your own data only**)
The subject is the sender (`row.person`); data has **no person field**, so the partner's record is unreachable. Seeing everything ≠ rewriting someone's health record; own-only avoids "who changed my numbers" and every change is still visible. `transfer_undo`: either person (shared); `spend_void`: the spender only.

### 4.3 Settlement policy (recommendation: **edits only in unlocked weeks**)
Activity edits count only if `!isLockedAt(weekKeyOf(date), at)`: this week, and last week until Wed 04:00 JST. Locked weeks are 🔒 read-only.
- **Fair to moved money.** Paid yen feed the bank transfer and purse. Full recompute (clawbacks) could turn past spends into overdraws and break done transfers; `max(paid, recomputed)` is one-way (only up) and late top-ups have no transfer month to land in.
- **Simple.** It is the existing check-in lock. `payoutAsOf` already reads only rows with `at ≤ finalMs`, so a pre-lock edit becomes the Wednesday top-up for free (a lowering edit leaves the Sunday payout, as today). Golden fixtures stay valid.
- **Abuse-resistant.** ≤ ~9.5 days back, always in the log.

`spend_void`/`transfer_undo` are allowed any time; they never change a week's pay.

### 4.4 Audit trail
The model derives `EditLog { at, by, date, field, before, after }` (`before` = value as of `at − 1`). Refused edits are not shown. The sheet stays the raw audit.

## 5. Backend and model task list

**`app/src/lib/ingest/sheet-api.ts`:** add `metric_set`, `workout_edit`, `workout_add`, `spend_void`, `transfer_undo` to `EVENT_TYPES`.

**`app/gas/main.ts`:** no new action; the model stays the rule engine. Add `bad_request` for `metric_set` with a non-integer/out-of-range value (steps 0–100,000; minutes 0–1,440). Tests: each new type appends with `at`; unknown type `bad_request`; bad `metric_set` refused; duplicate `id` ignored.

**`model/state.ts` (`reduce`):** add `metricSets`, `workoutEdits`, `manualWorkouts`, `spendVoids`, `transferUndos`; enforce lock + owner (4.2–4.3), bounds (`workout_add` 1–600 min, date ≤ today, known type) and the `checkin edit:true` window.

**`model/week.ts`:** `metricAsOf` per 4.1; `workoutsAsOf` merges manual, drops excluded, passes `strengthOverride`; `replayPurse` applies a void at its `at` (refund or cancel; refusals stay); `transfer.done` = latest of transfer/undo.

**`scoring/score.ts` + `types.ts`:** `Workout.strengthOverride?: boolean|null`, honoured first by `isStrengthWorkout`.

**New `model/history.ts`:** `historyWeeks(state, now)` (score, stamps, paid, locked, harvested); `weekDetail`, `dayDetail` (values with `source: 'watch'|'steps'|'edit'`, workouts, visits, ticks, `edits`); `moneyLog`. Lazy per opened week. Remove `share`/`visibility` remnants (ADR 0016).

**Tests (`model/history.test.ts`):** lowering lowers the live score; later higher sync beats a `metric_set`, lower doesn't; post-lock edit ignored, yen unchanged; pre-lock edit tops up; lowering keeps `paidAt` = Sunday value; partner can't touch my data; `strength:false` on Pilates drops the day; `excluded` drops minutes; `workout_add` counts; `spend_void` refunds/cancels, refusals stay; `transfer_undo`→`transfer` = done; `EditLog` before/after; `golden.test.ts` unchanged.

**`client/actions.ts`:** `setMetric`, `editWorkout`, `addWorkout`, `voidSpend`, `undoTransfer` (queued, optimistic, undoable).

## 6. Work plan

| Order | Owner | Files |
|---|---|---|
| 1 | Data builder (Builder A after the scene pass) | `sheet-api.ts`, `gas/main.ts` (+tests), `model/state.ts`, `model/week.ts`, new `model/history.ts` (+tests), `scoring/score.ts`, `types.ts`, `client/actions.ts` |
| 2 | Builder B (chrome) | new `components/history/{HistoryApp,WeekList,WeekDetail,DayDetail,MoneyLog,NumberPad}.svelte`, the `ShimaPhone` tile, the ribbon tap in `Hud.svelte`, the jar total link, `i18n/*` (`history.*`) |
| 3 | Art director | confirm the `phone/miles` tile; the stamp and ★ glyphs in the official style |

B starts on fixtures while step 1 lands.

## 7. Acceptance criteria
1. Every week since the first paid week is reachable from the NookPhone with both people's scores, stamps, yen; no horizontal scroll at 320×568.
2. Week → day shows steps, minutes (source), workouts, visits, check-ins for both.
3. In an unlocked week I can raise/lower my metrics, (un)count, exclude or add workouts, fix any day's check-in; ribbon and `≈¥` update at once; undo works.
4. Locked weeks: 🔒, no controls; crafted edits to locked weeks or the partner's data change nothing.
5. Every accepted edit shows in へんこう履歴 (who, when, before → after) on both phones.
6. Voiding a spend restores the purse; undoing a transfer un-ticks it; past weekly yen never change.
7. Golden + existing + §5 tests pass.
