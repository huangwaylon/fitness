# Motivational Coach / Gamification Design Memo

**Role:** Motivational Coach / Gamification Designer
**Status:** Draft v1, for team review
**Scope:** Behavioral grounding, the real-money economy, reward shop, couple dynamics, game loops, tone, honor system, and long-term retention.

> **TL;DR:** Pre-commit a vacation budget into a real savings account at the start of the year (a commitment device). Healthy behavior earns **Miles** (non-monetary points, always kept). Each Sunday, a person's weekly Miles **unlock** their share of that week's locked **Bells** (real dollars), with linear partial credit. Hitting about 81% of the weekly maximum unlocks 100%. Money that isn't unlocked goes to the **Lost & Found**, not away. Overflow effort, comeback quests, and seasonal events can win it back. A shared "Together Bonus" pays out at the *lower* partner's rate, which keeps the game cooperative. Streaks are weekly and forgiving. The tone is always Isabelle, never a drill sergeant. Both partners are at a healthy weight, so everything is framed around maintenance, fitness, strength, and habits. Scoring uses minutes and baseline-relative goals, never calories compared across partners of different body sizes.

---

## 1. Behavioral science grounding

Citations are from memory and given so the team can look them up. Please verify the details before quoting them in user-facing copy.

### 1.1 Self-Determination Theory (Deci & Ryan; Ryan & Deci 2000)
People sustain behavior when three needs are met. Each one maps to a design rule:

| Need | What it means here | Design rule |
|---|---|---|
| **Autonomy** | "We chose this, we control it" | Each person picks their own targets and which habits count, and can re-tune them at each season start. Several routes reach the same weekly goal, so no single activity is mandatory. No pushy notifications. |
| **Competence** | "I'm getting better" | Targets are personalized to each person's baseline. Progress shows as personal trends ("your best July ever"). Difficulty ramps up slowly. Feedback is *informational* ("you walked 12% more than last month"), never *controlling* ("you should have…"). |
| **Relatedness** | "We're doing this together" | One shared island, shared vacation, joint bonuses, high-fives. The partner is a teammate, never a scorekeeper. |

**Cognitive Evaluation Theory** (a sub-theory of SDT) is the key warning for a money app. Rewards experienced as **controlling** undermine intrinsic motivation. Rewards experienced as **informational** (signals of competence) don't. The **Deci, Koestner & Ryan (1999)** meta-analysis found that tangible, expected, performance-contingent rewards reduce free-choice intrinsic motivation for activities that were *already* interesting. Exercise often isn't intrinsically interesting at first, and that's exactly why extrinsic scaffolding can help. We still have to plan the fade (see 1.4).

