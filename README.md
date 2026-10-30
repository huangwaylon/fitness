# しまの貯金箱 · Island Fund 🏝️

A cozy fitness game for a couple in Tokyo (ウェイ and うめ, both with an iPhone and an Apple Watch), drawn with official
Animal Crossing art ([ADR 0018](docs/decisions/0018-official-art-public-site.md)). The Watch's Activity Rings, steps
and gym arrivals, all automatic, grow five fruits and earn ベル (play money) every day, plus a weekly badge bonus at the
Sunday harvest ([ADR 0021](docs/decisions/0021-activity-rings-no-check-ins.md)). The ベル go into one shared wallet,
spent on a menu of small luxuries the couple prices themselves ([ADR 0022](docs/decisions/0022-one-wallet-small-luxuries.md)).
Body weight is shown as a trend and never earns ([ADR 0020](docs/decisions/0020-weight-trend-never-rewarded.md)).
Japanese-first UI, switchable to English.

**App → https://huangwaylon.github.io/fitness/** · **Design → [`docs/design/design.md`](docs/design/design.md)** ·
Demo data: add `?demo` to the app URL.

## Architecture
No server of our own ([ADR 0015](docs/decisions/0015-google-sheet-backend.md)). iOS Shortcuts (the health sync and
the gym Arrive automation) and the PWA (buys, menu edits, the harvest, きろく edits) POST `{key, action, …}` to an
**Apps Script web app** bound to the *Island Fund* Google Sheet, which stores append-only rows. The PWA (on GitHub
Pages) fetches the rows and **computes the ベル, the wallet and the harvest in the browser** (`app/src/lib/model/`),
painting from a local cache and queueing writes. Contract: [`docs/design/sheets-architecture.md`](docs/design/sheets-architecture.md).

## Development
```sh
cd app
npm ci
npm run dev        # demo data unless VITE_GAS_URL is set in .env (see .env.example)
npm run check      # svelte-check
npx vitest run     # unit tests (golden fixtures included)
npm run e2e        # Playwright demo tests (after npm run build)
npm run build      # → build-pages/ for GitHub Pages
npm run gas:build  # bundle app/gas → app/apps-script/Code.js (then redeploy: google-setup.md §11)
npm run bench      # rows through the model at years 1 and 3
npx knip           # unused files, exports and dependencies
```

## Repo layout
| Path | Contents |
|---|---|
| `app/src/lib/model/` | Compute-on-read: sheet rows → the WeekView, the wallet and きろく; golden fixtures |
| `app/src/lib/config/rules.ts` | The rules as data (goals, ベル, badges, the default menu), versioned by week |
| `app/src/lib/scoring/` | Pure rules: ベル per day and the weekly badges |
| `app/src/lib/contract/` | The sheet/API contract shared with the Apps Script, workout labels |
| `app/src/lib/sync/`, `store/` | Apps Script client (transport, write queue, IndexedDB cache, pairing); the week store, user actions, live and demo backends |
| `app/src/lib/components/`, `app/src/routes/` | The UI |
| `app/src/lib/sound/` | Sound effects and music ([sound.md](docs/design/sound.md)) |
| `app/gas/` → `app/apps-script/` | Apps Script source (TS, with the Shortcut parser) and its bundled `Code.js` |
| `app/scripts/` | Asset scripts (art, font subsets, icons, music) and the model benchmark |
| `docs/design/` | The design spec, the sheets contract, きろく, sound, scene interactions |
| `docs/ops/` | [Runbook](docs/ops/runbook.md), Google setup, the Shortcuts guide |
| `docs/decisions/` | Decision records, with an [index](docs/decisions/README.md) |
| `docs/reviews/` | An [index](docs/reviews/README.md) of past review rounds |

## Status
Built and running on the Sheet backend; the economy counts from the week of Mon 2026-10-26. Setup order:
[runbook §1](docs/ops/runbook.md#1-one-time-setup-the-canonical-order-the-other-docs-link-here).
