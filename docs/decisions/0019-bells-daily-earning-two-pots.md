# 0019 — Play money (ベル), earned daily, in two shared pots
**Status:** Accepted (user decision 2026-10-30). Supersedes the money and scoring parts of [0003](0003-economy.md),
[0006](0006-yen-single-currency-and-accountability.md), [0008](0008-open-ended-savings-per-fruit-rate.md),
[0011](0011-mvp-rule-defaults.md) and [0017](0017-round-4-rule-changes-and-rule-versions.md) (§2–4, calibration).
Keeps the four fruits as the four activities, rule versioning by week (0017 §7), the Wednesday 04:00 lock and きろく
editing. Values: `app/src/lib/config/rules.ts`.

**Context.** Several things made the game hard to follow and slow to reward:
- Money was in four places: the jar layers A/B/team, the Treat Purse and a monthly real-yen transfer.
- Money only moved on Sunday, and the goals differed per person.
- Real yen made treat prices awkward.

The user wants:
- the same goals for both people;
- play money with prices they choose;
- one place for treats and one for trips;
- trip *types*, not destinations;
- money that visibly changes every day.

## Decision
1. **Currency: ベル (Bells), play money.** It isn't tied to real yen: no transfers, no payday, no ¥ anywhere. The art
   is `money/bells`. Amounts are integers; the format is `1,234 ベル` / `1,234 Bells`.
2. **Same daily goals for both people:** **45 active minutes** and **8,000 steps** a day. A day's minutes are
   max(Watch exercise minutes, (steps − 8,000) / 100, manual きろく workouts), as in 0017 §1, never a sum. Strength and
   eating-habit rules are unchanged: strength types and confirmed gym visits (max 2/week); 3 habits each, max 3 ticks a day.
3. **Earned per day, as it happens** (per person, per day; recomputed from the rows on read, so they update whenever
   data arrives):

   | Fruit | Earns | Max/day |
   |---|---|---|
   | 🍑 Active minutes | 5 ベル per counted minute, up to 45 min | 225 |
   | 🍎 Steps | 200 ベル when the day reaches 8,000 steps | 200 |
   | 🥥 Strength | 300 ベル on a strength day (max 1/day) | 300 |
   | 🍐 Eating | 100 ベル per habit tick (max 3/day) | 300 |

   That's **1,025 ベル max per person per day**. Rainy season (tsuyu): 30 or more active minutes also earns the step
   reward. 正月 pear-off days earn no 🍐.
4. **Weekly bonus at the Sunday harvest** (per person; the harvest opens Sunday 19:30, as before):
   - **+500 ベル for each weekly badge met:**
     - 🍑 45 or more minutes on at least 5 days
     - 🍎 8,000 or more steps on at least 4 days
     - 🥥 at least 2 strength days
     - 🍐 at least 15 ticks
   - **ふたりボーナス:** +1,000 when both people meet all four badges.
   - The harvest shows the week's recap and the bonus landing in the pots. Tapping 「受け取る」 is a ceremony only: the
     bonus counts either way.
5. **Two shared pots, owned by both people:**
   - Every earning, daily and weekly, splits **30% → おやつ (treats)** and **70% → 旅 (trips)**.
     - Computed on totals: treats = floor(total earned × 0.3); trips = total earned − treats.
     - Each pot's balance is its share minus what was spent from it.
   - **おやつ menu:** shared and editable (add, rename, reprice, remove). Defaults:
     - おやつ 300
     - アイス 500
     - カフェデート 1,500
     - 外ごはん 5,000

     Either person can "buy" an item; the balance can't go negative, and the buyer can undo it (`spend_void`).
     There's no partner approval step.
   - **旅 trip types:** shared and editable. Defaults:
     - 日帰り (day trip) 20,000
     - 温泉 (onsen) 50,000
     - 週末旅行 (weekend trip) 100,000
     - 海外旅行 (travel abroad) 400,000

     The pot shows progress toward each type. Buying one subtracts its price (with undo).
6. **What goes away:**
   - the weekly score /100
   - fruit point weights and partial credit
   - the team layer
   - the Treat Purse and its 60 threshold
   - the both-OK approval (`approve` events are ignored)
   - monthly transfer, payday and `transfer`/`transfer_undo` (ignored)
   - preset destinations (`RUNGS`)
   - calibration weeks
   - per-person targets
   - the rest-day bonus
7. **Start:** the economy counts from the week of **Mon 2026-10-26** (`RULES[0].from`), so the current week already
   earns.
8. **Locks:** a day's earnings can still change until the week locks on the Wednesday 04:00 after its Sunday (late
   syncs, きろく edits), then they're fixed. Spends are never locked (they can be undone).
9. **Events, with no backend change:**
   - Spending reuses `spend`: `{spendId, pot: 'treat'|'trip', item, label, bells}`. Old `amountYen` spends are ignored.
   - The shared menus reuse `pref`, keys `treatMenu` and `tripMenu`. The value is a JSON array of
     `{id, label, bells}`; the latest pref by either person wins.
   - The Apps Script stays a dumb log, so `Code.js` doesn't change.

## View model (the contract between the model and the UI)
- `WeekView.people[p].today`: `{ bells, parts: {peach, apple, coconut, pear} }`, today's earnings so far.
- `WeekView.people[p].fruits[f]`: today's and this week's progress per fruit:
  - `todayActual`, `todayGoal`
  - `weekDays` (days meeting the daily goal), `weekGoalDays` (badge threshold)
  - `badge` (bool)
  - `weekBells`
- `WeekView.pots`:
  - `treat: { balance, earned, spent }` and `trip: { balance, earned, spent }`
  - `todayBells` (both people)
  - `weekBells` (both people, incl. any bonus)
- `WeekView.menus`: `{ treat: MenuItem[], trip: MenuItem[] }`.
- `WeekView.harvest`: `{ weekKey, bonus: { A, B, duo }, totalBells, confirmedBy }` | null.
- History (きろく): a per-day ledger:
  - per person, per day: `{ date, bells, parts }`
  - weekly bonus rows
  - spends `{ at, by, pot, label, bells, voided }`

## Consequences
- **Typical numbers:** on a typical week (about 600 ベル a day each, plus a couple of badges), the pots grow by about
  10,000 ベル a week: about 3,000 for treats and 7,000 for trips. That's a coffee date most weeks, a day trip every
  three weeks, an onsen in about seven weeks and abroad in about a year. Every value is editable in `rules.ts`
  (rates) or in the app (prices).
- **History:** earlier weeks never paid real money (the first payout was due 2026-11-08), so there's nothing to migrate.
- **What changes for the user:** the island headline becomes today's ベル, and 旅の壺 becomes the two-pot screen.
