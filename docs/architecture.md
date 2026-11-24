# Architecture

One page: the parts, how data moves, where the code is. Each part's detail is in the doc linked from its row.

## The parts
```
 iPhone (Safari PWA, app/)                     Cloudflare
 ┌──────────────────────────┐   POST /api     ┌──────────────────────────────────────────────┐
 │ SvelteKit SPA + 3D island │ ─────────────► │ Worker island-fund-relay (relay/)             │
 │ snapshot cache, queue     │   WS /room      │  IslandStore DO: the record (SQLite)         │
 │ service worker            │ ◄────────────► │  IslandRoom DO: live room, weather, presence │
 └──────────────────────────┘                 │  IslandLog DO: the log                       │
 iOS Shortcut ── POST /api ingest ──────────► │  crons :15/:45 and 03:00 Tokyo; Workers AI   │
                                              └──────────────┬───────────────────────────────┘
 Pages project island-fund (static build)                    │ service bindings
 Worker gym-bot (gym/) ── LINE                 Worker its-bot (its/worker/) ◄─► Actions runner (its/runner/)
 Actions: food data, Kalori, places, backups, health checks (.github/workflows/)
```

- **The app** (`app/`): a static SvelteKit SPA on Cloudflare Pages. It paints from its cached snapshot, polls the
  record, and sends taps through a persisted write queue. Every number (ベル, wallet, charts) is computed on the phone
  from raw rows. The island and rooms are three.js. [design.md](design.md) is how it behaves.
- **The relay** (`relay/`): one Worker, three SQLite Durable Objects. `IslandStore` is the record: append-only rows,
  auth by per-person key, shape checks, `at` stamps, push to open phones. `IslandRoom` relays live intents (walks,
  catches, presence) and keeps the Tokyo weather. `IslandLog` is the capped, allow-listed log.
  [backend.md](backend.md); operating it: [ops/runbook.md](ops/runbook.md).
- **Health data** arrives from each iPhone's Shortcut ([ops/shortcut-health-sync.md](ops/shortcut-health-sync.md)).
- **The bots** are separate Workers on the same account: `gym-bot` ([gym/README.md](../gym/README.md)) and the ITS
  booker ([its/README.md](../its/README.md)); the app's ボット sheet reads them ([bots.md](bots.md)).
- **Static data** is built offline and shipped with the app: food ([food-data.md](food-data.md)), trails
  ([hiking.md](hiking.md)), English clips ([english.md](english.md)), NH models ([world3d-assets.md](world3d-assets.md)).
- **Scheduled work** runs only on Cloudflare crons, DO alarms and GitHub Actions: the list is
  [runbook §0](ops/runbook.md#0-scheduled-work).

## Relay routes (`relay/src/index.ts`)
| Route | What |
|---|---|
| `POST /api` | The record: `snapshot`, `event(s)`, `ingest` (Shortcut), `health` … (`contract/api.ts`) |
| `/room` | The live WebSocket; admitted by a ticket the phone signs with its key (`contract/ticket.ts`) |
| `/log` | The app's log lines |
| `/stt`, `/grade` | Speech-to-text and speaking grades (Workers AI, daily caps) |
| `/img`, `/img/<id>` | Custom food photos |
| `/hiking` | Reads a YAMAP link (writes nothing) |
| `/places`, `/places/pics`, `/places/status` | Saved places (read; the list arrives by `/admin` from places-pull.yml) |
| `/jobs` | The scheduled jobs' status (ボット → Jobs) |
| `/share` | Public share links |
| `/api/push`, `/api/push/subscribe` … | Web Push for やること reminders (`contract/push.ts`) |
| `/health`, `/health/log` | Liveness and the health workflow's check |
| `/admin` | Signed admin ops (`relay/scripts/record.ts`) |

## Code layout
| Path | Contents |
|---|---|
| `app/src/lib/contract/` | The record's API and rules, shared with the relay (the relay imports nothing else from the app) |
| `app/src/lib/model/` | Rows → the week, the wallet, きろく, health charts, meal days |
| `app/src/lib/config/`, `scoring/` | The rules as data, versioned by week; ベル and badges |
| `app/src/lib/sync/`, `store/` | The relay client (record, live socket), write queue, cache, pairing; Svelte stores |
| `app/src/lib/world/`, `layout/` | The island's pure game model (walks, critters, weather, seeds); the editable layout |
| `app/src/lib/components/` | The UI: `world3d/` and `island/` (3D island), `tent/` and `rooms/`, `museum/`, `shop/`, `health/`, `food/`, `look/`, `bots/`, `travel/`, `hiking/`, `places/`, `todo/`, `wedding/`, `board/`, `panel/` (設定), `ui/` (kit) |
| `app/src/lib/food/`, `kalori/`, `english/`, `sugoroku/`, `travel/`, `hiking/`, `places/`, `wedding/` | Feature logic and data loading |
| `app/src/lib/sound/`, `time/`, `i18n/`, `styles/`, `ui-state/` | Music and cues; clocks and holidays; ja/en strings; CSS tokens; UI state and test switches |
| `app/src/service-worker/` | Precache, offline shell, update on hide |
| `app/src/routes/` | Pages: the island, `/tent`, `/museum`, `/shop`, `/editor`, `/pair`, `/s` (share), `/sugoroku`, `/speech` |
| `app/scripts/` | Asset pipelines, CI helpers, docs-check, benchmarks |
| `app/e2e/` | Playwright specs ([testing](ops/testing.md)) |
| `app/static/` | Art, models, audio, food data (`npm run unused` lists what nothing uses) |
| `relay/src/`, `relay/scripts/` | The Worker and its objects; admin (`record.ts`), log reader (`logs.ts`), smoke, latency |
| `gym/`, `its/` | The bots (not the game) |
| `food-data/` | The food pipeline (Python): `scripts/` builds `out/` from `raw/` (gitignored) and `data_src/` |
| `english-captions/` | English clip captions tooling |
