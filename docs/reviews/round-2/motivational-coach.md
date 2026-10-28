# Round 2 Sign-off: Motivational Coach

Reviewed: `PROPOSAL.md` v1.0 and ADRs 0001–0005 (mainly 0002–0004). The 3-concept economy, the 5-fruit card, the provisional Sunday ceremony and the privacy defaults are what I asked for in round 1. Overall the proposal is strong. I found three economy-rule gaps that need exact wording before build.

## (a) Blocking issues (each with an exact fix)

**B1. The ticket rule ties one partner's treat to the other partner's week.**
"Both partners score ≥ 60 → +1 ticket" is all-or-nothing and depends on your partner. One person's sick or rough week takes the date night away from both, so the stronger partner learns to watch the weaker one. That's the blame dynamic we designed out everywhere else. The Team share already covers the cooperative stake.
*Fix (ADR 0003 §3, PROPOSAL §3.3):* "Each partner who scores ≥ 60 in a week earns **½ ticket** (≈ $5.77). A Cozy-paused week counts as ≥ 60." The total is unchanged at ≈ $50/month when both show up. The threshold of 60 is right: it's a "showed up" allowance that keeps food rewards guilt-free.

**B2. A paused partner drags down the Team share.**
The Team share pays at the lower partner's ratio. ADR 0004 pays a paused week at the trailing 4-week %, so one partner's flu or injury reduces the other's money. The fitness coach's original rule ("paused partner counts as met") was lost in synthesis.
*Fix (ADR 0003 §2):* "For the Team share, a partner on a paused week or Cozy Day proration uses ratio = 1.0. The Team share then pays at the healthy partner's ratio."

**B3. The scope of extra fruit is undefined, which opens a cross-subsidy loophole.**
It's unspecified whether extra fruit (85–100) can recover *Team* shortfalls or the *partner's* shortfalls. If A's extra fruit retroactively raises the past `min()`, A is paying for B's missed weeks. That's exactly the subsidy resentment we wanted to avoid, and it muddies the ledger.
*Fix (ADR 0002/0003):* "Extra fruit recovers **only that person's own personal-share shortfall**, oldest week first, within the same 52-week year, at the normal rate (share/85 per fruit). The Team share has no recovery. Each week's Team share is final at D+2."
Exploit check: the categories are capped, so extra fruit can only come from *completing more categories* (sleep, eating, strength), not more cardio. There's no overtraining or sandbagging incentive, because missing a week then catching up takes ≥ 6 strong weeks for 1 zero week.

No leftover Nintendo IP in PROPOSAL, ADRs, mockup or style guide. "Animal Crossing–inspired" appears only as a descriptive phrase in docs, which is fine. My own round-1 memo still uses AC names (Bells, Nook, Isabelle). I've added a banner marking those names superseded, since the proposal links to that memo.

## (b) Non-blocking suggestions
1. **Calibration (85 = full share).** It's acceptable but slightly tighter than the brief ("80–85% earns the full trip"). Because the recovery cap is 15 fruit, a *mean* of 85 with normal weekly swings lands at about 97–100%, and a mean of 80 at about 93%. Recommend keeping 85 because easy weeks (×0.8) and Cozy proration add slack. Add a **one-time review after Season 1**: if the projected jar is under 90% while both feel they're "doing the plan", lower the threshold to 80. Write this into ADR 0003.
2. **One "good week" threshold.** Streaks say "weeks at ≥ 70%" (of what?), tickets use 60, and upgrades say "after good weeks". Define **good week = ≥ 60 fruit (or paused)** and use it for tickets, streaks and freezes.
3. **Island upgrades should unlock on cumulative fruit**, not "after good weeks" (§3.5). Otherwise a rough patch visibly freezes the island, which is a silent punishment.
4. **No cliffs inside categories.** Confirm "linear from 0%". Earlier fitness text said "0 below 50%", and a cliff brings back the what-the-hell effect.
5. **Notification rule contradiction.** "At most one notification a day" (§3.9) clashes with the 8 pm check-in push plus high-fives. Rewrite as: "≤ 1 *app-initiated nudge* per day. Partner high-fives (max 3/day, mutable), Sunday Settlement and Transfer Day are exempt."
6. **Paused-week pay (trailing %, 2/season) can be gamed** for up to 8 effortless paid weeks a year. Keep it on the honor system, but show the pause on the partner's Us tab and have the partner send a "feel better 💛" acknowledgement rather than approve it.
7. **Calibration weeks:** say whether the 2 calibration weeks are inside the 52 and what they pay. Suggest outside the 52, paying tickets only.
8. **12-month content cadence.** "One drop per quarter" is too thin for month 4–9 decline. Add one small **monthly quest** (rotating from the existing seasonal quest list), hold back about 30% of cosmetics for months 7–12, and from Season 2 on lead the Island tab with fruit and island rather than dollars (planned fade). The loops are otherwise sustainable: weekly ceremony, monthly Transfer Day, quarterly re-tune and fresh start, and the vivid voyage map.
9. **Divergence rule** (from my round-1 review): a private "make my targets cozier?" offer if one partner trails by > 20 fruit for 4 weeks. Never shown to the other partner.

## (c) Sign-off
**Yes, conditional on B1–B3** being written into ADR 0003 (and mirrored in PROPOSAL §3.3/§3.7). They are wording-level fixes with no architecture impact.
