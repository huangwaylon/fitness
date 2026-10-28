# Round 1 review: Nutritionist

**What I read:** fitness-coach, motivational-coach, software-engineer, ui-ux-designer and manager-lead memos, plus `design/mockup.html` and its preview, and `profiles.md`.
**What I looked for:** food-as-reward risks, disordered-eating red flags, whether both partners eat enough for the training plan, and copy tone.

## 1. What I endorse
- **Everyone agrees: no calories, no weight, no Move-ring money comparisons.** The charter, fitness coach §2, motivational coach §2.4 and engineer §2 all say so. Keep it as a hard rule in the decision record.
- **Fitness coach on fueling.** The under-fueling flag (§4 item 5, §6.3) and the bone-health note for Partner B match my §1b. Weekly caps ("doing more is never better than enough"), pause weeks, recovery points, and weekly streaks with freezes all reduce the risk of compulsive patterns.
- **Motivational coach's banned-words list** (§6.2: no "cheat day," "burn off," "earn your food," no body commentary), plus the configurable diet slots, the 48 h backfill, and "no nudge-your-partner button."
- **Engineer's diet stance:** a once-a-day evening check-in of 3–4 habits, water read from Health, photos for memories only, no cloud AI on food photos, and no clawbacks.
- **Designer:** treats kept in a separate wallet, no red or "failed" states, "how was this counted?" transparency, and the scrapbook of treat memories.

## 2. Conflicts and concerns (with fixes)
**2.1 The per-meal "Healthy plate / Pretty balanced / Treat meal" check-in (mockup screen 4) is my biggest concern.**
- It asks people to *grade every meal*, up to 4 times a day, Snack included. That's a food diary with a moral scale, which is the "good food / bad food" labeling I flagged as a red flag. The "Pretty balanced" subtitle ("Some good stuff, some not") puts that judgment right into the copy.
- Per-meal logging is also 4x the friction of one daily card, and "Eats 2/2" turns *number of meals logged* into a goal.
- The toast says **"A pear grew… +$1.00"** after a meal tap. That pays real dollars for each logged meal, which is a direct food-to-money link.
- "Treat meal → still grows a pear" is well meant (honest logging), but it makes the pear meaningless as a health signal. It also keeps treat meals inside the scoring system, where they get counted and watched.
- **Fix:** replace it with **one evening "Island habits" card**: 3–4 yes-toggles from each person's chosen habits (veg at 2+ meals, home-cooked dinner, no sugary drinks, palm of protein, etc.). Show no money on that card. Treat meals leave the check-in entirely: they're redeemed in the Shop and **never logged or scored**. Remove the meal chips and the Snack option. The engineer's §2 design already matches this.

**2.2 Treat Jar funding scales with adherence** (motivational coach §2.5: `treat_bells = treat_weekly × avg(unlock_pct)`), and the designer's "Dinner out earned per N perfect days" ties food to perfection.
- Both make a restaurant meal the prize for "being good," which is the food-as-reward paradox.
- **Fix:** fund treats as a **flat monthly allowance**, unlocked by *participating* (e.g., at least 2 of 4 weeks at 60% or more), not scaled by score. At least half of the catalog should be non-food (massage, movie, cooking class, farmers-market haul).

**2.3 Juniper copy** ("Two pears today, nice! One more meal to go.") pushes people to log meals.
- **Fix:** food copy is about plants and cooking only, never about meal counts. Example: "Home-cooked dinner? Your kitchen smells like a festival."

**2.4 The Move ring is still in the motivational coach's scoring** (2 Miles a day, active-energy-based).
- Even measured against a personal baseline, a calorie-burn target encourages "burn more" thinking and compensatory exercise.
- **Fix:** follow the fitness coach and drop it. Use exercise minutes and steps instead.

**2.5 Partner can see "booze-free day / no soda"** (engineer §2) as social accountability. Lewis & Rook (cited by the motivational coach) suggests this kind of food and drink monitoring backfires between partners.
- **Fix:** see C7.

**2.6 Settings has a "meals/day" goal** (designer §7.7).
- **Fix:** remove it. Number of meals isn't a health target, and under-eating is the main risk for these two.

**2.7 Minor:** "Healthy plate: lean protein" is outdated wording; the 2025–2030 Dietary Guidelines say "protein at every meal." Also, the motivational coach uses Bells, Nook Miles, Isabelle and Blathers, which conflicts with the designer's IP guardrails (§12). The designer's naming should win.

## 3. Gaps
- **No refuel messaging anywhere.** Add a post-workout or high-training-week line, e.g., "Big week! Island cooks say: extra snack, extra water." Never praise eating less.
- **No under-fueling watch.** Add a private monthly self-check (energy, sleep, illness, Partner B's cycle regularity) with a gentle off-ramp ("talk to a clinician"). It is never scored and never shown to the partner.
- **Water isn't scored anywhere** except a shared slot with no-soda in the motivational coach's memo. Personal goals: A 2.0 L, B 1.5 L, +0.5 L on workout days, no credit above goal (my §1b). The engineer already ingests `dietary_water`. Also add `numberOfAlcoholicBeverages` as an optional metric.
- **Holiday and travel eating:** the "life happens" pause should cover holidays and the vacation itself, so the reward trip isn't scored.
- **No "nutrition off" switch** and no quiet support-resources link in Settings. Both are needed if either partner ever feels stressed by food tracking.

## 4. Positions on the lead's conflict points
**C1 (one scoring model):** 100 points per person per week, paid as a % of each person's own targets, capped:
- Exercise minutes 30
- Strength 20
- Daily movement (steps / active days) 15
- Sleep and recovery 15
- Eating habits 20

Couple bonuses (Together, joint workout, cooked-together) sit on top with a cap. I'd accept eating anywhere from 20 to 25 points. Above 25 would put too much honor-system money on food.

**C2 (economy concepts):** two currencies and two jars. **Fruit** (points, earned all week) becomes **dollars** on Sunday, split into the **Vacation Jar** and the **Treat Wallet**. Drop the named Lost & Found and Rainy Day buckets: unearned money just stays in their own savings. One-sentence version: *"Healthy habits grow fruit; every Sunday your fruit becomes dollars for the trip and a little for treats."*

**C3 (eating check-in cadence):** **one evening card, 3–4 habit toggles, under 10 s, 48 h backfill.** A widget or Shortcut can pre-tick habits during the day. No per-meal tiles, no Treat tile.

**C4 (fruit metaphor):** **five fruits for five categories**, mapped 1:1 to C1. Add a strength fruit (e.g., coconut, "tough shell"). The pear means "eating habits done today," not meals.

**C5 (settlement timing):** **settle provisionally on Sunday, top up later** (no clawbacks). Check-ins arrive instantly, so eating points are final at the ceremony, with Sunday's card answerable before it starts.

**C6 (where treat money comes from):** **a separate budget, never the vacation jar.** It's a flat allowance unlocked by participation, not scaled by score (§2.2). At least half of the catalog is non-food. Redeeming a treat never deducts points and isn't logged as eating.

**C7 (partner visibility):** **default is goal met / not met only**, with raw numbers if each person opts in. For eating and alcohol, the partner sees **only the single pear**, never which habits were ticked. Shared items (cooked together, meal-prep Sunday) are visible because both people do them.

**C8 (daily dollars vs. points):** **show points (fruit) daily and dollars only at the weekly ceremony** and on the Fund tab. Above all, never show a dollar amount on an eating check-in (remove "+$1.00" from the pear toast).
