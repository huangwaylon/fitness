# しまの貯金箱 · Island Fund

A cozy Animal Crossing–style fitness game for a couple in Tokyo (plus a guest). Each iPhone's steps, exercise, Move
and stand minutes grow fruit on a shared 3D island and earn ベル, spent on treats the couple prices themselves. Around
it: a meal log, health trends, trips, trails, places, to-dos, English study and two booking bots. A Japanese-first PWA
on Cloudflare Pages with a Cloudflare relay for the record and the live room.

**App:** https://island-fund.pages.dev/ · **How it fits together:** [docs/architecture.md](docs/architecture.md)

## First day
1. Node ≥ 24; `gh auth login`; `npx wrangler login` (once per machine).
2. `cd app && npm ci` (also installs the pre-push hook, `.githooks/pre-push`); `cd relay && npm ci`;
   `npx playwright install webkit` in `app/`; Xcode's iOS Simulator for `npm run ios:check`.
3. Keys from the password manager into the files below; `app/.env` from `.env.example` for a dev build on the relay.
4. Read [architecture.md](docs/architecture.md), [design.md](docs/design.md) "Product" and
   [decisions.md](docs/decisions.md), then the doc for your area. Before a push: `cd app && npm run verify`.

## Run and test
```sh
cd app
npm run dev        # made-up test data unless VITE_RECORD_URL is set in .env
npm test           # vitest
npm run check      # svelte-check
npm run build      # → build-pages/
npm run e2e        # Playwright on the build, WebKit + Chromium (docs/ops/testing.md)
npm run verify     # every CI check but e2e
```
| Part | From | Test | Deploy |
|---|---|---|---|
| Relay | `relay/` | `npm test`; `npm run deploy:test && npm run smoke` | CI on push (*Relay checks*); by hand `npm run deploy` ([runbook §8](docs/ops/runbook.md#8-deploy-the-live-relay)) |
| Gym bot | `gym/` | `npm test`, `npm run check`, `npm run knip` | `npm run deploy` from a clean origin/main |
| ITS booker | `its/worker`, `its/runner` | `npm test` · `python3 test_its.py && python3 test_remote.py` | [its/README.md](its/README.md) "Develop and deploy" |
| Food data | repo root | `python3 -I -m unittest discover -s food-data/scripts/tests` | `python3 -I food-data/scripts/build.py all`, then `cd app && npm run food:data` |
| Logs | `relay/` | `npm run logs -- report` ([observability](docs/ops/observability.md)) | |

## Services
| Deployable | Code | Deploy · roll back | Alerts ([runbook §0](docs/ops/runbook.md#0-scheduled-work)) |
|---|---|---|---|
| The app (Pages `island-fund`) | `app/` | a push under `app/**` runs the gate and deploys ([runbook §1](docs/ops/runbook.md#1-deploy-the-ui)) | `alert` |
| The relay (Worker `island-fund-relay`, test copy `-test`) | `relay/` | [runbook §8](docs/ops/runbook.md#8-deploy-the-live-relay) | `alert` |
| The gym bot (Worker `gym-bot`) | `gym/` | [gym/README.md](gym/README.md) | `gym-alert`, the app's dot ([bots.md](docs/bots.md)) |
| The ITS booker (Worker `its-bot` + Actions runner) | `its/` | [its/README.md](its/README.md) | `its-alert` |
| Kalori menus (Actions `kalori-scrape.yml`) | `food-data/` | weekly, self-merging within its bands ([runbook §13](docs/ops/runbook.md#13-refresh-kalori)) | `kalori-alert`, Jobs' Chain menus |

**Secrets** (names only; never in this public repo):
- Relay (`npx wrangler secret put`; test copy: `secret bulk .smoke-keys --env test`): `KEY_A`, `KEY_B`, `KEY_C` (guest),
  `HEALTH_TOKEN`, the GitHub App's (its/README.md "GitHub App"). Rotation:
  [runbook §3](docs/ops/runbook.md#3-rotate-a-key).
- Repo (`gh secret set`): `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `HEALTH_TOKEN`, the `ITS_*`
  ([its/README.md](its/README.md) "Secrets"); the gym bot's: [gym/README.md](gym/README.md) "Secrets".
- On the Mac: `~/.config/island-fund/keys` (mode 600), `~/.config/island-fund/archive-age.key`, `relay/.smoke-keys`,
  `~/.config/gym-bot/secrets.env`, `~/.config/its-bot/`; a gitignored `app/.env.local` for real-data tests.

Raw sources the repo doesn't hold (`~/food-images-raw`, `food-data/raw/`) are in the
`assets-*` GitHub releases (`app/scripts/assets-release.sh`); NH models, full music and avatar sources in the
`sources-*` release. Restore steps: each script's header.

## Docs
One home per topic; the code wins when a doc disagrees (fix the doc). `cd app && node scripts/docs-check.ts` checks
every link, anchor, path, code citation, cron and size budget.

| Doc | Owns |
|---|---|
| [architecture.md](docs/architecture.md) | The parts, relay routes, code layout |
| [decisions.md](docs/decisions.md) | The decisions in force, one line each |
| [design.md](docs/design.md) | What the app is and how it behaves: screens, HUD and menu, economy, the island, sound |
| [backend.md](docs/backend.md) | The record, the wire contract, sync and queue, the live room |
| [island-layout.md](docs/island-layout.md) · [world3d-assets.md](docs/world3d-assets.md) | The editable layout and /editor · the 3D model pipeline |
| [players.md](docs/players.md) · [farming.md](docs/farming.md) · [sound-sync.md](docs/sound-sync.md) · [board.md](docs/board.md) | Looks and すがた · the fields · music in step · the bulletin board |
| [food-data.md](docs/food-data.md) | ごはん's food catalog and pictures |
| [travel.md](docs/travel.md) · [hiking.md](docs/hiking.md) · [places.md](docs/places.md) · [wedding.md](docs/wedding.md) · [todo.md](docs/todo.md) | 旅行 · 登山 · 保存した場所 · 結婚式 · やること |
| [english.md](docs/english.md) · [sugoroku.md](docs/sugoroku.md) · [speech-test.md](docs/speech-test.md) | English Study · 英語すごろく · the speech test |
| [bots.md](docs/bots.md) · [gym/README.md](gym/README.md) · [its/README.md](its/README.md) ([SITE.md](its/SITE.md), [runner](its/runner/README.md)) | The ボット sheet · the two bots |
| [ops/runbook.md](docs/ops/runbook.md) | Scheduled work, deploys, keys, backups, recovery |
| [ops/testing.md](docs/ops/testing.md) · [ops/perf.md](docs/ops/perf.md) · [ops/observability.md](docs/ops/observability.md) | Tests and CI · performance budgets · the log and alerts |
| [ops/shortcut-health-sync.md](docs/ops/shortcut-health-sync.md) | The iOS Shortcut that sends Health data |
