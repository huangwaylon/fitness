# Sheets architecture: the contract (ADR 0015)

Builders code against this. Change it only through the lead.

## 1. Spreadsheet tabs (row 1 = header; the script creates missing tabs on first run)
All timestamps are ISO 8601 UTC strings written by the script (`at`). Dates are `YYYY-MM-DD` (Tokyo). Every tab is **append-only**; nothing is updated or deleted by the app.

| Tab | Columns | Written by |
|---|---|---|
| `metrics` | `at`, `person`, `date`, `metric` (`steps`\|`exercise_min`), `value` | `ingest`, **only when the value is higher** than the latest for (person, date, metric) |
| `workouts` | `at`, `person`, `id`, `date`, `type`, `start`, `end`, `duration_min`, `avg_hr` | `ingest`, only for unseen `id` (`workoutKey(type, start)`) |
| `presence` | `at`, `person`, `place`, `event` (`arrive`\|`leave`), `event_at` | `presence` |
| `events` | `at`, `person`, `id`, `type`, `data` (JSON) | `event` (client-generated `id`; a duplicate `id` is ignored, so retries are safe) |
| `uploads` | `at`, `person`, `status`, `bytes`, `error` | `ingest` (audit only: no payload stored) |

Event `type`s and `data`:
- `checkin {date, habit, done}`: the latest per (person, date, habit) wins.
- `confirm {kind:'visit'|'workout', id, yes}`
- `spend {spendId, label, amountYen}` and `approve {spendId}`
- `transfer {month}` · `harvest {week}` · `highfive {}`
- `pref {key, value}` (keys: `locale`, `villagerName`, `villager`)
- `share {metric, on}`: refused by the script (`bad_request`); old rows are ignored (ADR 0016).

Edits from きろく (`docs/design/history-and-editing.md` §4; added 2026-10-29, **redeploy `Code.js`**). The subject is always the sender (`person`): there is no person field, so nobody can edit the partner's record. Activity edits count only while the day's week is open (this week, and last week until Wednesday 04:00 JST); the model ignores the rest, so the sheet stays a dumb log:
- `metric_set {date, metric:'steps'|'exercise_min', value}`: overrides the day's value, also lower. The script refuses a non-integer or out-of-range `value` (steps 0–100,000; minutes 0–1,440) or a bad date/metric with `bad_request`. Read rule: S = latest `metric_set` with `at ≤ T`; none → max of ingest rows; else max(S.value, ingest rows with S.at < at ≤ T).
- `workout_edit {id, strength?: true|false|null, excluded?: boolean}`: strength override for any type (`null` = automatic), or out of scoring.
- `workout_add {id:'m:<id>', date, type, durationMin 1–600, strength?}`: a manual workout (a known canonical type).
- `checkin {…, edit:true}`: a fix for any day ≤ today of an open week (instead of the 48 h window).
- `spend_void {spendId}`: the spender only; refunds a paid spend or cancels a waiting one (a refused spend stays refused).
- `transfer_undo {month}`: either person; the latest of `transfer`/`transfer_undo` for the month wins.

Weekly yen already paid never change: a raise before the lock becomes the Wednesday top-up, a lowering keeps Sunday's payout.

The rules (targets, money, seasons) stay in `app/src/lib/config/rules.ts`. No config tab.

## 2. Web app API: `POST <exec url>`, body = JSON text, `Content-Type: text/plain`
Every request has `{key, action, ...}`. Every reply is JSON: `{ok:true, ...}` or `{ok:false, error}`, where `error ∈ unauthorized | bad_request | too_large | busy | unavailable`. `doPost` never throws: an uncaught error would return Google's HTML page. There is **no `doGet`**. Body cap: 1 MB.

