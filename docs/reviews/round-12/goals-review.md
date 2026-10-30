# Round 12: goals review (strength coach, dietitian, behaviour designer)
**Date:** 2026-10-30. **Scope:** the targets in ADR 0019 and its amendment, `app/src/lib/config/rules.ts`, `scoring/bells.ts`,
the あそびかた text and `docs/profiles.md`, against the couple's goal: lose about 4 kg each, gain major muscle by the wedding on
**2027-10-08**, then keep it forever. **Evidence used:** ウェイ's 33 days (28 Sep – 30 Oct 2026); うめ has no data yet.
No code was changed.

**Bottom line.** The *direction* is right: walking, strength, protein and veg are the right levers for recomposition. The
*calibration* is not. As written, the game asks for a full-intensity programme from week 1 and holds it for 49 weeks
without rest or phases. It prices the year as if both people hit every badge every week. And it has two rule gaps that
make the strength badge hard to earn for the very behaviour it is meant to reward. ウェイ's current data is about
**20% of the on-target pace**, so trips are priced for a year he isn't yet on track for.

---

## 1. Strength and conditioning coach

**Recomposition is realistic for both of you, but not symmetrically.** Untrained or detrained people can lose fat and
gain muscle at the same time (Barakat et al. 2020, *Strength Cond J*). That works best with progressive resistance training
2–4×/week, a small energy deficit and high protein. Realistic expectations for 49 weeks of good adherence:
- **ウェイ:** +2–4 kg lean mass and −3–5 kg fat.
- **うめ:** +1–2 kg lean mass and −4–5 kg fat. Women gain roughly half the absolute muscle men do.

So the scale moves less than you expect, especially for ウェイ, who is already mid-normal BMI. "−4 kg *and* major
muscle" is the right goal for うめ. For ウェイ, the honest target is **waist down 3–5 cm, weight −1 to −3 kg, lifts
up a lot**. Judge his year by waist and strength, not the scale.

**Activity (🍑 45 min, 🍎 8,000 steps).**
- WHO 2020 recommends 150–300 min/week of moderate activity plus muscle-strengthening on ≥2 days.
- ACSM (Donnelly et al. 2009) puts >250 min/week as the dose for meaningful weight loss and for preventing regain.
- 45 min × 5 days = 225 min, which is a sound build-phase target.
- 8,000 steps matches 健康日本21 (第三次) and the MHLW 身体活動・運動ガイド2023 adult target. Mortality benefit flattens
  around 8,000–10,000 under 60 (Paluch et al. 2022, *Lancet Public Health*). Keep 8,000.
- **The problem is the data, not the dose.** Without the Watch, minutes only come from steps *above* 8,000 at 100/min.
  ウェイ's median day (7,579 steps) earns 0 minutes, and a 45-minute day needs 12,500 steps, which he managed on
  about 5 of 33 days.
- The Watch also under-credits lifting: a 45-minute weights session often logs only 20–30 exercise minutes, because
  heart rate stays low between sets. So on a strength day the 🍑 goal and the 🥥 goal fight each other.
- **Fix:** count a strength workout's duration as a minute source (inside the existing max, never a sum), and ramp
  the 5-day badge in rather than starting there.

**Strength (🥥 3 days, ≥15 min) is the right frequency, but too loosely specified for "major muscle".**
- ACSM's 2009 progression position stand and NSCA guidance both support 2–3 full-body sessions/week for novices,
  with progressive overload.
- Hypertrophy tracks weekly hard sets: about 10+ sets per muscle per week (Schoenfeld et al. 2017), with each muscle
  trained ≥2×/week (Schoenfeld et al. 2016).
- A 15-minute Pilates or "functional" session can't deliver that, and Pilates is in `autoTypes`. Raise the workout
  minimum to **30 min** and move Pilates to `askTypes`.
