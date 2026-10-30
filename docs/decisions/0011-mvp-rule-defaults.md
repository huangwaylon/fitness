# 0011 — MVP rule defaults for implementation
**Status:** Accepted (lead, start of implementation); **money, scoring, per-person targets, easy weeks and calibration superseded by [0019](0019-bells-daily-earning-two-pots.md)**; **amended by [0014](0014-simplify-no-promises-no-cozy.md)**: Cozy Days, the promise check and the cozy clauses on calibration and rest days are gone. Fills gaps left after 0008/0009 removed the shortfall bank and sleep. Notifications superseded by [0016](0016-no-privacy-no-alerts.md); settlement (ledger, locking, jobs) by [0015](0015-google-sheet-backend.md) (compute-on-read, max of Sun 19:30 and Wed 04:00); active minutes by [0017](0017-round-4-rule-changes-and-rule-versions.md). Values live in `app/src/lib/config/rules.ts`: edit them there and redeploy, as a new dated rule set ([0017](0017-round-4-rule-changes-and-rule-versions.md)).

## Decision
- **No pause weeks in the MVP.** Cozy Days are the only rest mechanism (as SE round 3 §4 already cut). The "paused partner counts as 100" clauses in 0008 stay dormant until pause ships in v1.
- **Cozy Days:** at most **4 per calendar month and 3 per Mon–Sun week** per person (scoring also ignores any beyond 3, so a week is never fully excused). Only **today or yesterday**, and not on a day that already has a strength workout or ≥ 30 active minutes. A Cozy Day counts as a rest day and removes that day from every day-count target (exact fractions, no rounding).
- **Calibration (2 weeks):** flat **60 fruit** per person per week when Health data is present on **≥ 6 of 7 days** (no wear-time metric exists in HAE; Cozy Days count as data days), otherwise 0. Pays like a normal week (¥50 × 60, team bonus, Treat Purse).
- **One holiday window:** 正月 **Dec 29–Jan 3**: Pear not scored (those days drop out of the 15/21 target). The two easy weeks (Mon–Sun weeks touching Dec 25–Jan 1, always exactly two) use targets × 0.7 for Peach, Coconut and Apple.
- **Active minutes per day:** moved to [0017](0017-round-4-rule-changes-and-rule-versions.md) (max of Watch, step-derived and manual minutes, then the daily cap).
- **Score rounding:** categories are computed in integer milli-fruit and summed; the weekly score is `floor(sum / 1000)`. Yen are computed from that integer score.
- **Rest day:** a Cozy Day, or a day with Health data and no strength day, no workout ≥ 45 min and none ≥ 20 min at average HR ≥ 77% of `220 − age`. Days without data never count, so an empty week scores 0.
- **Strength day sources (max 1 per day):** Traditional/Functional Strength or Pilates ≥ 15 min; a Core/HIIT/yoga workout the person tapped "included strength"; a visit (arrive→leave ≥ 30 min) to a place marked `autoStrength` (B's PT studio); a gym visit the person confirmed (at most 2 confirmed visits paid per week).
- **Promise check:** each promised day needs a matching activity (workout of the promised kind, or a visit) on that day ±1, each activity used once.
- **Settlement:** Sunday 19:30 JST writes provisional `earn` entries; Wednesday 04:00 JST writes `topup` entries for any increase, then locks the week. No clawbacks.
- **Notifications:** at most one push per person per day, by priority: Sunday harvest (from 19:30) → evening check-in (20:00; not on 正月 days) → payday (25th). Gym-visit questions are in-app only. Nothing 22:00–07:00.

Amended after the round 3 review (in git history).
