# Fitness Coach Memo

**Role:** Fitness Coach | **Status:** Draft v1 for team review | **Date:** 2026-10-28

**Summary.** Reward *behaviors the guidelines say matter* (weekly active minutes, 2+ strength days, daily movement, sleep, sitting less, and taking rest), measured against **each person's own baseline**. Targets rise gradually toward the guideline ranges, then hold steady. Every week has a **points ceiling** so doing more is never better than doing enough. Most goals are **weekly**, so one bad day never ruins anything. Sick, travel, and low-energy days **pause** goals instead of costing points. Working out together earns a bonus.

### Who this is for

| | Partner A | Partner B |
|---|---|---|
| Sex / age | Male, 29 | Female, 26 |
| Height / weight / BMI | 175 cm / 66 kg / ~21.6 | 153 cm / 55 kg / ~23.5 |
| Implication | Healthy BMI. **No weight-loss goal.** Focus on fitness, strength, and habits. | Healthy BMI. **No weight-loss goal.** Strength emphasis, with **bone density** as the long-term angle. |
| Unknown | Activity history and fitness level, so the HealthKit baseline (§3) decides the starting numbers | Same |

Both are under 60, so the **step ceiling is 10,000/day** for both. Both are young, so the cardio and strength guidance in §6 assumes no medical limits (PAR-Q+ still runs at onboarding).

**Body-size fairness:** for the same 30-minute walk, Partner B burns noticeably fewer calories than Partner A, roughly 15–25% less from body mass alone, and the gap is bigger for running. With the default Move goals, their active-energy numbers will never be comparable. That's the main reason **no money is tied to calories or the Move ring**, and every goal is measured in **minutes, days, or % of each person's own baseline** (§2, §3.5).

---

## 1. Evidence base: what "healthy" means here

| Source | Adult recommendation | Verification |
|---|---|---|
| **CDC: Adults** (cdc.gov/physical-activity-basics/guidelines/adults.html) | "150 minutes of moderate-intensity physical activity a week", or "75 minutes of vigorous-intensity", or an equivalent mix. "At least 2 days of muscle-strengthening activity each week" that work "all major muscle groups (legs, hips, back, abdomen, chest, shoulders, and arms)". "You can spread your activity out during the week and break it up into smaller chunks of time." | Fetched 2026-10-28 |
| **ODPHP: Physical Activity Guidelines for Americans, 2nd ed. (2018), "Top 10 Things to Know"** | Adults need "at least 150 to 300 minutes" of moderate-intensity aerobic activity a week, plus muscle-strengthening "at least 2 days each week". "Move more and sit less." "Any amount of physical activity has some health benefits." | Fetched 2026-10-28 |
| **CDC: Older adults (65+)** | Same 150 / 75 / 2-day targets, *plus* "activities to improve balance". "Be as physically active as your abilities and conditions allow." "Some physical activity is better than none at all." | Fetched 2026-10-28 |
| **CDC: Adding activity** | "Talk to your doctor before starting vigorous-intensity physical activity if you have been inactive." | Fetched 2026-10-28 |
| **WHO Guidelines on Physical Activity and Sedentary Behaviour (2020)** | 150–300 min moderate **or** 75–150 min vigorous per week (or an equivalent mix). Muscle strengthening on 2+ days. Limit sedentary time. 65+: multicomponent balance and strength on 3+ days. | **Partly verified.** The WHO fact sheet confirms "at least 150 minutes" of moderate activity and "limit the amount of time being sedentary", and the publication page confirms the 2020 date. The full PDF (iris.who.int) returned **403**, so the 75–150 vigorous range and the 65+ details come from my own knowledge of the document. The ODPHP and CDC PDFs were too large or not readable as text here. |

**Supporting evidence used for secondary targets (not fetched, from coach knowledge):**
- **Steps:** Paluch et al., *Lancet Public Health* 2022 (meta-analysis of 15 cohorts). The drop in mortality risk levels off at about 6,000–8,000 steps/day for adults 60+ and about 8,000–10,000 for adults under 60. **So step targets stop rising at about 10k.**
- **Sleep:** AASM/SRS consensus (2015) and the CDC recommend **7+ hours** a night for adults. More than about 9 hours isn't a goal.
- **Progression:** "Increase gradually" is standard ACSM advice. The "10% rule" is a rule of thumb, not hard science, so we use it as a cap, not as a formula.

