# Fitness Coach: Round 3 (Japan, personal trainer, Anytime Fitness)

**Input:** ADR 0006 and user confirmation. The couple lives in Japan. **Partner B (F, 26) trains with a personal trainer (PT).** **Partner A (M, 29) is self-guided at Anytime Fitness Japan (AF, 24/7).**

## 1. Partner B: the app defers to her trainer
- **PT sessions count as strength days automatically** when recorded as a Watch *Traditional* or *Functional Strength Training* workout. Max 1 strength day per day.
- **The app doesn't program B's strength work.** Her Coconut card says *"Follow your trainer's plan."*
- **Targets are set with the trainer.** Each season opener produces a one-page summary (strength days/wk, active min/wk, steps, sleep) for B to show the trainer, and the trainer's numbers replace the app's suggestions. Default until then: strength days = PT sessions/wk + trainer homework (e.g. 1 PT + 1 solo = 2). If the trainer wants less cardio during a heavy block, the peach target goes down.
- **The trainer's deloads win.** A one-tap "Trainer deload week" applies ×0.8 and shifts the app's own easy week so they don't stack.
- **Watch tip:** start Strength at the beginning of each session. Few Exercise minutes during rest periods is fine, because the Coconut counts sessions, not minutes.

### "Talk to your trainer" note (B can share it as-is)
> I'm 26 and want to build and protect **bone density** long-term, since bone mass peaks around the late 20s to 30. Could my program include:
> 1. **Progressive, reasonably heavy lower-body and spine loading**: squat, hinge/deadlift, lunge, carry. Working sets around 5–8 reps once technique is solid, with load increasing over time.
> 2. **Short impact work**: e.g. 10–20 jumps or hops per session at first, building to 40–60 across 2–3 days/week as you see fit.
> 3. **2–3 strength days per week** (the Japanese MHLW 2023 guideline and CDC both say 2+). My app counts PT plus one solo day as my strength days.
> 4. Please tell me what my solo session should be, and when my deload weeks are, so the app can match them.
> I'm at a healthy weight: the goal is strength and bone, **not weight loss**, and I'm working on fueling well (protein, calcium, vitamin D).

## 2. Partner A: self-guided Anytime Fitness plan (12-month template)
- **Detection:** start **"Traditional Strength Training"** on the Watch at the door (one tap via a Watch face shortcut). Book a form check during branch staffed hours in Season 1.
- **Sessions:** full-body **A / B** (Season 3+: **A / B / C**), 40–50 min, each ending with 10 min easy cardio.
  - **A:** goblet or back squat, DB bench press, seated cable row, Romanian deadlift, plank.
  - **B:** leg press, lat pulldown, DB overhead press, hip thrust, farmer carry.
  - **C (S3+):** split squat, incline DB press, chest-supported row, back extension, Pallof press.

| Season | Days/wk | Sets × reps (main lifts) | Effort | Focus |
|---|---|---|---|---|
| S1 Planting (Nov–Jan) | 2 (A/B) | 2–3 × 10–12 | 3 reps in reserve | Technique, a habit of fixed slots (e.g. Tue/Thu 7:00) |
| S2 Growing (Feb–Apr) | 2 | 3 × 8–12 | 2 reps in reserve | Steady loading. Add 1 cardio interval session (treadmill 6×1 min) |
| S3 Harvest (May–Jul) | **3** (A/B/C, opt-in) | 3–4 × 6–10 | 1–2 reps in reserve | Strength block. Norwegian 4×4 on the AF bike once a week |
| S4 Celebration (Aug–Oct) | 2–3 | 3 × 5–8 on squat/RDL/press | 1–2 reps in reserve | Maintain, then retest (5-rep squat, push-ups, plank) vs. S1. 5K prep |

**Progression rules:**
1. **Double progression:** once every set reaches the top of the rep range, add the smallest step (+2.5 kg lower body, +1–2 kg upper body) and drop back to the bottom of the range.
2. **Stall** (no progress for 2 sessions on a lift): reduce the load by 10% and build back up, or swap the variation.
3. **Deload** in the app's easy weeks (weeks 4, 8, 12): same exercises, about half the sets, lighter load.
4. **Pain rule:** sharp or joint pain → stop that lift, substitute, and log a Cozy Day if needed.
5. **Cap:** 3 paid strength days. MHLW data shows the benefit fading by about 130–140 min/week of strength training, so more isn't better.

**Sample A week (S2):** Tue 7:00 AF-A · Wed 30 min walk · Thu 7:00 AF-B · Fri rest · Sat 60 min hike/cycle with B, or treadmill intervals · Sun/Mon easy walk or rest.

## 3. Backup "gym visit" signal (rule spec for the engineer)
The Watch credits exercise minutes even without a workout started; only the *strength classification* is lost. Rule:
- **Trigger:** **≥ 30 min and ≤ 3 h** within a registered geofence (A: his AF branches; B: the PT studio; up to 3 places each), and **no HealthKit workout** overlaps that window (±15 min).
- **Prompt** (about 20 min after leaving, or at next app open): *"Gym visit 7:02–7:51. Log as: [Strength] [Cardio] [Not a workout]"*.
- **Strength** → counts a strength day, tagged `gym-visit` and visible to the partner. **Cardio** → nothing added (the minutes already count).
- **Limits:** 1 per day, max **2 per week** count. Prompts expire after 48 h. Only geofence enter/exit times are stored, never routes.

