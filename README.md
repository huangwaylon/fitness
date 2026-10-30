# しまの貯金箱 · Island Fund 🏝️

A cozy fitness and healthy-eating app for two people in Japan, drawn with official Animal Crossing art ([ADR 0018](docs/decisions/0018-official-art-public-site.md)).
Healthy habits, tracked automatically by iPhone and Apple Watch, grow fruit and earn ベル (play money) every day, plus a weekly badge bonus at the Sunday harvest, into two shared pots: おやつ (treats) and 旅 (trips), each with a menu the couple prices themselves ([ADR 0019](docs/decisions/0019-bells-daily-earning-two-pots.md)).
Japanese-first UI (switchable to English): the island, ふたりの壺 and NookPhone apps (きろく history + editing). No server of our own: a Google Sheet + Apps Script backend, the UI on GitHub Pages ([ADR 0015](docs/decisions/0015-google-sheet-backend.md)).

**App → https://huangwaylon.github.io/fitness/** · **Start here → [`docs/PROPOSAL.md`](docs/PROPOSAL.md)** · Demo data: add `?demo` to the app URL.

## Architecture
iOS Shortcuts (health sync, gym Arrive/Leave) and the PWA (check-ins, harvest, buys from the pots, きろく edits) POST `{key, action, …}` to an **Apps Script web app** bound to the *Island Fund* sheet, which stores append-only rows. The PWA fetches the rows and **computes the ベル, the pots and the harvest in the browser** (`app/src/lib/model/`), painting from a local snapshot and queueing writes. Contract: [`docs/design/sheets-architecture.md`](docs/design/sheets-architecture.md).

## Repo layout
| Path | Contents |
|---|---|
| `app/` | SvelteKit 3 static PWA (ja/en). `npm run build` → `build-pages/` for GitHub Pages; needs `VITE_GAS_URL` (see `.env.example`) |
| `app/src/lib/model/` | Compute-on-read: sheet rows → WeekView (today's ベル, fruit progress, the pots, the harvest) and the きろく ledger; golden fixtures |
| `app/src/lib/config/rules.ts` | The rules as data, versioned by week ([ADR 0017](docs/decisions/0017-round-4-rule-changes-and-rule-versions.md)) |
| `app/src/lib/scoring/` | Pure rules: ベル per day, badges and the pot split (`bells.ts`), rule/habit versions, gym visits (calendar helpers are in `app/src/lib/time/`) |
| `app/src/lib/sync/` | Apps Script client: storage key registry, transport, write queue, IndexedDB snapshot cache (`rev` resync, compaction), pairing |
| `app/src/lib/store/` | The week store, user actions, cache + queue → model, and its two backends (live, `demo/`) |
| `app/src/lib/contract/` | Dependency-free sheet/API contract types and workout labels (bundled into Apps Script); the Shortcut parser is `app/gas/parse.ts` |
| `app/gas/` → `app/apps-script/` | Apps Script source (TS) and its bundled `Code.js` (`npm run gas:build`) |
| `app/scripts/` | `fetch-assets` (`npm run assets:fetch`: official art), `font-subsets` (`npm run fonts:subset`: trims Zen Maru Gothic), `bench-model` (`npm run bench`: a year of rows through the model) |
| `docs/PROPOSAL.md` | The product description (v2.2) |
| `docs/profiles.md` | Participant profiles, gyms, eating patterns |
| `docs/decisions/` | Decision records 0001–0019, with an [index](docs/decisions/README.md) |
| `docs/design/` | [design.md](docs/design/design.md) (the design spec), the sheets contract, the きろく spec, Animal Crossing research |
| `docs/ops/` | Runbook, Google setup, the Shortcuts health-sync guide |
| `docs/archive/no-mac/` | The research behind ADR 0015 (historical) |
| `docs/reviews/round-7/` … `round-11/` | Review rounds (historical records) |

## Status
Design complete (v2.2). MVP built on the Sheet backend, with きろく history and editing. **Next:** the one-time setup in [runbook §1](docs/ops/runbook.md#1-one-time-setup-the-canonical-order-the-other-docs-link-here) (sheet and script → `GAS_URL` → Shortcuts → pairing → day-8 check), then play: the economy counts from the week of Oct 26 (ADR 0019).