| `action` | Request | Reply |
|---|---|---|
| `ingest` | `dates, steps, exercise_minutes` (newline lists or arrays; the user's Shortcut format), optional `workouts` (types/starts/ends/avgHrs lists) | `{ok, metrics, workouts, skipped?, unknownTypes?}`: rows actually appended, plus unparsed entries and unmapped workout names when there are any |
| `presence` | `place, event, at?` | `{ok}` |
| `event` | `id, type, data` | `{ok, duplicate?}` |
| `snapshot` | `since?` (ISO, the max `at` the client has seen) | `{ok, me, now, rows:{metrics, workouts, presence, events}}` (rows with `at > since`; both people) |
| `whoami` | — | `{ok, me}` (used when pairing) |

- Person = whichever of `KEY_A`/`KEY_B` matches, compared in constant time. The rate limit is a per-key-per-minute counter in `CacheService`.
- Writes take `LockService.getScriptLock()` (wait ≤ 10 s, else `busy`).
- `snapshot` without `since` returns everything: ~a few thousand rows a year, compact arrays (`rows.metrics = [[at, person, date, metric, value], …]`).

## 3. Code layout
- `app/src/lib/ingest/parse.ts`: **pure, dependency-free** parser of the Shortcut body → `{metrics:[{date,metric,value}], workouts:[…], skipped}`. A port of `server/ingest/shortcut.ts` + `workout-names.ts`, without zod, so it runs in Apps Script (the browser never parses Shortcut bodies).
- `app/gas/`: Apps Script source in TS (`main.ts`: `doPost`, sheet helpers), bundled with the parser by **esbuild** into `apps-script/Code.js` (one global script, no imports) via `npm run gas:build`. `apps-script/appsscript.json` sets scope `spreadsheets.currentonly`, the web app, and timezone `Asia/Tokyo`. `clasp` is optional (`.clasp.json` not committed).
- `app/src/lib/model/`: **pure compute-on-read**. `snapshot → WeekView` (and jar, harvest, pending confirmations, host line), reusing `scoring/` and `config/rules.ts`. It replaces `server/week.ts` and `server/ledger.ts` semantics, including the max(Sunday 19:30, Wednesday 04:00) payout rule and purse/transfer math.
- `app/src/lib/client/`:
  - `gas.ts`: post helper with a timeout and retry. Writes go through a queue persisted in `localStorage` and replayed until acked. Snapshot merge and cache in `localStorage`.
  - `week.svelte.ts` and `actions.ts`: rewired to the model and queue; same UI-facing functions where possible.
- Pairing: paste your key in the installed app. A `#key=` link only works when opened inside the installed PWA (iOS storage is per app). `whoami` confirms the person, and the key is stored in `localStorage`.
- Removed (done 2026-10-29): `app/src/lib/server/**`, `app/src/routes/api/**`, `app/src/routes/ingest/**`, `hooks.server.ts`, drizzle, `scripts/{pair,token,devices,recompute,vapid,backup*,restore*}`, Docker, adapter-node, better-sqlite3, web push.

## 4. Testing
- The parser: unit tests (ported from the shortcut-ingest tests).
- The GAS backend: vitest with an in-memory fake of `SpreadsheetApp`/`PropertiesService`/`LockService`/`CacheService`/`ContentService`. It covers auth, never-throws, append-only + higher-only metrics, dedupe, snapshot `since`, rate limit and body cap.
- The model's edits: `model/history.test.ts` (lowering, later higher syncs, lock, top-up, own data only, workouts, check-in fixes, voids, transfer undo, the change log, the history views).
- The model: was differential-tested against the old server (`getWeekView`, settlement, payout) on a 10-week timeline and on the real DB; those server outputs are now frozen golden fixtures (`app/src/lib/model/fixtures/`, `golden.test.ts`).
- The client: queue/retry/merge unit tests.

## 5. Shortcut (the user's)
URL → the `/exec` URL. Body: add `"key": "<KEY_A>"` and `"action": "ingest"` to the existing dictionary (`dates`, `steps`, `exercise_minutes`). Drop the `Authorization` header. Request body type stays JSON (sent as text/plain: Shortcuts' "Text" body with the JSON string, or "JSON" works too because Apps Script reads `postData.contents`).
