# Round 1 Review: UI/UX Designer

Reviewed: fitness-coach, nutritionist, motivational-coach, software-engineer, manager-lead, `research/apple-health-ingestion.md`, `profiles.md`.
Lens: can two people understand it at a glance, how many concepts does it ask them to learn, does it fit on a 390pt screen, and does the tone stay consistent.

**Headline:** each memo is strong on its own, but stacked together they add up to ~25 user-facing concepts, 11+ scored items per person, 3 season naming schemes and 4 settlement times. The product only works if it can be explained in one sentence and Home shows at most 4 rows per person.

## 1. What I endorse
- **Baseline-relative goals, equal points, no calories or weight in scoring** (fitness §3.5, nutrition §5, coach §4.4). This is also a UI rule: never show raw numbers from both partners side by side.
- **Weekly accounting with slack and linear partial credit** (all three). That's a gift for UX, because nothing ever looks "failed".
- **Point caps and "more isn't better"** (fitness §4.3, nutrition caps). The UI should show a full tree, not a counter that keeps climbing.
- **The nutritionist's evening card**: 3 to 4 toggles, 48h backfill, partner co-logging, no free text. Better than my per-meal tiles (see C3).
- **The coach's tone rules and banned-word list**, plus "settlement screen leads with the combined number." Fitness copy ("re-tuned", "rest is progress") matches.
- **Engineer: "today so far (syncing…)" with a last-synced time per person**, append-only ledger, no clawbacks, Transfer Day as a single "I moved it" button. All of these are easy to design and build trust.
- **Engineer's MVP path** (PWA + Health Auto Export + optional Scriptable widget, then a native companion in v1). Matches my widget/Watch concepts.

## 2. Conflicts and concerns, with fixes
1. **IP risk in the coach memo.** It uses "Nook Miles", "Bells", "Nook's Cranny", "Payday at Nook's", Blathers/Isabelle/Redd/Saharah/Kicks, a raccoon host, and Tom Nook's catchphrases ("hm-hmm", "Yes, yes!"). **Fix:** use only our own names (Fruit, Jar, Treat tickets, Juniper the capybara, Harbor Day) and write original voice lines. The coach's ideas stay; only the names change.
2. **"Bells as cents" (+5,325 Bells).** This hides the real stakes and adds a second money unit. **Fix:** always show real `$`.
3. **Too many scored items.** Fitness has 7 metrics, nutrition 4 to 5 habits, plus quests, joint, team, focus, recovery and comeback items. Home can hold 4 rows per partner in two columns at 390pt. **Fix:** 4 categories (see C1). Sub-metrics live in a "How was this counted?" sheet, not on Home.
4. **Six overlapping rest mechanics.** Sick day, gentle day (4/mo), pause week, travel, injury, Cozy Days (12/yr) and life-happens pause, plus two different freeze systems (2/season vs 1 per 4 weeks, max 3). **Fix:** expose two buttons. **Cozy day** is one tap for one day. **Pause** covers multiple days, with a reason chip (sick, travel, injury); the reason sets the engine's rules. Use one freeze system (the coach's earned Snowflakes).
5. **Four couple mechanics.** Joint +5 (max 3), Team week +10, Together Bonus (min), and Buddy +50% for the partner who is behind. **Fix:** keep the **Together Bonus** as one row in the ceremony. A detected joint workout grows a **golden fruit** worth a small bonus. Drop Team week (it duplicates Together) and Buddy +50% (hard to explain).
6. **Three season naming schemes** (Sprout/Bloom/Harvest/Snowfall, Planting/Growing/Harvest/Celebration, Blossom/Sunny/Harvest/Cozy), and the start is about November. **Fix:** one set tied to the real calendar, starting with **Cozy Season (winter)**. The fitness block structure and nutrition habit additions hang off the same 13-week seasons.
7. **Notification budget.** The coach says ≤1/day, but the memos add check-in, celebrations, cheers, ceremony, Transfer Day and the recovery nudge. **Fix:** one evening push (the check-in card). Sunday's push is the ceremony instead. Transfer Day is monthly. Celebrations and cheers show in the app only, unless a partner opts in.
8. **Manual workouts.** The coach wants a partner thumbs-up before Bells count; fitness says count them and keep them visible. **Fix:** go with fitness. Show a small "hand-logged" leaf tag. An approval queue adds friction and implies distrust.
9. **The coach's daily loop is 30 to 60 s** with a manual "collect" tap, which strains the charter's ≤10 s. **Fix:** collecting is optional delight. Fruit is auto-collected at midnight.
10. **Concept leakage.** "Island Locker" is the name of a bank account, not an app concept. "Rainy Day" is a year-end setting. Neither belongs in the main UI.

