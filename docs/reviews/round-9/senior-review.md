# Round 9: senior engineer review (post-Mac cleanup)

Scope: all of `app/` at `c7fb663`. Read-only.

**Checks:** `npm run check` gives 0 errors in 470 files. `vitest` passes 270/270 in 1.0 s. `npm run build` is OK: JS is 351 KB (124 KB gzip) in total, with the largest node at 19 KB gzip. `npx knip` reports 20 unused exports and 19 unused types (§3). The codebase is about 16.4k LOC. The largest files are `history.ts` (449), `week.ts` (443), `state.ts` (404), `client/gas.ts` (351), and `parse.ts` and `gas/main.ts` (340 each).

**Measured (new):** I benched realistic volume: hourly syncs, 2 people. **At year 3 that is 53.5k rows (45.9k of them metrics), 3.7 MB of JSON.** On a Mac, `reduce` takes 32 ms and reduce + view 48 ms. An old iPhone is about 4× slower, so expect ~200 ms per tap and per minute tick. `npm run bench` under-counts metrics by about 7×.

## 1. Architecture

The direction types → scoring → model → client → UI mostly holds. It breaks in four places:
- `scoring/dates` → `ingest/sheet-api` (for `DATE_RE`), and `ingest/parse` → `model/labels`. Together they form an ingest ↔ model cycle.
- `client/{week,theme}.svelte.ts` and `jarTransition` → `components/motion/clock` (client depends on UI).
- `art.ts` → `client/season` (a type).
- `ingest/parse.ts` is **backend-only** (only `gas/` imports it).

`client/` mixes transport, the store and UI state. `components/` has 26 flat files.

**Target tree:**
```
app/gas/          main.ts (doPost/auth/rate), sheet.ts (tab/read/append/text), actions.ts, parse.ts ← ingest/parse.ts
src/lib/
  contract/       api.ts ← ingest/sheet-api.ts, labels.ts ← model/labels.ts   (dependency-free, bundled into Code.js)
  time/           clock.ts ← components/motion/clock.ts, dates.ts ← scoring/dates.ts
  config/ scoring/ model/          (import only contract/ + time/)
  sync/           transport.ts, queue.ts, cache.ts ← client/gas.ts; storage.ts (one key registry)
  store/          week.svelte.ts, actions.ts, view.ts, demo/{rows,backend}.ts
  ui-state/       toast, ui, theme, season, jarScreen, jarTransition, standalone, paths
  components/     ui/ (Sheet, Bubble, Toast*, ChoiceList, PhoneButton, Yen, LeafCoin, Mark, Rope, SyncPill, Sprites, keyboardInset, roving)
                  characters/ (Villager, Avatar, Host, Silhouette, Emote, OfficialArt, Fx)
                  sheets/ (CheckinSheet, PartnerSheet, HarvestOverlay, FruitRing, ripeness)
                  island/ kiroku/ phone/(+ShimaPhone) motion/ dev/
```
Enforce the boundaries with a small `deps.test.ts` that checks each folder's imports against an allow-list.

## 2. Weaknesses and concerns

### High
1. **Shared origin.** `huangwaylon.github.io` also serves 7 other Pages sites (epub, hiking-trails, n2, suumo, travel-plans, verbose-octo-pancake, wedding). Any of them can read `island.key` and the cached money data, and all of them share the ~5 MB `localStorage` quota. **Fix:** give this site a custom domain (`CNAME`, `BASE_PATH`).
2. **The cache hits the storage ceiling by year 2–3.** The cache is 3.7 MB at year 3. When storage is full, `write()` fails silently.
   - Every launch then fetches a **full** snapshot while holding the script lock, so Shortcut ingests get `busy`.
   - A 3.7 MB stringify runs on every refresh.
   
   **Fix:** move the cache to IndexedDB. Compact metrics on merge: a locked week needs at most 2 rows per `person|date|metric`, which cuts about 90%.
