# Round 2 sign-off: Nutritionist

**Reviewed:** `PROPOSAL.md` v1.0 and ADRs 0001–0005, from the nutrition angle.

## (a) Blocking issues (each fix is copy or config, not a redesign)
**B1. The Pear target doesn't survive the habit progression.**
- ADR 0002 and §3.2 fix the Pear at "15 of 21 ticks (3 habits × 7 days)".
- But §2.3 *adds* habits each season: Season 2 has 4 (28 ticks) and Season 3 has 5 (35). The target is now either impossible to read or quietly easier.
- **Fix:** always keep **3 active habits**. Each season, *swap* one in. A habit that has become automatic "graduates" to a Museum badge. Change §2.3 from "+ Palm of protein…" to "swap in: Palm of protein…". The Pear stays "15 of 21" all year, and each person can pick which habit to swap out (no free ticks for something they already do).

**B2. The holiday timing contradicts the calendar.**
- §2.3 puts "lighter targets through the holidays" in Season 4 (Aug–Oct).
- But Thanksgiving through New Year falls in **Season 1 (Nov–Jan)**, the exact weeks we ask them to start new eating habits.
- **Fix:**
  - Season 1: Pear target **12 of 21** for Dec 20–Jan 1, and holiday meals count as Cozy Days.
  - Season 4 becomes "Maintain + vacation prep".
  - Add one line: "the vacation itself and major holidays are never scored for eating".

**B3. There's no under-fueling safeguard.**
- Both partners are lean-to-healthy and their training load rises all year. Partner B's bone goal depends on eating *enough*.
- The only mention is the weight-flag line in §2.3. The Risks table (§7) has no row for it.
- **Fix:**
  - Add a §7 row: "Under-fueling (RED-S) during training build-up → refuel copy after hard or high-volume weeks ('Big week! Extra snack, extra water'), a private monthly 3-question self-check (energy, illness/injury, Partner B's cycle regularity) with a 'talk to a clinician' off-ramp, never scored or shared."
  - Add to §3.9: *the app never praises eating less, skipping meals, or 'being good'.*

**B4. The banned-words list (§3.9) misses the most common food-moralizing terms.**
- **Fix:** extend it to: failed, missed, lost, behind, **lazy**, cheat day, **cheat meal**, **junk / clean / good food / bad food**, **guilty / sinful / naughty**, **"deserve" (a treat)**, burn off, **work it off / make up for**, earn your food, **detox**, and any body or weight commentary.
- Also replace "guilt-free" in §3.3 and §3.4 with **"planned, no strings"**. "Guilt-free" implies guilt is the default.

## (b) Non-blocking suggestions
1. **The "treat today 🍰" chip** (ADR 0004): it's harmless only if it is **never counted, charted, or shown** in history or to the partner. Otherwise it's a treat diary. My preference is to drop it, since treats already live in the Shop. If kept, its one job is to tick a cosmetic "festival" decoration.
2. **Treat-ticket wording.** §3.3 says tickets are "decoupled from performance", but they're gated at both partners scoring ≥ 60.
   - Say "close to a showed-up allowance" instead.
   - State explicitly that **Cozy Day and paused weeks count as met**, so one partner's flu never blocks the couple's treat.
   - Consider "each partner ≥ 60 on 3 of the month's 4 weeks → 4 tickets" to avoid a one-week cliff.
3. **Shop balance:** food items are coffee/dessert, dinner out and cooking class; non-food items are movie/museum, massage, and plant/gear/book. That meets "≥ half non-food" only barely.
   - Split "cooking class / massage" into two lines.
   - Add a **farmers-market haul (2 tickets)** and a **day trip / hike outing (3 tickets)**.
4. **Nutrient wording (§2.3):** "B also needs 18 mg iron and 1,000 mg calcium" implies A doesn't need calcium. Change it to: "Both need 1,000 mg calcium; iron is 18 mg for B vs 8 mg for A." Protein (1.2–1.6 g/kg → A 79–106, B 66–88) and fiber are correct.
5. **Water** (shown, not scored): if it's displayed, show personal goals (A 2.0 L, B 1.5 L, +0.5 L on workout days). Show no extra credit or praise above about 3.5 L / 3.0 L, so "more is better" never comes up.
6. **"Kitchen closes 2–3 h before bed"** (Season 3): add "not offered if either partner reports a disordered-eating history (Q5)".
7. **Pear weight:** 25 of the 85 fruit needed for a full week means about 29% of personal Jar money comes from honor-system taps. That's within the range I proposed, so it's acceptable. Revisit it at the end of Season 1 if it feels too easy.
8. Add a **"nutrition goals off" switch** in Settings that reweights the remaining categories, plus a quiet link to support resources.

## (c) Sign-off
**YES, conditional on B1–B4.** All four are text or config changes. The core design is sound from a nutrition standpoint: behaviors not bodies, no calories or weight, no per-meal grading, private eating answers, a separate treat budget, and no food-to-money link at the meal level.
