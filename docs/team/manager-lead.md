# Manager / Lead — Project Charter

## Vision
Two people, one year, one vacation they *earned*. A cozy island app that turns everyday healthy habits
(automatically measured by Apple Watch) into real savings, and makes showing up feel delightful rather than dutiful.

## Success criteria (end of year 1)
1. The vacation fund reaches its target at ~80–85% realistic adherence (not perfection).
2. Both partners are still opening the app weekly in month 12 (engagement doesn't collapse after the novelty wears off).
3. Measurable healthy change vs. their own baseline (activity minutes, strength days, sleep consistency, eating habits), with no injuries or burnout caused by the app.
4. Daily manual effort ≤ 10 seconds per person. Zero manual data import/export.
5. Health data stays private: self-hosted, encrypted in transit, never sent to third-party analytics.

## Non-goals
- Not a calorie counter, not a weight-loss app, not a social network.
- Not a general product. Optimise for exactly two trusted users; skip multi-tenant complexity.
- Not real bank automation in v1. The app is the ledger, and humans move the money.

## Working assumptions (to confirm with users)
| # | Assumption | Why it matters |
|---|---|---|
| A1 | Both use iPhone + Apple Watch with Health sync on | Basis of auto-tracking |
| A2 | Budget is configurable; example used in docs: $3,000 vacation + ~$50/mo dining treats | Calibrates the economy |
| A3 | Currency USD (configurable) | Copy and formatting |
| A4 | One partner (the builder) is comfortable self-hosting on a home machine or small VPS | Architecture |
| A5 | Profiles in `docs/profiles.md`; both have healthy BMI, so goals are fitness and habits, not weight loss. Fitness levels unknown, so everything is relative to personal baselines | Fairness |
| A6 | Start date ≈ Nov 2026, so year ends ≈ Nov 2027 | Seasons calendar |

## Process
1. **Round 1 – Discovery memos** (parallel): each role writes `docs/team/<role>.md`.
2. **Round 2 – Cross-review**: each role reviews the others' memos for conflicts and gaps → `docs/reviews/round-1.md`.
3. **Lead synthesis**: resolve conflicts and record decisions in `docs/decisions/`, then write `docs/PROPOSAL.md`.
4. **Round 3 – Final sign-off review** of the proposal → `docs/reviews/round-2.md`, then fix-ups.
5. Commit and push after each step.

## Update (2026-10-28, after round 3)
The working assumptions were superseded by user input: they live in Japan, use **yen** (¥520,000 trip + up to ¥104,000 treats), want a **Japanese-first** UI and a **super simple** app, B has a personal trainer, and A goes to Anytime Fitness. See `docs/profiles.md` and ADRs 0006–0007.
Process ran as planned, plus a round 3 for Japan localization and simplification.
