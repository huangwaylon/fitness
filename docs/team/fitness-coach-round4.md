# Fitness Coach: Round 4 (no sleep data, open-ended linear economy)

**Input:** neither partner wears the Watch to bed and they want zero manual work, so sleep can't be scored. The economy becomes open-ended and linear, likely **¥50 per fruit per person**, with every fruit up to 100 paying.

## 1. Four fruits, re-weighted (sum = 100)
| Fruit | Category | Weight | Rule (unchanged unless noted) |
|---|---|---|---|
| 🍑 Peach | Active minutes **+ rest day** | **35** = 30 + 5 | 30: weekly active min vs. personal target, linear, daily cap. **5: at least 1 rest day** (no workout ≥ 45 min and no workout ≥ 20 min at ≥ 77% of estimated max HR; walking and mobility are fine; Cozy Days count). |
| 🥥 Coconut | Strength days | **25** (was 20) | 2–3 days (trainer-set for B), 1 per day, strength workout ≥ 15 min, or gym-visit backup (max 2/wk) |
| 🍎 Apple | Step days | **15** (was 10) | Personal step target on 5 of 7 days. 8,000 is the MHLW milestone, ceiling 10,000 |
| 🍐 Pear | Eating habits | **25** (unchanged) | Evening check-in, 15 of 21 ticks |

- **Why the rest day stays (inside Peach):** with linear pay, every fruit is worth money, so there has to be a reason *not* to train 7 days a week. The 5 fruit (¥250/wk) mean a perfect 100 is impossible without a rest day. It's fully automatic and needs no new tree slot.
- **Where sleep's 15 goes:** +5 strength, the priority (B's bone density, MHLW 2–3 days/wk). +5 steps, the best automatic match for MHLW's "60 min/day ≈ 8,000 steps". +5 Peach, for the rest-day component (up from 3).
- I'd **not** make "rest" a fruit of its own: it's too small to deserve a tree slot, and a "rest fruit" can read as a reward for inactivity.

## 2. Sleep: an optional, non-scored reminder
- **Yes:** an optional **iPhone Sleep Focus / bedtime schedule** reminder (set once in iOS, zero daily work). The app only shows a cozy evening line ("Juniper is dimming the lanterns 🌙"). **No fruit and no money.**
- iPhone-only "time in bed" estimates (based on phone use) are too unreliable to score. Don't ingest them.
- **Leave a hook:** if either partner later chooses to wear the Watch at night, the moon-plum can return as an opt-in personal fruit, re-weighted on their card only (lead's decision; keep v1 simple).

## 3. Recovery hints from daytime data only
The Watch still computes **Resting HR** from daytime wear and records **Walking HR Average**. Overnight HRV and sleep are gone, so:
- **Illness hint** (suggest a Cozy Day): resting HR **≥ 7 bpm above its 30-day baseline for 2+ days**, OR walking HR average **≥ 5 bpm above baseline for 3 days**.
- **Load hint** (suggest a rest day): **6 days in a row** with ≥ 30 active min, OR a week over **1.3×** the 4-week average.
- **HRV:** daytime spot readings are sparse and noisy, so show the trend only and never use it as a trigger. The "poor sleep" condition is removed.
- All hints are suggestions only and never change pay. Engineer: daily resting HR and walking HR average are both standard HealthKit metrics, so add walking HR average to the export.

## 4. Tokyo tsuyu
The rainy season in Tokyo runs roughly **early June to mid-July**. From **Jun 1 to Jul 20** (adjustable each year), the apple counts a day if **steps are hit OR ≥ 30 active min** were logged (gym, home workout, mall walk).

## 5. Overtraining check under linear ¥50/fruit (max ¥5,000/person/week)
**Verdict: the caps still hold.** Every category pays by **% of the person's own target, capped at 100%**, so the maximum is reached by *meeting* targets, never by exceeding them:
- **Peach:** minutes above target pay ¥0. The daily cap **min(90, max(60, 50% of target))** forces spreading across at least 2 days, so no binges. Hitting 35 also needs a rest day.
- **Coconut:** 1 per day, capped at 2–3 days. The weight is fixed at 25 whatever the target, so opting into 3 days earns nothing extra.
- **Apple:** capped at 5 of 7 days. **Pear:** capped at 15 of 21.

What changes, and the fixes:
1. **The 85–100 "free zone" is gone.** Previously 85 = a full week; now the last 15 fruit are worth ¥750. That pushes toward perfectionism and training through illness. **Fix:** Cozy Days prorate targets (they never cost fruit) and pause stays unlimited. Copy celebrates 85+ as "a great week", and the ceremony shows yen, not a "missed ¥" figure.
2. **Raising your own targets earns nothing** (pay is % of target), so there's no reason to ratchet up. **Lowering targets** to farm fruit is the opposite risk. Keep the floors (60 min/wk, 3,000 steps, 1 strength day) and the season-opener review with both partners (and B's trainer).
3. **The gym-visit backup** stays capped at 2 per week, and partner-visible.
4. **Year-end equivalent:** a typical 85 fruit/week × ¥50 × 2 people × 52 weeks ≈ **¥442,000**. A perfect 100 every week = ¥520,000. That's the same scale as before, but nothing is "locked".

Net: no new overtraining incentive. The only new pressure is psychological (perfectionism), which the copy and Cozy Day rules handle.
