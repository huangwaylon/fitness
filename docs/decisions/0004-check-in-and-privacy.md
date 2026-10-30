# 0004 — Eating check-in cadence and partner visibility
**Status:** Partly superseded by ADR 0016: visibility (all data is shown to both) and the 8 pm push (no alerts). The evening check-in itself stands. Was: accepted (round 1), resolving C3 and C7.

**Check-in.** One **evening card** (push at ~8 pm, or from a widget or Watch button) with **3 habit toggles** for the season, e.g. *veggies at 2+ meals*, *no sugary drinks*, *home-cooked dinner*. It takes one tap per habit, ≤ 10 s total. Missed days can be filled in up to 48 h later, and a partner can co-log ("we both cooked").
There's a neutral "treat today 🍰" chip that never costs fruit. No per-meal Healthy/Balanced/Treat grading, and no food → money link at the meal level.
Water comes in automatically from Health if logged. It's shown but not scored in Season 1, and may become a habit option later.

**Visibility.** By default each partner sees the other's **fruit and % of target** per category. Raw numbers (steps, minutes, sleep hours) are opt-in per person per metric. Individual eating answers are **never** shown to the partner, only the pear count.
This is enforced server-side, not just hidden in the UI.

**Cozy days (single rest mechanism).** Either partner can mark a day as a Cozy Day (sick, travel, low energy). Targets for that week prorate, so a full share is still reachable.
Up to 4 per month need no explanation. A fully paused week (illness or the vacation itself) pays at the person's trailing 4-week %, up to 2 weeks per season.

## Round 2 amendments
- **Long pauses:** beyond 2 paused weeks per season, weeks are excluded from scoring and their personal share goes to the shortfall bank. The return week uses ×0.8 targets.
- **Recovery hint** triggers on any one signal (resting HR ≥ 7 bpm over baseline, HRV well below norm, or two short nights). It's a suggestion only.
- **Fuelling safeguard:** "refuel" tips after big training days, plus a private monthly self-check (energy, sleep, cycle regularity). Answers are never shared or scored; concerning answers suggest seeing a professional.
- **Visibility** is stored in `visibility_pref(person, metric, share_raw)` and enforced in the API.
