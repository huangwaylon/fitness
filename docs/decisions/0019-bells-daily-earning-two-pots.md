# 0019 — Play money (ベル), earned daily, in two shared pots
**Status:** **Partly superseded:** what earns (the four fruits, 🍐 eating habits) by [0021](0021-activity-rings-no-check-ins.md); the two pots, their menus and trip prices by [0022](0022-one-wallet-small-luxuries.md) (one wallet). Still true: ベル play money earned daily, the same goals for both, the weekly badge bonus and ふたりボーナス at the Sunday 19:30 harvest, the Wednesday 04:00 lock. Was: accepted (user decision 2026-10-30). Supersedes the money and scoring parts of [0003](0003-economy.md),
[0006](0006-yen-single-currency-and-accountability.md), [0008](0008-open-ended-savings-per-fruit-rate.md),
[0011](0011-mvp-rule-defaults.md) and [0017](0017-round-4-rule-changes-and-rule-versions.md) (§2–4, calibration).
Keeps the four fruits as the four activities, rule versioning by week (0017 §7), the Wednesday 04:00 lock and きろく
editing. Values: `app/src/lib/config/rules.ts`. **Amended 2026-10-30** (tuned values, see the end): the numbers below
are the original ones where the amendment changes them.

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

## Amendment 2026-10-30: tuning for the couple's goals
**Status:** Accepted (lead's tuning, approved by the user 2026-10-30). Values: `app/src/lib/config/rules.ts`.

**Why.** The goals for the year:
- A year of on-target play should pay for **2 trips abroad, 6 weekend trips and 1–2 onsen**.
- Sweets should be deliberately expensive.
- Both are aiming at weight loss and muscle gain for their wedding on **2027-10-08**, so strength is weighted up and
  the habits are about protein and sweets.

**Changes** (they replace the numbers above):

| | Was | Now |
|---|---|---|
| 🥥 strength day | 300 ベル | **400 ベル** (max per person per day 1,025 → **1,125**) |
| 🥥 weekly badge | 2 strength days | **3 strength days** |
| Pot split (`POTS.treatPercent`) | おやつ 30% / 旅 70% | **おやつ 20% / 旅 80%** |
| おやつ menu | おやつ 300 · アイス 500 · カフェデート 1,500 · 外ごはん 5,000 | **おやつ 1,500 · アイス 2,000 · カフェデート 2,000 · デザート・パフェ 3,000 (new, `dessert`) · 外ごはん 5,000** |
| 旅 trip types | 日帰り 20,000 · 温泉 50,000 · 週末旅行 100,000 · 海外旅行 400,000 | **日帰り 12,000 · 週末旅行 35,000 · 温泉 45,000 · 海外旅行 160,000** |
| Habits (🍐) | A: 定食ランチ · 減塩デー · 野菜 2食; B: 昼ごはん · おやつに果物・ナッツ · 野菜 2食 | **both: 毎食たんぱく質 (`protein_each_meal`) · 甘いものは壺から (`no_sweets`) · 野菜 2食 (`veg_two_meals`)** |

**Numbers on target** (every badge for both, minimum days): per person a week 5 × 225 + 4 × 200 + 3 × 400 + 15 × 100
= 4,625 daily + 2,000 badges; both + 1,000 duo = **14,250 ベル a week**, about **741,000 a year**:
- 旅 80% ≈ 593,000 a year = 2 × 160,000 + 6 × 35,000 + 45,000 (575,000), with room for a second onsen in a strong year.
- おやつ 20% ≈ 2,850 a week: one café date or ice cream a week, a dinner out every couple of weeks.

**How it was applied.** Nothing had paid (ベル are play money and the economy started that week), so `RULES[0]` was
edited in place rather than appending a version (`rules.test.ts` notes the one-off). Old check-in rows with the old
habit keys simply stop counting. Menus that were already edited in the app (`pref`) keep their prices; only the defaults
changed.

## Amendment 2 — 2026-10-30, after the goals review
The goals review (round 12, [reviews index](../reviews/README.md)) found ウェイ's real recent weeks earn ~21% of on
target, and flagged rule gaps. The user kept the on-target goals (no phased ramp) and chose:

| | Was | Now |
|---|---|---|
| ふたりボーナス | +1,000 only when both meet all four badges | **+250 for each badge both people meet** (same 1,000 max; one miss costs one share), `badges.duoPerBadge` |
| Confirmed gym visits paid | 2 a week (`STRENGTH.maxConfirmedVisitsPerWeek`) | **3 a week**, so the 3-day strength badge is reachable from gym visits alone |
| 🍐 `no_sweets` habit | 甘いものは壺から | **間食は計画どおり** (snacks only as planned: sweets *and* chips only when bought from the pot) |
| おやつ menu | 1,500 · 2,000 · 2,000 · 3,000 · 5,000 | **おやつ 800 · アイス 1,000 · カフェデート 2,000 · デザート・パフェ 2,000 · 外ごはん 5,000**: dear but reachable, since strict bans backfire |
| 旅 trip types | 12,000 · 35,000 · 45,000 · 160,000 | **日帰り 10,000 · 週末旅行 28,000 · 温泉 36,000 · 海外旅行 130,000**: the year's plan (2 × abroad + 6 × weekend + 1–2 × onsen ≈ 470,000–506,000) costs ~80% of a year on target, leaving room for off weeks |

Not adopted (user decision): phases/seasons, a cap on paid strength days, 30-minute minimum sessions, strength
minutes counting as active minutes, pass weeks, the comeback bonus. Applied in place to `RULES[0]` (nothing paid).

## Amendment 3 — 2026-10-30, gym arrivals
User decision: "As long as they go, it counts." Each phone runs one Shortcut, **Arrive** at the gym
(`presence {place, event:'arrive', at?}`; [shortcut-health-sync.md §5](../ops/shortcut-health-sync.md)).

| | Was | Now |
|---|---|---|
| Gym visit | arrive→leave pair of 30+ minutes (`STRENGTH.minVisitMin`); auto places counted, others asked 「…は筋トレでしたか？」 and paid at most 3 a week | **any arrive at a known place is a strength day** for that person and date: no leave, no dwell, no question, no weekly cap. Several arrivals a day = one strength day |
| Places | `PlaceConfig.autoStrength` | every place counts (the field, `minVisitMin`, `maxConfirmedVisitsPerWeek`, `Visit.confirmed/autoStrength/leaveAt/dwellMin` and the `'visit'` pending kind are gone) |

Unchanged: ask-type workouts still get 「筋トレでしたか？」 (`confirm {kind:'workout'}`). The server still accepts
`leave`; the model ignores `leave` rows and old `confirm {kind:'visit'}` events. 0017 §6's busy day is now
any gym arrival. Applied in place to `RULES[0]` (play money): past weeks re-read with the new rule, so a visit shorter
than 30 minutes now counts.