3. **The Shortcut recipe loses or double-counts health data.** In `shortcut-health-sync.md` step 9, `exercise_minutes` is paired with `StepDates`.
   - If the counts differ, `dailyTotals` throws and the whole ingest is refused, steps included.
   - If they match, minutes can land on the wrong days.
   - The daily form has no `sources`, so iPhone and Watch steps are **summed**, and steps pay money.
   
   **Fix:** accept `exercise_dates` and `*_sources`, or use *Group by Day*. Verify on a device.
4. **No resync.** The cache only grows (`since` + key merge). Rows that are deleted or corrected in the sheet, or pasted with an `at` below a client's `since`, never reach cached clients. **Fix:** a `REV` Script Property returned by `snapshot`. When it changes, the client drops its cache. Add a resync button too.
5. **CI never runs `check` or `vitest`.** `pages.yml` deploys whatever is on main, red or not.
6. **Stale lazy chunks after a deploy.** The SW calls `skipWaiting` and `claim`, then deletes the old cache. A PWA left resident then fails `import()` of `HarvestOverlay` or `Kiroku` (404). The `??=` memo keeps the rejected promise. **Fix:** on failure, reset the memo and reload; keep one previous cache generation.

### Medium
7. **Anonymous POSTs spend the quota.** The rate limit applies only after auth. Each request costs 2 Properties reads (about 50k/day consumer quota), and each write costs `LAST_AT` reads and writes. **Fix:** cache the keys in `CacheService`, and reject non-hex keys first.
8. **Keys leak through shared Shortcuts.** An iCloud link to the Shortcut embeds KEY_A. **Fix:** make *Key* an Import Question.
9. **Backups are a manual monthly `.xlsx`**, and the sheet is the only copy of the money events. **Fix:** a separate standalone script with Drive scope, running a weekly `makeCopy` trigger.
10. **No monitoring, and nothing shows which code is deployed.** **Fix:**
    - A GitHub cron POSTs `{}` to `/exec`. It needs no key: JSON `bad_request` means healthy, HTML means the auth lapsed.
    - `whoami` returns a `build` hash, pinned by `bundle.test`.
    - Script the redeploy with `clasp deploy -i`.
11. **The model is O(all rows) per tap and per minute.** **Fix:**
    - The compaction from item 2.
    - Recompute on the tick only at a cutoff or day boundary.
    - Round 8 P5 (keep finalized weeks across States), keyed by `REV`.
    - A realistic `bench`.
12. **The server scans everything under the lock.** `ingest` reads the whole metrics tab, and `event` scans every id. **Fix:** for ingest, read only the last N days.

### Low
13. **Mixed clocks.** The model uses JST, but the scene, host and `clockTime` use device-local `getHours()`. Abroad they disagree. **Fix:** one `time/` helper.
14. **Demo leak risk is low.** `person` is honored only when `cache.demo` is set. But `WeekStore` has 14 `this.demo` branches: move them behind a `Backend` interface.
15. **Storage keys are scattered:** `island.*`, `if-balloon`, `demo*`, the high-five counter, and an unguarded `localStorage` call in `islandLife`.
16. **Safari ITP.** In a browser tab (not installed to the home screen), storage is wiped after 7 days, taking the key and the queue. **Fix:** an install hint on the pair page.
17. **The toolchain is bleeding-edge** (Kit 3.1, Vite 8, TS 6, Vitest 5) and there is no Dependabot.

**Test gaps:**
- No `reduce` unit tests per event type.
- No component or e2e tests: add one Playwright smoke test on `?demo`.
- No tests for the service worker.
- No test for the item-3 length mismatch.

## 3. Removal list (verified by grep or knip)