**Design consequences**
1. The main aerobic goal is **weekly minutes**, building toward **150** and stopping at **300**. Past 300 there's no extra money.
2. **Strength on 2 days a week** is its own goal, because aerobic activity doesn't replace it.
3. "Sit less" and "any amount helps" justify a small reward for daily movement and standing.
4. Vigorous minutes could count double (75 vigorous = 150 moderate). That's **optional for v2**, because Apple's Exercise minutes already count brisk-walk effort or higher. See §2.

---

## 2. Which Apple Watch / Health metrics to reward

### Reward (behaviors you control)

| Metric (HealthKit) | Why | Caveats |
|---|---|---|
| **Exercise minutes** (`appleExerciseTime`) | Closest automatic match to "moderate-or-vigorous minutes". Apple counts movement at brisk-walk level or harder. Works for every kind of activity. | Counts brisk walking, which is fine because brisk walking *is* moderate activity. Can't tell 150 moderate from 150 vigorous minutes, which is acceptable for v1. |
| **Strength workouts** (`HKWorkout` by activity type) | The only automatic way to detect the 2-day strength guideline. | Needs the person to start a workout (one tap on the Watch). See the type list below. |
| **Steps** (`stepCount`) | Captures everyday movement and the "sit less" message. Easy to understand. | Penalizes cycling, swimming, and strength days. Overweights walking. So it's a **secondary** goal with a capped target. Wheelchair users: use `pushCount`. |
| **Sleep duration** (`sleepAnalysis`, all asleep stages added up) | Sleep drives recovery, appetite control, and mood. It's a real health behavior. | Only works if the Watch is worn at night. Suggest charging it during the morning shower. Reward **time asleep and regularity**, not sleep stages. |
| **Stand hours** (`appleStandHour`) | Direct proxy for "sit less". | Low weight. Easy to game by waving an arm, but harmless. |
| **Workout overlap between partners** | Couple bonus (§5). | Overlap detection rules are in §5. |

### Track and show, but do NOT pay for

| Metric | Why not pay |
|---|---|
| **Active energy / Move ring calories** | Bigger and heavier people burn more for the same effort, which is **unfair between partners**. Rewarding calories pushes toward "burn more = better", leads to compensatory eating and overtraining, and Watch calorie estimates are error-prone (studies often find errors of 20%+). The Move ring goal can also be set by the user, which makes it trivial to game. |
| **Closing all three rings** | Daily all-or-nothing streaks punish rest days and sick days, which is exactly the anxiety we're avoiding. Fine as a badge for fun, not for money. |
| **Resting HR, HRV, VO2 max** | These are **results**, not behaviors. They're noisy and partly genetic, and you can't directly "try harder" at HRV. Rewarding them invites anxiety. Use them for **insights and recovery guardrails** (§4). Celebrate a VO2 max improvement each season with a badge, not money. |
| **Sleep stages (deep/REM)** | Watch stage tracking is approximate, and you can't control your stages. Chasing them causes "orthosomnia" (anxiety about sleep scores). |
| **Distance / pace / flights climbed** | Favors runners and fitter people. Good for fun stats and shared quests, not for core pay. |
| **Body weight / BMI / body fat** | **Do not reward weight change.** It encourages crash dieting and dehydration tricks, it's unfair between people, it isn't behavior, and it can do psychological harm (disordered eating risk). Fluctuations from water and menstrual cycles make weekly targets meaningless. If someone wants to track weight, keep it **private to that person**, never shown to the partner, never tied to money, and show trends only (e.g., a 7-day average). |

### Strength workout detection

- **Always counts:** `traditionalStrengthTraining`, `functionalStrengthTraining`, `coreTraining`, `pilates`.
- **Counts after a one-time confirmation ("Did this include strength work? Yes / No"):** `highIntensityIntervalTraining`, `crossTraining`, `yoga`, `climbing`, `barre`, `mixedCardio`. Remember the answer per workout type and source app so it isn't asked every time.
- **Minimum:** at least 15 minutes. **At most one strength credit per calendar day** (guideline is "days").
- **Duplicates:** if two apps (e.g., Strava and the Workout app) log the same session, merge workouts that overlap by more than 50%.
- **Manual entries:** workouts added by hand with no heart-rate samples count, but are marked "manual" so the partner can see. We trust each other, but we keep it visible.

