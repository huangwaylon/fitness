# Round 15: 🍐 eating, with less tapping (dietitian, behaviour designer, iOS automation engineer)
**Date:** 2026-10-30. **Question (user):** "Minimise manual check-ins and work: should we remove 🍐, replace it, or
automate it? Discuss and plan, weigh pros and cons, research others' solutions." **Scope:** the 🍐 habits
(`protein_each_meal`, `no_sweets` 間食は計画どおり, `veg_two_meals`), ADR 0019 and its amendments, ADR 0020, ADR 0016,
`app/src/lib/config/rules.ts`, `CheckinSheet.svelte`, `docs/ops/shortcut-health-sync.md` §1, `app/gas/main.ts`, the round-12
goals review and `docs/profiles.md`. No code was changed.

**Sources.** App Store listings were read live through the iTunes lookup API (JP store, 2026-10-30). Apple's
Health support page was also read live. Research papers are cited by journal and DOI from the team's knowledge. PubMed
and the publishers' sites weren't reachable from the sandbox, and no allowlist domain was added, so those weren't
re-read live. **[U]** marks a claim that wasn't verified on a phone or a live page.

**Bottom line.** Keep 🍐 and the economy exactly as they are, and cut the work to **one tap on a good day**:
1. A big 「ぜんぶできた！」 button.
2. An in-app evening question the first time the app opens after 19:00.
3. A weekly catch-up grid at the Sunday harvest, so a forgotten night is never lost.
4. Optionally, a 「きょうの食事」 Shortcut on a widget, the Watch or an NFC tag at the dining table.

This needs no backend change, no rules version and no rebalancing (still **14,250 ベル** a week on target).

Health automation of protein (option **b**) is the only option that improves data quality. But it moves the work into
a food logger (about 5–10 minutes a day) rather than removing it. Offer it as an opt-in Phase 2 for whoever logs in
あすけん anyway, and as a 2-week "calibration" exercise each phase. Don't remove 🍐: protein and planned snacks are the
two dietary levers that matter most for recomposition, and 🍐 is the only place the game touches food.

---

## 1. What Apple Health can provide automatically (iOS automation engineer)

**Data types.** HealthKit has quantity types for:
- `dietaryEnergyConsumed`, `dietaryProtein`, `dietaryCarbohydrates`, `dietarySugar`, `dietaryFiber`, `dietaryWater`,
  fats, sodium and about 30 micronutrients;
- Sleep Analysis (a category type);
- Mindful Minutes;
- State of Mind (iOS 17+).

