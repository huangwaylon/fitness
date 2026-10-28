# しまの貯金箱 · Island Fund 🏝️

A private, cozy, Animal Crossing–inspired fitness and healthy-eating app for two people in Japan.
Healthy habits, tracked automatically by Apple Watch, grow fruit. Every Sunday that fruit earns real yen (1 fruit = ¥50, plus a team bonus) into an open-ended trip jar and a treat purse.
Japanese-first UI (switchable to English), 3 simple pages, self-hosted.

**App → https://huangwaylon.github.io/fitness/** · **Start here → [`docs/PROPOSAL.md`](docs/PROPOSAL.md)** · Mockup: open [`docs/design/mockup.html`](docs/design/mockup.html) in a browser.

![Mockup](docs/design/mockup-preview.png)

## Repo layout
| Path | Contents |
|---|---|
| `docs/PROPOSAL.md` | The cohesive proposal (v2.1) |
| `docs/profiles.md` | Participant profiles, gyms, eating patterns |
| `docs/decisions/` | Decision records 0001–0013 (latest: 0013 UI on GitHub Pages, API on the Mac) |
| `app/` | The app: SvelteKit 3 + SQLite server, scoring engine, PWA (ja/en) |
| `docs/ops/` | Runbook: Funnel, pairing, Shortcuts health sync, gym Shortcuts, backups |
| `docs/team/` | Role memos: round 1, round 3 (Japan), personalized nutrition |
| `docs/reviews/` | Cross-review round 1 and sign-off round 2 |
| `docs/research/` | Apple Health ingestion research |
| `docs/design/` | Mockup, style guide, preview |

## Status
Design complete (v2.1). **Implementation in progress** on main: MVP server, scoring and PWA built and reviewed (round 3); Animal Crossing–style UI revamp in progress. Next: the Phase 0 spike on the real phones (Tailscale Funnel + Shortcuts health sync + gym Shortcuts), then calibration. App: [`app/`](app/), ops: [`docs/ops/runbook.md`](docs/ops/runbook.md).