---

## 3. Personalized baselines and progression

### 3.1 Getting a baseline
1. **Use HealthKit history first.** Pull the **previous 8–12 weeks** at onboarding. Baseline = the **median** week (for weekly metrics) or median day (for steps, sleep, stand). Medians aren't distorted by one huge hike or a sick week.
2. **Two-week calibration** (always runs; it's the only data source if there's under 4 weeks of history). Points are paid at a flat "participation" rate (e.g., 60% of max for wearing the Watch at least 20 hours a day). People change their behavior when observed, so if calibration is more than 30% above history, use the **average of the two**, so the first targets aren't too hard.
3. **Safety check at onboarding:** a short PAR-Q+ style questionnaire (heart condition, chest pain, dizziness, joint problems, pregnancy). If any answer is yes, show "check with your doctor before adding vigorous activity". Walking-based targets stay available.

### 3.2 Turning a baseline into targets

| Metric | First target | Floor | Ceiling (stops rising) |
|---|---|---|---|
| Weekly exercise minutes | baseline × 1.10, rounded up to the nearest 5 | 60 min/wk | **300 min/wk** |
| Strength days/wk | 1 if baseline is 0, else 2 | 1 | **2, or 3 if opted in from Season 3.** Always worth 20 points total (§6.3) |
| Daily steps (goal is "days hit") | baseline × 1.05 | 3,000 | **10,000** (8,000 if 60+) |
| Sleep (goal is "nights hit") | min(baseline + 15 min, 7h) | 6h | **7h** asleep (adjustable to 7.5h, never above) |
| Stand hours (goal is "days hit") | min(baseline, 10) | 6 | 12 |

### 3.3 Progression over 12 months: four 13-week "Seasons"

The yearly cycle: **Season 1 Spring Sprout → Season 2 Summer Bloom → Season 3 Harvest → Season 4 Snowfall.**

Each season splits into 3 blocks of 4 weeks plus a transition week:

```
Wk 1-3 build | Wk 4 EASY | Wk 5-7 build | Wk 8 EASY | Wk 9-11 build | Wk 12 EASY | Wk 13 RECOVERY + re-tune
```
- **Easy weeks:** target × 0.80. **Recovery week:** target × 0.60. These still pay **full points** if met. Rest is part of the plan, not a break from it.
- **Step size per 4-week block** (applies only if the previous block went well, see 3.4):
  - **Below 150 min/wk:** the larger of **+10%** or **+10 min/wk**. A flat 10% is too small in absolute terms for beginners. At 60 min/wk, 10% a quarter would never reach 150 within the year.
  - **150–300 min/wk:** about **+5–8% per season** (raised at season start only), up to 300.
  - **At the ceiling:** hold. The goal becomes "maintain", and variety quests keep it interesting.
- Steps rise about 250–500/day per season up to the ceiling. Sleep rises 15 min per season up to 7h.

### 3.4 Adaptive rules: hit, hold, or step back
At the end of each 4-week block, count how many weeks the goal was met (easy weeks count as met if their reduced target was hit; paused weeks are left out):

| Weeks met in block | Action |
|---|---|
| 3–4 of 4 | **Advance** to the next step |
| 2 of 4 | **Hold** the current target |
| 0–1 of 4 | **Step back** 10% ("re-tuned to fit your life"), with no penalty message |

- **Plateau** (held for 2 blocks in a row): offer a choice of (a) swap modality ("try 2 bike rides instead of 1 walk"), (b) a different time of day, (c) keep the target where it is for a season. Never raise a target automatically if the person is stalled.
- **Way ahead of target** (more than 150% of target for 3+ weeks): offer to move them to the next tier *early*, but **only if they opt in**.
- People can **always lower their own targets** (with a soft confirmation). Fairness comes from the cap structure, not from forcing hard targets.

