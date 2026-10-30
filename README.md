# しまの貯金箱 · Island Fund 🏝️

A cozy fitness and healthy-eating app for two people in Japan, drawn with official Animal Crossing art ([ADR 0018](docs/decisions/0018-official-art-public-site.md)).
Healthy habits, tracked automatically by iPhone and Apple Watch, grow fruit. Every Sunday that fruit earns real yen (1 fruit = ¥50, plus a team bonus) into an open-ended trip jar and a treat purse.
Japanese-first UI (switchable to English): the island, 旅の壺 and NookPhone apps (きろく history + editing). No server of our own: a Google Sheet + Apps Script backend, the UI on GitHub Pages ([ADR 0015](docs/decisions/0015-google-sheet-backend.md)).

**App → https://huangwaylon.github.io/fitness/** · **Start here → [`docs/PROPOSAL.md`](docs/PROPOSAL.md)** · Demo data: add `?demo` to the app URL.

## Architecture
iOS Shortcuts (health sync, gym Arrive/Leave) and the PWA (check-ins, harvest, purse, きろく edits) POST `{key, action, …}` to an **Apps Script web app** bound to the *Island Fund* sheet, which stores append-only rows. The PWA fetches the rows and **computes scores, yen, harvest and jar in the browser** (`app/src/lib/model/`), painting from a local snapshot and queueing writes. Contract: [`docs/design/sheets-architecture.md`](docs/design/sheets-architecture.md).

## Repo layout
| Path | Contents |
|---|---|
| `app/` | SvelteKit 3 static PWA (ja/en). `npm run build` → `build-pages/` for GitHub Pages; needs `VITE_GAS_URL` (see `.env.example`) |
| `app/src/lib/model/` | Compute-on-read: sheet rows → WeekView (scores, ¥, harvest, jar); golden fixtures frozen from the old server |
| `app/src/lib/config/rules.ts` | The rules as data, versioned by week ([ADR 0017](docs/decisions/0017-round-4-rule-changes-and-rule-versions.md)) |
| `app/src/lib/scoring/` | Pure scoring: targets, visits, score, payout (calendar helpers are in `app/src/lib/time/`) |
| `app/src/lib/sync/` | Apps Script client: storage key registry, transport, write queue, IndexedDB snapshot cache (`rev` resync, compaction), pairing |
| `app/src/lib/store/` | The week store, user actions, cache + queue → model, and its two backends (live, `demo/`) |
| `app/src/lib/contract/` | Dependency-free sheet/API contract types and workout labels (bundled into Apps Script); the Shortcut parser is `app/gas/parse.ts` |
| `app/gas/` → `app/apps-script/` | Apps Script source (TS) and its bundled `Code.js` (`npm run gas:build`) |
| `app/scripts/` | `fetch-assets` (`npm run assets:fetch`: official art), `font-subsets` (`npm run fonts:subset`: trims Zen Maru Gothic), `bench-model` (`npm run bench`: a year of rows through the model) |
| `docs/PROPOSAL.md` | The product description (v2.2) |
| `docs/profiles.md` | Participant profiles, gyms, eating patterns |
| `docs/decisions/` | Decision records 0001–0018, with an [index](docs/decisions/README.md) |
| `docs/design/` | [design.md](docs/design/design.md) (the design spec), the sheets contract, the きろく spec, Animal Crossing research |
| `docs/ops/` | Runbook, Google setup, the Shortcuts health-sync guide |
| `docs/archive/no-mac/` | The research behind ADR 0015 (historical) |
| `docs/reviews/round-7/` … `round-10/` | Review rounds (historical records) |

## Status
Design complete (v2.2). MVP built on the Sheet backend, with きろく history and editing. **Next:** the one-time setup in [runbook §1](docs/ops/runbook.md#1-one-time-setup-the-canonical-order-the-other-docs-link-here) (sheet and script → `GAS_URL` → Shortcuts → pairing → day-8 check), then the calibration weeks of Nov 2 and Nov 9.
