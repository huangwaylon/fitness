# Nutritionist memo: habit-based eating goals for Island Fund

**Role:** Nutritionist
**Status:** Draft for team review
**Summary:** Don't count calories, don't pay for weight, don't build anything that needs more than about 10 seconds a day. Reward 3 to 5 high-impact eating *habits*, logged with one tap (or automatically where possible). Score them weekly, not as fragile daily streaks. Treat meals out are planned rewards, never "cheats," and they should never cost points. Both partners are at a healthy weight (Partner A BMI ~21.6, Partner B ~23.5), so the nutrition goal is **maintenance and fueling for strength and fitness**, not weight loss. Personalized protein, fiber, and hydration numbers are in Section 1b.

> Note: this memo is general, evidence-based wellness guidance for two healthy adults. It is not individualized medical or dietetic advice. If either partner is pregnant, has diabetes, kidney disease, a history of disordered eating, or takes medications affected by diet or alcohol, check with a clinician or registered dietitian before adopting targets.

---

## 1. Evidence-based principles (what the habits are built on)

### Sources consulted
| Source | Accessed | Status |
|---|---|---|
| Dietary Guidelines for Americans, 2025–2030 (USDA/HHS, Jan 2026), full text via realfood.gov (dietaryguidelines.gov now points there) | 2026-10-28 | Fetched. `cdn.realfood.gov` was blocked at first; `realfood.gov` was added to the domain allowlist |
| WHO Healthy Diet fact sheet (who.int) | 2026-10-28 | Fetched |
| WHO Alcohol fact sheet (who.int) | 2026-10-28 | Fetched |
| CDC: Water and Healthy Drinks; Moderate Alcohol Use (cdc.gov) | 2026-10-28 | Fetched |
| odphp.health.gov page for the 2020–2025 DGA | 2026-10-28 | 404 (page moved). Not needed because the current edition was fetched |
| NIH ODS fact sheets (calcium, iron, vitamin D) | 2026-10-28 | **HTTP 403 from server.** The micronutrient values in Section 1b are the standard NASEM DRI/RDA values that ODS publishes, written from reference knowledge rather than a fresh fetch. Worth a re-check |
| NASEM water Adequate Intake (3.7 L men / 2.7 L women, total water) | — | Not fetched (domain not in allowlist). Standard DRI value written from reference knowledge |

### Where the guidelines agree
The 2025–2030 DGA changed some emphases (more protein, full-fat dairy allowed), and those changes are debated. The points below are the ones where **DGA 2025–2030 and WHO agree**. Those are the safest things to build an app around.

| Principle | DGA 2025–2030 | WHO | App habit it maps to |
|---|---|---|---|
| **Eat lots of vegetables and fruit** | Vegetables 3 servings/day, fruits 2 servings/day (2,000 kcal pattern); "throughout the day"; frozen/canned with no added sugar is fine | ≥400 g/day fruit & veg (about 5 portions) | Veggies at 2+ meals; fruit today |
| **Cut highly processed food** | "Limit highly processed foods"; prioritize "home-prepared meals"; "when dining out, choose nutrient-dense options" | Limit highly processed foods high in sugar, salt, unhealthy fats | Home-cooked dinner; smart snack |
| **Avoid sugary drinks** | "Avoid sugar-sweetened beverages, such as sodas, fruit drinks, and energy drinks"; ≤10 g added sugar per meal | Free sugars <10% of energy (~50 g/day), ideally <5% | No sugary drinks |
| **Drink water** | "Choose water (still or sparkling) and unsweetened beverages" | (implicit via sugar limits) | Water goal (auto via HealthKit) |
| **Fiber / whole grains** | Prioritize fiber-rich whole grains, 2–4 servings/day; cut refined carbs | ≥25 g fiber/day; unrefined carbs | Folded into veggie / home-cooked habits; optional "whole-grain swap" quest |
| **Limit sodium** | <2,300 mg/day (ages 14+) | <2 g sodium (<5 g salt)/day | Indirect: home cooking is the biggest sodium lever |
| **Saturated fat** | ≤10% of calories | ≤10% of energy; trans fat ≤1% | Indirect: less processed and fried food |
| **Alcohol: less is better** | "Consume less alcohol for better overall health" (no numeric target in this edition) | "No form of alcohol consumption that is risk-free" | Alcohol-free days |
| **Protein at each meal** | 1.2–1.6 g/kg/day; protein "at every meal" | 10–15% of energy is generally enough | Optional, later in the year only. Don't make people count grams |
| **Gut health** | Vegetables, fruit, fermented foods, high-fiber foods support the microbiome | — | Optional "plant variety" quest |