### 3.5 Fairness between partners
- Every goal pays a **percentage of the person's own target**, so a beginner walking 70 min/wk and a runner doing 250 min/wk earn **the same max points**.
- No leaderboards on absolute numbers. The app compares each of you to **your own last season**.
- Calorie metrics are excluded (body-size bias). Step ceilings are age-adjusted.

---

## 4. Rest, recovery, illness, travel, low-energy days

### 4.1 Mechanics

| Mechanic | How it works | Limit |
|---|---|---|
| **Sick day** | One tap. Removes the day from all weekly targets pro-rata (target × (7 − paused days)/7). Sleep goal stays (sleep helps recovery) but at a reduced count. | No hard cap. It's honor system and visible to the partner. More than 7 days in a row turns into a **Pause week**. |
| **Pause week** (illness, injury, family stuff) | Week is skipped completely: no points, no penalty, progression **frozen**. On return, targets restart at **80%** of the previous level for 1 week (×0.8), then resume. | After more than 3 weeks paused, return at 70% and redo a mini 1-week check. |
| **Low-energy / gentle day** (period symptoms, bad night, stress, for anyone) | Turns the day into a recovery day: no movement targets, and 10 minutes of walking, yoga, or stretching earns that day's daily-goal credit. Never labeled by gender. If the person opts in, menstrual cycle data from Health can trigger a *suggestion*, which stays private. | 4 per month |
| **Travel mode** | Steps and stand goals stay. Exercise and strength targets drop to 60% for the trip. Detected by time-zone change or toggled on. | Unlimited, including the vacation itself. |
| **Injury mode** | Shows modality-safe alternatives (e.g., upper body only, or swim instead of run) and lowers targets to 50%. Suggests seeing a professional if it lasts more than 2 weeks. | Same as Pause rules |

### 4.2 Rest days count positively
- **Recovery points (weekly):** paid if the week includes at least 1 day with **no workout over 20 min at high HR** (or 2 such days when the weekly target is over 250 min). Easy walking is fine on recovery days.
- **Weekly streaks, not daily ones.** A streak counts weeks with at least 80% of points. Each person gets **2 streak freezes per season**.

