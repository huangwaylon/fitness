# 0006 — Yen, a single real currency, and team + individual accountability
**Status:** Partly superseded by ADR 0008 and 0014; the rest stands (accepted round 3; user input). Supersedes the currency parts of 0003. Superseded in part by [0008](0008-open-ended-savings-per-fruit-rate.md) (the 85 threshold, shortfall bank and fixed goal). The Sunday promise is removed by [0014](0014-simplify-no-promises-no-cozy.md).

**User input (2026-10-28):** the final currency is yen. Worry that intermediate currencies are too complicated. Want a team effort *and* accountability for each person.
Both live in Japan: one partner has a personal trainer, the other an Anytime Fitness membership.

## Decision
1. **One currency: yen (¥).** There's no intermediate spendable currency. **Fruit is a score** (e.g. "57 / 85"), never spent or banked as currency. Treat tickets are **dropped**.
2. **Two pots of real yen:**
   - **Trip Jar (旅の壺):** default **¥520,000/year = ¥10,000/week**. That's about $3,300 at ¥158/USD (2026-10-27).
   - **Treat Purse (ごほうび財布):** up to **¥2,000/week (¥104,000/yr, about ¥8,700/month)**. Each person who scores ≥ 60 adds **¥1,000** that week (a paused week counts). Shop items are priced in yen (e.g. yakiniku dinner ¥8,000, café date ¥1,500, onsen day ¥5,000).
3. **Accountability + team split of the weekly ¥10,000:**

   | Share | Amount | Paid at | Purpose |
   |---|---|---|---|
   | Partner A's own share | ¥4,000 | `min(A/85, 1)` | Individual accountability: "my part of the trip" |
   | Partner B's own share | ¥4,000 | `min(B/85, 1)` | Individual accountability |
   | **Team share** | ¥2,000 | the **lower** partner's ratio (a paused partner counts as 1.0) | Team effort: lift each other |

   The team share rises from 15% to 20% so that teamwork is felt more strongly.
4. **Making accountability visible, not shaming:**
   - The jar is drawn in two coloured layers plus a team layer: "Mochi ¥128,000 · Bean ¥121,500 · Team ¥58,000".
   - **Sunday promise:** during the ceremony each person sets one concrete plan for next week (e.g. "Anytime Tue/Thu/Sat 7 am", "PT Wed + 1 solo session"). The partner sees it, and next Sunday shows ✓ for kept promises. Kept promises are cosmetic and give a small fruit bonus (≤ 5 fruit inside the 100 cap). This is an implementation-intention technique.
   - If a partner is under 60 for two weeks running, the *other* partner gets a gentle "invite them to something" suggestion. There are no alerts to the struggling partner beyond the usual cozy tone.
5. **Rounding:** all yen amounts are integers, and the ledger stores whole yen. Shares are computed in yen and rounded down per entry, and the remainder stays in savings.

## Consequences
- Concepts drop to: **Fruit (score) · Trip Jar (¥) · Treat Purse (¥)**. One sentence: *"Healthy habits grow fruit; every Sunday your fruit puts yen in the trip jar and the treat purse."*
- The shortfall bank (0003 amendment) works unchanged, in yen, on personal shares.
- UI copy is English by default, with Japanese labels as an option (TBD with the users).

## Round 3 amendments (motivational coach review)
- **No fruit bonus for kept promises.** It would reward easy promises. Promises carry no money and no streak; a kept one shows ✓, a missed one ○ (never ✗).
- **The Home screen shows only the combined jar.** Personal layers are one tap deeper, each against its own maximum (not a leaderboard). Copy never names whose score set the team rate.
- **Year-end yen** (steady weekly scores, floor per entry): ≥85 → **¥520,000** · 75 → ¥458,744 · 60 → ¥366,964 · 40 → ¥244,660.
