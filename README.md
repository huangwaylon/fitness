# しまの貯金箱 · Island Fund 🏝️

A private, cozy, Animal Crossing–inspired fitness and healthy-eating app for two people in Japan.
Healthy habits, tracked automatically by Apple Watch, grow fruit. Every Sunday that fruit earns real yen (1 fruit = ¥50, plus a team bonus) into an open-ended trip jar and a treat purse.
Japanese-first UI (switchable to English), 3 simple pages, self-hosted.

**App → https://huangwaylon.github.io/fitness/** · **Start here → [`docs/PROPOSAL.md`](docs/PROPOSAL.md)** · Demo data: add `?demo` to the app URL.

## Repo layout
| Path | Contents |
|---|---|
| `app/` | The app: SvelteKit 3 + SQLite (drizzle) server on the Mac, scoring engine, PWA (ja/en). UI also built for GitHub Pages (`npm run build:pages`) |
| `app/src/lib/scoring/` | Pure scoring: dates, targets, visits, score, payout |
| `app/src/lib/server/` | API, ingest (Shortcuts), ledger, scheduler, push, auth |
| `app/drizzle/` | SQL migrations (run on boot) |
| `app/scripts/` | Ops CLIs: pair, token, devices, vapid, recompute, fetch-assets, backup / restore drill |
| `docs/PROPOSAL.md` | The cohesive proposal (v2.1) |
| `docs/profiles.md` | Participant profiles, gyms, eating patterns |
| `docs/decisions/` | Decision records 0001–0014 (latest: 0014 no Sunday promises, no Cozy Days, no ふたり tab) |
| `docs/design/` | Style guide v3, Animal Crossing research |
| `docs/ops/` | Runbook (Funnel, pairing, backups) and the Shortcuts health-sync guide |
| `docs/research/no-mac/` | Options for running without the Mac |
| `docs/reviews/round-4/` | Latest reviews: code cleanup, fitness/nutrition, UX/motivation (earlier rounds and role memos are in git history) |

## Status
Design complete (v2.1). **Implementation in progress** on main: MVP server, scoring and PWA built; round 4 reviews in `docs/reviews/round-4/`. Next: the Phase 0 spike on the real phones (Tailscale Funnel + Shortcuts health sync + gym Shortcuts), then calibration. App: [`app/`](app/), ops: [`docs/ops/runbook.md`](docs/ops/runbook.md).