([HealthKit nutrition type identifiers](https://developer.apple.com/documentation/healthkit/nutrition-type-identifiers).)

**Health records none of the nutrition types by itself.** A food-logging app has to write them; there is no built-in food
logging in Health today. **[U]** Apple has been reported to be working on food tracking for a future Health service.
Re-check this before building Phase 2.

**Reading by day in a Shortcut.** It works the same way the current sync reads steps. **Find Health Samples** → Type
**Dietary Protein** (たんぱく質) or **Dietary Energy** (摂取エネルギー), Start Date in the last 31 days, **Group by Day**.
Then **Get Details → Value**, and send the list as Text.
- Health sums the day's samples per source. **If two apps write protein, the day is double-counted**, so use one
  logging app per person.
- The parser drops a list whose line count differs from `dates` (`shortcut-health-sync.md` §1). The `weight` list already
  comes through with `0` on empty days, so grouped lists appear to be filled. **[U]** Confirm that dietary types behave
  the same way. If they don't, send a parallel `protein_dates` list and match by date (§6).

**Which apps write nutrition to Health:**

| App | Writes to Health | Effort to log | Japanese food coverage | Price (JP store) |
|---|---|---|---|---|
| **あすけん** (Asken) | **Yes: intake kcal, protein, fat, carbs** (and weight, body fat). Listing: 「摂取カロリー・たんぱく質・脂質・炭水化物…をヘルスケアに連携」 | Search, barcode or photo. The photo 画像解析 and the AI 「AIおまかせ記録」 (18+) are **Premium** | Best: Japanese menus, konbini and chains; dietitian-written daily advice | Free; Premium ¥480–580/month, ¥4,400/year |
| **カロミル** | **Reads only** per its listing (weight, steps, workouts…). **[U]** No nutrition write is mentioned | **Lowest effort found:** free photo analysis scans the camera roll every 72 h: just photograph meals, then confirm | Strong (chains, ラーメン店, nutrition-label OCR) | Free; Premium extra |
| **MyFitnessPal** | **[U]** Yes: energy and macros (long-standing feature; not stated in the JP listing) | Search, barcode; Meal Scan (Premium) | Weak for 定食 and konbini (14M mostly Western entries) | Free; Premium ¥1,200/month or ¥6,000/year |
| **Lose It!** | **[U]** Yes (HealthKit listed) | Barcode, voice; Snap It photo | Weak | Free; Premium ¥800–10,000 |
| **Cronometer** | **[U]** Yes: syncs with Apple Health | Barcode free; photo and voice AI in Gold | Weak for Japan; best micronutrients | Free; Gold paid |
| **Yazio** | **[U]** Yes: 「ヘルスアプリ…と同期」, Watch app | Barcode, AI | Medium | Free; Pro paid |
| **MacroFactor** | **[U]** Yes: nutrition and weight | Barcode (reviews are mixed on JP barcodes), AI | Medium | Paid only: ¥1,540/month, ¥9,200/year |
| **Cal AI** | **[U]** Yes | Photo → kcal and macros | Unknown for 和食 | Subscription |

**For this couple: あすけん** is the only option that is Japanese-first and confirmed to write protein and kcal to Health.
With Premium photo analysis, a meal takes about a minute (photo → pick the menu → adjust the portion). That's roughly
5 minutes a day, and longer for home cooking.

**Sleep, mindfulness and mood:**
- **Sleep:** Health's sleep data **needs the Watch worn at night** (Apple: "To receive sleep data, you must turn on Track
  Sleep with Apple Watch… If you don't wear your Apple Watch to sleep, your graph might not show any data";
  [support.apple.com/108906](https://support.apple.com/en-us/108906)). Neither of them wears it to bed (profiles, ADR
  0009), so sleep isn't automatic today.
  - Sleep matters for this goal. In a deficit, 5.5 h of sleep instead of 8.5 h shifted the loss from fat towards lean
    mass (Nedeltcheva et al. 2010, *Ann Intern Med* 153:435, doi:10.7326/0003-4819-153-7-201010050-00006).
  - So it's a candidate fruit *if* they start wearing the Watch at night and charging it in the morning.
  - Reading sleep needs more work in the Shortcut, because it's a category type with stages. **[U]** Group by Day may
    not sum the durations.
- **State of Mind:** logged by hand in Health or the Watch's Mindfulness app. It's a tap, not automation, and it isn't
  diet-related. **Not useful.**
- **Mindful minutes:** not related to the goal. **Not useful.**

## 2. How other apps and games reduce logging effort (behaviour designer)

**Habit apps:**
- **Finch:** self-reported, guilt-free check-ins. You tap a goal and the pet goes on adventures. Missing a day costs
  nothing: the pet never dies. Its tone is the right model for 🍐 (ADR 0016 already bans meal grading).
- **Streaks:** "automatically knows when you complete tasks linked to the Health app" (its listing). It also has negative
  tasks ("don't…"), one-tap completion from a widget, rich notifications, the Watch and Siri Shortcuts. **It is the closest
  precedent for option (b):** a habit that ticks itself from a Health threshold.
- **Habitica:** a missed daily costs HP. That punishment is a known cause of churn ("the Inn" exists to pause it).
  **Avoid** this pattern.

**Diet apps:** each makes *logging* cheaper, but none removes it.
- **Noom:** colour-codes foods (green/yellow/orange by energy density), which simplifies the *judgement* but still logs
  each food.
- **Lose It! Snap It** and **MyFitnessPal Meal Scan:** a photo suggests items, then you confirm the portion. They save
  typing, not the meal-by-meal habit.
- **あすけん:** photo analysis and AIおまかせ (Premium).
- **カロミル:** batch-analyses camera-roll photos for free, so you only confirm. This is the closest to zero effort.
- **Cal AI-style apps:** fully photo-based, but the portion estimate is the weak point. **[U]** Published evaluations of
  image-based energy estimates commonly show errors of tens of percent, worst for mixed dishes such as 丼 and 定食.
- **MacroFactor:** its adaptive approach needs **daily weight plus logged calories**: it back-calculates real
  expenditure from the weight trend and intake. It still needs full food logging, but it's "adherence-neutral": no red
  days and no shaming. That doesn't reduce the work.

**Mechanics:**
- **Default-yes / opt-out.** Defaults are powerful: organ-donor consent rates were ~85–100% in opt-out countries vs
  4–28% in opt-in ones (Johnson & Goldstein 2003, *Science* 302:1338). But the default then *is* the behaviour, so a
  default "yes" measures nothing, and reporting a slip costs you ベル. Under-reporting is the predictable result.
- **Weekly reflection** is the cheapest option, but a week-old recall is less accurate. It also loses the "money moves
  today" feel that ADR 0019 was built for.
- **One-tap widgets and notification actions.** Island Fund is a PWA. iOS web push for Home Screen apps exists, but
  **[U]** iOS doesn't show web-notification action buttons. Sending push from Apps Script would also need VAPID signing,
  and ADR 0016 removed alerts. **Shortcuts widgets** (Home or Lock Screen) give the one tap with no backend change.
- **Apple Watch:** Shortcuts run on the Watch (a complication or the Shortcuts app), and Choose from Menu works there
  **[U]**.
- **NFC tags:** Shortcuts → Automation → **NFC** runs a Shortcut when the iPhone touches a tag (about ¥100 each). A tag
  on the dining table makes 「ごちそうさま」 a physical ritual: one touch, one menu tap. These automations are user-started,
  so they aren't alerts under ADR 0016.

## 3. Evidence: what matters for fat loss and recomposition (registered dietitian)

1. **Self-monitoring of food helps, but its frequency matters more than its detail.**
   - Burke, Wang & Sevick's review found a consistent association between diet self-monitoring and weight loss across
     22 studies (*J Am Diet Assoc* 2011;111:92, doi:10.1016/j.jada.2010.10.008). The studies were mostly observational,
     and adherence fell over time.
   - In Harvey et al. 2019 ("Log often, lose more", *Obesity* 27:380, doi:10.1002/oby.22382), the most successful
     participants' logging time fell from ~23 to ~15 min/day over 6 months, while they kept logging *frequently*.
   - So the regular act of reflecting is the active ingredient, and a cheap daily signal keeps most of it.
2. **Detailed logging fatigues fast.** In the free photo food-logging app The Eatery, only a small minority (~3%) kept
   using it beyond the first week (Helander et al. 2014, *JMIR* 16:e109, doi:10.2196/jmir.3084). Any plan that depends on
   two people photographing or weighing every meal for 49 weeks will probably fail by February.
3. **Obsessive tracking is a real risk, especially before a wedding.**
   - Calorie tracking is associated with eating-disorder symptoms (Simpson & Mazzeo 2017, *Eat Behav* 26:89,
     doi:10.1016/j.eatbeh.2017.02.002).
   - 73% of patients with an eating disorder who used MyFitnessPal felt it contributed to their illness (Levinson et al.
     2017, *Eat Behav* 27:14, doi:10.1016/j.eatbeh.2017.08.003).
   - Most engaged women plan to lose weight for the wedding (Neighbors & Sobal 2008, *Appetite* 50:550,
     doi:10.1016/j.appet.2007.11.004).
   - Gram-level daily scoring of うめ's intake carries a real downside. Keep any calorie number a *band with a floor*
     (never below ~1,500 kcal with training; RED-S, IOC 2023).
4. **The levers, in order:**
   - **(i) A modest energy deficit** drives fat loss. Diet *type* matters little when intake is matched: DIETFITS
     (Gardner et al. 2018, *JAMA* 319:667) found low-fat and low-carb equal.
   - **(ii) Protein ≥1.6 g/kg plus resistance training** keeps or builds muscle (Morton et al. 2018, *BJSM* 52:376).
     In a hard deficit, high protein with training *gained* 1.2 kg lean mass while losing 4.8 kg fat (Longland et al.
     2016, *AJCN* 103:738).
   - **(iii)** Veg and fibre for fullness.
   - **(iv)** Sleep.
   - For ウェイ (66 kg) that's **~105 g/day**, and for うめ (55 kg) **~90 g/day**.
   - "A palm of protein at each of 3 meals" (~20–30 g each) gives about 60–90 g. That's close for うめ and about one
     portion short for ウェイ (add a ヨーグルト or a protein drink). The tick is a *good enough proxy* without grams.
   - 間食は計画どおり is the practical deficit lever for うめ, whose excess is chips.
5. **Is the weight trend alone enough?** For the *outcome*, mostly yes:
   - Daily weighing with a trend is associated with more loss and less regain (Steinberg et al. 2015, *J Acad Nutr Diet*
     115:511).
   - ADR 0020 already shows the trend without paying for it.
   - But the trend can't tell *why* it moves. For ウェイ, recomposition can hold the scale flat while the waist shrinks
     (round 12).
   - MacroFactor and Libra-style apps still need intake logged to explain the trend.
   - So: **the trend gives the outcome feedback, 🍐 nudges the process, and nothing pays for the scale** (ADR 0020 stands).
6. **Habit ticks vs grams.** Grams are more accurate but cost ~10× the effort. For two healthy-BMI adults with modest
   goals, a reliable daily yes/no on the right two or three behaviours is worth more than precise grams that stop being
   logged in week 3. A **short, periodic calibration** gives most of the benefit of grams: 2 weeks of あすけん logging per
   phase teaches what 100 g of protein and 1,700 kcal look like, then stops.

## 4. Options

**Effort** is per person per day. **Economy** means the on-target weekly total for both, kept at ≈14,250.

### (a) Remove 🍐
- **Pros:** zero food taps; a simpler game (3 fruits).
- **Cons:**
  - Drops the only food lever, while the deficit and protein are the biggest levers for the goal (§3.4).
  - Wastes the existing 🍐 art and tree slot.
  - Sends the message "food doesn't count" before a weight-loss goal.
- **Economy, exact:** without 🍐 the per-person on-target total is 3,125 daily + 1,500 badges = 4,625. Both + 750 duo
  = 10,000, so it needs +4,250. Rebalance:
  - `perMinute 7` (5 × 315 = 1,575)
  - `stepDay 300` (4 × 300 = 1,200)
  - `strengthDay 600` (3 × 600 = 1,800)
  - `badges.bells 700` (× 3 = 2,100)

  That's 6,675 a person; both 13,350, + `duoPerBadge 300` × 3 = 900, for **14,250**.
- **Cost:** a RULES version from a future Monday, remove 🍐 from `FRUITS`, and UI and tree changes. Medium.

### (b) Automate via Health (protein and calories from a logging app)
- **How:** the Shortcut adds `protein` (g) and `calories_in` (kcal), one line per day. 🍐 auto-earns on thresholds. The
  manual tick stays as a fallback: the higher of the two counts, never the sum (like minutes).
- **Pros:**
  - The real signal (grams); zero taps *in Island Fund*.
  - Like Streaks' Health auto-complete.
  - Under-logging costs ベル, so the incentive pushes towards logging, not away from it.
- **Cons:**
  - The work moves into あすけん (~5–10 min/day; Premium photo ¥480–580/month).
  - Logging fatigue (§3.2) and tracking risk (§3.3).
  - Can't see `no_sweets` or veg (あすけん doesn't write sugar or fibre).
  - Double-counting if two apps write.
  - Daily protein and kcal land in a **public** Sheet. Weight already does, but intake is more personal.
- **Economy, exact:** per day, protein ≥ target (A 105 g, B 90 g, **fixed numbers in `rules.ts`**, so the economy never
  reads weight, per ADR 0020) pays **200**. kcal in band (A 2,200–2,600, B 1,500–1,850) pays **100**, only when ≥1,000
  kcal is logged. That's max 300/day; badge at ≥15 pear-ticks-equivalent (5 full days). On target: 5 × 300 + 500 = 2,000
  a person, the same as now, so **14,250**.
- **Cost:** parser fields, metrics, the model rule and a Code.js redeploy. Medium–high.

### (c) One daily tap
「きょうの食事 OK?」, answered in-app on the first open after 19:00, from a Shortcut menu, or from the Watch or an NFC tag.
- **Pros:**
  - Keeps the daily reflection that the evidence favours.
  - A good day is 1 tap (now 3).
  - ベル still move today.
  - Fits the existing `checkin` events exactly.
- **Cons:**
  - Self-report, so it's honesty-based.
  - A one-question version loses which habit was missed (fixed by 「えらぶ」).
  - A timed reminder automation is an *alert*, which ADR 0016 removed, so only use user-started triggers.
- **Economy:** unchanged.
- **Cost:** low.

### (d) Default-yes with opt-out
- **Pros:** zero taps on good days.
- **Cons:**
  - Pays for nothing: reporting a slip costs ベル, so slips go unreported.
  - The reflection moment, the actual mechanism, disappears.
  - 🍐 becomes a flat +2,000 a week, so the economy inflates by ~15% for real-world play.
- **Economy:** to stay honest it would need `perTick` cut. Not recommended.
- **Cost:** low.

### (e) Weekly reflection at the harvest
「今週、たんぱく質を毎食とれた日は？ 0–7」 × 3 habits.
- **Pros:** 1 interaction a week; it fits the harvest ceremony.
- **Cons:**
  - Week-old recall, generous by nature.
  - 🍐 ベル land only on Sunday, so 1,500–2,000 a week disappear from "today's ベル".
  - Daily self-monitoring is lost.
- **Economy:** unchanged (21 possible day-habits, 100 each, badge ≥15).
- **Cost:** low–medium.

### (f) Replace food with sleep (or the weight trend)
- **Pros:** sleep is relevant (§1) and automatic *with the Watch*.
- **Cons:**
  - They don't wear the Watch to bed (ADR 0009), so sleep isn't automatic today.
  - Removes the food lever.
  - The weight trend can't earn: ADR 0020 forbids it, and it would reward crash dieting.
- **Economy, if sleep:** ≥7 h asleep pays 300 a night; badge ≥5 nights. On target 5 × 300 + 500, the same as now, so
  **14,250**.
- **Cost:** medium (a category-type Shortcut field `sleep_min`, a new fruit).

### (g) Photo logging with AI
A meal photo goes to a vision model.
- **Pros:** feels magical; no typing.
- **Cons:**
  - Still 3 photos a day: the habit is the cost, not the typing.
  - Portion errors (§2).
  - Meal photos must **never** reach the public Sheet or repo.
  - Building it needs an API key in Script Properties, image upload through Apps Script, and per-photo API fees.
    **[U]** That's small (around cents a day), but check current vision-model pricing before building.
  - Off-the-shelf already exists: カロミル (free; doesn't write to Health) and あすけん Premium (writes to Health).
- **Economy:** as (b).
- **Cost:** high. Not worth building.

### (h) Hybrids
- **h1 (recommended):** (c) plus a weekly catch-up from (e).
- **h2:** h1 plus (b) as opt-in: protein from Health auto-ticks `protein_each_meal` when logged.
- **h3:** (b), falling back to a weekly tap.

### Comparison

| Option | Taps per person/day (good day) | Data quality | Game feel | Privacy (public Sheet) | Build cost | Verdict |
|---|---|---|---|---|---|---|
| (a) Remove 🍐 | 0 | none | 3 fruits; food "doesn't count" | best | medium | ✗ |
| (b) Health auto | 0 in app, **5–10 min in あすけん** | **high (grams)** if logged | magic when it works; punishes not logging | protein/kcal public | medium–high | opt-in Phase 2 |
| (c) One daily tap | **1** (~3 s) | medium (self-report, 3 habits kept) | daily ベル, short ritual | as now | **low** | ✓ core |
| (d) Default-yes | 0 | **none** | free money | as now | low | ✗ |
| (e) Weekly | ~0.15 (1 a week) | low (recall) | 🍐 ベル only on Sunday | as now | low–medium | ✓ as catch-up |
| (f) Sleep | 0 (needs the Watch at night) | high | new fruit | sleep public | medium | later, if the Watch is worn |
| (g) Photo AI (built) | 3 photos | medium (portions) | fun | photos must stay off the Sheet | high | ✗ (use あすけん) |
| **(h1) c + e** | **1, or 0 with catch-up** | medium | best balance | as now | **low** | **✓ primary** |

## 5. Recommendation: h1 now, h2 as an opt-in Phase 2

**Why h1.** It cuts the daily work by two-thirds (3 taps → 1) and makes a forgotten day recoverable. It keeps the
protein and snack levers in the game and the daily reflection the evidence supports, with no tracking burden. And it
changes **no rules, events, backend or economy**. ウェイ currently ticks nothing (round 12), so the barrier to beat is
friction, not precision.

### Migration plan

**Rules versioning:** none for Phase 1. Same habit keys, same `checkin {date, habit, done, edit?}` events and same
`perTick 100`, `maxTicks 3`, `badges.ticks 15`. Existing check-ins all stay valid. On-target ベル stay at **14,250**:
- per person: 5 × 225 + 4 × 200 + 3 × 400 + 15 × 100 = 4,625 daily + 4 × 500 badges = 6,625;
- both: 13,250 + 4 × 250 duo = 14,250.

**UI changes:**
1. **CheckinSheet:**
   - Add a big leaf-green 「ぜんぶできた！」 button at the top. It sends the three missing `checkin` events (done: true)
     with one cue and one 🍐 pop.
   - Keep the three toggles below it for partial days. On a good day the sheet is open → 1 tap → done.
   - Before 12:00, open on 「きのう」 when yesterday is empty.
2. **Evening question (not an alert):** the first time the app opens after **19:00**, when today has no ticks, しずえ asks
   on the island with the existing `Bubble` and `ChoiceList`: 「きょうのごはん、どうだった？」 → [ぜんぶできた！]
   [えらぶ…] [あとで].
   - [えらぶ…] opens the sheet.
   - [あとで] hides it until tomorrow. Remember it per day in local storage.
   - No meal grading and no red (ADR 0016 tone rules).
3. **Harvest catch-up:** when the Sunday harvest opens and any day this week has no 🍐 answer, show 「まとめて記入」 first.
   - It's a 7 × 3 grid (days × habits) with a 「この日はぜんぶ」 tap per row.
   - Days older than the 48 h window are sent as `edit: true`, which the model already accepts until the Wednesday 04:00
     lock.
   - It's one screen a week at most, and only when needed.
4. **Help text:** sharpen the hints as in round 12 #10. For protein: 「3食とも20g以上：肉・魚100g / 卵2個+納豆 / 木綿豆腐 半丁 /
   ギリシャヨーグルト / サラダチキン」 (ウェイ: plus one extra protein snack).

**The optional Shortcut 「きょうの食事」** (no backend change; `event` already exists in `app/gas/main.ts`):
1. **Choose from Menu**: 「ぜんぶできた」 / 「たんぱく質だけ」 / 「あとで」. Extend the menu if they want per-habit options.
2. **Format Date** (Current Date, custom `yyyy-MM-dd`) → `Day`. **Format Date** (custom `X`, Unix seconds) → `T`.
3. For each chosen habit, **Get Contents of URL**: POST to `/exec` with this JSON body:

   ```json
   { "key": "<key>", "action": "event", "id": "A-<T>-protein_each_meal", "type": "checkin",
     "data": { "date": "<Day>", "habit": "protein_each_meal", "done": true } }
   ```

   Use the person's prefix (`A-` or `B-`). The server dedupes ids, so a double run is harmless. `data.done` must be a
   **Boolean** and `id` must be **Text**. **[U]** Check the JSON field types in the Shortcuts editor.
4. **Triggers, all user-started** (so they comply with ADR 0016):
   - a Home or Lock Screen widget;
   - the Watch Shortcuts complication;
   - an **NFC** automation on a tag on the dining table, with Run Immediately.

   A 21:00 time-of-day automation would be a reminder: it needs the couple to reverse ADR 0016's "no reminder
   automations". **[U]** It may also need a notification tap before the menu shows.
5. Copy it to the other phone with an Import Question for the key, as in `shortcut-health-sync.md` §4.

**Phase 2: opt-in auto-protein (h2).** Only if one of them commits to logging in あすけん:
- **Shortcut:** two new Text fields in the existing しまの同期 body:
  - `protein`: Find Health Samples Dietary Protein, the same 31 days, Group by Day, Value, grams.
  - `calories_in`: Dietary Energy, the same settings, kcal.

  Both are one line per day aligned with `dates`, `0` meaning not logged. Don't reuse `calories`, which is already sent
  and ignored. If dietary lists don't come back filled, add `protein_dates` and match by day.
- **Parser** (`app/gas/parse.ts`): `{ field: 'protein', metric: 'protein_g' }` and `{ field: 'calories_in', metric:
  'kcal_in' }`, as integers. A day takes its latest value, as weight does (a day's log can be corrected down). Redeploy
  Code.js.
- **Rules:** append a RULES version from a future Monday (e.g. **2026-11-16**) with
  `pear: { autoProteinG: { A: 105, B: 90 } }`:
  - a day with `protein_g ≥ target` counts as a `protein_each_meal` tick;
  - a manual tick still counts;
  - one tick at most (a set, not a sum).

  Calories stay **shown only** in きろく (a band, with うめ's floor). Don't pay for kcal, because paying for under-eating
  is the RED-S and ED risk (§3.3).
- **Privacy:** intake numbers become public with the Sheet. Ask the couple first.
- **Calibration habit (no code):** at the start of each phase (2026-11-02, 01-04, 03-29, 06-28), log everything in
  あすけん for 14 days, then go back to ticks.

**Not doing:**
- (a) removes the lever.
- (d) measures nothing.
- (f) needs the Watch worn at night; revisit then with a `sleep_min` field.
- (g) means building what あすけん already sells.
- The weight trend stays unpaid (ADR 0020).

### Open questions for the couple
1. Is 「ぜんぶできた！」 on your honour OK? (The partner sees the ticks, ADR 0016.)
2. Will either of you log in **あすけん** daily, at about ¥480–580 a month for photo analysis? If not, skip Phase 2. If
   yes, are you OK with daily protein and kcal in the public Sheet?
3. Would you do a **14-day あすけん calibration** at each phase start? It's the dietitian's cheapest way to learn your
   portions and set うめ's calorie band.
4. Evening question at **19:00**, or another time? Do you want an **NFC tag** at the table, or a Watch or widget
   shortcut?
5. Do you want a **21:00 reminder** after all? That reverses part of ADR 0016.
6. Would you wear the **Watch to bed** (charging it in the morning)? If yes, a sleep fruit or a fourth habit becomes
   automatic later.
7. Keep 野菜 2食 as the third habit, or swap it (e.g. for 「夜9時以降は食べない」)? The dietitian keeps veg for fullness
   in a deficit.
