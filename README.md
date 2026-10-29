# しまの貯金箱 · Island Fund 🏝️

A private, cozy, Animal Crossing–inspired fitness and healthy-eating app for two people in Japan.
Healthy habits, tracked automatically by Apple Watch, grow fruit. Every Sunday that fruit earns real yen (1 fruit = ¥50, plus a team bonus) into an open-ended trip jar and a treat purse.
Japanese-first UI (switchable to English), 3 simple pages. No server of our own: a Google Sheet + Apps Script backend, the UI on GitHub Pages ([ADR 0015](docs/decisions/0015-google-sheet-backend.md)).

**App → https://huangwaylon.github.io/fitness/** · **Start here → [`docs/PROPOSAL.md`](docs/PROPOSAL.md)** · Demo data: add `?demo` to the app URL.

## Architecture
iOS Shortcuts (health sync, gym Arrive/Leave) and the PWA POST `{key, action, …}` to an **Apps Script web app** bound to the *Island Fund* sheet, which stores append-only rows. The PWA fetches the rows and **computes scores, yen, harvest and jar in the browser** (`app/src/lib/model/`), painting from a local snapshot and queueing writes. Contract: [`docs/design/sheets-architecture.md`](docs/design/sheets-architecture.md).

## Repo layout
| Path | Contents |
|---|---|
| `app/` | SvelteKit 3 static PWA (ja/en). `npm run build` → `build-pages/` for GitHub Pages; needs `VITE_GAS_URL` (see `.env.example`) |
| `app/src/lib/model/` | Compute-on-read: sheet rows → WeekView (scores, ¥, harvest, jar); golden fixtures frozen from the old server |
| `app/src/lib/scoring/` | Pure scoring: dates, targets, visits, score, payout |
| `app/src/lib/client/` | Apps Script client (`gas.ts`: keys, write queue, snapshot cache), stores, actions |
| `app/src/lib/ingest/` | Dependency-free Shortcut body parser (shared by the browser and Apps Script) |
| `app/gas/` → `app/apps-script/` | Apps Script source (TS) and its bundled `Code.js` (`npm run gas:build`) |
| `app/scripts/` | `fetch-assets` (official art), `export-to-sheet` (one-time Mac DB → sheet migration) |
| `docs/PROPOSAL.md` | The cohesive proposal (v2.1) |
| `docs/profiles.md` | Participant profiles, gyms, eating patterns |
| `docs/decisions/` | Decision records 0001–0015 (latest: 0015 Google Sheet backend, no Mac) |
| `docs/design/` | Sheets architecture contract, style guide v3, Animal Crossing research |
| `docs/ops/` | Runbook, Google setup, the Shortcuts health-sync guide |
| `docs/research/no-mac/` | The research behind ADR 0015 |
| `docs/reviews/round-4/` | Latest reviews (earlier rounds are in git history) |

## Status
Design complete (v2.1). MVP built and moved to the Sheet backend (the Mac server is deleted from the code). **Next:** create the sheet and deploy the script ([`docs/ops/google-setup.md`](docs/ops/google-setup.md)), set the `GAS_URL` repo variable, migrate the Mac data and switch the Shortcuts ([`docs/ops/runbook.md`](docs/ops/runbook.md)); then calibration.