### 1.2 Habit formation
- **Cue → routine → reward loop** (Duhigg's popularization of the habit-loop literature; Wood & Neal 2007 on context-dependent habits). The app should help them attach habits to stable cues, e.g. "after morning coffee → 10-min walk." Setup includes optional **implementation intentions** (Gollwitzer 1999, "When X happens, I will do Y"). These have robust meta-analytic support (Gollwitzer & Sheeran 2006).
- **Lally et al. (2010, EJSP; data collected 2009):** the median time to habit automaticity was **~66 days**, with a range of **18–254 days**. Two important findings:
  1. Simpler behaviors (drinking water) automate faster than complex ones (50 sit-ups).
  2. **Missing a single day did not materially derail habit formation.** This is the scientific basis for forgiving streaks.
- Design implication: the first ~10 weeks ("Season 1: Settling In") carry the strongest scaffolding: the most frequent celebrations and the easiest targets. After that we gradually shift weight from rewards toward identity and mastery.

### 1.3 Loss aversion and commitment devices
- **Loss aversion** (Kahneman & Tversky 1979): losses loom about 2x larger than equivalent gains.
- **Patel et al. (2016, Annals of Internal Medicine):** for step goals, a *loss-framed* incentive (money pre-allocated and taken away for missed goals) beat an equivalent gain-framed incentive. **Patel et al. (2017, JAMA Internal Medicine, "BE FIT")** combined loss-framed points with family social support and also improved activity.
- **Deposit contracts / commitment devices:** **StickK** (Karlan, Ayres, Goldberg) lets you stake money on a goal. **Halpern et al. (2015, NEJM)** on smoking cessation found deposit contracts were *more effective among people who accepted them*, but far fewer people accepted. **Royer, Stehr & Sydnor (2015)** found that commitment contracts improved long-run gym attendance for those who used them. **Volpp et al. (2008, JAMA)** found deposit contracts worked for weight loss during the incentive period, with regain afterwards.
- **Our use:** the couple *pre-funds* the vacation account up front. The money is psychologically "already theirs" (endowment effect), and unlocking it feels like protecting something they own. This gets loss-framing's power **without punishment**: unearned money is never destroyed or sent to an "anti-charity." It moves to a *less fun* bucket (see 2.6). That keeps the stakes real but soft, which is right for a cozy app and a relationship.

### 1.4 Extrinsic rewards crowding out intrinsic motivation
- **Gneezy & Rustichini (2000), "Pay enough or don't pay at all":** small payments can perform *worse* than none because they reframe the activity as a transaction.
- **Charness & Gneezy (2009, Econometrica):** paying people to go to the gym for a month increased attendance *after* payments stopped, because a habit had formed. **Acland & Levy (2015)** found substantial decay of that effect afterwards. The lesson is that money can start habits, but something else has to sustain them.
- **Woolley & Fishbach (2016/2017):** *immediate* rewards increase intrinsic motivation more than delayed ones. So we celebrate daily, even though money settles weekly.

**Mitigations built into the design:**
1. **The money is meaningful, not trivial.** About $57/week of vacation is not "pay enough or don't pay," and it's framed as *their own vacation*, not a wage.
2. **Two currencies.** Miles reward the *activity* itself (identity: "I'm an islander who walks"). Bells are the *shared dream*. Most moment-to-moment feedback uses Miles and island reactions, not dollars.
3. **Informational feedback.** Copy talks about competence and progress ("You've walked to the lighthouse and back 40 times!"), never about compliance.
4. **Planned fade (money → mastery → identity).** Season 1 is dollar-forward. Seasons 2–3 lead with the island, the museum, and personal bests, with dollars in the weekly ceremony only. Season 4 introduces identity titles ("Trailblazer," "Garden Chef") and reflection prompts ("What do you like about how you feel now?"). After year 1, money becomes optional (see section 8).
5. **Autonomy over the system.** They set the rules together. Self-endorsed rules are experienced as less controlling.

### 1.5 The what-the-hell effect
- **Polivy & Herman (1985)** on dieting counter-regulation, and **Cochran & Tesser (1996)**, who named it the "what-the-hell effect": once a goal is "blown," people abandon it entirely ("I already had dessert, might as well eat the whole cake").
- **Design response:**
  - **No all-or-nothing thresholds.** Partial credit is *linear*, so every Mile counts on Saturday night even after a bad week.
  - **Weekly, not daily, accounting.** A bad Tuesday can be made up on Thursday.
  - **Streaks are weekly and include freeze tokens** (see 5.5).
  - **Comeback quests:** after a low week, the next week offers bonus reclaim from the Lost & Found. The **Milkman et al. (2021, Nature) StepUp megastudy** found that among the best-performing gym interventions were bonuses for *returning after a missed workout*. Rewarding the comeback beats punishing the miss.
  - **Emergency reserves / slack:** **Sharif & Shu (2021)** found that goals with a few built-in "emergency skips" sustained persistence better than rigid goals. This is the direct basis for Cozy Days and freeze tokens.

### 1.6 The fresh-start effect
- **Dai, Milkman & Riis (2014, Management Science):** people pursue goals more after temporal landmarks such as Mondays, month starts, birthdays, holidays, and new semesters.
- **Design:** every Monday is a "New Week on the Island." Each **season** (quarterly) is a big, ceremonious fresh start with retuned targets, new events, and a clean streak slate. The app proactively offers a fresh start after a hard stretch ("New season, new tide 🌊"), along with a new birthday-week event and a new-moon micro-event monthly.

### 1.7 Other useful findings
- **Temptation bundling (Milkman, Minson & Volpp 2014):** pair a "want" with a "should," e.g. a favorite podcast only on walks. We can suggest this in setup.
- **Partner effects (Jackson, Steptoe & Wardle 2015, JAMA IM):** people were much more likely to adopt healthy behaviors when their partner did too. Couples are a natural unit for this.
- **Social control vs. social support (Lewis & Rook 1999; Bolger et al. 2000 on "invisible support"):** nagging ("did you work out yet?") can backfire and create resentment. Support works best when it's positive and low-pressure. This is the basis for our encouragement mechanics (section 4).

---

## 2. The money economy (core design)

### 2.1 Principles
1. **Earn what you spend.** The vacation is funded by healthy behavior.
2. **Never fail the vacation.** A realistic, imperfect year should still produce a great trip. A genuinely bad year still produces *a* trip, just a smaller one.
3. **Stakes are real but soft.** Unearned money doesn't evaporate. It moves somewhere boring.
4. **Every unit of effort counts.** Linear partial credit, no cliffs.
5. **Everything is configurable**, but the defaults are calibrated (below).
6. **Transparent math.** Either partner can open a "How Bells work" screen and see the exact formula.

### 2.2 Two currencies

| | **Bells 🔔** | **Nook Miles ✈️** (or "Leaves 🍃") |
|---|---|---|
| Backed by | Real dollars (1 Bell = $1, or display 1 Bell = 1¢ for that AC feel: "You unlocked 5,769 Bells!") | Nothing, purely in-game |
| Earned by | Weekly settlement, converted from Miles | Every healthy action, in real time |
| Spent on | Vacation fund; Treat Jar items (dining, date nights) | Island decorations, villager outfits, museum display cases, Miles-priced "love coupons" |
| Cap | Yes, the weekly locked amount plus overflow rules | Soft daily cap per habit (prevents over-exercise), no lifetime cap |
| Can be lost? | Never once unlocked | Never |

The key mechanic: **Miles are earned and kept forever, and the weekly Miles total *also* determines how many Bells unlock.** One action does two things: an immediate cosmetic reward plus a contribution to the shared dream.

> UX note for the designer: showing Bells as cents (1 Bell = $0.01) gives satisfying big numbers ("+2,500 Bells!") while staying honest. Always show the dollar equivalent on the settlement screen.

### 2.3 Setup: the commitment
At year start, the couple configures:

| Parameter | Default | Notes |
|---|---|---|
| `vacation_budget` | $3,000 | The core locked pool |
| `treat_budget_monthly` | $50 | Dining/treats jar |
| `stretch_budget` | $400 (optional) | "Upgrade fund" (nicer hotel, excursion) earnable only by exceeding goals |
| `weeks` | 52 | |
| `together_share` | 13% of vacation budget | Portion paid via the joint bonus |
| `weekly_target_miles` | 85 per person | ≈81% of the 105-Mile weekly maximum |
| `cozy_days` | 12 per person per year | Pre-approved rest/sick days |
| `unearned_destination` | "Rainy Day savings" | See 2.6 |

**Real-money mechanics (recommendation):** on day 1 they transfer the full $3,000 (or set up a monthly auto-transfer of $250) into a dedicated savings account or bucket called "Island Locker." The app is a **ledger**. Once a month (on "Payday at Nook's"), they move the *unlocked* amount from "Locker" to "Vacation Fund" in their banking app. A literal transfer is a nice ritual and keeps the app out of handling money (no bank APIs, no compliance). Pre-funding is the commitment device, because the money is visibly set aside and visibly "waiting to be unlocked."

### 2.4 Earning Miles (daily quest card, per person)

Targets are **personalized per person**. Scoring is deliberately weighted toward **size-neutral, time-based metrics** (exercise minutes, sessions, sleep hours) rather than calories. Active energy scales with body mass, so Partner B (55 kg) burns roughly 15–20% fewer kcal than Partner A (66 kg) for the identical workout (see 4.4). The Move ring stays in, but at lower weight and set *relative to each person's own baseline*. Same points, different bars. Both partners are at a healthy weight, so **the economy is about fitness, strength, and habits, never weight loss.**

| Habit | Source | Miles/day | Notes |
|---|---|---|---|
| Exercise minutes ≥ personal target (start: 30 for both) | Apple Health (auto) | 4 | Primary metric; minutes are size-neutral |
| 🏋️ Strength *or* mobility: a Strength Training workout logged (any length ≥ 20 min) **or** ≥ 10 min yoga/mobility/stretch | Apple Health workouts (auto) | 2 | Strength emphasis; gives rest days a way to score too |
| Move ring, baseline-relative goal (≈100–110% of own 4-week median) | Apple Health (auto) | 2 | Calories never compared across partners |
| Steps ≥ personal target (start: 8,000 both, or baseline) | Apple Health (auto) | 2 | |
| Sleep ≥ personal target (start: 7h asleep both) | Apple Health (auto) | 2 | Rewarding sleep counters "grind" culture |
| 🥦 Veggies/fruit: ate ≥ 2 servings | One-tap check-in | 1 | |
| 🍳 Home-cooked or healthy main meal | One-tap check-in | 1 | |
| 💧 No sugary drinks / hit water goal | One-tap check-in | 1 | User picks which habit this slot is |
| **Daily max** | | **15** | |
| **Weekly max** | | **105** | |
| **Weekly target (100% unlock)** | | **85** | ≈ 81% adherence |

Notes:
- The diet slots are *configurable*. Each person picks 3 eating habits from a menu (no late-night snacking, protein at breakfast, alcohol-free day, etc.). Autonomy matters more than nutritional precision.
- **No calorie counting, no weight tracking in the economy.** Weight-based money incentives encourage unhealthy shortcuts and have poor long-run evidence (Volpp 2008 regain). Weight can be an optional private chart, never a scoring input.
- **Weekly strength bonus (Miles only, no Bells effect):** 2+ strength sessions in a week gives +10 Miles toward cosmetics (see 4.4). This adds a strength emphasis without breaking the money calibration.

### 2.5 Weekly settlement (Sunday night ceremony)

Daily payout is too noisy and invites daily what-the-hell. Weekly settlement is the right cadence: it allows within-week recovery, creates a weekly ritual (section 5), and matches the fresh-start Monday.

**Per-person weekly share.** The vacation budget, excluding the Together share, is split evenly across weeks and partners:

```
individual_pool   = vacation_budget × (1 − together_share)     = $3,000 × 0.87 = $2,610
personal_weekly   = individual_pool / weeks / 2                = $25.10 per person/week
together_weekly   = vacation_budget × together_share / weeks   = $390 / 52 = $7.50 per week
treat_weekly      = treat_budget_monthly × 12 / weeks          = $600 / 52 = $11.54 per week
```

**Unlock formulas:**
```
unlock_pct(person)   = min(1, miles(person) / weekly_target)            # linear, no cliff
personal_bells       = personal_weekly × unlock_pct
together_bells       = together_weekly × min(unlock_pct(A), unlock_pct(B))
treat_bells          = treat_weekly × average(unlock_pct(A), unlock_pct(B))
unearned             = (personal_weekly × 2 + together_weekly) − (personal_bells_A + personal_bells_B + together_bells)
                       → goes to the Lost & Found
```

**Why the Together Bonus uses `min`:** it's the joint goal. It only fully pays when *both* hit target, so each person has a reason to help the other (the carry mechanic, 4.3). It's still partial credit, never all-or-nothing, so one person's rough week only trims it. At 13% of the budget it's meaningful but not big enough to breed resentment.

**Overflow (exceeding the target).** Miles above 85 (up to 105) are "overflow." Overflow converts at the same rate as normal Miles (`personal_weekly / weekly_target` ≈ **$0.295/Mile**) and goes, in order:
1. Into **reclaiming the Lost & Found** (recovering earlier missed money).
2. Once the Lost & Found is empty, into the **Stretch Fund** (the optional upgrade budget), up to its cap.
3. Beyond that, overflow earns Miles only.

So the most a person can unlock in a week is about $25.10 + 20 × $0.295 ≈ $31, and only if there's something to reclaim or stretch into. This rewards over-performance while capping it, which matters for burnout (see 7.2).

### 2.6 The Lost & Found (what happens to unearned money)

Unearned Bells are **never lost during the year**. They sit in the **Lost & Found** (Blathers-style: "Hoo! Someone left these Bells on the beach…"). Ways to reclaim them:

| Path | Mechanic | Limit |
|---|---|---|
| Overflow | Extra Miles above target (2.5) | Rate-limited by overflow cap |
| Comeback Quest | The week after a <70% week, hitting target pays a 20% bonus from the Lost & Found | 1 per person per 2 weeks |
| Seasonal events | Events (5.3) offer Lost & Found "treasure" rewards | ~$40–80 per season |
| Fresh Start Festival | First week of each season: double overflow rate | 4 per year |

**End-of-year disposition of anything still unclaimed:** this is the "stakes" dial. Options, from softest to hardest:

| Option | Feel | Recommendation |
|---|---|---|
| A. Returns to the vacation anyway | No stakes, the economy is meaningless | ❌ |
| **B. Moves to "Rainy Day" savings (not fun money)** | Real but kind: you keep it, you just can't spend it on fun | ✅ **Default** |
| C. Rolls into next year's pool at 50% | Second chance, discounted | ✅ Good add-on if they continue to year 2 |
| D. Donated to a charity *they like* | Meaningful, gentle, feels good | ✅ Offer as an alternative to B |
| E. Anti-charity (StickK-style) | Powerful but punitive | ❌ Wrong tone for a cozy couple app |

Default: **B**, with an option to set a **split** (e.g. 50% Rainy Day, 50% charity of choice). The money remains theirs, so no one "lost" anything, but the dream vacation is smaller. That's a stake you feel without it being cruel.

### 2.7 Protecting against "failing the vacation"

1. **Cozy Days (12/person/year):** one tap to mark a day as rest or sick. The day is credited as **12 Miles for settlement purposes** (≈ the daily share of the target) but earns 0 cosmetic Miles. This is the Sharif & Shu "emergency reserve." The villager says: "Rest is part of the routine! 🛌"
2. **Pause Mode (illness, injury, family emergencies, travel):** pauses settlement entirely. Those weeks' Bells don't go to the Lost & Found. They roll forward and are spread across the remaining weeks or the next season. No questions asked (honor system).
3. **The vacation week itself** (and other trips) are auto-paused.
4. **Mid-year recalibration:** at each season start, the app shows a forecast ("At this pace you'll unlock ~$2,650 of $3,000") and offers to retune targets. Easier targets are always allowed. That's the competence need, and nobody gets shamed for it.
5. **Minimum trip guarantee (optional):** couples can mark a floor (e.g. 30%, $900) as unconditional. I recommend **off by default** to honor "actually earn it," but it should be available if either partner feels anxious.

### 2.8 Worked numbers ($3,000 vacation + $50/mo treats + $400 stretch)

**Example week:**

| | Partner A | Partner B |
|---|---|---|
| Miles this week | 92 | 68 |
| unlock_pct | 100% | 80% |
| Personal Bells | $25.10 | $20.08 |
| Overflow (7 Miles × $0.295) | $2.07 → Lost & Found reclaim | — |
| Together Bonus ($7.50 × min(1.0, 0.8)) | $6.00 (shared) | |
| Treat Jar ($11.54 × avg 0.9) | $10.39 (shared) | |
| Unearned → Lost & Found | $5.02 (B's) + $1.50 (together) = $6.52, minus $2.07 reclaim = **net $4.45** | |
| **Vacation fund +** | **$53.25** this week (of $57.69 possible) | |

**Annual projections:**

Assumptions: "hit target" weeks average 90 Miles. Other weeks average the stated %. Cozy Days are used. Overflow is ~5 Miles in hit weeks.

| Scenario | Hit-target weeks (each) | Other weeks avg | Mean adherence | Vacation unlocked | Lost & Found unclaimed | Stretch earned | Treats |
|---|---|---|---|---|---|---|---|
| **Thriving** | 46/52 | 75% | ~88% | **$3,000** (full) | $0 | ~$250 | ~$585 |
| **Realistic (target design point)** | 40/52 | 70% | ~81% | **≈ $2,930–3,000** | ≈ $0–70 | ~$0–50 | ~$560 |
| **Uneven (A thriving, B struggling)** | A: 46, B: 30 | A 75%, B 60% | A 88%, B 74% | **≈ $2,750** | ≈ $250 | $0 | ~$520 |
| **Rough year** | 20/52 | 60% | ~68% | **≈ $2,250** | ≈ $750 → Rainy Day | $0 | ~$450 |
| **Very rough year** | 5/52 | 45% | ~50% | **≈ $1,600** | ≈ $1,400 → Rainy Day | $0 | ~$360 |

Realistic-case derivation, per person: 40 × $25.10 + 12 × 0.70 × $25.10 = $1,004 + $211 = **$1,215**, so $2,430 for two. Together: ≈ 36 weeks × $7.50 + 16 × 0.7 × $7.50 = $270 + $84 = **$354**. Subtotal $2,784 (93%). Lost & Found ≈ $216, mostly reclaimed via overflow (40 weeks × 2 × 5 Miles × $0.295 = $118), one Comeback Quest per rough week (12 × ~$5 = $60), and seasonal events (~$160/yr). **Net ≈ full $3,000.** ✅ This meets the brief: ~80–85% adherence earns the full planned vacation.

Even a "very rough year" funds a real (smaller) trip, so nobody "fails."

**Configurability:** every number scales linearly with `vacation_budget`. For $5,000 the personal weekly share becomes $41.83 and the Mile rate $0.49. No other changes are needed. The calibration knob is `weekly_target`: 80 is easier, 90 is harder.

---

## 3. The reward shop ("Nook's Cranny")

Two sections, two currencies.

### 3.1 Treat Jar items (priced in Bells, real money)
Funded by the weekly Treat Jar unlock (~$11.54/wk at full adherence ≈ $50/mo). Example price list (configurable):

| Item | Price | Notes |
|---|---|---|
| ☕ Fancy coffee date | $12 | |
| 🍦 Ice cream / dessert outing | $15 | |
| 🍕 Treat meal (takeout night) | $30 | |
| 🍣 Eating out (casual restaurant) | $50 | ≈ one month of the jar |
| 🎬 Movie date night | $35 | |
| 🍷 Nice dinner date | $100 | A saving-up goal (2 months) |
| 💆 Massage / spa voucher | $80 | |
| 🎟️ Custom item | user-defined | They add their own |

### 3.2 Miles items (non-monetary)
- **Island cosmetics:** furniture, paths, flowers, villager outfits, house upgrades.
- **Love coupons** (partner-to-partner, priced in Miles): "You pick the movie" (300), "Breakfast in bed" (800), "I do the dishes for a week" (1,200), "Back rub" (500). These build *relatedness* and are deliberately non-monetary.
- **Museum display cases** to show off collections.

### 3.3 Redemption flow
1. Browse the shop → tap item → "Buy for 3,000 Bells ($30)?"
2. **Joint purchases need the partner's tap** (a lightweight "Let's do it! 💕" confirmation). This prevents unilateral spending and makes buying a shared moment. Optionally, each person gets a small personal allowance within the jar for solo treats.
3. The item goes to the **Pocket** (inventory) as a ticket: "🍣 Sushi Night ticket."
4. When used, tap "We did it!", optionally add a photo, and it goes to the **Scrapbook** (a memory log, which is great for nostalgia at year end).
5. Real money: the treat jar balance is the "allowance" they spend from their normal card. The app only tracks it (ledger), consistent with 2.3.

**Rules:** Treat Jar Bells can be saved up indefinitely. Unspent treat money at year end can be moved to the vacation fund (a "spending money on the trip" bonus). Treat Jar money **cannot** be redeemed for unhealthy-diet-sabotaging items on a schedule. That's actually fine, because a treat meal is *healthy behavior* in moderation. We explicitly normalize planned treats.

---

## 4. Couple dynamics

### 4.1 Cooperative by design
- **One shared island, one shared vacation fund.** There is no head-to-head leaderboard by default. Individual stats are visible but framed as "our island's contributions" (two villagers working together), not ranked.
- **Together Bonus** (2.5) pays at the lower partner's rate, so helping your partner is literally worth money.
- **Joint quests:** "Walk 20 km together this week" (combined steps from both watches), "Both cook at home 4 nights," "Sunday walk together" (both log a walking workout in the same time window).
- **Double High-Five day:** when both hit their daily card, a special animation plays (villagers dance) plus a small Miles bonus.

### 4.2 Encouragement (support, not control)
- **High-fives** 🙌: one tap on the partner's completed habit. It sends a cute villager reaction. This is unlimited and costs nothing.
- **Send a Gift** 🎁: gift a cosmetic item (bought with your own Miles) to your partner's house.
- **Cheer Letter** ✉️: short message delivered in a bottle on the beach.
- **No "nudge your partner" button.** We deliberately don't build "Remind your partner to work out." Lewis & Rook and Bolger's invisible-support research suggests that monitoring and nagging backfire in couples. Encouragement is always positive and responsive to what they did, never pre-emptive pressure about what they haven't done.
- Partners can *see* each other's progress (relatedness), but there's an optional "private mode" for any habit (e.g. sleep).

### 4.3 The carry / help mechanic ("Lend a Hand")
When one partner is behind mid-week (e.g. Thursday and <50% of the pace needed), the *other* partner can see a gentle prompt: "Partner B could use a buddy this week 🌱. Plan a walk together?"
- **Buddy Workouts:** a workout both log at the same time (overlapping Apple Health workout windows) earns the *behind* partner **+50% Miles** for that workout. Help is "doing it together," not "doing it for them." That keeps it fair and makes the act of helping itself healthy.
- **Gift a Freeze:** a partner can give one of their streak freeze tokens to the other (max 2 per season).
- **What we do NOT allow:** transferring Miles or Bells between partners for the money economy. It would create "I subsidized you" resentment and muddy fairness.

### 4.4 Asymmetric fitness levels and body sizes

**Partner profiles (from the user):**

| | Partner A | Partner B |
|---|---|---|
| Sex / age | M / 29 | F / 26 |
| Height / weight | 175 cm / 66 kg | 153 cm / 55 kg |
| BMI | ~21.6 (healthy) | ~23.5 (healthy) |
| Goal framing | Maintenance, fitness, strength, cardio, habits | Maintenance, fitness, **strength (bone density long-term)**, cardio, habits |
| Fitness history | Unknown, so baseline from Health data at setup | Unknown, same |

**Why calorie-based goals would be unfair between them** (rough estimates for illustration):

| Same activity | Partner A (66 kg) | Partner B (55 kg) | Gap |
|---|---|---|---|
| 30-min brisk walk (~5.5 km/h) | ~110–140 active kcal | ~90–115 active kcal | B ≈ 17% less |
| 45-min strength session | ~150–200 active kcal | ~120–160 active kcal | B ≈ 15–20% less, plus a smaller muscle mass penalty in Watch estimates |
| Est. stride length (≈0.415 × height) | ~73 cm → ~1,370 steps/km | ~64 cm → ~1,580 steps/km | B takes ~15% more steps per km |
| Typical "default" Move goal Apple suggests | higher | lower | Not comparable |

Active energy scales roughly with body mass. If both had a "500 kcal" Move goal, Partner B would need ~20% more exercise time for the same Bells. That is an invisible tax that would breed exactly the resentment we're trying to avoid. Steps run slightly the other way (B's shorter stride racks up steps faster per km, though at similar steps per *minute* it roughly evens out). That's why steps are a small, baseline-set slot.

**Fairness rules:**
- **Personalized targets, equal points.** Everyone earns the same Miles for hitting *their own* goal. Scoring leans on **minutes, sessions, and sleep hours**, which are size-neutral. The Move ring is worth only 2 Miles/day and is set from *each person's own baseline*. This is the single most important fairness rule.
- **Never display kcal side by side.** The partner view shows **% of own goal** (rings/bars), never raw calories or step counts compared against each other.
- **Suggested starting targets (to be replaced by baseline data at setup; the fitness coach owns the progression):**

| Slot | Partner A | Partner B |
|---|---|---|
| Exercise minutes/day | 30 | 30 |
| Strength sessions/week (counted in the strength/mobility slot) | 2 → 3 | 2 → 3 (bone-density emphasis: progressive loading, impact work) |
| Mobility/yoga on non-strength days | ≥ 10 min | ≥ 10 min |
| Move goal | ~100–110% of own 4-week median active kcal | same rule (her number will be lower, which is fine) |
| Steps/day | 8,000 or own 60th-percentile day | 8,000 or own 60th-percentile day |
| Sleep | 7h asleep | 7h asleep |

- **Strength Wing:** a new museum section with fossils for 10/25/50/100 strength sessions, art pieces for personal bests if they log lifts. This gives Partner B's long-term bone-density goal visible progress.
- **Cardio / VO2 max:** Apple Watch VO2 max estimates (Cardio Fitness) are *not* scored, since they're noisy and slow-moving. Instead they appear as **seasonal informational feedback** ("Your Cardio Fitness rose from 38 to 41 this season! 🫀") and as museum art milestones. That's competence feedback with no stakes.
- **Equal money share.** Each person's weekly pool is identical ($25.10). Contribution is measured by *adherence to your own plan*, not absolute output.
- **Goal-setting from baseline.** At setup, pull 4–8 weeks of Health history. Suggest targets at about the person's 60th percentile day, so they're achievable but slightly stretching. Re-suggest each season based on recent data (the "competence ramp").
- **Different habit menus are fine.** One person might count yoga and sleep, the other runs and steps. The card structure stays the same.
- **Watch the "ratchet":** never auto-raise targets. Suggest increases only, and let the person accept them. Raising targets after success feels like punishment ("the reward for doing well is harder work").

### 4.5 Handling divergence and resentment
- If adherence gaps persist (e.g. one partner >20 points lower for 4+ weeks), the app does **not** highlight the gap. Instead, at the next weekly ceremony it privately suggests to the lower-adherence partner: "Want to make your targets cozier? 🍃" Fixing the system beats blaming the person.
- The settlement screen leads with the **combined** number ("Our island earned $53!"), with individual breakdowns one tap deeper.
- Season retros (5.3) include a joint, non-judgmental reflection prompt: "What helped us this season? What should we change?"

---

## 5. Game loops

### 5.1 Daily loop (~30–60 seconds)
1. **Open the app** → the island scene. Your villager (and pet) reacts to the day's data, which syncs automatically from Health. Morning shows sleep ("Well-rested! ☀️"). Evening shows movement.
2. **Collect:** completed habits appear as items to tap and collect (fruit falling from trees, shells on the beach) → Miles count up with a satisfying chime. *The manual "collect" tap is the daily ritual. Data is automatic, celebration is interactive.*
3. **Three one-tap diet check-ins** (evening).
4. **See the partner's island activity:** send a high-five.
5. **Daily "island tidbit":** a villager line, a tiny piece of lore, or a weather/season detail. This gives low-stakes novelty.

### 5.2 Weekly loop: the Sunday Settlement Ceremony
- **Sunday evening "Island Meeting"** (both partners, ideally together on the couch):
  1. Week recap: each person's card fills in, day by day.
  2. **Bells unlock animation:** Bells fly from the "Locker" into the **Vacation Fund jar** (a growing visual, e.g. a tiki jar or a boat being built plank by plank 🚤).
  3. Together Bonus + Treat Jar reveal.
  4. Lost & Found update (framed as "treasure waiting to be found," never as loss).
  5. **Island upgrade** unlocked from cumulative Miles (new bridge, shop expansion, new villager moves in).
  6. Weekly streak +1, plus any museum donations.
  7. Prompt: "Set one intention for next week?" (an optional implementation intention).
- **Monday:** "New Week on the Island" fresh-start message.

### 5.3 Seasonal loop (quarterly, 13 weeks)

| Season | Theme | Sample events (2–3 per season) |
|---|---|---|
| **Spring: "Blossom Season"** | Fresh start, new habits | *Cherry Blossom Walks* (step challenge, collect petals), *Garden Week* (veggie check-in streak grows a garden), *Spring Cleaning* (sleep consistency) |
| **Summer: "Sunny Season"** | Energy, outdoors | *Summer Swim* (water workouts or any cardio = "swims"), *Fishing Tourney* (each workout is a cast with a random catch; biggest fish wins a trophy), *Firework Fridays* (both close rings → fireworks) |
| **Autumn: "Harvest Season"** | Consistency, cooking | *Harvest Festival* (home-cooked meals → recipes for the museum), *Mushroom Hunt* (hidden collectibles on walks), *Bug-Off* (exercise minutes) |
| **Winter: "Cozy Season"** | Rest, sleep, gentleness | *Toy Day prep* (joint quests build gifts), *Snowboy Builder* (sleep streaks build a snowman), *Countdown* (New Year fresh start) |

Each season includes:
- **Season opener:** retune targets, clean streak slate, fresh-start bonus week.
- **One "tournament" event:** cooperative, the couple vs. a goal (e.g. "catch 50 fish together"), with a trophy for the museum.
- **Seasonal collectibles:** 10–15 limited items or critters. Missing some is fine, because they return next year (no FOMO punishment).
- **Season finale and retro:** a recap card with stats, a highlight photo from the Scrapbook, a reflection prompt, and a vacation-fund forecast.

Start the season calendar at whatever season they begin in.

### 5.4 Yearly loop: the vacation unlock
- A **progress landmark every month** ("1/12 of the way there! 🏝️"). Use a visual map: the boat or plane travels across an ocean toward the destination island as the fund grows.
- **Choose the destination early** (Season 1), and add a photo or mood board to the app. Vivid future goals strengthen motivation (the "future self" connection).
- **Big Unlock Day:** a final ceremony with confetti, the total, a year-in-review "museum tour," and a printable/shareable "Island Passport." Then "Payday at Nook's" moves the money.
- The **vacation itself** is a special event: auto-paused tracking, plus optional "Vacation Steps" fun stats (no stakes).

### 5.5 Collections, streaks, and surprise

**Museum (Blathers' collection):**
- **Fossils = milestones:** first 10k day, 100 workouts, 1,000 km walked lifetime, 30 sleep-goal nights.
- **Bugs and fish = variable catches** from workouts (a random critter appears, with rarity scaled lightly by workout length/type).
- **Art = personal bests:** longest walk, best week ever, most consistent month.
- **Recipes = cooking check-ins** (log a healthy home-cooked meal, optionally name it, and it becomes a recipe card).
- Collections are *informational competence feedback* in disguise: they turn history into something visible and lovable.

**Streaks with forgiveness:**
- **The primary streak is weekly:** "weeks at ≥ 70% of target," a gentler threshold than 100%.
- **Daily streaks exist only as soft, cosmetic counters** (no money attached) and show as "X of last 7 days," never as a fragile chain.
- **Freeze tokens ("Snowflakes" ❄️):** 1 earned per 4 successful weeks, max 3 banked. A missed week auto-uses a freeze.
- **Broken streak = "Best streak" is preserved and celebrated,** with a "start a new chain" message, never "you lost your 23-week streak."

**Variable/surprise rewards (use sparingly):**
- Gentle variable rewards (critter catches, a balloon present floating by about 1–2× per week, a rare villager visit) add delight. **Do not** build slot-machine loops, loot boxes with Bells, or variable *money* rewards. Money must stay predictable and fair. Variability lives only in cosmetics.
- Bonus surprise: an unannounced "Lucky Day" (double Miles, cosmetic only) about once a month.

---

## 6. Notifications and tone

### 6.1 Principles
- **Default: ≤ 1 notification per day**, configurable down to zero. Weekly ceremony reminder on Sunday.
- **Celebrate, invite, never guilt.** No "You haven't…", no red badges, no countdown pressure.
- **Respond to what happened.** Prefer celebrating completed actions over reminding about missing ones.
- **Quiet hours** and **sleep-aware** (never ping during sleep window).
- Reminder notifications (if enabled) are user-scheduled implementation-intention cues ("Your 7am walk 🌅") they configured themselves, which keeps them autonomous.

### 6.2 Example copy (villager voice)

**Celebration**
- 🐶 *"Wowee! Strength day done! Your bones say thank you, and so does the whole island, hm-hmm!"*
- 🐻 *"You closed your Move ring! The whole island felt that, hm-hmm!"*
- 🦉 *"Hoo! A new fossil for the museum: your 100th workout! I shall label it with great ceremony."*
- 🐱 *"You both hit your goals today! I'm doing a little dance, meow~"*

**Gentle invitation (instead of reminders)**
- 🐿️ *"The evening breeze is nice for a stroll, if you feel like it! 🌙"*
- 🐸 *"Ribbit! Did you eat something green today? Tap to tell me, no pressure~"*

**Weekly settlement**
- 🦝 *"Island Meeting time! This week you two unlocked 5,325 Bells for the vacation. Yes, yes!"*
- 🦝 *"A few Bells washed up in the Lost & Found. Don't worry, they're not going anywhere. Treasure hunt next week?"*

**After a rough week (fresh start, no guilt)**
- 🐑 *"Some weeks are cozy weeks. A brand-new week starts tomorrow. Want to set one tiny goal? 🌱"*
- 🐧 *"Rest is part of the routine. Your island is right here whenever you're ready."*

**Partner interactions**
- 💌 *"Partner A sent you a high-five for your morning run! 🙌"*
- 🎁 *"A present floated in from Partner B's house… it's a hammock! 🌴"*

**Copy never uses:** "failed," "missed," "lost," "behind," "lazy," "cheat day," "burn off," "earn your food," or body/weight commentary. Food is never framed as something to be earned or punished.

---

## 7. Honor system and burnout guardrails

### 7.1 Anti-cheating for two people who trust each other
The goal is **reducing temptation, not policing**.
- **Auto-tracked data is the backbone** (≈80% of daily Miles). Manual check-ins are limited to 3 per day at 1 Mile each, so the payoff from fudging is tiny.
- **Manual Health entries:** the data engineer can flag workouts entered manually rather than from Watch sensors (HealthKit exposes source and `HKMetadataKeyWasUserEntered`). These count for Miles, but default to *not* counting toward Bells unless the partner taps "👍 sounds good." It's lightweight, social, and not accusatory. Useful for forgot-my-watch situations.
- **Backfill window:** check-ins can be added up to 48h late (life happens), then lock at settlement.
- **Transparency:** both partners see each other's logs. Mutual visibility is a natural, gentle check.
- **"Honor pledge"** at setup: a cute one-time ceremony where both villagers sign the island charter. Commitment and consistency effects (Cialdini) apply, and it sets the tone.
- **No sabotage incentives:** because the economy is cooperative (shared fund, min-based together bonus), there's no gain from undermining your partner.

### 7.2 Anti-burnout and health guardrails
- **Daily Mile caps per habit.** No extra Bells for a 3-hour workout vs. 30 minutes. This removes incentives to over-exercise.
- **Overflow cap** (20 Miles/week) limits how much extra effort can be "monetized."
- **Rest is rewarded:** sleep earns Miles, and Cozy Days credit full settlement value.
- **Rest-day nudge:** after 10+ consecutive high-exercise days, the villager suggests rest ("Even Nook takes a day off!") and offers a free Cozy Day.
- **Injury and illness:** Pause Mode with no penalty (2.7).
- **No weight/calorie/body-shape scoring**, and no "cheat day" framing. This guards against disordered-eating patterns. Include an "If tracking stops feeling good, tap here" escape hatch that pauses the economy and hides numbers.
- **Targets never auto-increase** (4.4).
- **Notification budget** (6.1).
- **Quarterly check-in prompt:** "Is the app still fun? Anything feeling like a chore?" Then adjust.

---

## 8. Long-term: novelty over 12 months and life after year 1

### 8.1 Content cadence (keeping novelty alive)
Engagement with gamified health apps typically drops sharply after the first few weeks or months. Novelty has to be *scheduled*.

| Cadence | New content |
|---|---|
| Daily | Villager dialogue lines (need a pool of ~150+ lines, rotated with context), random critter catches |
| Weekly | Island upgrade, 1–2 new shop items, the ceremony |
| Monthly | New villager moves in (or a visitor: a Redd/Saharah/Kicks analog), Lucky Day, monthly landmark, new-moon micro-event |
| Seasonal | 2–3 events, 10–15 collectibles, seasonal island palette, season retro, target retune |
| Annual | Vacation unlock, year-in-review museum tour, new "Year 2" island area (e.g. a second island) |

**Pacing rule:** front-load *reward frequency* in the first ~10 weeks (habit formation, Lally's 66 days) and back-load *content variety* (months 4–12), when novelty matters most. Hold back about 30% of the cosmetic catalog for the second half of the year.

Since this is a private app for two, content can be **personalized**: inside jokes, their pet as a villager, their actual destination as the "dream island," anniversary events, their birthdays as fresh-start weeks.

### 8.2 After year 1
Options to present at Big Unlock Day:
1. **Year 2, new destination:** same system, with the stakes dial possibly turned down (smaller budget, or more cosmetic-forward). The unclaimed Lost & Found can roll in at 50% (2.6 option C).
2. **"Maintenance Mode" (the identity phase):** money mechanics off or minimal (e.g. treat jar only). The island, museum, and joint quests continue. This is the planned fade from extrinsic to intrinsic: the habits are now ~1 year old, well past the automaticity window.
3. **Rotating goals:** each year focuses on something new (e.g. year 2 = "Strength & Cooking," with different habit menus), which keeps competence growth alive.
4. **Archive mode:** the island becomes a keepsake with the Scrapbook, museum, and year-in-review, so the effort is memorialized rather than abandoned.

Recommendation: default to **Option 1 with a lighter money dial**, and offer Option 2 explicitly. Telling them on day 1 that "the money is training wheels" sets healthy expectations.

---

## 9. Hand-offs to other roles
- **Data/HealthKit engineer:** needs Move ring (plus active energy for baseline medians), exercise minutes, workout type (Strength Training, Yoga, etc.), Cardio Fitness/VO2 max (display only), steps, sleep (asleep duration), and workouts with start/end times (for Buddy Workouts) and source metadata (for manual-entry flagging). The day boundary is local midnight. Settlement runs Sunday 8pm local and locks Monday 00:00 plus the 48h backfill rule (late entries affect the *next* settlement as adjustments).
- **Backend/sync:** the ledger must be append-only and auditable (every Bell traceable to a week and rule). Config changes take effect at the next week boundary, never retroactively.
- **Visual designer:** key moments are the daily collect, the Sunday ceremony with the Bells-to-jar animation, the boat-to-destination map, the museum, and the Lost & Found (which must look like *treasure*, not debt).
- **Product lead:** decide the stakes dial default (2.6) and the floor option (2.7) with the users.

---

## 10. Open questions for the users
1. **Budget:** Is $3,000 vacation + $50/month treats right? Do you want the optional $400 Stretch Fund?
2. **Pre-funding:** Will you actually set aside the money on day 1 (strongest commitment device), or transfer monthly?
3. **Stakes:** Where should unclaimed money go at year end: Rainy Day savings (default), a charity you love, rolled into next year, or a split?
4. **Floor:** Do you want a guaranteed minimum trip (e.g. 30%), or pure "earn it all"?
5. **Diet habits:** Which 3 eating habits matter most to each of you?
6. **Visibility:** Comfortable with full mutual visibility, or should some metrics (sleep, specific check-ins) be private?
7. **Competition:** Would either of you enjoy *optional* friendly competition (e.g. a monthly step duel for cosmetics only), or keep it 100% cooperative?
8. **Destination:** Do you have a vacation in mind? Having it pictured from week 1 helps a lot.
9. **Start date:** When do you start? It sets the season calendar and the first fresh-start moment.
10. **After the year:** Gut feeling: continue with money, fade to island-only, or decide later?
11. **Baseline:** Can you both share 4–8 weeks of Apple Health history (or wear the Watch for 2 weeks before "Day 1") so targets start from your real baselines instead of placeholder numbers?
12. **Strength logging:** Is logging strength sessions as a Watch "Strength Training" workout realistic for you both, or do you want a one-tap "I lifted today" check-in as a fallback?