CDC (moderate alcohol use page): if drinking, no more than 2 drinks/day for men and 1/day for women, and "drinking less is better for your health than drinking more."

**Bottom line for the app:** a few behaviors capture most of the benefit: **more plants, more home cooking, water instead of sugary drinks, and less alcohol.** You don't need macro counting for any of them.

---

## 1b. Personalized numbers for Partner A and Partner B

**Profiles:** Partner A: male, 29, 175 cm, 66 kg, BMI ~21.6. Partner B: female, 26, 153 cm, 55 kg, BMI ~23.5. **Both are in the healthy BMI range (18.5–24.9). Weight loss is not a goal.** The nutrition aim is **maintenance plus fueling for fitness and strength**: eat enough, eat well, recover well.

> **These numbers are background for the team, not user-facing targets.** The app should **not** show calorie targets or ask anyone to hit them. They exist so we (a) set sensible water/protein guidance, (b) understand that A and B have very different energy needs, so the motivational coach can avoid calorie-based fairness problems, and (c) can spot under-fueling risk.

### Energy (Mifflin-St Jeor; background only)
- Partner A BMR = 10×66 + 6.25×175 − 5×29 + 5 ≈ **1,615 kcal/day**
- Partner B BMR = 10×55 + 6.25×153 − 5×26 − 161 ≈ **1,215 kcal/day**

| Activity level (multiplier) | Partner A TDEE | Partner B TDEE |
|---|---|---|
| Sedentary (×1.2) | ~1,940 | ~1,460 |
| Lightly active, 1–3 workouts/wk (×1.375) | ~2,220 | ~1,670 |
| Moderately active, 3–5 workouts/wk (×1.55) | ~2,500 | ~1,880 |
| Very active, 6–7 workouts/wk (×1.725) | ~2,780 | ~2,100 |

**Likely working range once the fitness plan ramps up:** Partner A **~2,200–2,600 kcal**, Partner B **~1,650–1,950 kcal**. Equations are ±10% for individuals. The real check is a **stable weight trend, steady energy, good sleep, and training progress**, not a number.

**Key implications:**
- Partner B's needs are about **25–30% lower** than Partner A's. Shared meals should differ in **portion size, not food**. Same plate composition, different amounts. Partner B shouldn't feel she has to match A's portions, and A shouldn't shrink his to match B's.
- **Under-fueling is the main nutrition risk here, not overeating.** Both are lean-to-normal and about to train more. Low energy availability (sometimes called RED-S) hurts performance, mood, hormones, and **bone density**, which matters especially for Partner B's long-term bone goals. Signs to watch: persistent fatigue, stalled strength, frequent illness or injury, poor sleep, irregular or missed periods (Partner B), low libido. **App rule: never praise eating less. On hard training days, the messaging should be "refuel well."**

### Protein (DGA 2025–2030: 1.2–1.6 g/kg/day)
| | Partner A (66 kg) | Partner B (55 kg) |
|---|---|---|
| Minimum RDA (0.8 g/kg) | ~53 g | ~44 g |
| **Target for strength training (1.2–1.6 g/kg)** | **~80–105 g/day** | **~65–90 g/day** |
| Practical per meal (3 meals + optional snack) | ~25–35 g | ~20–30 g |
| Food picture | e.g., 3 eggs + Greek yogurt at breakfast; palm-to-hand-sized chicken/fish/tofu at lunch and dinner | e.g., 2 eggs or a yogurt bowl at breakfast; palm-sized protein at lunch and dinner |

