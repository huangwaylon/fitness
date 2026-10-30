# History and editing: きろく (records) app

> **Decided by the user (2026-10-29):** edit permissions = **own data only**; past weeks = **open weeks only** (locked weeks are view-only).
>
> **2026-10-30 (ADR 0019):** money is ベル in two shared pots; the yen jar, purse, transfers and the score /100 are gone.
> The screens below show ベル where they used to show yen and the score.

UX designer + data architect, 2026-10-29. User: "see all recorded data over time and allow editing as needed." Bound by ADR 0015 (append-only, compute-on-read), ADR 0016 (all visible, no alerts), [design.md](design.md) (no tab bar, NookPhone apps).

## 1. What is recorded and shown

| Scope | Data | Source |
|---|---|---|
| Person × day | steps; active minutes = max(Watch, step-derived, hand-added workouts); workouts (type, minutes, strength ✓/✗); gym visits (dwell, confirmed); 3 eating check-ins | `metrics`, `workouts`, `presence`, `checkin`/`confirm` events |
| Person × day | ベル per fruit | `earnWeek` (`weekBells`) |
| Person × week | ベル (daily + badge bonus), the four badges, strength days | `historyWeeks`, `weekDetail` |
| Week | ベル (both, incl. the bonus once it landed), harvest, locked | `historyWeeks` |
| Money | the two pots, each day's ベル, the weekly bonuses, spends (voided or not) | `bellsLedger` |
| Audit | every edit: who, when, before → after | event rows |

## 2. Where it lives

- **NookPhone app `きろく`** on the official `phone/miles` tile (NH's Nook Miles app is the "what you did" log with stamp cards), first in the grid, phone-frame takeover.
- Shortcuts: **ribbon tap** (today's ベル) and the pots screen's recent moves → the `お金` tab.
- `◀` goes up one level. Two pills on top: `からだ` | `お金`.

## 3. Screens (393×852; 320×568 notes)

**3.1 Week list.** Newest first, all weeks since `firstWeek()`, one cream Nook Miles+ card each: the week's ベル, then per person the villager, their ベル and 7 day stamps (● activity, ★ strength day, ○ none).

```
┌ ◀  きろく ─────────────────────┐
│ ( からだ )  お金                │
│ ┌ 今週 10/27–11/2  6,420ベル ─┐ │
│ │ 🐱 3,310 ● ●★ ○ ● · · ·     │ │
│ │ 🐶 3,110 ●★● ● ○ · · ·      │ │
│ └─────────────────────────────┘ │
│ ┌ 10/20–10/26 14,250ベル 収穫✓┐ │
│ │ 🐱 6,625 ●★●●★●○  🔒        │ │
│ │ 🐶 6,625 ●●★○●●●            │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```
320: 14px stamps; the ベル wrap; `収穫✓` → ✓.

**3.2 Week detail.** Header: the week's ベル and `🔒` or `あと2日 修正できます`. Me left, partner right: their ベル + the four badges (lit = met). A 7-row day table; tap a row → day. Then 内訳: each person's daily ベル + bonus, and the ふたりボーナス.

```
┌ ◀  10/20–10/26   14,250ベル 🔒┐
│ 🐱 6,625ベル      🐶 6,625ベル  │
│ 🍑🥥🍎🍐 (lit)     🍑🥥🍎🍐       │
│ ─────────────────────────────── │
│ 月 8,120 32分 ★ ●●○ │ 6,900 20分 ●○○│
│ 火 12,4k 61分   ●●● │ 7,010 ✎45分 ★ │
│ …                                │
│ 内訳 🐱4,625+2,000 🐶4,625+2,000 ふたり1,000│
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
│ │ たんぱく質 ✓ 甘味 ✓ 野菜 ○  │ │
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

**3.5 お金 (ベル).** The two pots on top (balance each). Then the ledger by week, newest first: the Sunday bonus, the spends (my own → `なかったことに`, asked first; badge `取り消し済み`) and each day's ベル per person with what each fruit earned. A week shows 🔒 once locked. The banner's undo is always `もとに戻す`.

## 4. Editing model

### 4.1 New event types (in the `events` tab; append-only, deduped by `id`)
| type | data | Effect |
|---|---|---|
| `metric_set` | `{date, metric:'steps'\|'exercise_min', value}` | Overrides the day's value, **including lowering it** |
| `workout_edit` | `{id, strength?: boolean\|null, excluded?: boolean}` | Overrides strength counting (any type; `null` = automatic) and/or removes the workout from scoring |
| `workout_add` | `{id:'m:<uuid>', date, type, durationMin}` | A manual workout (Watch forgotten), editable later with `workout_edit`. Its minutes count toward 活動: the day counts **max(Watch, step-derived, sum of hand-added minutes)**, never a sum of sources, ([ADR 0017](../decisions/0017-round-4-rule-changes-and-rule-versions.md)). `type` must be a known workout type (GAS refuses others) |
| `checkin` | existing, plus `edit:true` | `edit:true` widens the 48 h window to any day ≤ today in an unlocked week |
| `confirm` | existing (visits) | Already "latest wins" |
| `spend_void` | `{spendId}` | Takes a ベル spend back (the buyer only) |
| `transfer_undo` | `{month}` | Old yen economy: ignored since ADR 0019, no longer accepted since round 16 (old rows are ignored) |

**Latest edit wins, by server `at`.** Metric as of T: S = latest `metric_set` with `at ≤ T`; none → max of ingest rows (today); else `max(S.value, ingest rows with S.at < at ≤ T)`. A later, higher sync still wins (more walking); a stale re-send can't revive a wrong value (GAS appends only above the sheet max).

### 4.2 Who may edit what (recommendation: **your own data only**)
The subject is the sender (`row.person`); data has **no person field**, so the partner's record is unreachable. Seeing everything ≠ rewriting someone's health record; own-only avoids "who changed my numbers" and every change is still visible. `spend_void`: the spender only.

### 4.3 Lock policy (recommendation: **edits only in unlocked weeks**)
Activity edits count only if `!isLockedAt(weekKeyOf(date), at)`: this week, and last week until Wed 04:00 JST. Locked weeks are 🔒 read-only.
- **Settled is settled.** A week's ベル move with edits (up or down) until its lock, then they are fixed at the lock (rows stamped later never count), so spends made from them stay covered.
- **Simple.** It is the existing check-in lock; the earnings read only rows with `at ≤` the lock once it passed.
- **Abuse-resistant.** ≤ ~9.5 days back, always in the log.

`spend_void` is allowed any time; it never changes a week's earnings.

**Held edits and the lock (round 7 M1/M2).** An edit is held 5 s for もとに戻す, but the server stamps the send time, so the client judges it by when it will be sent: きろく's controls close 65 s before the lock; a hold never runs past lock − 60 s (and a hovered banner holds at most 2 min); within 5 s of the lock an edit is refused at once. A queued edit that would reach the server after its lock (e.g. offline) is not shown, is dropped unsent, and しずえ says so; an acked edit stamped after the lock gets the same message. A later event on the same subject (habit-day, workout, metric, spend) never overtakes a held one, so the server keeps the on-screen order.

### 4.4 Audit trail
The model derives `EditLog { at, by, date, field, before, after }` (`before` = value as of `at − 1`). Refused and no-op edits are not shown. The sheet stays the raw audit.

The task list, work plan and acceptance criteria (shipped in round 7) are in git history.
