# 0014 — Simplify: no Sunday promises, no Cozy Days, no ふたり tab
**Status:** Accepted (user input, 2026-10-28). Supersedes the Sunday-promise parts of 0006 and 0011, and the Cozy Day, calibration-cozy and rest-day-cozy clauses of 0011.

**User input:** remove the Sunday promise feature and Cozy Days entirely; drop the ふたり (Us) tab. The partner's fruit and score stay on Island, and settings live in the しまフォン launcher.

## Decision
- **No Sunday promise.** No setting, cheering, auto-check (✓/○), "what got in the way?" prompt or harvest step. The harvest goes tally → rung (if one was reached) → 「壺に入れる」. The `week_promise` table is dropped (migration 0003).
- **No Cozy Days.** No のんびりデー toggle, no monthly or weekly caps. **Targets are never prorated.** The only proration left is Pear over the 正月 pear-off days (Dec 29–Jan 3). The `cozy_day` table is dropped.
- **Rest day** = a day with Health data and no strength day, no workout ≥ 45 min and none ≥ 20 min at average HR ≥ 77% of `220 − age`. Days without data never count.
- **Calibration** pays the flat 60 with Health data on ≥ 6 of 7 days. No other days count as data days.
- **Reminders:** the 20:00 check-in reminder skips only people who already ticked and 正月 days.
- **No ふたり tab.** The server never assumed it: `GET /api/week` already returns the partner's privacy-filtered card, and Island and しまフォン use it.
- **Villager prefs:** only the roster key `villager` is kept. `villager_species`/`villager_color` are dropped, and a roster id stored in `villager_species` is first copied into `villager`.

## Consequences
- **A sick or travel week just scores lower.** Nothing excuses a day. Weekly slack (5 of 7 step days, linear partial credit) and the Wednesday top-up are the only cushion. If this feels harsh in practice, pause weeks (v1) are the way back, not Cozy Days.
- Easy weeks (×0.7 around 正月), the rest-day Peach bonus and the daily active-minute cap are unchanged.
- No more accountability-by-promise: the team bonus (¥20 × the lower score) and the partner's visible fruit carry the "together" part.
- API removed: `POST /api/promise`, `/api/promise/cheer`, `/api/promise/blocker` and `/api/cozy-day`. In `WeekView`, `PersonWeekView` loses `promise`, `cozyDaysThisMonth`, `isCozyToday`, `villagerSpecies` and `villagerColor`, and `villager` is always present. `HarvestView` loses `promiseResults`.
- No week has been settled yet, so the ledger is unaffected. The one test promise row is lost.
