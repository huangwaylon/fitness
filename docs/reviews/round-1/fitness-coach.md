# Round 1 Review: Fitness Coach

**Lens:** safety, realistic targets, overtraining, and whether the data each idea needs actually exists.
**Read:** all of `docs/team/*.md`, `docs/research/apple-health-ingestion.md`, `docs/design/mockup.html` plus the preview, and `docs/profiles.md`.

## 1. What I endorse
- **No calories or weight in the economy** (all memos). Nutritionist §5 is excellent; I'd adopt its guardrail list as written.
- **Personal baselines and equal money per person** (Motivational §4.4). The fairness table on body size matches my §3.5.
- **Weekly settlement, linear partial credit, forgiving weekly streaks, and freeze tokens** (Motivational §1.5, §5.5).
- **Daily caps per habit and a capped overflow** (Motivational §7.2). **Pause Mode rolls money forward instead of losing it** (Motivational §2.7). That's better than my version; I'll align with it.
- **Engineer's rules engine:** settles at D+2, re-checks the last 14 days, pays top-ups only, never claws back. Late Watch syncs never cost anyone.
- **Manual-entry flag** via `HKMetadataKeyWasUserEntered`, with the partner's 👍 needed for money (Motivational §7.1).
- **Nutritionist's under-fueling warning and the bone bundle** (strength and impact work + enough energy + calcium/vitamin D + protein). This is the key safety pairing for Partner B's bone goal.
- **Designer's tone** ("Rest days grow strong trees too"), a quiet-week ceremony with no red $0, and "How was this counted?" with gap fixing.
- **Buddy workouts detected by overlapping workout times** (Motivational §4.3). This matches my §5.1.

## 2. Conflicts and concerns (with fixes)
| # | Where | Concern | Fix |
|---|---|---|---|
| 1 | Motivational §2.4: "Exercise minutes ≥ target (30/day)", 4 Miles/day | A **daily** exercise goal means every rest day loses the biggest slot. That pushes people toward 7 workout days a week and undercuts the "rest is rewarded" principle. | Score active minutes **weekly** (personal target, rising toward 150, capped at 300, daily counting cap max(60, 50% of target)). A daily fruit can still show progress, but money comes from the weekly total. |
| 2 | Motivational §2.4: strength bonus is "Miles only, no Bells effect"; daily slot is "strength *or* mobility" for 2/day | Strength, our top long-term goal (bone density for B), carries almost no money. Also, 20 min of yoga earns the same as lifting, so the 2-days-a-week strength guideline is never actually rewarded. | Make **strength days a weekly money category** (20% of points, 2 days, 3 if opted in from S3, same points either way). Mobility can count on the recovery / rest-day line instead. |
| 3 | Motivational §2.4: Move ring (baseline-relative, 2/day); Engineer §5 example "close Move ring 20 days/month" | It's still calorie-based. The Move goal can be edited by the user, so it's easy to game. And it duplicates active minutes. | **Drop the Move ring from scoring.** Show it in the app only. Replace the example rule with "≥ 2 strength days/week". |
| 4 | Motivational §2.4: starting step target 8,000 for both | Could be a big jump from someone's real baseline (unknown), or no challenge at all. | Start at baseline × 1.05, capped at 10,000 (both are under 60). Count "days hit", 5 per week. |
| 5 | Motivational §4.4: "never auto-raise targets" vs. my seasonal progression | I agree with "never force". But with no prompt, targets stay flat for a year and the beginner never reaches 150 min/wk. | At each season ceremony, show a **suggested target pre-filled** (my §3.3 step sizes) with Accept / Keep / Lower. Lowering after hard blocks can happen automatically; raising never does. |
| 6 | Motivational §7.2: rest nudge after 10+ consecutive hard days | Far too late. | Nudge after **6 days in a row** with ≥ 30 min, or a week more than 1.3× the 4-week average, or resting HR ≥ 7 bpm above baseline for 2 days (see gap G1 for the data). |
| 7 | Motivational: Cozy Days 12/yr vs. my "gentle days" 4/month | 12 a year doesn't cover period or low-energy days *and* minor illness. | **Cozy Days: 2 per month** (they roll over, max 6 banked), credited at target value. Real illness and injury use **Pause** (unlimited, honor system). |
| 8 | Designer §8: "perfect day" (all 4 fruits) pays bonus $ | A daily all-or-nothing bonus that a rest day can never earn. | Make the perfect day cosmetic only (sparkle and golden leaf), or let a rest day / Cozy Day count as the movement fruit. |
| 9 | Designer mockup: peach labeled "Move 34m" | "Move" means the calorie ring in Apple's vocabulary, which confuses which metric counts. | Label it **"Active min"** (`appleExerciseTime`). |
| 10 | Nutritionist §3: water logged per glass | 6–8 taps a day breaks the 10 s/day budget. | One water toggle in the evening card by default. Per-glass logging is opt-in. |
| 11 | My memo §4.1 (opt-in cycle data) vs. Nutritionist Q9 ("never goes in the app") | — | **I concede.** No cycle data ingestion. Cozy Days are self-tapped with no reason asked. I'll update my memo. |
| 12 | Season names differ across memos (Sprout/Bloom, Blossom/Sunny, Planting/Growing) | Confusing. | The lead picks one set. My progression just needs four 13-week blocks with easy weeks 4/8 and a week-13 recovery week. |