## 3. Gaps (no one owns these yet)
- **Onboarding and setup:** Add to Home Screen, enabling web push (has to be triggered by a tap), Health Auto Export install and token, Tailscale VPN On Demand, picking villagers, PAR-Q+, destination and budget. This is about 15 minutes of fiddly steps. It needs a guided checklist with ticks and a "Test sync" button. I'll design it.
- **Stale-sync state:** if Health Auto Export hasn't posted in more than 18h, show Juniper: "I haven't heard from Mochi's Watch since yesterday," with 2 fix steps. Never show an empty tree that looks like failure.
- **The 2-week calibration period:** what do the trees show? Proposal: "seedling" trees with a flat participation rate and no goals shown.
- **Strength confirmation** ("Did this include strength?") and **rule changes that need both partners' approval** both need UI. I'll do inline bubble cards.
- **A "hide numbers / pause economy" escape hatch** (coach and nutritionist both want one). It goes in Settings plus a long-press on the jar.
- **A content pipeline** for about 150 original voice lines. Needs one owner and a tone guide; I can draft it.
- **Wheelchair `pushCount`** and a Dynamic Type check on the 4-row Home at 200% text size.

## 4. Positions on the lead conflict points
**C1: one score.** Each person has one weekly score out of **100 points**. The **Jar fills at 85** (the coach's linear unlock, 81 to 85% adherence pays the full share). Weights, with fitness scaled to 75 and nutrition to 25 (inside the nutritionist's 25 to 35% band):

| Category (fruit) | Pts | From |
|---|---|---|
| **Move** (apple) | 45 | exercise minutes 30, step days 10, active days 5 |
| **Strength** (coconut) | 15 | strength days vs target (1 to 3), always worth 15 total |
| **Rest** (moon-plum) | 15 | sleep nights 10, recovery day 5 |
| **Eat** (pear) | 25 | 3 to 4 chosen habits on 5 of 7 days, home-cooked count |

Stand hours, Move ring and water over goal become badges or quests only. Couple bonuses and quests sit on top of the 100.

**C2: concepts.** Three: **Fruit, Jar, Treat tickets.** One-sentence pitch: *"Healthy days grow fruit; every Sunday your fruit fills the trip jar with real dollars and earns treat tickets for date nights."* Miles become Fruit, Bells become `$`, and the Together Bonus is a ceremony row. Lost & Found becomes the **remaining sea distance** on the voyage map, and overflow or comebacks show as "catching the tide." Locker and Rainy Day are settings, not concepts. Cosmetics unlock at milestones, so there's no second spendable currency.

**C3: check-in.** **One evening card** (the nutritionist's): 3 to 4 big toggles that save on tap, opened from the 8 pm push, a widget, or the Home button. It can be opened any time during the day, and the toggles remain set. 48h backfill. "We both had home-cooked dinner" fills both cards. My per-meal tiles are retired. Target: 1 card, ≤4 taps, about 6 s.

**C4: metaphor.** A 1:1 mapping, which also fixes the daily-vs-weekly mismatch: **each person's tree is weekly.** It has slots for that week's targets (apples for Move, coconuts for strength days, plums for rest nights, pears for eating days). Fruit appears as it's earned, today's new fruit sparkles, Sunday is the harvest, and Monday brings a fresh tree. **Coconut = strength** (sturdy, hard shell), which gives strength a distinct shape and color.

**C5: timing.** Keep the **Sunday 7:30 pm ceremony** (the ritual plus the Monday fresh start). Show it as a provisional floor: "$56 so far · Sunday still syncing." Final numbers come at the engineer's Wed 04:00 run. Any top-up appears as "+$2.10 washed ashore" on Home and in the next ceremony. Because there are no clawbacks, the provisional figure counts only data that has arrived, so the money shown can only go up.

**C6: treats.** **A separate treat budget** (about $50/mo), unlocked by the same weekly score and paid out as treat tickets. Never deducted from the trip jar. Unspent treat money can move to the trip at year end.

**C7: visibility.** By default, partners see **fruit and % of own goal only**. Raw numbers are private, with opt-in sharing per metric. Sleep and eating are always shown as fruit or no fruit. Raw numbers are never placed side by side (body-size fairness). I'll update my mockup, which currently shows Bean's raw steps.

**C8: daily dollars.** Daily feedback is **fruit only**. Dollars appear in the Sunday ceremony and on the Fund screen as "this week so far ≈ $X, settles Sunday." This avoids daily money noise and the crowding-out effect the coach cites. I'll remove the "+$3" chip from Home.