Going above ~1.6 g/kg has little added benefit for muscle. **Don't track grams in the app.** Use the "palm of protein at each meal" heuristic. A 2–3 h post-workout meal containing protein is a reasonable tip.

### Fiber
| | Partner A | Partner B |
|---|---|---|
| Target | **~30–38 g/day** (14 g per 1,000 kcal; NASEM AI 38 g for men ≤50) | **~25 g/day** (14 g/1,000 kcal; NASEM AI 25 g for women ≤50; WHO ≥25 g) |
| What that looks like | Veg at 2+ meals, 1–2 fruits, a whole grain or legume daily | Same pattern, slightly smaller portions |

Most adults eat about 15 g, so the "veggies at 2+ meals" + "fruit today" habits are the whole fiber strategy. No counting. Increase gradually and with water to avoid GI discomfort.

### Hydration
NASEM Adequate Intake for *total* water (food plus all beverages): **men ~3.7 L, women ~2.7 L/day**. About 20% typically comes from food.

| | Partner A | Partner B |
|---|---|---|
| Beverages per day (approx.) | **~3.0 L** (~12 cups) | **~2.2 L** (~9 cups) |
| **App "logged water" goal** (start; most people don't log coffee/tea/milk) | **2.0 L (8 cups of 250 ml)** | **1.5 L (6 cups of 250 ml)** |
| Exercise add-on | +0.4–0.8 L per hour of exercise, more in heat | Same |
| Simple check | Pale-yellow urine; not thirsty | Same |

Hard cap guidance: don't reward more than ~3.5 L (A) / ~3.0 L (B) of logged water. Overhydration (hyponatremia) is a real, if rare, risk, and "more is better" is the wrong message.

### Micronutrients worth knowing (no tracking; just food choices)
| Nutrient | Partner A | Partner B | Note |
|---|---|---|---|
| Calcium (RDA, 19–50 y) | 1,000 mg | **1,000 mg** | Bone health, important for B's long-term goals. About 3 servings/day of dairy or fortified alternatives (DGA: 3 dairy servings at 2,000 kcal), plus leafy greens, canned fish with bones, calcium-set tofu |
| Vitamin D (RDA) | 600 IU (15 mcg) | **600 IU (15 mcg)** | Bones; sun exposure varies. Ask a clinician about testing or supplementing, especially in winter |
| Iron (RDA) | 8 mg | **18 mg** | Menstruating women need over twice as much. Red meat, poultry, fish, beans/lentils plus vitamin C foods. Fatigue during training merits a ferritin test |
| Alcohol (CDC, if drinking) | ≤2 drinks/day | ≤1 drink/day | Less is better (WHO: no risk-free level). Smaller body size means more effect per drink for B |

**Bone-health bundle for Partner B (coordinate with the fitness coach):** strength and impact training + adequate total energy + calcium/vitamin D + protein. These work together. Under-eating cancels the bone benefit of lifting. Partner A benefits from the same bundle.

---

## 2. Habit menu, ranked by impact and effort

Effort is measured in *user input seconds per day*. Impact is my judgment of health benefit for a typical American adult, based on the guidelines above.

| Rank | Habit | Impact | Input effort | Why |
|---|---|---|---|---|
| 1 | **No sugary drinks today** (soda, juice drinks, sweetened coffee/tea, energy drinks) | High | 1 tap | Single biggest added-sugar source for most adults; both guideline sets name it explicitly; binary and easy to self-judge |
| 2 | **Veggies at 2+ meals** | High | 1 tap | Moves toward 3 servings/day without weighing anything; adds fiber and potassium and crowds out processed food |
| 3 | **Home-cooked dinner** (anything you assembled at home counts: frozen veg + rotisserie chicken counts) | High | 1 tap (or 0 if partner logs for both) | Home cooking is the strongest practical lever on sodium, portion sizes, and processed food. Great for couples |
| 4 | **Water goal** (e.g., 6–8 cups, personalized) | Medium | 0–3 s per drink (Watch app/Shortcut writes to HealthKit; app reads automatically) | Supports swapping out sugary drinks; the most automatable nutrition metric |
| 5 | **Alcohol-free day** | Medium–High (depends on baseline) | 1 tap, or 0 if they log drinks to HealthKit | Less is better; also helps sleep, which the Watch measures |
| 6 | **Fruit today** | Medium | 1 tap | Easy win; good "starter" habit to build confidence |
| 7 | **Kitchen closes ~2–3 h before bed** | Low–Medium | 1 tap | Framed as a sleep habit, not a fasting rule. Possible small benefit to sleep and reflux; evidence for metabolic benefit is mixed |
| 8 | **Palm of protein at each meal** | Medium (given the strength focus) | 1 tap | Matches the DGA protein emphasis and supports strength training (A ~80–105 g/day, B ~65–90 g/day, Section 1b) with no grams counted. Added in Q2 |
| 9 | **New vegetable/recipe this week** | Low (fun) | 1 tap weekly | Variety and microbiome; a fun weekly quest, not a daily chore |

**Not recommended:** calorie counting, macro tracking, "no carbs," "no sugar ever," fasting windows longer than 12 h, daily weigh-ins, "clean eating" streaks, and any habit defined by restriction alone.

### Recommended starter set (Q1)
1. **Veggies at 2+ meals** (daily, 1 tap)
2. **No sugary drinks** (daily, 1 tap)
3. **Home-cooked dinner** (count per week, 1 tap; can tag "cooked together")
4. **Water goal** (daily, auto from HealthKit)

That is about 3 taps/day, under 10 seconds. Add one habit per quarter (Section 6). Never run more than 5 active daily habits.

### Check-in UX (for the designer and engineer)
- **One evening card** (around 8 pm notification, or a Watch complication / Home Screen widget / interactive Live Activity): 3–4 big toggles, all **pre-set to "no" with no shame copy**. Tap the ones that apply, done.
- **Allow backfill for 48 h.** People forget; a missed check-in shouldn't mean a missed reward.
- **Partner can log shared items** ("we both had home-cooked dinner") for both people with one tap.
- **No free-text fields, no photos required, no numbers to type.**

---

## 3. What can be automatic or near-automatic (honest assessment)

| Signal | How | Automation level | Honest notes |
|---|---|---|---|
| **Water** | HealthKit `dietaryWater`. Logged by Watch/iPhone apps that write to Health (e.g., WaterMinder, Waterllama, HydroCoach), or by an iOS Shortcut using the "Log Health Sample" action on a Watch complication / Action Button / back-tap | **Near-automatic** (2–3 s per drink; our app reads it with zero input) | Still requires a tap per glass. Smart bottles exist (some sync to Health) but cost money and need charging. Recommend a Shortcut "+1 glass (250 ml)" on the Watch face |
| **Alcohol** | HealthKit `numberOfAlcoholicBeverages` (iOS 15+), loggable via Shortcut or apps | Near-automatic if they choose to log drinks; otherwise 1 tap "alcohol-free today" | Logging each drink is more honest, but the "alcohol-free day" toggle is less effort and less judgmental. Offer both and let each partner choose |
| **Caffeine** | HealthKit `dietaryCaffeine` via Shortcut | Optional | Only useful if they want a "no caffeine after 2 pm" sleep habit |
| **Sleep as a proxy** | Apple Watch sleep tracking (automatic) | **Fully automatic** | Sleep duration and consistency are linked to appetite regulation and food choices. Reasonable to reward sleep in the fitness/recovery pillar, but don't present it as a *nutrition* score |
| **Photo meal logging (calorie-estimating AI apps)** | Third-party apps estimate calories/macros from photos and can write nutrition to HealthKit | Semi-automatic (5–15 s per meal) | **Cons:** estimates can be badly wrong (hidden oils, portion size), it is still per-meal friction, it brings calorie counting back in through the back door, and it drops off fast. **Pros:** good awareness tool for a few weeks. **Recommendation: don't build this in and don't score it.** |
| **Photo journal, no numbers** | Optional in-app "snap the dinner we cooked" with no calorie estimate | Optional, 3 s | A nice *memory/scrapbook* feature (fits the cozy theme): a "cookbook" of meals cooked together. Works as gentle proof for the cooking bonus. Never required |
| **Time-restricted eating via first/last meal timestamps** | Would need manual "first bite / last bite" taps, or inference from photo timestamps | Manual (2 taps/day) | **Use caution.** Evidence for TRE beyond what it does to calorie intake is mixed. Strict fasting windows can trigger restrict/binge cycles, and timestamp-chasing is a classic obsessive pattern. **Recommendation:** no fasting scores. At most a gentle "kitchen closed ~2–3 h before bed" toggle framed around sleep |
| **Dietary energy/macros from a third-party logger** (MyFitnessPal, Cronometer, etc.) | Reads HealthKit `dietaryEnergyConsumed` etc. | Automatic *read*, but high-friction *write* | **Do not reward calorie or macro numbers.** If one partner already logs and enjoys it, the app can ignore the data or show it privately; never score it |
| **Restaurant/grocery detection** (location, bank transactions) | Geofences, card feeds | Possible | Invasive, error-prone, and it turns the app into surveillance. Not recommended |
| **Glucose (CGM)** | HealthKit `bloodGlucose` | Automatic if worn | Not appropriate for healthy users as a scored metric. Skip |

**The honest answer:** apart from water (near-automatic) and sleep (automatic), nutrition can't be tracked automatically in a reliable, low-friction, healthy way. The best design is **one tap per habit per day, batched into one evening card, with partner co-logging**. That is about 5–10 seconds a day.

---

## 4. Eating-out and treat rewards (without undermining health)

### Framing rules
1. **Call them "Treat Meals" or "Date Nights," never "cheat meals."** "Cheat" implies the normal diet is a punishment and the treat is a sin. That moralizes food and drives guilt/binge cycles.
2. **Plan them.** A treat earned and scheduled ahead ("Friday: ramen night") is enjoyed mindfully. Unplanned "I blew it" eating is the problem, not restaurant food itself.
3. **A Treat Meal never costs points and never breaks habits.** On a treat day the "home-cooked dinner" toggle simply isn't checked. No penalty, no "fail" icon. The weekly scoring (Section 7) has slack built in for this.
4. **Eating out unplanned is also not a failure.** It's life. The app should be silent about it.
5. **Enjoy it fully.** Encourage savoring: order what you actually want, eat slowly, share dessert.

### Light restaurant guidance (optional tips card, never enforced)
- Start with a vegetable (salad, veg side, broth soup); it naturally counts toward "veggies at 2 meals."
- Pick grilled, roasted, broiled, or stir-fried more often than deep-fried (DGA explicitly suggests this swap).
- Water or sparkling water at the table; if drinking alcohol, one drink and enjoy it.
- Share an appetizer or dessert; box half of an oversized entrée.
- Cuisines that make this easy: Mediterranean/Greek, Japanese, Vietnamese (pho, fresh rolls), Indian (dal, tandoori, veg curries), Mexican (fajitas, bowls, beans).

### The food-as-reward paradox
Using food as a reward can raise the emotional value of "treat" foods and frame healthy food as the price you pay. This is well described in the child-feeding literature, and plausibly applies to adults. Mitigations:
- **Make most rewards non-food.** Suggested mix for the smaller-reward catalog: about 1/3 food experiences, 2/3 non-food.
- **Make food rewards experiences, not quantities:** a nice restaurant date, not "a pint of ice cream."
- **Food-adjacent but healthy-positive rewards:** couples cooking class, farmers-market haul budget ($30–50 "spend it on anything beautiful"), a good chef's knife or Dutch oven, a new cookbook, a cooking-themed day trip (orchard, berry picking, winery tour), a spice-shop spree.
- **Non-food rewards:** massage, movie night, concert tickets, new running shoes, a hike/day trip, plants for the island-theme garden, an in-app cosmetic for their island.
- **Decouple timing:** rewards unlock weekly/monthly, not right after a "good" meal, so there's no direct "I ate broccoli so I get cake" link.

---

## 5. Weight: should the app track or reward it?

### Recommendation: **reward behaviors, never weight outcomes.** Weight is optional, private, trend-only, and never monetized.

**Why not reward weight:**
- **Both partners are already at a healthy weight** (Partner A BMI ~21.6, Partner B ~23.5). Weight loss isn't indicated for either of them. Paying for weight change would push one or both toward under-eating, which works against the strength and bone-density goals.
- **Money for kg lost invites unhealthy shortcuts:** crash diets, dehydration before weigh-ins, skipping meals. Financial-incentive studies also show weight often comes back once payments stop.
- **Daily weight swings of 1–2 kg are mostly water, salt, and glycogen.** Rewarding noise is demotivating and teaches the wrong lesson.
- **Couples dynamics:** comparing partners' weights or putting them on a shared scoreboard can create resentment, shame, or one partner "policing" the other.
- **Recomposition:** with more strength training, weight may stay flat or **rise slightly** (muscle, glycogen) while health improves. Rewarding a lower number would penalize exactly the progress we want.

**Recommendation for these two people:** leave weight **out of the app by default**. The only nutrition-relevant use is a private under-fueling check: if someone opts in, a 4-week trend dropping more than ~2–3% *unintentionally* gets a gentle private nudge to eat more on training days. Nothing else.

**If they want weight in the app:**
- **Off by default.** Each partner opts in for themselves.
- **Private to that person.** Never shown to the partner, never on a shared screen.
- **Trend line only** (e.g., 7-day or 14-day moving average from HealthKit `bodyMass` if a smart scale writes it). No daily number front and center, no red/green coloring, no goal-weight countdown.
- **No points, no money, no streaks tied to it.**
- Better outcome metrics to celebrate (also unmonetized): Watch **resting heart rate** and **cardio fitness (VO2 max)** trends, sleep consistency, energy/mood check-ins, and *how clothes fit*. These are framed as "your body is getting stronger," not "smaller."

### Red flags for disordered eating (design must avoid triggering them; partners should watch for them gently)
- Skipping meals or "saving up" calories for treats or to earn rewards
- Rigid rules, distress or guilt after "breaking" a food rule, labeling foods "good/bad"
- Compensatory exercise ("I have to burn off that dinner")
- Frequent weighing, body checking, distress at the number
- Avoiding social meals or dining out because of the app's goals
- Secretive eating, or bingeing after restriction
- Logging becoming compulsive, or anxiety about missed logs

### Design guardrails (non-negotiable from the nutrition side)
1. **No calorie, macro, or weight-based rewards. Ever.**
2. **No penalties or money taken away for eating anything.** Points only go up.
3. **No "exercise to earn food" or "burn off your treat" messaging.** Never show food in "minutes of walking" units.
4. **No moral language:** no "clean," "junk," "guilty," "cheat," "bad day," "failed."
5. **Weekly targets with slack** (e.g., 5 of 7 days) instead of daily all-or-nothing streaks. Streaks, if any, should have freezes/grace days.
6. **Caps:** a daily/weekly max on nutrition points, so there's no incentive to over-restrict or game the system.
7. **No partner-vs-partner competition on food.** Use cooperative shared goals ("together we hit 10 home-cooked dinners").
8. **Easy pause:** a "life happens / sick / traveling / holiday" toggle that freezes scoring without penalty.
9. **A gentle off-ramp:** settings include a "nutrition goals off" switch and a short resources link (e.g., NEDA/ANAD helplines) without fanfare.
10. **Quarterly self-check prompt:** "Is the app making food feel more fun, or more stressful?" If stressful, simplify.

---

## 6. 12-month progression (quarterly seasons)

The cozy-island theme maps nicely onto seasons. Each season keeps prior habits as "maintained" (still scored, maybe at reduced points) and adds one new focus. Pick the actual months to match the start date.

| Season | Theme | New focus habit | Weekly quest ideas | Couples angle |
|---|---|---|---|---|
| **Q1: "Planting"** (months 1–3) | Build the base | Starter set: veggies at 2 meals, no sugary drinks, home-cooked dinners, water (auto) | Try one new vegetable/week; find your two favorite sparkling waters | **Meal-prep Sunday** (30–60 min together: wash/chop veg, cook a grain, a protein, a sauce) = weekly bonus |
| **Q2: "Growing"** (months 4–6) | Add plants, fruit, and protein for strength | **+ Palm of protein at each meal** (supports the fitness plan's strength block) and **+ fruit today** or **+ alcohol-free days (target 4–5/week, personalized to baseline)** | Farmers-market trip; "eat the rainbow" week (5 colors); one meatless dinner/week (beans/lentils) | **Cook-together night** bonus; recipe swap: each partner picks a new recipe for the other |
| **Q3: "Harvest"** (months 7–9) | Quality and variety | **+ Calcium-rich food 2–3×/day** (bone health, especially Partner B) or **+ kitchen closes 2–3 h before bed** (choose one) | 30-plants-in-a-week challenge (any fruits, veg, grains, nuts, herbs count); whole-grain swap week; fermented food try | **Couples cooking class** as a reward; build a shared "Island Cookbook" of 10 go-to healthy meals |
| **Q4: "Celebration"** (months 10–12) | Maintain through holidays, make it stick | **No new daily habit.** Switch to maintenance with lighter weekly targets | Healthy holiday dish to bring to gatherings; host a dinner for friends | Holiday-season **pause/grace tokens**; plan vacation meals as treats (the vacation fund *includes* great food) |

Progression rules:
- **Never more than 5 active daily nutrition habits.**
- **Let each partner swap one habit** for one that fits them better (e.g., someone who never drinks soda swaps "no sugary drinks" for "fruit today"). Baselines differ, and rewarding something they already do is a waste.
- At each season change, a 1-minute **retrospective card**: "Keep / drop / swap?"

---

## 7. Concrete rule table

Points are on a neutral scale for the lead/economist to convert to dollars. Suggested anchor: a "perfect" nutrition week ≈ 100 points per person. Nutrition should be a **meaningful but not dominant** share of total earnings (suggested about 25–35%, with movement/fitness and sleep making up the rest), so a single treat meal never matters financially.

| Habit | How logged | Frequency / target | Suggested points | Honor-system notes |
|---|---|---|---|---|
| Veggies at 2+ meals | 1 tap in evening card / widget | Daily; full credit for **5 of 7** days | 3/day (max 15/wk) + 5 weekly bonus at 5/7 | Any vegetable counts: frozen, canned, soup, salsa-heavy dishes, salad. Potatoes/fries don't count as the veg |
| No sugary drinks | 1 tap | Daily; full credit at 5/7 | 3/day (max 15/wk) + 5 bonus | Sugary = soda, sweet tea, juice drinks, energy drinks, sweetened coffee drinks. 100% juice small glass OK; diet soda: neutral (no rule, but DGA advises limiting sweeteners) |
| Home-cooked dinner | 1 tap; partner can log for both; optional "cooked together" tag | Weekly; target **4–5/week** (personalize) | 4 each, up to 5/wk (max 20) | Assembled at home counts (rotisserie chicken + bagged salad). Takeout eaten at home doesn't. No proof needed; optional photo for the shared cookbook |
| Cooked together bonus | Tag on home-cooked dinner | Weekly | +3 each per meal, max 2/wk (6) | Both actually helped (chopping counts) |
| Water goal | **Auto** from HealthKit `dietaryWater` via Watch/Shortcut | Daily; **Partner A 2.0 L (8 cups), Partner B 1.5 L (6 cups)** logged, +0.5 L on workout days (auto-detected from Watch workouts); full credit 5/7 | 2/day (max 10/wk) | Auto-read. Coffee/tea/sparkling water may count if logged. No extra credit above goal; cap at ~3.5 L (A) / ~3.0 L (B), because overhydration is a real risk |
| Alcohol-free day (from Q2) | 1 tap, **or auto** from HealthKit `numberOfAlcoholicBeverages` = 0 | Daily; target personalized (e.g., 4–5/wk) | 2/day (max 10/wk) | Not a judgment of drinking on other days. If baseline is already ~0, swap this for another habit |
| Fruit today (from Q2) | 1 tap | Daily; 5/7 | 2/day (max 10/wk) | Whole/frozen/dried with no added sugar. Juice doesn't count |
| Kitchen closes 2–3 h before bed (Q3 option) | 1 tap | Daily; 4/7 | 1/day (max 4/wk) | Framed as a sleep habit. Water/herbal tea fine. Skip if it causes stress or hunger at night; don't use if either partner has a disordered-eating history |
| Palm of protein at each meal (from Q2) | 1 tap | Daily; 5/7 | 2/day (max 10/wk) | A palm-sized portion (A's palm is bigger, which is the point): eggs, Greek yogurt, cottage cheese, fish, chicken, meat, tofu, tempeh, beans/lentils. No grams |
| Calcium-rich food 2–3×/day (Q3 option) | 1 tap | Daily; 5/7 | 1/day (max 5/wk) | Milk/yogurt/cheese, fortified soy milk, calcium-set tofu, canned salmon/sardines with bones, leafy greens |
| Meal-prep Sunday | 1 tap (either partner, credits both) | Weekly | 10 each | 30+ min together prepping food for the week |
| New veg / new recipe quest | 1 tap | Weekly | 5 each | Novelty counts even if it was terrible |
| Seasonal quest (e.g., rainbow week, 30 plants) | Simple checklist | Once per season | 25 each | Self-reported; pure fun |
| Treat Meal / Date Night | Redeemed from reward shop | Earned (e.g., every ~2 weeks of solid habits) | **Costs reward-shop currency, never deducts habit points** | Planned, guilt-free. Habits that day are simply not checked, with no penalty |
| Life-happens pause | Toggle | As needed (illness, travel, holidays) | Freezes targets; no loss | Unlimited for illness; suggest ~2 weeks/yr for travel/holidays beyond the vacation itself |
| Weight (optional) | Auto from HealthKit `bodyMass` if opted in | Never scored | **0, never monetized** | Private, trend-only, partner can't see |

**Weekly cap on nutrition points:** ~100 per person (excluding seasonal quests). Points never go negative.

**Honor system overall:** this is a two-person app between partners who trust each other. Fixed definitions (above) prevent arguments; partner co-logging of shared meals is the natural verification. No photo proof required. If one partner feels the other is "gaming" it, that's a conversation to have, not a feature to build.

---

## Open questions for the user
1. **Baselines:** Does either of you currently drink soda/sweet drinks or alcohol regularly? How many nights a week do you cook now? (This sets personalized targets and decides whether "no sugary drinks" or "alcohol-free days" is worth including.)
2. **Dietary patterns or restrictions:** vegetarian, allergies, cultural cuisines, medical conditions (diabetes, pregnancy plans, etc.)?
3. **Any history of disordered eating or difficult relationships with food/weight** for either of you? If yes, we drop timing-based habits and weight entirely and keep tone extra gentle.
4. **Weight:** since you're both at a healthy weight, we recommend leaving it out entirely (or as a private, opt-in, unscored under-fueling check). OK?
5. **Food rewards ratio:** how do you feel about about 1/3 of small rewards being food (restaurants) and 2/3 non-food experiences?
6. **Water logging:** are you willing to tap a Watch complication per glass, or would you rather do a daily "drank enough water" toggle (simpler, less precise)?
7. **Does either of you already use a food logger (MyFitnessPal, etc.)?** If so, should the app ignore that data, or show it privately unscored?
8. **Who usually cooks?** If it's mostly one person, the "cooked together" bonus and shared logging rules may need adjusting so effort is credited fairly.
9. **Activity and cycle:** what's your current training volume? Partner B: are periods regular? (This helps calibrate fueling guidance and spot low energy availability early. It never goes in the app.)
