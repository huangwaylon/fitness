# Motivational Coach: Round 3 (yen, accountability, simplicity)
Responds to ADR 0006 and the user's new input: yen, no intermediate currencies, "team effort but also accountability for each side", super simple and uncluttered, living in Japan, one partner with a personal trainer (PT) and one with Anytime Fitness.

## 1. Critique of ADR 0006
**Dropping tickets, Fruit as a score: right, strongly endorse.** Every intermediate currency adds an exchange rate the couple has to keep in their heads. A score ("72 / 85") plus real yen is the minimum that still gives daily feedback. Keep fruit as the *picture* of the score (the tree), never as a balance.

**¥4,000 / ¥4,000 / ¥2,000 (40/40/20): right balance, with two fixes.**
- 80% of the money is personal, so each person clearly owns "my part of the trip" (accountability). The 20% team share pays at the lower ratio, so it's always worth lifting your partner. Above about 25% team share, a struggling partner starts to feel like they're "costing us," which turns into guilt. Don't go higher than 20%.
- Arithmetic to know: while B is the lower partner, each of B's fruit is worth ¥70.6 (¥47 personal + ¥23.5 team) and each of A's is worth ¥47. That's acceptable, but **copy must never say who set the team rate**. Write "Team ¥1,647", never "limited by Bean".
- **Fix 1: the jar layers.** Equal shares make "Mochi ¥128,000 · Bean ¥121,500" a running head-to-head leaderboard. Show the **combined jar** on Home. Personal layers sit one tap deeper, each shown against *its own* maximum ("your part: 94%"). Accountability is about your own plan, not a comparison.
- **Fix 2: drop the ≤5-fruit bonus for kept promises.** Paying for kept promises teaches people to set promises they can't miss (sandbagging), and the workout itself already earns fruit. A kept promise earns a ✓ stamp and partner recognition only (see §2).
- **"Under 60 for two weeks → partner gets an invite suggestion":** keep it, but the prompt must never mention the score ("Fancy a walk to the konbini together tonight?"). At the same time, the struggling partner privately gets "make next week cozier?". If one partner trails by more than 20 fruit for 4 weeks, offer re-tuned targets privately.

**Treat Purse ¥1,000 per person at ≥ 60: works.** It's individual (no partner dependency, which fixes my round-2 B1), uses a low "showed up" bar, and a paused week counts. ¥2,000/week ≈ ¥8,700/month, which buys a yakiniku night monthly or several café dates. Keep the rule from ADR 0003 that items **≥ ¥5,000 need both partners to tap yes**. No treat costs score.

## 2. The Sunday promise and accountability loop
**Evidence.** Implementation intentions ("When/where X, I will Y"; Gollwitzer 1999) had a medium-to-large effect on goal attainment in Gollwitzer & Sheeran's 2006 meta-analysis (d ≈ 0.65). Prompting people to write down a specific date and time raised follow-through (Milkman et al. 2011, flu-shot plans). Monitoring progress improves goal attainment more when the progress is *reported to someone* (Harkin et al. 2016 meta-analysis). Accountability works best when it's about *process* and the audience is supportive (Lerner & Tetlock 1999), so the partner is a **witness and helper, not a judge**. If-then backup plans protect against all-or-nothing thinking (the what-the-hell effect).

**Flow (≈ 20 s per person, the last step of the Sunday ceremony):**
1. **Make the plan.** One card: *When* (day + time chips) · *Where* (Anytime Fitness / PT studio / home / outside) · *What* (strength, run, walk…). It's pre-filled from last week and from recurring sessions, so the PT slot appears automatically. One promise per person, two at most.
   - Fairness: PT sessions are already externally accountable, so the PT partner's promise should be something *beyond* the PT session (e.g. "PT Wed + solo Sat 9:00"). The Anytime partner has no external check, so the promise matters most for them.
2. **Optional backup:** "If I miss it, then ___" (e.g. "Thu 19:00 instead"). If the backup is kept, the promise counts as kept.
3. **Witness.** The partner sees the promise and taps **"I've got you 🤝"**. They can optionally add a helper action ("I'll make dinner Tue so you can go"). This is the team half of accountability.
4. **During the week:** one cue notification to the *promiser only*, the evening before (07:00 plans) or 1 h before. Nothing goes to the partner.
5. **Automatic check:** kept = a Watch workout of a matching type on the promised day (±1 day, or the backup slot). Promises that can't be auto-checked ("cook 3 dinners") get a single self-tap at the ceremony. Cozy Days set the promise to "paused 🌙" automatically.

