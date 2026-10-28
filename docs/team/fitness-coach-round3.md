# Fitness Coach: Round 3 (Japan, personal trainer, Anytime Fitness)

**Input:** ADR 0006. The couple lives in Japan. One partner trains with a personal trainer (PT; which partner is unknown, so below they're the **"PT partner"**). The other has an **Anytime Fitness Japan** membership (24/7) and is the **"AF partner"**.

## 1. Integrating both gyms

### PT partner: the app defers to the trainer
- **PT sessions count as strength days automatically** when recorded as a Watch *Traditional* or *Functional Strength Training* workout. Max 1 strength day per day, so a PT session plus a solo session on the same day still counts once.
- **The app doesn't program this partner's strength work.** My §6.3 strength plan (sets, reps, loads, jumps) is hidden for them. Their Coconut card just says *"Follow your trainer's plan."*
- **Targets are set with the trainer.** At each season opener the app produces a one-page summary ("what the app rewards this season": strength days/wk, active min/wk, steps, sleep) that the partner shows the trainer. The trainer's numbers replace the app's suggestions. Default until then: strength days = PT sessions/wk + any trainer-assigned homework sessions (e.g. 1 PT + 1 solo = 2). Active-minute targets follow the trainer too. If the trainer wants less cardio during a heavy block, the peach target goes down.
- **The trainer's deloads win.** A one-tap "Trainer deload week" applies the easy-week multiplier (×0.8) that week and shifts the app's own easy week so they don't stack.
- **Bone focus:** if the PT partner is Partner B, ask the trainer to include progressive lower-body loading and short impact sets, rather than the app prescribing jumps.
- **Watch tip:** start the Strength workout when the session begins. Rest periods mean the Watch may credit few Exercise minutes, which is fine, because the Coconut counts sessions, not minutes.

### AF partner: self-guided, the app supplies the plan
- Strength is detected when they start a **"Traditional Strength Training"** workout on the Watch (Workout app → Traditional Strength). A **Watch face shortcut** makes this one tap.
- Tip: get a form check during staffed hours (Japanese branches have limited staffed hours; check your branch) for the main lifts in Season 1.
- **Sample self-guided week** (Season 2 "build", e.g. 2 strength days, ~130 active min):

| Day | Session | Notes |
|---|---|---|
| Mon 7:00 | AF full-body A, 40 min: goblet squat, DB row, DB bench, RDL, plank (2–3 × 8–12), + 10 min incline walk | Coconut 1 |
| Tue | 30 min brisk walk (commute or lunch) | Peach |
| Wed | Rest or 10 min mobility | Rest-day fruit |
| Thu 7:00 | AF full-body B, 40 min: leg press, lat pulldown, overhead press, hip thrust, farmer carry (+ 20–40 jumps if this is Partner B) | Coconut 2 |
| Fri | 20–30 min walk | |
| Sat | Together: 60 min hike or cycle, *or* 25 min AF treadmill intervals | Joint-workout cosmetic |
| Sun | Rest. Sunday promise at the ceremony | |

The Season 3 opt-in third day is a short Saturday full-body C. Progression: add load once every set reaches the top of the rep range (see my memo §6.3).

## 2. Backup "gym visit" signal (rule spec for the engineer)
Exercise minutes still accrue automatically without a workout started. Only the *strength classification* is lost. Rule:
- **Trigger:** time spent within the registered geofence (PT studio and/or the AF branches they use; up to 3 places per person) is **≥ 30 min and ≤ 3 h**, and **no HealthKit workout** overlaps that window (±15 min).
- **Prompt** (push about 20 min after leaving, or at next app open): *"Looks like a gym visit at Anytime (7:02–7:51). Log it as: [Strength] [Cardio] [Not a workout]"*. One tap, nothing typed.
- **Strength** → counts a strength day, tagged `gym-visit`, visible to the partner (same honor-system rule as manual entries). **Cardio** → no extra minutes; the Watch's exercise minutes already count.
- **Limits:** 1 per day, **2 per week** count as Coconuts (so it stays a backup, not a habit). The prompt expires after 48 h. No repeat prompt if dismissed.
- Location stays on-device or on the home server only, and only geofence enter/exit times are stored, never routes.

## 3. Japan's guideline (MHLW 2023), verified and reconciled
Verified 2026-10-28 from the MHLW adult sheet (成人版, mhlw.go.jp/content/001195866.pdf) and the muscle-training sheet (001195869.pdf). The text was extracted locally because WebFetch couldn't read the PDFs.
- 「個人差を踏まえ、強度や量を調整し、可能なものから取り組む。今よりも少しでも多く身体を動かす。」 (adjust to the individual, start with what you can, move a bit more than now)
- Physical activity ≥ 3 METs, **≥ 23 METs·h/week**, i.e. 「歩行又はそれと同等以上の強度の身体活動を１日60分以上…（１日約8,000歩以上に相当）」 (60 min/day of walking-level activity, roughly 8,000 steps/day)
- Exercise ≥ 3 METs, **≥ 4 METs·h/week**, i.e. 「息が弾み汗をかく程度の運動を週60分以上」 (60 min/week of exercise hard enough to breathe heavily and sweat)
- 「筋力トレーニングを週２～３日」 (strength training 2–3 days/week, which can count toward the 4 METs·h). Bodyweight training counts, all major muscle groups, progressive overload, and rest days matter. Mortality risk was lowest at roughly 40–60 min/week of strength training, with the benefit fading by about 130–140 min/week. **That supports our cap of 3 paid days.**
- Sedentary time: avoid long sitting; breaking it up roughly every 30 minutes is cited as important. No minimum bout length: 「短い時間の積み重ねでも健康増進効果は得られます」 (short bouts add up). 「“やりすぎ”の身体活動量はまだ明らかではありませんが、怪我や体調に注意して無理をしないことが大切」 (the "too much" level isn't known, so watch for injury and don't overdo it)
- Context: Japanese adults averaged **6,278 steps/day** in 2019 (men 6,793, women 5,832).

**Reconciliation** (no change to the scoring model):

| Area | Japan 2023 | CDC/WHO | What we use |
|---|---|---|---|
| Daily movement | 60 min/day ≈ **8,000 steps** | "Move more, sit less" | Apple: **8,000 steps** becomes a "guideline met" milestone. Partner B's Season 4 placeholder rises from 7,750 to **8,000**. The 10,000 ceiling stays. |
| Exercise | ≥ 60 min/wk vigorous-ish | 150–300 min moderate | Peach: CDC's 150 stays the destination. It's stricter, so it also satisfies Japan's 60. Apple Exercise minutes ≈ brisk-walk-or-harder, which falls between the two definitions. |
| Strength | 2–3 days/wk | 2+ days | Coconut: 2, or 3 opt-in. Fully aligned. |
| Sitting | Break up every ~30 min | Sit less | Stand hours stay a non-scored nudge |

## 4. Japan calendar adjustments
| Period | Adjustment |
|---|---|
| **Bōnenkai and New Year (Dec 20–Jan 3)** | Two **easy weeks (×0.7)** fall automatically in Season 1. The PT studio may close, so the PT partner's strength target becomes 1 or a bodyweight home session. Quests: 初詣 walk together, New Year's walk. Late nights out: the sleep target counts 4 of 7 nights. Alcohol guidance belongs to the nutritionist. |
| **Golden Week (~Apr 29–May 6)** | Align the **Season 2 → 3 recovery/re-tune week** with GW. Suggest travel mode or Cozy Days. Optional "GW adventure" joint hike quest (cosmetic). |
| **Tsuyu (rainy season, ~early Jun–Jul, varies by region; Hokkaido barely has one)** | The apple fruit counts a day if **steps are hit OR ≥ 30 active min** (gym, home workout, mall walk). Juniper suggests indoor options. Targets aren't cut, since AF is 24/7 indoors. |
| **Summer heat (~mid-Jul–mid-Sep)** | When a **熱中症警戒アラート** (heatstroke alert) is issued, or WBGT ≥ 28, Juniper suggests indoor or early-morning sessions. No outdoor-only quests in July–August. In the first hot weeks, keep intensity easy for ~1–2 weeks to acclimatize. Pre-hydrate and refuel per the nutritionist. *(WBGT thresholds from Japan Sports Association guidance, from memory, not fetched; the alert itself is from Japan's Environment Ministry.)* |
| **Obon (~Aug 13–16)** | Travel mode or Cozy Days, no explanation needed. Make it the Season 4 easy week. |
| **Season 4 joint 5K / hike** | Move from August to **October–November** (autumn fun runs, 紅葉 hikes), or do it early morning only. |

## 5. The Sunday promise (ADR 0006)
**A good promise** is:
1. **Specific:** day, time, place.
2. **In your control:** a behavior, not an outcome.
3. **Realistic:** about 80% confident, small enough to keep.
4. **1–3 items** that line up with this week's targets.
5. **Has an if-then backup:** "if X, then Y".

**Kept** = every item done, *or* its backup done. A Cozy Day or pause auto-marks it "kept by resting". The app gently flags promises that exceed the week's target by more than 30%: *"Big week! Keep one rest day?"* Never promise weight, "every day", or "no rest".

| Who | Example promises |
|---|---|
| **PT partner** | "PT Wed 19:00 + the trainer's homework session Sat morning at home." · "If PT is cancelled → 30 min bodyweight circuit Thu." · "Lights out by 23:30 Sun–Thu." |
| **AF partner** | "Anytime Tue/Thu 7:00, full-body A/B, start the Watch workout at the door." · "If I oversleep → go at 21:00 same day." · "Walk from one station further on Mon/Wed." |
| **Joint** | "Saturday 9:00 hike at Takao-san together; if it rains → AF treadmill + onsen." |

## Questions for the user
1. Which partner has the PT, how many sessions a week, and is the trainer willing to look at the app's season summary?
2. Which AF branch(es) and the PT studio location, for the gym-visit geofence? Is location permission OK?
3. Which region of Japan (affects tsuyu and heat timing)?
4. Any New Year, Golden Week or Obon travel already planned?