| What | Why |
|---|---|
| `scripts/export-to-sheet.ts` and the `export:sheet` npm script | The migration is done |
| Local `app/build/` (adapter-node output) and `app/data/` (`island.db`, `server.log`, `export/`), and their `.gitignore` lines | Mac-era. Archive `island.db` privately first |
| `allowScripts` entries for esbuild 0.18.20 and 0.25.12 | Only 0.28.2 is in the lockfile |
| `vite.config.ts:19` comment about `app/build/` | Mac-era |
| Mac wording in `parse.ts:5,133` and `golden.test.ts:1`; rename `server-facts.json` → `legacy-facts.json` | Keep the SHA-id rationale |
| Runbook §5, google-setup §8, the Mac line in the README | Migration is done |
| `docs/research/no-mac/*` (8 files) → `docs/archive/` | Historical |
| `SendResult.status` / `.data` (fake HTTP 200/409, always `null`), the `Promise.resolve` wrappers, and the `jar/+page.svelte:67` `r.data?.status` branch | `send()` can return `{ok, undo?, hold?}` synchronously; `spendPurse` adds `pending` |
| `view.ts` `composeView` | Used only by tests |
| Unexport (knip): `UNDO_MS`, `DEMO_WEEKS_BACK`, `demoFirstWeek`, `demoRows`, `getStoredMe`, `subjectOf`, `paidWeeks`, `SEASONS`, scene `STAGE_W/H`/`col`/`ROWS`/`hedgePair`/`PLATEAU_BOTTOM`/`HORIZON_U`/`TUCK_U`, `EMOTE_MS`, `WALK_MS`, `isoWeekday`, `md`, plus 19 types | Internal only |

There are no unused dependencies: knip's zen-maru hit is a false positive. Every art key is used, and `usage.test` guards that. The dev gallery is DEV-only, with no production chunk.

## 4. Refactor plan: three parallel workstreams

**Hands off:** the villager engineer owns `src/lib/villagers/**`, `static/art/villagers/**`, `static/art/manifest.json`, `scripts/fetch-assets.ts` and `phone/VillagerApp.svelte`. Moving `art.ts` waits for their merge.

**WS1: backend, contract and domain.** Owns `gas/**`, `apps-script/**`, `ingest/**`, `scoring/`, `model/`, `config/`, `types.ts`, `scripts/{bench-model,export-to-sheet}.ts` and `docs/ops/*`.
1. One commit, moves only: `contract/`, `time/dates.ts`, and `parse.ts` → `gas/`.
2. `REV` in `snapshot`; cache the keys and `LAST_AT`; reject bad keys early; a `build` hash in `whoami`.
3. The parser accepts `exercise_dates` and `*_sources`; fix the Shortcut doc.
4. `model/compact.ts` (WS2 uses it on merge) and the realistic bench.
5. `reduce` tests per event type.

**WS2: client sync, store and demo.** Owns `client/{gas,week.svelte,actions,view,demoRows}*` and their tests → `sync/` + `store/`.
1. Split `gas.ts` into transport, queue and cache, plus `storage.ts`. Move the cache to IndexedDB, migrating once from `localStorage`.
2. Drop the cache on a `REV` change, compact on merge, and recompute on the tick only at boundaries.
3. The `Backend` interface (live or demo). A synchronous `send()` without `status`/`data`.
4. Remove `composeView`; unexport the knip items.

**WS3: UI, SW and CI.** Owns `components/**` (except `VillagerApp`), `routes/**`, `client/{toast,ui,theme,season,jarScreen,jarTransition,standalone,paths}` → `ui-state/`, `service-worker/`, `styles/`, `i18n/`, `vite.config.ts` and `.github/`.
1. Regroup `components/` as in §1. `clock.ts` → `time/`, after WS1 step 1.
2. SW: chunk-failure reload, keep the previous cache, a 3 s navigation timeout.
3. CI: `check` + `vitest` before `build`, the `/exec` health cron, Dependabot, the CNAME, and the Playwright demo smoke test.
4. The `time/` helper for the scene; `storage.ts` for the balloon and high-five keys.

**Order:** WS1 step 1 merges first. After that the three run in parallel.

**Acceptance, every PR:**
- `check` and knip are clean.
- `vitest` passes with **`golden.test.ts` and its fixtures unchanged**.
- `bundle.test` passes against a regenerated `Code.js`.
- The main JS stays ≤ 124 KB gzip, and no chunk exceeds 20 KB gzip.
- The year-3 bench shows reduce + view ≤ 15 ms (Mac) after compaction.
- The demo smoke test passes: tap, undo, harvest, きろく edit.
- The jar total matches on both phones before and after.