**How it looks the next Sunday (both partners see this):**

| Outcome | Shown | Copy |
|---|---|---|
| Kept | ✓ green stamp on the promise card; a stamp in a simple "promise book" | Juniper: "Promise kept! Tue 7:00 at Anytime ✓" · partner gets "Bean kept her promise 🎉" |
| Kept via backup | ✓ stamp with a small ↻ | "Plan B saved the day. That's a skill!" |
| Paused (Cozy Day) | 🌙 | "Rest week. Promise on pause." |
| Not kept | ○ open circle (never a red ✗) | "Not this week 🌱" |

When a promise isn't kept, **only the promiser** gets one optional question: "What got in the way?" with chips (work ran late / tired / sick / plans changed / skip). Then: "Make next week's plan smaller or move the time?" After 2 open circles in a row, Juniper suggests "so easy you can't say no" sizing (e.g. 20 min instead of 60). The promise has **no money attached** (the behavior already pays) and **no streak to lose**. The promise book shows kept stamps only, so it doesn't count failures.

A nice touch for Japan: Sunday evening blues ("Sazae-san syndrome") is a known feeling. A warm 2-minute ceremony plus a concrete Monday plan turns Sunday night into something to look forward to. Use 正月 (New Year), Golden Week and Obon as extra fresh-start moments.

## 3. Simplicity: keep / later / cut
Home screen in the MVP is **two trees + the combined jar + one Juniper line + one button**. Nothing else.

| Element | Verdict | Why |
|---|---|---|
| 5-fruit weekly score (tree) | **Keep (MVP)** | The core feedback |
| Trip Jar (combined) + simple voyage line with real milestones | **Keep (MVP)** | The dream, made visible |
| Treat Purse + short yen shop list | **Keep (MVP)** | The small reward |
| Sunday ceremony (≤ 60 s) + Sunday promise | **Keep (MVP)** | The ritual plus accountability |
| Evening eating check-in (3 taps) | **Keep (MVP)** | Needed for the pear |
| Cozy Day | **Keep (MVP)** | Forgiveness |
| Juniper one-liner (1 per day, no cycling) | **Keep (MVP)** | Tone carrier, zero clutter |
| High-five (one tap on partner's tree) | **Keep (MVP)** | Cheap warmth |
| Season re-tune + one-screen season recap | Later (v1) | Needed by month 3, not day 1 |
| Island upgrades (from cumulative fruit, quiet) | Later (v1) | Long-term novelty with no extra UI |
| Museum: a single milestone shelf | Later (v1) | Year-long progress; fold in personal bests |
| One seasonal event per season | Later (v1) | Novelty in months 4–12. Replaces monthly quests |
| Partner invite suggestion | Later (v1) | Needs a few weeks of data |
| Widgets / Watch complication | Later (v1) | Native companion |
| Critters/random catches, recipes, art collections | **Cut** | Collection clutter |
| Streaks + freeze tokens | **Cut** | The weekly score already forgives. Promise stamps replace streaks |
| Perfect-day golden leaf, balloons, Lucky Day | **Cut** | Variable-reward noise |
| Monthly quests, Fishing Tourney, multiple events per season | **Cut** | Merged into one event per season |
| Cosmetic shop, outfits, deep villager customization | **Cut** | Only pick species + colour + name |
| Promise fruit bonus, "≈ ¥ so far this week" on Home | **Cut** | Sandbagging / clutter (keep it on the Jar tab only) |
| Island Passport, ambient sound, extra NPCs | **Cut** | Nice but not needed |

## 4. Yen worked numbers (52 weeks, ¥10,000/week jar, both partners at the same score, whole-yen rounding down)
| Weekly score (both) | Weekly jar | Trip Jar / year | Treat Purse / year |
|---|---|---|---|
| 100 | ¥10,000 | **¥520,000** (full; extra fruit has nothing to recover) | ¥104,000 |
| 85+ | ¥10,000 | **¥520,000** (full) | ¥104,000 |
| 75 | ¥8,822 | ¥458,744 (88%) | ¥104,000 |
| 60 | ¥7,057 | ¥366,964 (71%) | ¥104,000 |
| 40 | ¥4,705 | ¥244,660 (47%) | ¥0 |

**More realistic mixes:**
- Alternating 75/95 weeks (mean 85): **¥513,812**. The shortfall bank recovers the personal shares, and only the team share's dips (≈ ¥6,000) stay unearned.
- A steady at 90, B steady at 70: **¥464,932**.

Unearned yen stays in savings. ¥520,000 ≈ $3,300 at ¥158/USD.
