# 0011 — MVP rule defaults for implementation
**Status:** Accepted (lead, start of implementation). Fills gaps left after 0008/0009 removed the shortfall bank and sleep. Values live in `app/src/lib/config/rules.ts` and can be tuned without code changes.

## Decision
- **No pause weeks in the MVP.** Cozy Days are the only rest mechanism (as SE round 3 §4 already cut). The "paused partner counts as 100" clauses in 0008 stay dormant until pause ships in v1.
- **Cozy Days:** at most **4 per calendar month** per person, enforced by the API. A Cozy Day counts as a rest day and removes that day from every day-count target (exact fractions, no rounding). If every non-holiday day of a category is excused, that category pays in full.
- **Calibration (2 weeks):** flat **60 fruit** per person per week when Health data is present on **≥ 6 of 7 days** (no wear-time metric exists in HAE), otherwise 0. Pays like a normal week (¥50 × 60, team bonus, Treat Purse).
- **One holiday window:** 正月 **Dec 29–Jan 3**: Pear not scored (those days drop out of the 15/21 target). The two easy weeks (Mon–Sun weeks touching Dec 22–Jan 3) use targets × 0.7 for Peach, Coconut and Apple.
- **Score rounding:** categories are computed in integer milli-fruit and summed; the weekly score is `floor(sum / 1000)`. Yen are computed from that integer score.
- **Rest day:** no workout ≥ 20 min with average HR ≥ 77% of `220 − age`. Cozy Days count as rest days.
- **Strength day sources (max 1 per day):** Traditional/Functional Strength, Core or Pilates ≥ 15 min; a HIIT/yoga workout the person tapped "included strength"; a visit (arrive→leave ≥ 30 min) to a place marked `autoStrength` (B's PT studio); a gym visit the person confirmed.
- **Promise check:** each promised day needs a matching activity (workout of the promised kind, or a visit) on that day ±1, each activity used once.
- **Settlement:** Sunday 19:30 JST writes provisional `earn` entries; Wednesday 04:00 JST writes `topup` entries for any increase, then locks the week. No clawbacks.
