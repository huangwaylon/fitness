# しまの貯金箱 · Island Fund

A cozy Animal Crossing–style fitness game for a couple in Tokyo. Each iPhone's daily steps, exercise, Move and
stand minutes grow fruit and earn ベル into one shared wallet, spent on small luxuries the couple prices themselves.
Japanese-first PWA on Cloudflare Pages; its server is a Cloudflare relay (`relay/`: the record in a Durable Object, and
the live room).

**App:** https://island-fund.pages.dev/ (demo data: add `?demo`)

## Run it
```sh
cd app
npm ci
npm run dev        # demo data unless VITE_RECORD_URL is set in .env (see .env.example)
npm test           # unit tests (vitest)
npm run check      # svelte-check
npm run build      # → build-pages/
npm run e2e        # Playwright, WebKit and Chromium (--project= picks one), against the build (npm run build first; docs/ops/testing.md)
npm run bench      # model timing at years 1 and 3
npm run knip       # unused files, exports, dependencies
```
Needs Node ≥ 24.

The meal log's food data (`app/static/food/`), rebuilt from the repo root ([docs](docs/food-data.md); Python ≥ 3.9, stdlib
only; the raw downloads in `food-data/raw/` are gitignored):
```sh
python3 -I food-data/scripts/build.py all    # → food-data/out/
cd app && npm run food:data                  # → app/static/food/
python3 -I -m unittest discover -s food-data/scripts/tests
```

## Layout
| Path | Contents |
|---|---|
| `app/src/lib/model/` | The record's rows → the week view, the wallet, きろく, the meal log's days |
| `app/src/lib/config/`, `scoring/` | The rules as data, versioned by week; ベル and badges |
| `app/src/lib/contract/` | The record's API and rules, shared with the relay |
| `app/src/lib/sync/`, `store/` | The relay's client (record and live socket), write queue, cache, pairing; the stores |
| `app/src/lib/layout/` | The island's editable layout: its grid, ops, default, nav and checks |
| `app/src/lib/food/`, `sound/` | The food data's loading and search; the music and sounds |
| `app/src/lib/time/`, `ui-state/`, `villagers/`, `i18n/`, `styles/` | Clocks and holidays; UI state and test switches; the villager roster; ja/en strings; CSS tokens |
| `app/src/lib/components/` | The UI: `island/` and `world3d/` (the 3D island), `tent/`, `museum/`, `shop/`, `rooms/` (the interiors), `food/`, `health/`, `look/` (すがた), `board/`, `editor/` and `layoutEdit/`, … |
| `app/src/routes/` | The pages (the island, `/tent`, `/editor`, `/pair`, …) |
| `app/static/` | Art, 3D models, audio, food data (`npm run unused` lists what nothing uses) |
| `app/scripts/` | Asset and model pipelines, the e2e's CI helpers, the benchmark |
| `app/e2e/` | Playwright tests |
| `app/design/` | Design sources (the avatar, the icon) |
| `relay/` | The Cloudflare Worker: the record, the live room, the log, the weather, the Shortcut parser; `scripts/` the admin tools (`record.ts`, `logs.ts`), smoke and latency |
| `food-data/` | The food data pipeline (Python): `scripts/` builds `out/` from `raw/` (gitignored) and `data_src/`; `npm run food:data` ships it |
| `docs/` | Below |

## Docs
- [Design](docs/design.md) · [Backend](docs/backend.md) · [Decisions](docs/decisions.md) · [Food data](docs/food-data.md)
- [Island layout](docs/island-layout.md) · [3D assets](docs/world3d-assets.md) · [Bulletin board](docs/board.md)
- [Runbook](docs/ops/runbook.md) · [Observability](docs/ops/observability.md) · [Testing](docs/ops/testing.md) · [Test strategy](docs/ops/test-strategy.md) · [Health sync Shortcut](docs/ops/shortcut-health-sync.md)
