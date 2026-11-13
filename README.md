# しまの貯金箱 · Island Fund

A cozy Animal Crossing–style fitness game for a couple in Tokyo. Each iPhone's daily steps, exercise, Move and
stand minutes grow fruit and earn ベル into a wallet each, spent on small luxuries the couple prices themselves.
Japanese-first PWA on Cloudflare Pages; its server is a Cloudflare relay (`relay/`: the record in a Durable Object, and
the live room).

**App:** https://island-fund.pages.dev/

## First day
1. Node ≥ 24; `gh auth login`; `npx wrangler login` (once per machine, for the relay and the bots).
2. `cd app && npm ci` (also sets the pre-push hook, `.githooks/pre-push`); `cd relay && npm ci` (verify's knip-relay);
   `npx playwright install webkit` in `app/`; Xcode's iOS Simulator for `npm run ios:check`.
3. The keys files, from the password manager (below); `app/.env` from `.env.example` for a dev build on the relay.
4. Read [design.md](docs/design.md) "Product", [decisions.md](docs/decisions.md), then the doc that owns your area
   (Docs, below). Before a push: `cd app && npm run verify`.

## Services
| Deployable | Code | Deploy · roll back | Health · who alerts |
|---|---|---|---|
| The app (Cloudflare Pages `island-fund`) | `app/` | a push under `app/**` (pages.yml); [runbook §1](docs/ops/runbook.md#1-deploy-the-ui), "Roll back" in §8 | health.yml's site checks: red mails the owner |
| The relay (Worker `island-fund-relay`, test copy `-test`) | `relay/` | `npm run deploy:test`, `smoke`, `deploy`; rollback: [runbook §8](docs/ops/runbook.md#8-deploy-the-live-relay) | `/health`; health.yml every 6 h: red mails, the log's spikes open an `alert` issue |
| Kalori's chain menus (the relay's KV `FOOD`) | `food-data/`, `relay/scripts/kalori-put.sh` | [food-data.md "Kalori"](docs/food-data.md#kalori); roll back: put an older converted file | `npm run smoke` (test copy) |
| The gym bot (Worker `gym-bot`) | `gym/` | `npm run deploy`; [gym/README.md](gym/README.md) | `/health`, ボット → ジム; nothing watches it |
| The ITS booker (Worker `its-bot` + the Actions runner) | `its/` | [its/README.md](its/README.md) "Develop and deploy" | its-health.yml every 30 min: the `its-alert` issue |

Other signals: a red *e2e logic full* after a deploy is the next push's to fix; *Pages alias lag* is a warning; the flake
hunt gates nothing ([testing.md "CI"](docs/ops/testing.md#ci-githubworkflowspagesyml)).

**Secrets** (names only; never in this public repo):
- Relay (`npx wrangler secret put`; the test copy's keys: `secret bulk .smoke-keys --env test`): `KEY_A`, `KEY_B`,
  `KEY_C` (the guest), `HEALTH_TOKEN`, `ARCHIVE_TOKEN` (a fine-grained GitHub token: rotate before it expires). Rotation: [runbook §3](docs/ops/runbook.md#3-rotate-a-key).
- Repo (`gh secret set`): `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (Pages), `HEALTH_TOKEN` (health.yml), the
  `ITS_*` ([its/README.md](its/README.md) "Secrets"). The gym bot's: [gym/README.md](gym/README.md) "Secrets".
- On the Mac: `~/.config/island-fund/keys` (KEY_A/B, mode 600), `~/.config/island-fund/archive-age.key` (the dumps'
  age key), `relay/.smoke-keys` (the test relay's), `~/.config/gym-bot/secrets.env`, `~/.config/its-bot/`.

## Run it
```sh
cd app
npm ci
npm run dev        # test mode's made-up data unless VITE_RECORD_URL is set in .env (see .env.example)
npm test           # unit tests (vitest)
npm run check      # svelte-check
npm run build      # → build-pages/
npm run e2e        # Playwright on the build, WebKit + Chromium (--project= picks one; docs/ops/testing.md)
npm run bench      # model timing at years 1 and 3
npm run knip       # unused files, exports, dependencies
npm run verify     # every CI check but e2e (before a push)
```
Needs Node ≥ 24.

The relay, from `relay/` (deploying: [runbook §8](docs/ops/runbook.md#8-deploy-the-live-relay)):
```sh
npm test               # unit tests (vitest)
npm run deploy:test    # deploy the test copy
npm run smoke          # check the test copy (keys in relay/.smoke-keys)
npm run logs           # the log's reader (docs/ops/observability.md)
```

The gym bot, from `gym/` ([gym/README.md](gym/README.md)):
```sh
npm test               # unit tests (vitest); npm run check, npm run knip
npm run deploy         # production, from a clean tree on origin/main
```

The food data (`app/static/food/`), from the repo root ([food-data.md](docs/food-data.md); Python ≥ 3.9, stdlib only):
```sh
python3 -I food-data/scripts/build.py all    # → food-data/out/
cd app && npm run food:data                  # → app/static/food/
python3 -I -m unittest discover -s food-data/scripts/tests
```

Raw sources the repo doesn't hold (`~/food-images-raw`, `app/.cache/tts/{clean,refs}`, `food-data/raw/`) live in the
`assets-*` releases (`app/scripts/assets-release.sh`); the coordinator's notes in the encrypted `notes` release
(`app/scripts/notes-backup.sh`, by hand). Restore steps: each script's header.

## Layout
| Path | Contents |
|---|---|
| `app/src/lib/model/` | The record's rows → the week view, the wallet, きろく, the meal log's days |
| `app/src/lib/config/`, `scoring/` | The rules as data, versioned by week; ベル and badges |
| `app/src/lib/contract/` | The record's API and rules, shared with the relay |
| `app/src/lib/sync/`, `store/` | The relay's client (record and live socket), write queue, cache, pairing; the stores |
| `app/src/lib/layout/` | The island's editable layout: its grid, ops, default, nav and checks |
| `app/src/lib/world/` | The island's game model, pure (never a component): the world and its walk, critters, sea, weather, day seeds, the farm's batch writes |
| `app/src/lib/food/`, `sound/` | The food data's loading and search; the music and sounds |
| `app/src/lib/kikimimi/`, `mic/` | ききみみ: decks, content, the round's rules; the mic (capture, VAD, recognisers, matching) |
| `app/src/lib/travel/`, `hiking/`, `wedding/` | 旅行's trip guides (`trips/`); 登山's trails and tracks; 結婚式's board settings and progress |
| `app/src/lib/gym/`, `app/src/lib/its/` | ボット's clients: the gym bot's and the ITS booker's pages |
| `app/src/lib/offline/` | Map areas saved ahead for offline: their tiles and size |
| `app/src/lib/time/`, `ui-state/`, `villagers/`, `i18n/`, `styles/` | Clocks and holidays; UI state and test switches; the villager roster; ja/en strings; CSS tokens |
| `app/src/lib/components/` | The UI: `island/` and `world3d/` (the 3D island), `tent/`, `museum/`, `shop/`, `rooms/` (the interiors), `food/`, `health/`, `look/` (すがた), `board/`, `farm/`, `wallet/`, `editor/` and `layoutEdit/`, … |
| `app/src/routes/` | The pages (the island, `/tent`, `/editor`, `/pair`, …) |
| `app/static/` | Art, 3D models, audio, food data (`npm run unused` lists what nothing uses) |
| `app/scripts/` | Asset and model pipelines, the e2e's CI helpers, the benchmark |
| `app/e2e/` | Playwright tests |
| `app/design/` | Design sources: the avatar's render tools and signed-off outfits ([players.md](docs/players.md)), the icon |
| `relay/` | The Cloudflare Worker: the record, the live room, the log, the weather, the Shortcut parser; `scripts/` the admin tools (`record.ts`, `logs.ts`), smoke and latency |
| `gym/` | Not the game: a LINE bot that tells a group when a gym slot opens, as its own Worker on the same account; its page in ボット → ジム ([gym/README.md](gym/README.md)) |
| `its/` | Not the game: the ITS 保養所 booker, a Worker (`worker/`) and a GitHub Actions runner (`runner/`); its page in ボット → 保養所 ([its/README.md](its/README.md)) |
| `food-data/` | The food data pipeline (Python): `scripts/` builds `out/` from `raw/` (gitignored) and `data_src/`; `npm run food:data` ships it |
| `docs/` | Below |

## Docs
One home per topic; the others link to it. If a doc and the code disagree, the code wins (and the doc gets fixed).

| Doc | Owns |
|---|---|
| [design.md](docs/design.md) | What the app is and how it behaves: screens, the HUD and menu (the one home of the menu order), economy, the island's behaviour, sound |
| [decisions.md](docs/decisions.md) | The decisions in force, each with its one-line why |
| [backend.md](docs/backend.md) | The relay: the record (Durable Object SQLite), the wire contract, the client's sync and queue, the live room |
| [island-layout.md](docs/island-layout.md) | The editable layout: grid, ops, default, nav, checks, homes and rooms; the /editor |
| [world3d-assets.md](docs/world3d-assets.md) | The 3D model and texture pipeline (NH models → GLB/KTX2) |
| [players.md](docs/players.md) | The players' looks: the look's fields and defaults, the closet, portraits, the すがた dresser |
| [farming.md](docs/farming.md) | The fields: rules, balance, the record's ops, how it plays |
| [food-data.md](docs/food-data.md) | ごはん's food catalog and pictures: sources, build, shipping |
| [sound-sync.md](docs/sound-sync.md) | How music and sounds stay in step across phones |
| [board.md](docs/board.md) · [travel.md](docs/travel.md) · [wedding.md](docs/wedding.md) · [hiking.md](docs/hiking.md) | The bulletin board, 旅行, 結婚式, 登山 |
| [kikimimi.md](docs/kikimimi.md) | ききみみ, the English listening games, as the player sees them: games, hub, progress, rewards; its open items |
| [kikimimi-engine.md](docs/kikimimi-engine.md) · [kikimimi-mic.md](docs/kikimimi-mic.md) | ききみみ's round engine, wire, content loading and packs; the mic modes and their privacy rule |
| [curriculum.md](docs/curriculum.md) | What ききみみ teaches: stages, scenarios, units, content and TTS rules, the listening check, its backlog |
| [app/content/listen/README.md](app/content/listen/README.md) | The listening units' YAML format |
| [ops/perf.md](docs/ops/perf.md) | Performance: the budgets, how to measure, the open items |
| [ops/runbook.md](docs/ops/runbook.md) | Running it: hosting, deploys, keys, the relay, recovery |
| [ops/testing.md](docs/ops/testing.md) | The test tiers and why, CI (the lean gate, shards, the flaky ledger) and how to write a stable spec |
| [ops/observability.md](docs/ops/observability.md) | The log, its reader, the alert, the costs |
| [ops/shortcut-health-sync.md](docs/ops/shortcut-health-sync.md) | The iOS Shortcut that sends Health data |
| [gym/README.md](gym/README.md) · [its/README.md](its/README.md) ([SITE.md](its/SITE.md), [runner](its/runner/README.md)) | The two bots: rules, routes, secrets, operations |
