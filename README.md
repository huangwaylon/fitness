# しまの貯金箱 · Island Fund

A cozy Animal Crossing–style fitness game for a couple in Tokyo. Each iPhone's daily steps, exercise, Move and
stand minutes grow fruit and earn ベル into one shared wallet, spent on small luxuries the couple prices themselves.
Japanese-first PWA; no server of its own (a Google Sheet behind an Apps Script web app).

**App:** https://huangwaylon.github.io/fitness/ (demo data: add `?demo`)

## Run it
```sh
cd app
npm ci
npm run dev        # demo data unless VITE_GAS_URL is set in .env (see .env.example)
npm test           # unit tests (vitest)
npm run check      # svelte-check
npm run build      # → build-pages/
npm run e2e        # Playwright against the build (run npm run build first)
npm run bench      # model timing at years 1 and 3
npm run gas:build  # bundle app/gas → app/apps-script/Code.js
npm run knip       # unused files, exports, dependencies
```
Needs Node ≥ 24.

## Layout
| Path | Contents |
|---|---|
| `app/src/lib/model/` | Sheet rows → the week view, the wallet, きろく |
| `app/src/lib/config/`, `scoring/` | The rules as data, versioned by week; ベル and badges |
| `app/src/lib/contract/` | The API and sheet contract shared with the Apps Script |
| `app/src/lib/sync/`, `store/` | Apps Script client, write queue, cache, pairing; the stores |
| `app/src/lib/components/`, `app/src/routes/` | The UI |
| `app/gas/` → `app/apps-script/` | Apps Script source (with the Shortcut parser) and its bundle |
| `app/scripts/` | Asset scripts and the benchmark |
| `app/e2e/` | Playwright tests |

## Docs
- [Design](docs/design.md) · [Backend](docs/backend.md) · [Decisions](docs/decisions.md)
- [Runbook](docs/ops/runbook.md) · [Google setup](docs/ops/google-setup.md) · [Health sync Shortcut](docs/ops/shortcut-health-sync.md)