- **Rule gap:** confirmed gym visits are capped at 2/week, but the badge needs 3. If ウェイ goes to Anytime Fitness
  three times without starting a Watch workout, the third visit doesn't count and the badge fails. Either mark his gym
  `autoStrength` (as うめ's PT studio is) or raise the cap to 3.
- **Progressive overload** can't be measured from HealthKit. Don't build a lift logger. Instead:
  - ウェイ should follow a written 3-day full-body programme (squat or leg press, hinge, push, pull, carry; 3 × 8–12;
    add reps, then load).
  - うめ already has a PT.
  - Every 4 weeks, record one benchmark per lift in Notes. This is a process the couple runs, not a rule.

**Recovery.** Removing the rest-day bonus is fine for walking, since daily moderate activity is recovery, not risk. The
risk is strength: nothing stops 7 paid strength days a week (2,800 ベル), and a pre-wedding injury is the worst
outcome of the year.
- Pay at most **4 strength days a week**.
- Schedule a **deload week every 6th week** (badge 2 sessions, lighter loads).
- Taper volume about 40% in the last 10 days before the wedding.
- Tokyo summer (Jul–Sep, WBGT often over 28) makes outdoor steps unsafe at midday. Add a heat rule like the tsuyu rule.

## 2. Registered dietitian (Japanese diets)

**Protein: the habit is right, but the portion is too vague.**
- Targets:
  - The ISSN position stand (Jäger et al. 2017) gives 1.4–2.0 g/kg/day for training people.
  - Morton et al. 2018 (*BJSM*) found gains plateau around 1.6 g/kg, with up to 2.2 g/kg useful in a deficit.
  - That's **about 105–130 g/day for ウェイ and about 90–110 g/day for うめ**, well above the MHLW DRI 2025 RDA
    (65 g men, 50 g women), which is a deficiency floor, not a training target.
  - Spread it as **≥20–30 g at each of 3 meals** (about 0.3–0.4 g/kg per meal).
- Measurability:
  - "手のひら1枚分" works for meat and fish (100 g ≈ 20 g protein).
  - It fails for tofu: a palm of 絹ごし is about 7 g.
  - Breakfast is the weak meal in Japanese homes (toast, onigiri, miso soup), and the habit should push it.
  - Rewrite the hint as a concrete list (below).
  - The habit implicitly requires **3 meals**, which also fixes うめ's skipped lunches. Say so in the hint.

**"Sweets only from the pot".** Planned, priced treats are better than "never", and 1–3 planned sweets a week fits the
WHO free-sugar guideline (<10% of energy). But:
1. **It misses うめ's real snack, which is potato chips.** Make it "間食は計画どおり": sweets *and* chips only
   from the pot, with fruit, plain yogurt and nuts free.
2. **The tick is all-or-nothing, and the price is high.** At a realistic 60% pace the pair's treat pot earns about
   1,700 ベル/week, which is barely one 1,500 snack shared between two people.
   - Strict, all-or-nothing rules predict the "what-the-hell" effect: break the rule once, abandon the day
     (Polivy & Herman 1985; Westenhoefer 1999 on rigid vs flexible restraint and higher BMI and binge eating).
   - Lower the snack and ice-cream prices so a planned sweet is reachable about twice a week. Keep dinner out dear.

**Veg × 2 matters.**
- 健康日本21 targets 350 g of vegetables a day; Japanese adults in their 20s average about 230–250 g.
- Fibre (MHLW DG: ≥21 g men, ≥18 g women) and volume help satiety in a deficit.
- Define it in 小鉢 so it's checkable: "2食で野菜の小鉢2皿 (または大皿1)".

**What's missing.**
- **Energy deficit size.** This is the biggest lever and the game doesn't touch it. Don't gamify calories; set them
  once:
  - **うめ:** about −300 to −400 kcal/day, roughly 1,600–1,800 kcal. Never below about 1,500 alongside training:
    low energy availability disrupts menstrual function and bone (RED-S, IOC 2023).
  - **ウェイ:** about −200 to −300 kcal/day, roughly 2,300–2,500 kcal, against an MHLW estimated requirement of
    about 2,650 at activity level II.
  - Cap loss at 0.5–1.0% of body weight a week to keep muscle (Helms et al. 2014). The weight trend can enforce this
    (§5).
- **Salt.** Protein-rich Japanese staples are salty (natto sauce, salted salmon, ham, miso). MHLW DRI 2025 goals are
  <7.5 g/day salt for men and <6.5 g for women. ウェイ's old 減塩 habit was dropped. Not a tick, but say it in the hint.
- **Alcohol and sweet drinks:** neither of you drinks either, so leave them out. Re-add if that changes (wedding
  season).
- **Sleep:** 7+ hours (AASM; MHLW 健康づくりのための睡眠ガイド2023 says ≥6). Short sleep shifts loss toward lean mass
  (Nedeltcheva et al. 2010). It can't be measured without the Watch at night, so it's an open question.
- **Late eating:** low priority. Total intake matters more than timing.
- **Should the habits differ between you?** The habits should be the same; the portions and calories are personal.
  うめ: iron (DRI 10.5 mg menstruating) and calcium deserve a mention once in the hint. No separate rule needed.

## 3. Game and behaviour designer

**Daily vs weekly balance is good.** Daily ベル give immediate feedback and the weekly badge gives the "complete a
set" moment. Keep both. But a perfect week with every badge for both pays 14,250, and the minimum-days version of that
is the *on-target* number. The trip prices assume it for 52 weeks.

**Is the on-target pace achievable?** Not yet. ウェイ's last 33 days:
- 8k steps on 3.2 days/week, about 640 ベル.
- Minutes mostly from steps above 8,000, about 500.
- The step badge about half the weeks, about 250.
- No strength, no ticks.

That's **about 1,400 ベル/week**, against 6,625 per person on target, so **about 21%**. Wearing the Watch, three gym
sessions and ticking meals plausibly gets him to 60–80% within 6–8 weeks. Habit automaticity takes a median of 66 days,
with a range of 18–254 (Lally et al. 2010).
- If weeks 1–8 are scored against the full target, the couple watches the abroad trip recede every Sunday.
  Goal-gradient research says motivation rises as the goal gets *close* (Kivetz et al. 2006). A goal that keeps
  getting further away does the opposite.
- **Ramp the targets** and **price trips at about 80% of the full pace**, so a good-not-perfect year buys the plan.

**The difficulty curve needs phases.** 49 flat weeks is a recipe for a February slump. Use the fresh-start effect
(Dai, Milkman & Riis 2014: New Year, new month and new season boost goal pursuit) and make each phase a new
`RULES` version with a name and a visible "season". The app already supports versioning by week. See §5.

**The duo bonus.**
- All-or-nothing +1,000 means one partner's missed strength session costs the pair 7% of the week. This sets up blame,
  and the person with less data (うめ, working from home with no commute steps) is the likely weak link.
- Collaborative team incentives beat individual ones in trials (Patel et al. 2017, *JAMA Intern Med*), but only when
  the team can still win.
- **Make it +250 per badge that both of you earn** (same 1,000 max). Then every shared badge is a win, and the bonus
  never vanishes for one miss.

**Treat prices: reward or punishment?** Expensive sweets plus a "no sweets" tick doubles the punishment: you pay
twice and lose the tick. It's better framing for the pot to be how you *plan* treats, priced so that planning works.
Keep 外ごはん dear, which makes it a celebration. Make a weekday sweet reachable.

**Forgiveness.**
- 正月 is handled for 🍐 only. Activity badges still demand 5 days at 45 minutes during New Year visits.
- Sick weeks, work crunches, Golden Week, Obon and the wedding week have no rule. Lally found a single missed day
  doesn't derail habit formation; the risk is the *story* of failing ("we lost the week").
- Add **おやすみ週 (pass weeks)**: each person gets 6 a year (about 1 per 8 weeks). A pass week uses half thresholds,
  so the bonus is still winnable. 正月, the wedding week and the honeymoon count as automatic passes.
- Add a small **comeback bonus**, +200 ベル on the first goal day after 2+ missed days. In the 61,000-person gym
  megastudy, rewards for returning after a miss were among the best performers (Milkman et al. 2021, *Nature*).

**Weeks that fall short.** Show the week relative to the *phase* target, never to the 14,250 maximum. Lead the harvest
with what was earned, not the badges missed. In the trip pot, show "next trip in N weeks at your 4-week pace" rather
than "% of abroad".

**After the wedding.** Rewards can crowd out intrinsic motivation (Deci, Koestner & Ryan 1999). Maintenance should keep
the structure but lower the targets and ask more of the couple's identity ("we're people who lift"), not the ベル.

## 4. Consolidated recommendations (prioritised)

| # | Change | Proposed values | Why |
|---|---|---|---|
| 1 | **Phased `RULES` versions** (§5) instead of one flat year | Ramp `goals.activeMin 30`, `badges {activeDays 4, stepDays 4, strengthDays 2, ticks 12}`; Build 1 `activeMin 45, activeDays 4, strengthDays 3, ticks 15`; Build 2 / Peak `activeDays 5` | ウェイ is at about 21% of pace. Automaticity takes about 66 days. Phases are fresh starts. |
| 2 | **Strength rule gaps** | Mark ウェイ's gym `autoStrength`, or `STRENGTH.maxConfirmedVisitsPerWeek: 3`. New `STRENGTH.maxPaidDaysPerWeek: 4`. | The 3-day badge is unreachable from gym visits alone. Paid strength days are uncapped. |
| 3 | **A strength workout's duration counts as active minutes** | Minute sources become max(Watch, (steps − 8,000)/100, manual, strength workout `durationMin`) | The Watch under-credits lifting, so strength days miss the 45-minute goal. |
| 4 | **Duo bonus per shared badge** | `badges.duo` → `duoPerBadge: 250` (max 1,000) | Cooperative and graded; no blame for one miss. |
| 5 | **Trip prices at about 80% of full pace** | 日帰り 10,000 · 週末旅行 28,000 · 温泉 36,000 · 海外旅行 130,000 | A 75–80% year still buys 2 abroad, 6 weekend and 1–2 onsen. Ramp weeks earn less. |
| 6 | **Pass weeks and comeback** | New `PASSES = { perPersonPerYear: 6, badges: { activeDays: 2, stepDays: 2, strengthDays: 1, ticks: 7 } }`. Automatic passes: 正月 week, wedding week, honeymoon. `COMEBACK = { afterMissedDays: 2, bells: 200 }`. | Sickness, travel and crunches without a "lost week" story. Megastudy evidence for comeback rewards. |
| 7 | **Strength quality** | `STRENGTH.minWorkoutMin: 30` (from Build 1). Move `'Pilates'` from `autoTypes` to `askTypes`. | 15 minutes can't deliver hypertrophy volume. |
| 8 | **Habit 2 becomes planned snacks** | `no_sweets` → `planned_snacks`: 「間食は計画どおり」, hint "甘いもの・スナック菓子は壺で買ったときだけ。果物・ヨーグルト・ナッツはOK" | Covers うめ's chips. Flexible restraint over rigid. |
| 9 | **Cheaper weekday sweets** | おやつ 800 · アイス 1,000 · デザート 2,000; カフェデート 2,000 and 外ごはん 5,000 unchanged | About 2 planned sweets a week at a realistic pace; avoids restriction and binge cycles. |
| 10 | **Sharper habit hints** | protein: 「3食とも20g以上：肉・魚100g / 卵2個+納豆 / 木綿豆腐 半丁 / ギリシャヨーグルト / サラダチキン」. veg: 「2食で野菜の小鉢2皿 (または大皿1)」. A salt line in the help. | Measurable; fixes tofu and breakfast; 3 meals implied. |
| 11 | **Heat rule** | `HEAT = { from: '07-21', to: '09-15', exerciseMin: 30 }`: ≥30 minutes also counts as a step day, like `TSUYU` | Tokyo midday WBGT; indoor gym minutes still count. |
| 12 | **Deload weeks** | A `RULES` version with `strengthDays: 2` in weeks 15, 21, 27, 33, 41 and 47 | Recovery, injury prevention, a planned easy week. |
| 13 | **Weight pace guard and waist** | §5 below | Recomposition is invisible on the scale for ウェイ. Protects muscle. |

Keep as is: `goals.steps 8000`, `stepDays 4`, `bells.perMinute 5`, `stepDay 200`, `strengthDay 400`, `perTick 100`,
`badges.bells 500`, `POTS.treatPercent 20`, `DAILY.maxTicks 3`, the tsuyu rule, and 正月 🍐-off. Note that `STRENGTH`, `HOLIDAY` and
`TSUYU` aren't versioned by week. Changes #2, #3, #7 and #11 need to be versioned (or applied only from a future week)
so past weeks don't re-score.

## 5. Phase plan, 2026-11-02 → 2027-10-08, then maintenance

| Phase | Weeks (Mon) | Dates | Targets (`RULES`) | Focus |
|---|---|---|---|---|
| **1. Ramp (はじまり)** | W1–W8 | 2026-11-02 – 12-27 | activeMin 30; activeDays 4, stepDays 4, strengthDays 2, ticks 12 | Wear the Watch daily; learn the lifts (ウェイ: written programme; うめ: PT); baselines (weight, waist, photos, lift benchmarks). うめ starts her deficit; ウェイ eats at maintenance. |
| 正月 | W9 | 12-28 – 2027-01-03 | Automatic pass; 🍐 off Dec 29 – Jan 3 | Walk at New Year visits; no guilt. |
| **2. Build 1 (きそ)** | W10–W21 | 01-04 – 03-28 | activeMin 45; activeDays 4, stepDays 4, strengthDays 3, ticks 15; strength ≥30 min | Fresh start on Jan 4. Progressive overload; ウェイ −200 to −300 kcal. Deloads W15 (02-08) and W21 (03-22). |
| **3. Build 2 (つよく)** | W22–W34 | 03-29 – 06-27 | activeDays **5**, otherwise as Build 1 | New fiscal year as a fresh start. Golden Week (04-29, 05-03 – 05-05) → deload W27 (05-03) plus a pass if travelling. Tsuyu from 06-01. Deload W33 (06-14). |
| **4. Peak (ほんばん前)** | W35–W46 | 06-28 – 09-19 | As Build 2; heat rule 07-21 – 09-15 | Hardest block, mostly indoors. Obon → deload W41 (08-09). うめ's deficit ends about 09-12; both eat at maintenance from then. Dress and suit fittings: use waist, not the scale. |
| **5. Taper (しあげ)** | W47–W49 | 09-20 – 10-08 | strengthDays 2, activeDays 4, ticks 15 | About 40% less lifting volume; last hard session about 10-01; normal salt and carbs (no water or carb tricks). Silver Week 09-20 – 09-23. W49 (10-04) is an automatic pass. **Wedding Fri 10-08.** |
| **6. Maintenance (これから)** | W50 on | from 2027-10-11 | activeMin 30; activeDays 5 (150 min, WHO minimum), stepDays 4, strengthDays 2, ticks 12; trip pot continues | Honeymoon weeks are automatic passes. Eat at maintenance; a lean-gain block for ウェイ if wanted. Every 12 weeks, a fresh season with a new trip goal. |

**Weight trend (`WEIGHT`, ADR 0020).**
- Weigh in the morning after the toilet, before food. Daily is best; ≥3×/week is fine. Daily self-weighing is
  associated with better loss and less regain (Steinberg et al. 2015; Zheng et al. 2015).
- `alpha 0.1` and the 28-day pace are good. Show the **trend line and 4-week pace**, with the raw number small.
- Add a **pace guard**, shown as a message only: "ゆっくりでOK" if loss is faster than 0.75% of body weight a week
  over 28 days (protects muscle), and nothing scolding on a gain.
- うめ's readings swing 1–2 kg across the menstrual cycle. Compare month to month, not week to week.
- **Waist:** measure weekly on Sunday at the navel, relaxed exhale, as a shown-only metric like weight. For ウェイ
  it is the primary outcome.
- **Progress photos:** every 4 weeks, same light and pose, kept **on the phones only**. The repo and Sheet are public
  and have no privacy rules (ADR 0016/0018), so photos and waist must never be logged there unless that's accepted.
  Waist is low-risk; photos are not.
- Never reward weight with ベル. Keep it as shown-only, as ADR 0020 already does.

## 6. Open questions for the couple

1. **ウェイ's weight goal:** is "−4 kg" a must, or would "waist −4 cm, lifts up, weight about −2 kg" count as success?
   Hitting −4 kg at his current build trades away some of the muscle goal.
2. Will ウェイ **wear the Watch every day** from Nov 2? Without it, about half his active minutes are invisible to the
   game.
3. ウェイ's gym: mark Anytime Fitness `autoStrength` (any ≥30-minute visit counts), or keep confirmations and raise the
   cap to 3?
4. うめ: what are her usual daily steps working from home? If they're under 6,000, should she have a daily walk slot,
   or a personal ramp (6,500 → 8,000), even though the goals are the same for both?
5. Are 6 pass weeks a year each the right amount of slack? Who decides a week is a pass: the person, or both?
6. Sleep: would you tick a manual "7時間寝た" habit? That would make it 4 habits with 3 ticks, or replace veg.
7. Do you accept the cheaper sweets (おやつ 800 / アイス 1,000) and trips at 80% (abroad 130,000)? Or would you rather
   keep the prices and accept fewer trips?
8. Calories: will you set a daily number once (with a dietitian or app), or rely on the habits alone? The habits
   alone may not create the deficit うめ needs.
9. Should waist (and later photos) live in the app at all, given the public repo and Sheet?
