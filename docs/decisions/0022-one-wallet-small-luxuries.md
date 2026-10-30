# 0022 — One wallet of small luxuries (trips are paid for outside the game)
**Status:** Accepted (user decision 2026-10-30). Supersedes the two pots of [0019](0019-bells-daily-earning-two-pots.md)
§5 and its trip-price amendments. Keeps daily earning ([0021](0021-activity-rings-no-check-ins.md)), the Sunday
harvest, the ふたりボーナス, buying with undo and editable menus.

**Context.** The couple will plan and pay for their trips (day trips, weekends, abroad) outside this fitness game. So
the reward is no longer "saving for a trip" but **permission for small luxuries**, day to day and during trips: coffee
dates, things they want to buy, sweets, chips, snacks, ice cream; a souvenir budget, a special meal, a spa on a trip.
That also suits the weight-loss goal: a sweet bought with ベル is an earned yes.

## Decision
1. **One shared wallet.** Every ベル earned (daily and the Sunday bonus) goes into one wallet owned by both. No
   split, no pots. The wallet's balance is the island plate's number and the top of the wallet screen.
2. **One menu, two sections**, both editable (add / rename / reprice / remove), either person can buy, the buyer can
   undo, the balance never goes negative:
   - 🍦 **まいにちのごほうび** (everyday): snack / chips, ice cream, konbini sweet, dessert / parfait, coffee date,
     dinner out, something we want to buy.
   - ✈️ **旅のごほうび** (on a trip): souvenir budget, a special meal, spa / massage, a room upgrade, an onsen extra.
3. **Balanced prices**: at the on-target pace (≈ 14,000 ベル a week for both), about 2–3 sweets or snacks plus a coffee
   date a week, dinner out about every two weeks, a trip treat saved up over a few weeks. Exact defaults and the
   maths in `rules.ts` and design.md §E.
4. **Data:** one menu `pref` key (items carry their section); spends carry no pot. The one-off sheet cleanup
   (runbook) removes the old two-pot menus and spends, as nothing real was at stake.

## Consequences
- Simpler for everyone: one number, one list.
- Trip prices and the trip progress bars are gone; trip-time treats are just menu items saved up for.

## Amendment 2026-10-30: one list, five grouped items (user decision)
The two sections were too many categories. The menu is **one list, no sections** (items `{id, label, bells}`), with
five grouped defaults (`DEFAULT_MENU` in `rules.ts`):

| | Item | ベル |
|---|---|---|
| 🍦 | おやつ (Snack): chips, snacks, ice cream, konbini sweets | 1,200 |
| 🍰 | カフェ・デザート (Café & dessert): coffee date, parfait, cake | 2,500 |
| 🍽️ | 外ごはん (Eating out) | 6,000 |
| 🛍️ | ほしいもの (Something we want) | 8,000 |
| ✈️ | 旅のごほうび (Trip treat): souvenirs, a special meal, a spa or an upgrade on a trip | 12,000 |

**Maths** at the on-target 14,400 ベル a week for both: 2–3 おやつ (≈ 3,000) + one café date (2,500) + eating out every
two weeks (3,000) ≈ 8,500, leaving ≈ 5,900 a week: a ほしいもの every ~1.5 weeks or a 旅のごほうび every ~2.

**Data:** `pref` `menu` (one list); `spend {spendId, item, label, bells}` (a `pot` is refused); `treatMenu` / `tripMenu`,
`POTS` and the split are gone. Applied in place to the economy's first week; `cleanupLegacyData` deletes every old
spend, spend_void and pot menu so the wallet starts from earnings.