## 4. Japan's guideline (MHLW 2023), verified and reconciled
Verified 2026-10-28 from the MHLW adult sheet (mhlw.go.jp/content/001195866.pdf) and the muscle-training sheet (001195869.pdf). The text was extracted locally because WebFetch couldn't read the PDFs.
- 「個人差を踏まえ、強度や量を調整し、可能なものから取り組む。今よりも少しでも多く身体を動かす。」 (adjust to the individual, start with what you can, move a bit more than now)
- ≥ 23 METs·h/week of activity at ≥ 3 METs: 「歩行又はそれと同等以上の強度の身体活動を１日60分以上…（１日約8,000歩以上に相当）」 (60 min/day of walking-level activity, roughly 8,000 steps)
- ≥ 4 METs·h/week of exercise: 「息が弾み汗をかく程度の運動を週60分以上」 (60 min/week of exercise hard enough to breathe heavily and sweat). 「筋力トレーニングを週２～３日」 (strength 2–3 days/week). Bodyweight counts, all major muscle groups, progressive overload, rest days. Lowest mortality risk at roughly 40–60 min/week of strength training.
- Sitting: break it up (roughly every 30 min). Short bouts count: 「短い時間の積み重ねでも健康増進効果は得られます」. On overdoing it: 「怪我や体調に注意して無理をしないことが大切」 (watch for injury, don't overdo it). Japanese adults averaged 6,278 steps/day in 2019.

| Area | Japan 2023 | CDC/WHO | What we use |
|---|---|---|---|
| Daily movement | 60 min/day ≈ **8,000 steps** | Move more, sit less | 8,000 steps is a "guideline met" milestone. B's Season 4 step target rises from 7,750 to **8,000**. Ceiling stays at 10,000. |
| Exercise | ≥ 60 min/wk | 150–300 min moderate | Peach destination stays 150. It's stricter, so it satisfies both. |
| Strength | 2–3 days/wk | 2+ days | Coconut: 2, or 3 opt-in. Aligned. |
| Sitting | Break every ~30 min | Sit less | Stand hours: non-scored nudge |

## 5. Japan calendar adjustments
| Period | Adjustment |
|---|---|
| **Bōnenkai and New Year (Dec 20–Jan 3)** | Two easy weeks (×0.7) in Season 1. If B's PT studio closes, her strength target = 1 (a trainer homework session). 初詣 walk quest. Sleep target counts 4 of 7 nights. Alcohol guidance belongs to the nutritionist. |
| **Golden Week (~Apr 29–May 6)** | Season 2 → 3 recovery/re-tune week. Travel mode or Cozy Days. Optional joint hike quest (cosmetic). |
| **Tsuyu (rainy season, ~Jun–Jul, by region)** | The apple counts a day if **steps are hit OR ≥ 30 active min** (gym, home workout, mall walk). |
| **Summer heat (~mid-Jul–mid-Sep)** | On a 熱中症警戒アラート (heatstroke alert), or WBGT ≥ 28, Juniper suggests indoor or early-morning sessions. No outdoor-only quests in July–August. Keep it easy for 1–2 weeks to acclimatize. *(WBGT thresholds from Japan Sports Association guidance, from memory, not fetched.)* |
| **Obon (~Aug 13–16)** | Season 4 easy week. Travel mode or Cozy Days, no explanation needed. |
| **Joint 5K / hike** | Move to October–November (autumn fun runs, 紅葉 hikes). |

## 6. The Sunday promise (ADR 0006)
**A good promise** is specific (day, time, place), a behavior you control (not an outcome), about 80% confident, 1–3 items in line with the week's targets, and includes an if-then backup.
**Kept (✓)** = every item done, or its backup done. Otherwise it shows ○, never ✗. No fruit or money attached. A Cozy Day or pause auto-marks it "kept by resting". If a promise exceeds the week's target by more than 30%, the app asks: 「休息日も入れようか？」 (Want to include a rest day too?). Never promise weight, "every day", or "no rest".

| Who | Example promises |
|---|---|
| **B** | 「水曜 PT＋土曜ヨガ」 (Wed PT + Sat yoga) · 「PTがキャンセルなら木曜に自重トレ30分」 (if PT is cancelled, 30 min bodyweight on Thu) · 「日〜木は23時半までに消灯」 (lights out by 23:30 Sun–Thu) |
| **A** | 「エニタイム 火・木・土 7時」 (Anytime Tue/Thu/Sat 7:00) · 「寝坊したら同じ日の21時に行く」 (if I oversleep, go at 21:00 the same day) · 「月・水は一駅歩く」 (walk one extra station Mon/Wed) |
| **Together** | 「土曜9時 高尾山ハイク、雨ならエニタイム＋温泉」 (Sat 9:00 Takao-san hike; if it rains, Anytime + onsen) |

Note: B's Saturday yoga counts as mobility or the rest-day fruit. It becomes a Coconut only if she confirms it included strength work.

## Questions for the user
1. How many PT sessions a week does B have, and will her trainer look at the app's season summary?
2. Which AF branch(es) and the PT studio location, for the geofence? Is location permission OK?
3. Which region of Japan?
4. Any New Year, Golden Week or Obon travel already planned?