### 4.3 Overtraining guardrails (more is not better)
1. **Weekly points cap:** 100 per person (see §7). Going past 100% of target pays **0 extra points**. It earns a cosmetic badge at most.
2. **Daily minutes cap:** exercise minutes counted toward the weekly goal are capped at **max(60, 50% of weekly target)** per day. A 3-hour hike still gets "adventure" badges.
3. **Load spike warning:** if this week's minutes exceed **1.3× the 4-week average** (a rough acute:chronic load rule of thumb), show a gentle message. No penalty.
4. **Recovery flags (from data we don't pay for):** resting HR **≥ 7 bpm above the 30-day baseline for 2 or more days**, or HRV well below baseline (below baseline − 1 SD for 3 days), or under 6h sleep for 3 nights → the app **suggests** a gentle day or a sick day: "Your body may be fighting something."
5. **No dieting + hard training combo:** the nutrition rules must not reward big calorie deficits on high-training weeks. That's a RED-S / under-fueling risk. *(Flag for Nutritionist.)*
6. **Stop signs:** onboarding and help screens list chest pain, fainting, and unusual shortness of breath as reasons to stop and get medical care. Also: don't train through sharp pain.

---

## 5. Couple and joint activities

### 5.1 Detecting a workout together
Count a **joint workout** when both partners have workouts where:
- the overlapping time is **≥ 20 minutes** *and* at least **60% of the shorter workout**, and
- the start times are within **15 minutes** of each other.
- Activity types can differ (e.g., she runs, he bikes alongside).
- Location isn't checked, for privacy and simplicity. Trust plus visibility is enough.
- Optional "virtual together" mode: a long-distance workout at the same time counts if both tap "together".

### 5.2 Couple rewards

| Reward | Rule | Points |
|---|---|---|
| **Joint workout bonus** | Per detected joint workout | +5 each, **max 3/week** |
| **Team week** | Both people reach at least 80% of their own weekly points (a paused partner counts as met, so one person's illness never costs the other) | +10 each |
| **Monthly shared quest** | Measured as a **combined % of personal targets**, never absolute numbers. Examples: "Together, complete 200% of your strength targets", "4 joint walks after dinner", "Try 1 new activity together", "Hike a new trail", "Sleep goal 20 of 30 nights each" | +20 each, once a month |
| **Season finale** | Both finish the season with at least 9 of 13 weeks at 70%+ | Bonus deposit (lead sets the $ amount) and an unlockable cosmetic |

No head-to-head competitions that pay money. Friendly "who closed more weeks" stats are opt-in and cosmetic only.

---

## 6. Personalized plans: Partner A and Partner B

> **Activity history is still unknown.** The numbers below use **placeholder baselines**, picked to show two *different* starting points. On day 1 the HealthKit baseline (§3.1) replaces them, and the same rules produce the real targets. If Partner B turns out to be the more active one, the tables simply swap.

### 6.1 Starting tier from the measured baseline (applies to both)

| Baseline exercise min/wk | Tier | Starting min target | Strength days to start | Cardio focus in Season 1 |
|---|---|---|---|---|
| < 90 | Starter | baseline × 1.1 (min 60) | 1 → 2 by month 2 | All easy/moderate (walk, jog-walk, easy bike) |
| 90–149 | Builder | baseline × 1.1 | 2 | Easy/moderate, plus 1 brisk hill walk |
| 150–220 | Active | baseline × 1.05 | 2 | 80% easy, 1 tempo session |
| > 220 | Athletic | baseline (maintain) | 2–3 | 80% easy, 1 interval session |

### 6.2 Intensity guide, personalized
CDC (verified): moderate = effort "5 or 6" out of 10, or you "can talk but not sing". Vigorous = "7 or 8", only a few words between breaths. Heart-rate ranges below are approximate, using the ACSM convention (moderate about 64–76% of max HR, vigorous about 77–93%) and the Tanaka formula for max HR (208 − 0.7 × age). This is coach knowledge, not fetched this session. These are used only for coaching text and the optional v2 vigorous credit, never for money.

| | Est. max HR | Moderate | Vigorous |
|---|---|---|---|
| Partner A (29) | ~188 bpm | ~120–143 bpm | ~145–175 bpm |
| Partner B (26) | ~190 bpm | ~122–144 bpm | ~146–177 bpm |

Formula estimates can be off by ±10 bpm or more. After a few months, the app can switch to each person's observed peak HR.

### 6.3 Strength progression (same structure for both, loads are personal)

| Season | Sessions/wk (paid target) | Session | Focus |
|---|---|---|---|
| S1 Sprout: Foundation | 2 (Starter: 1 in month 1) | 25–35 min full body | Learn the patterns: squat, hinge (RDL / hip thrust), push (incline push-up → push-up), pull (row), carry, plank. 2–3 sets × 8–12 reps, finishing each set with 2–3 reps left in the tank. |
| S2 Bloom: Build | 2 | 35–45 min | **Progressive overload:** once every set reaches the top of the rep range, add the smallest load step (~2.5–5%). |
| S3 Harvest: Strength | **3 if opted in** (else 2) | 35–45 min | Main lifts go heavier (5–8 reps). Add single-leg work. Split upper/lower/full. |
| S4 Snowfall: Consolidate | 2–3 | 30–45 min | Maintain, then do an optional "season test" (e.g., max push-ups, 5-rep goblet squat, plank hold) to compare with S1. The result is a badge, not money. |

The strength points stay at **20 per week no matter what**. They're split across the target number of days (2 days = 10 each, 3 days = ~6.7 each). Choosing 3 days never earns more, so adding a third day is purely for health.

**Partner B: bone density.** Bone mass peaks around the late 20s to about 30, so at 26 Partner B is near the end of the window for building bone. After that, the goal becomes keeping it. The strongest evidence-backed stimuli are (a) **progressive, reasonably heavy resistance training** that loads the hips and spine (squats, deadlifts/hinges, lunges, carries) and (b) **short bursts of impact** (jumps, skipping, hopping, jogging). Plan:
- S1: 10–20 low jumps or skips in the warm-up on strength days.
- S2: 20–40 jumps (squat jumps, jump rope), 2–3 days/wk.
- S3–S4: 40–60 jumps across 3+ days/wk, plus heavier lower-body lifts (5–8 reps).
- Detection: `jumpRope`, `running`, and some HIIT workouts count automatically. Otherwise a one-tap "included jumps" chip appears on the strength-workout confirmation.
- *For the nutritionist:* calcium, vitamin D, protein, and especially **eating enough overall**. Under-fueling (low energy availability) is a well-known cause of bone loss in young women, which is one more reason this app must never reward weight loss.

**Partner A** gets the same strength plan. Long-term benefits for him: keeping muscle mass, injury resilience, and metabolic health. He can pick the parallel "Engine Builder" cardio quest (§6.4) or the Bone Builder quest. Both are available to either partner.

### 6.4 Cardio and VO2 max progression
| Season | Aerobic structure |
|---|---|
| S1 | All easy/moderate ("talk-but-not-sing"). One outdoor walk or run of **20+ min** per week so the Watch keeps updating the **Cardio Fitness (VO2 max)** estimate (it needs outdoor walk/run/hike workouts with GPS and HR). |
| S2 | About 80% easy. Add 1 harder session/wk: 15–20 min of hills or tempo. |
| S3 | About 80% easy. 1 interval session/wk, e.g., **4 × 4 min hard (vigorous zone) with 3 min easy between** (the "Norwegian 4×4"). Starters can use 6–8 × 1 min hard / 2 min easy instead. |
| S4 | Maintain. Joint goal event before the vacation: a **5K together or a long hike** (shared quest). |

**VO2 max is shown, not paid** (§2). Use Apple's own Cardio Fitness levels, which are already adjusted for age and sex, so A and B are each compared with their own group. **Badge:** move up one Apple level, or improve the estimate by about 3 ml/kg/min over the year. Untrained young adults commonly gain 5–15% with consistent training.

**Personal focus quest** (monthly, either partner, pick one per season): **Bone Builder** (12+ impact days a month) or **Engine Builder** (4 interval or tempo sessions a month plus at least 1 outdoor run or walk per week). Worth +10 points per month and equal for both (rule P1 in §7).

### 6.5 12-month plan: Partner A (placeholder baseline: Builder, 120 min/wk, 7,000 steps, 1 strength day, sleep 6h45)
Build-week targets. Easy weeks ×0.8, week 13 ×0.6.

| Month | Season | Exercise min/wk | Strength | Cardio focus | Steps/day (days hit, 5/wk) | Sleep |
|---|---|---|---|---|---|---|
| 0 | Calibration (2 wk) | measure | — | — | — | — |
| 1 | S1 | 135 | 2 × foundation | easy + 1 outdoor 20-min | 7,500 | 7h00 |
| 2 | S1 | **150** (guideline reached) | 2 | easy | 7,500 | 7h00 |
| 3 | S1 | 150 | 2 | easy | 7,500 | 7h00 |
| 4 | S2 | 160 | 2 × build | +1 hill/tempo | 8,000 | 7h00 |
| 5 | S2 | 160 | 2 | +1 hill/tempo | 8,000 | 7h00 |
| 6 | S2 | 160 | 2 | +1 hill/tempo | 8,000 | 7h00 |
| 7 | S3 | 175 | 3 (opt-in) × strength | +1 interval (4×4) | 8,500 | 7h00 |
| 8 | S3 | 175 | 3 | +1 interval | 8,500 | 7h00 |
| 9 | S3 | 175 | 3 | +1 interval | 8,500 | 7h00 |
| 10 | S4 | 185 | 3 × consolidate | maintain + 5K prep | 9,000 | 7h00 |
| 11 | S4 | 185 | 3 | maintain | 9,000 | 7h00 |
| 12 | S4 | 185 (vacation = travel mode) | 2–3 | 5K / long hike together | 9,000 | 7h00 |

### 6.6 12-month plan: Partner B (placeholder baseline: Starter, 75 min/wk, 6,000 steps, 0 strength days, sleep 7h00)

| Month | Season | Exercise min/wk | Strength (+ bone loading) | Cardio focus | Steps/day (days hit, 5/wk) | Sleep |
|---|---|---|---|---|---|---|
| 0 | Calibration (2 wk) | measure | — | — | — | — |
| 1 | S1 | 85 | 1 × foundation, 10–20 jumps | easy + 1 outdoor 20-min | 6,250 | 7h00 |
| 2 | S1 | 95 | 2 × foundation | easy | 6,250 | 7h00 |
| 3 | S1 | 105 | 2 | easy | 6,250 | 7h00 |
| 4 | S2 | 115 | 2 × build, 20–40 jumps | +1 hill walk | 6,750 | 7h00 |
| 5 | S2 | 125 | 2 | +1 hill walk | 6,750 | 7h00 |
| 6 | S2 | 135 | 2 | +1 hill / jog-walk | 6,750 | 7h00 |
| 7 | S3 | **150** (guideline reached) | 3 (opt-in) × strength, 40–60 jumps | +1 interval (6×1 min → 4×4) | 7,250 | 7h00 |
| 8 | S3 | 150 | 3 | +1 interval | 7,250 | 7h00 |
| 9 | S3 | 150 (consolidate) | 3 | +1 interval | 7,250 | 7h00 |
| 10 | S4 | 160 | 3 × consolidate | maintain + 5K prep | 7,750 | 7h00 |
| 11 | S4 | 160 | 3 | maintain | 7,750 | 7h00 |
| 12 | S4 | 160 (vacation = travel mode) | 2–3 | 5K / long hike together | 7,750 | 7h00 |

These are planned paths. The adaptive rules (§3.4) will hold or re-tune a month when life happens. Partner A ends at about 185 min/wk and Partner B at about 160, but **both earn the same points** for hitting their own targets.

### 6.7 Sample week: Partner B, Month 4
Targets: 115 min, 2 strength days, steps ≥ 6,750 on 5 days, sleep ≥ 7h on 5 nights.

| Day | Activity (automatic) | Counts toward | Notes |
|---|---|---|---|
| Mon | 25-min brisk walk at lunch. 7,200 steps, slept 7h10 | 25 min, steps ✓, sleep ✓ | |
| Tue | 35-min Functional Strength with 30 jumps (Watch credits 22 exercise min). 6,100 steps, 6h40 | 22 min, strength 1/2, Bone Builder day | Step and sleep goals missed, no problem |
| Wed | Rest. 6,900 steps, 7h15 | steps ✓, sleep ✓, **recovery ✓** | Rest day pays |
| Thu | 30-min walk **together** with Partner A (28 min overlap). 7,400 steps, 7h05 | 30 min, steps ✓, sleep ✓, **joint +5** | |
| Fri | Period cramps, low energy → **gentle day**: 10-min yoga | gentle-day credit | Weekly targets × 6/7 |
| Sat | 45-min bike ride together, then 30-min strength in the evening (Watch credits 20). 6,800 steps, 7h20 | 65 min logged, **60 counted** (daily cap), strength 2/2, **joint +5** | |
| Sun | 20-min outdoor jog-walk (updates VO2 max). 8,000 steps, 7h00 | 20 min, steps ✓, sleep ✓ | |

**Result:** 157 min counted against an adjusted target of ~99 (115 × 6/7), capped at 100% → 40. Strength 2/2 → 20. Steps on 5 days → 15. Sleep 5 nights → 10. Active days 5 → 5. Stand 4/5 → 4. Recovery → 5. **= 99/100**, plus **10 joint points**, plus **10 team-week points** if Partner A reaches 80+.

---

## 7. Rule proposals: per-person weekly scoring (max 100 points)

All thresholds are relative to the person's current target (§3). Weekly goals are pro-rated for sick, gentle, and paused days.

| # | Metric (source) | Threshold | Frequency | Points | Notes |
|---|---|---|---|---|---|
| 1 | **Exercise minutes** (`appleExerciseTime`) | Weekly total ≥ personal target (daily cap applies) | Weekly | **40** (0 below 50% of target; linear from 50% to 100%; capped at 100%) | Main goal. Rises toward 150, stops at 300 |
| 2 | **Strength days** (workout types, §2) | Distinct days with a strength workout of ≥ 15 min, vs. target (1–3) | Weekly | **20**, split evenly across the target days | Days above target = badge only. Opting into 3 days never pays more |
| 3 | **Daily movement** (`stepCount`) | Days with steps ≥ personal step target | Weekly (count of days) | **15** (3/day, max 5 days) | 2 days off built in |
| 4 | **Sleep** (`sleepAnalysis`) | Nights asleep ≥ personal sleep target (up to 7h) | Weekly (count of nights) | **10** (2/night, max 5) | Optional v2: +bonus for bedtime within ±45 min of personal median |
| 5 | **Active days** (`appleExerciseTime`) | Days with ≥ 10 exercise min | Weekly | **5** (needs ≥ 4 days) | Rewards spreading activity out (CDC "spread it out") |
| 6 | **Sit less** (`appleStandHour`) | Days with stand hours ≥ personal target | Weekly | **5** (1/day, max 5) | |
| 7 | **Recovery** | ≥ 1 day with no hard workout over 20 min (≥ 2 days if target > 250) | Weekly | **5** | Rest counts as success |
| | **Personal total** | | | **100 max** | Hard cap |
| C1 | Joint workout (§5.1) | Overlap ≥ 20 min and ≥ 60% of shorter | Per event | +5 each, max 3/wk | |
| C2 | Team week | Both ≥ 80 personal points (paused partner = met) | Weekly | +10 each | |
| C3 | Monthly shared quest | Combined % of personal targets | Monthly | +20 each | |
| C4 | Season finale | Both ≥ 9 of 13 weeks at ≥ 70 points | Quarterly | Lead/Economist sets $ | |
| P1 | Personal focus quest (§6.4): Bone Builder or Engine Builder | Monthly quest criteria met | Monthly | +10 | Same value for both partners |
| X | Calibration participation | Watch worn ≥ 20 h/day | Daily, weeks 1–2 only | 60% of max, flat | |

**Money mapping is for the lead/finance role to decide.** For scale: if 100 points = $10, a strong year (about 85 points/week average per person, plus about 15 couple points) adds up to roughly **$2,000+** for the fund. Smaller treats (meals out) could unlock on streak milestones, e.g., 4 weeks in a row at 80+ points = a dinner out.

---

## 8. Notes for other roles
- **Engineering:** read HealthKit daily/weekly statistics in the user's local time zone. Steps need source priority (Watch over iPhone) to avoid double counting. Workout duplicates need merging. Sleep "asleep" = core + deep + REM + unspecified. Recompute the past 7 days for late Watch syncs before closing a week (close weeks on Monday at noon, not midnight Sunday).
- **Nutritionist:** both partners have a healthy BMI, so the goal is **maintenance and fueling performance**, not a deficit. Don't combine calorie-deficit rewards with high-training weeks. Don't use weight in rewards. Partner B's bone goal needs enough total energy, calcium, vitamin D, and protein.
- **Designer:** language like "re-tuned", "rest is progress", "paused" — never "failed" or "lost streak".

---

## Open questions for the user
1. Any injuries, medical conditions, or pregnancy plans in the next year? (These affect impact loading and intensity work, especially Partner B's bone/jump plan.)
2. Roughly how active is each of you now, and do you have any strength-training experience? (Until calibration, this only changes the placeholder tables in §6.)
3. Do you have access to weights or a gym, or should strength sessions assume bodyweight plus dumbbells at home?
4. Would you like a joint event in Season 4 (a 5K or a long hike) as a pre-vacation milestone?
5. Will you both wear the Watch while sleeping? If not, sleep points need a different source or should be dropped.
6. How much are you willing to tap for strength workouts (start a Workout on the Watch)? Is a one-tap "was this strength?" prompt acceptable?
7. Do you want vigorous minutes to count double (75 vigorous = 150 moderate)? It's more accurate to the guidelines but more complex.
8. Should sick and gentle days be fully honor-system and visible to the partner, or capped?
9. Should menstrual-cycle data from Health be used (opt-in, private) to suggest gentle days?
10. Should weight be tracked at all? (Recommendation: no, or private only with no money attached.)
11. Points-to-dollars rate and yearly fund goal? (These set how motivating each point feels.)