## 3. Gaps
- **G1. Data that isn't in the engineer's HAE config.** The HAE metric list (Eng §1) has steps, exercise, stand, active energy, sleep, water, and mindful minutes only. Recovery flags need **resting heart rate, HRV (SDNN), and VO2 max** added to the automation (all of these are HAE metrics; [U] on the exact keys). "Hard day" detection needs a **workout avg HR**. Config currently says "no fine-grained metrics", so confirm the v2 workout summary still includes avg/max HR. If it doesn't, the recovery rule falls back to "any workout ≥ 45 min".
- **G2. Strength is scored by sessions, not minutes.** The Watch often credits only part of a lifting session as Exercise minutes. Strength must count as **workout sessions** (type list in my §2: HAE `name` strings like "Traditional Strength Training", "Functional Strength Training", "Core Training"). The engineer needs a type→category mapping table plus a one-tap "was this strength?" for HIIT and yoga.
- **G3. "No data" is not "did nothing".** If the Watch was charging or left at home, show the day as **missing** (e.g., stand hours = 0 and steps < 500 from the Watch source). Auto-exclude it from weekly targets, pro-rated like a Cozy Day, limited to 2 per month. Nobody owns this today.
- **G4. Sleep night attribution.** Assign each night to the **wake date** (HAE `sleepEnd`), and handle naps or split sleep (don't count naps toward the 7 h).
- **G5. Safety onboarding.** No memo has a PAR-Q+ style screen or "stop signs" (chest pain, fainting). Needs a home in onboarding and help screens.
- **G6. Easy and recovery weeks.** No other memo has easy weeks (×0.8) or a recovery week. The rules engine needs a `week_multiplier` per season week, and the ceremony copy should celebrate them.
- **G7. Vacation and travel weeks.** Auto-pause the trip itself (Motivational has this). The engineer should detect time-zone shifts so travel mode can be suggested.

## 4. Positions on the lead's conflict points
**C1: one scoring model.** **100 points per person per week**, settled weekly. Each category has its own cap. Unlock 100% at 85 (keeps the motivational coach's calibration).

| Category | Points | Rule |
|---|---|---|
| Active minutes | 30 | Weekly vs. personal target, linear from 50% to 100%, daily cap |
| Strength | 20 | 2 (or 3) strength days |
| Daily movement | 10 | Step days hit, 5/7 |
| Sleep & recovery | 15 | Sleep nights 5/7 (10) + rest or mobility day (5) |
| Eats | 25 | Nutritionist's habits scaled to 25 (inside their 25–35% range) |

Couple bonuses (joint workouts, team week) sit **outside** the 100, as a separate Together line.

**C2: fewer concepts.** Three: **Fruit** (weekly points), **Jar** (vacation dollars), **Treat tickets**. Together Bonus is just a line in the ceremony. Lost & Found and Rainy Day are a year-end setting only, not a daily concept. One sentence: *"Grow your fruit each week to fill the trip jar, and earn treat tickets along the way."*

**C3: eating cadence.** **One evening check-in** (3–4 toggles, about 5 s), per the engineer and nutritionist. The per-meal tile can be an optional quick entry that fills in tonight's toggles.

**C4: metaphor = categories, 1:1.** Apple = daily movement (steps). Peach = active minutes. Plum = sleep & recovery. Pear = eats. **Add the coconut = strength day.** A hard shell for strong bones, it fits the island, and it grows on a palm next to each tree. Coconuts are counted per week (2–3).

**C5: settlement timing.** **Settle provisionally on Sunday at 7:30 pm, then top up** at Wednesday 04:00 (the engineer's D+2 job, no clawbacks). Sunday-evening workouts still count, just as a top-up shown at the next ceremony ("+$1.20 washed ashore").

**C6: treats.** **Separate treat budget.** Treat meals should never look like they cost the vacation, because that's the food-guilt problem the nutritionist warns about.

**C7: visibility.** By default, partners see **% of own target and goal met / not met** only. Raw numbers are opt-in per metric (sleep hidden by default), and calories are never shown. Comparing raw minutes or steps across different baselines invites one-upping and overtraining.

**C8: daily $.** **No daily dollars.** Show fruit and points daily, plus a weekly "on track for about $X" projection. Dollars appear at the ceremony and in the jar. A daily "+$3" teaches people to max out every day, which works against rest days and weekly targets.
