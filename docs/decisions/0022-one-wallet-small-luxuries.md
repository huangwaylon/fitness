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

## Note 2026-10-30: the default prices (engine)
`DEFAULT_MENU` in `rules.ts`. 🍦 まいにちのごほうび: snack 1,000 · ice cream 1,200 · konbini sweet 1,500 · dessert 2,500 ·
coffee date 2,500 · dinner out 6,000 · something we want 8,000. ✈️ 旅のごほうび: souvenir budget 8,000 · onsen extra
10,000 · special meal 12,000 · spa 15,000 · room upgrade 20,000. At the on-target 14,400 a week: ≈ 3,100 for 2–3
sweets + 2,500 coffee date + 3,000 (dinner out every two weeks) ≈ 8,600, leaving ≈ 5,800 a week, so a trip treat
takes ~1.5–3.5 weeks of saving. Data: `pref` `menu` (items `{id, section, label, bells}`), `spend {spendId, item,
label, bells}` (a `pot` is refused); `treatMenu` / `tripMenu`, `POTS` and the split are gone. Applied in place to the
economy's first week; `cleanupLegacyData` deletes every old spend, spend_void and pot menu.
