# Round 4: code review and cleanup list

Reviewer: senior SE · 2026-10-28 · Read-only audit of `app/` at `5d7f3d5`. Baseline: `svelte-check` 0/0, `vitest` 97 tests in 0.6 s, `knip` output below. Each item says where, the evidence, and the gain. Do P1 first. After each block, run `npm run check && npm test && npm run build:pages`.

## P1 Perf (biggest wins)

- [ ] **Stop inlining font files into the blocking CSS.** `build-pages/_app/immutable/assets/0.*.css` is **470 KB (211 KB gz)**. 150 KB of that is 48 base64 `data:font/woff` subsets, inlined because Vite's default `assetsInlineLimit` is 4 KB. Fix: in `vite.config.ts`, set `build: { assetsInlineLimit: (f) => (/\.woff2?$/.test(f) ? false : undefined) }`. Gain: about −150 KB raw on first paint.
- [ ] **Cut font weights from 6 to 3.** Each Zen Maru Gothic weight adds 107 KB of `@font-face` CSS (30 KB gz) and 120+ subset files. Usage is `--fw-body:500`, 700 (29 places), 900 (6 places), and `--fw-num:600` for Fredoka. Drop `zen-maru-gothic/900.css` (map `--fw-black` to 700). Also drop `fredoka/500.css`: Fredoka only renders numbers, at 600 and 700 (`.hero-num`, `.pill b`). Gain: about −110 KB CSS, about −2.5 MB in the Pages deploy.
- [ ] **Add an index for last-sync.** `personView()` (`src/lib/server/week.ts:160`) runs `max(raw_payload.received_at)` filtered by person twice per `GET /api/week`. `raw_payload` has **no index** and is **never pruned** (each Shortcut run stores the gzipped body). Fix: add `index('raw_person_received').on(t.person, t.receivedAt)` (migration 0004), or prune bodies older than 30 days in `jobs.ts`.
- [ ] **Remove repeated work in `getWeekView` (about 35 queries per call).** `loadActivity` runs for A, then B (`computePayout`), then again for *me* across 2 weeks (`pendingConfirmations`). `harvestView` re-scores the harvest week. `place` and `personPref(me)` are each read twice. Counts use `.all().length` (`harvestWeekKey`, `jarView.weeks`, `harvestConfirm`, `highFivesToday`); switch them to `count()`. `monthEarnings` loads every jar ledger row and filters in JS; use `WHERE week_key BETWEEN`. The DB is small today, so these are fixes for neatness more than speed.
- [ ] **Client: dedupe `week.refresh()`** (`src/lib/client/week.svelte.ts`). Mount, `visibilitychange` and the 400 ms debounced refresh can overlap, and an older response can overwrite a newer view. Keep one in-flight promise, or drop stale responses with a sequence number.
- [ ] **Service worker bug:** `cache.add('/')` (`src/service-worker/index.ts:25`) ignores the `/fitness/` base on Pages. Navigations cache `SCOPE`, so change this to `cache.add(SCOPE)`.

## P2 Delete (verified by `knip` and `grep -rw` in `src/` and `scripts/`)

- [ ] **Unused files:** `src/lib/components/Icon.svelte` (16 LOC) and `src/lib/components/Isabelle.svelte` (8 LOC, an alias of Juniper). Neither is imported anywhere.
- [ ] **Dead functions:** `formatNumber` and `weekdayShort` (`i18n/index.ts`), `stopScheduler` (`server/jobs.ts:107`). Each has 0 call sites.
- [ ] **Remove `export` only** (used inside their own file): `API_BASE`, `BASE`, `has`, `isoWeekday`, `isStrengthVisit`, `PAIRING_TTL_MS`, `safeEqualHex`, `seedPlaces`, `zoneOf`, `parseShortcut`, `firstWeek`, `tick`, `BUCKETS`, `amountFor`, `paidFor`, `partnerOf`, `loadActivity`, `loadWeekInput`, `scorePersonWeek`, `jstInstant`, `jarBalances`, `sharedRawMetrics`, `personView`, `pendingConfirmations`, `DEFAULT_VILLAGER`. Also these types: `PlaceRow`/`PresenceRow` re-export (`scoring/index.ts:7`), `MetricKey`, `ParsedShortcut`, `BucketKey`, `SettleLine`, `Ears`. Exception: keep `FRUITS` exported (see Merge).
- [ ] **20 of 51 `<symbol>`s in `Sprites.svelte` are never referenced,** including dynamic `#f-{fruit}` and `#{glyph}` uses: `f-plum f-empty tree i-bag i-shell i-x i-okbowl i-treat i-flag i-ticket i-cake i-drink i-pot i-info i-spa i-chef i-plant i-undo i-bell i-pencil`. Gain: −6.3 KB of the 20.5 KB file, which ships in the layout chunk.
- [ ] **i18n keys (en and ja):** `fruit.{peach,coconut,apple,pear}.name` are never read. `juniper.strength_left` is only used by `client/fixtures.ts:90`, and the server never emits it; point the fixture at `juniper.next_rung` and delete the key. Gain: −10 lines × 2.
- [ ] **CSS custom properties with 0 `var()` uses** (dynamic `--f-{fruit}`, `--tag-*` and `--p-*` were excluded; `src/lib/styles/tokens.css`): `--accent --app-us --c-blush --c-coral-ink --c-cream --c-emote-blue --c-ink-faint --c-ink-soft --c-sky-ink --c-sky-lip --coral-soft --dur-ceremony --font-body --font-display --gold --grass-dot --leaf-deep --leaf-ink --leaf-soft --lh-tight --p-lemon --p-mint --pat-check --pat-dots-pink --pat-stars --peach --r-md --r-xl --r-xs --sky-pale --sp-1 --sp-4 --sp-6 --sp-10 --sp-12 --tabbar-bg --tag-berry --tag-lemon --tag-mint --type-ms --type-pause --v-eye --v-line --v-line-w --v-mouth --v-tongue --white`. That is 47 of 201. Also delete `@keyframes if-coin` (unused; `LeafCoin` uses `if-pop`, so fix its comment too). Gain: about −40 LOC.
- [ ] **Static art never referenced** by `assets.ts` helpers or literal keys: `trees/*` (7), `items/*` (2), `fruit/cherry`, `fruit/orange`, `host/tom-nook-icon`, `money/bells-badge`, `phone/diy`. Remove them from `scripts/fetch-assets.ts`, `static/art/manifest.json` and disk. Gain: −96 KB of SW precache.
- [ ] **Old `species` alias:** `Villager.svelte` prop `species` and `resolveLook({species})` in `villagers/roster.ts`. No caller passes it.

## P3 Merge / Simplify

- [ ] **One date module.** `i18n/index.ts` re-implements `addDays` and `parseLocalDate` next to `scoring/dates.ts`. Keep `scoring/dates.ts`, and leave only formatting (`formatDate`, `formatSyncTime`) in i18n. `CheckinSheet` and `jar/+page.svelte` should import from scoring.
- [ ] **One `FRUITS` constant.** It is defined 4 times (`server/week.ts:19`, `PartnerSheet.svelte:13`, `IslandScene.svelte:43`, `dev/characters`), plus the zod enum in `server/actions.ts:34`. Move it to `config/rules.ts` and derive `z.enum(FRUITS)` from it.
- [ ] **Naming: Juniper vs Isabelle.** There are about 70 `juniper` references: component `Juniper.svelte`, `juniperLine` (i18n and week.ts), `WeekView.juniper`, 11 `juniper.*` keys per locale, and `--tag-juniper`. Rename everything to `host`/`Host.svelte` in one PR. This touches the API field, so update fixtures and tests at the same time.
- [ ] **Token layering.** The "legacy v0.4 names" in section 1 of `tokens.css` duplicate the v2 values (e.g. `--cream`/`--c-cream`, `--ink`/`--c-ink`). Point the semantic vars at `--c-*`, delete section 1 plus `--font-display`/`--font-body`, and move `components/theme.css` to `styles/`.
- [ ] **Fan-art fallbacks** `villagers/IsabelleArt.svelte` (195 LOC) and `VillagerFallback.svelte` (55) only render if a bundled webp 404s. Swap them for a plain silhouette or initials. Gain: about −200 LOC from the layout chunk.
- [ ] **Dev gallery in production.** `routes/dev/characters` (234 LOC, 13 KB chunk) ships in production. Gate it with `if (!dev) error(404)` in a `+page.ts`, or leave it if it's still useful.
- [ ] **Bundled manifest.** `assets.ts` bundles all of `manifest.json`, including the `source` URLs. Strip `source` at fetch time, or import a slim map. Gain: about −4 KB JS.

## P4 Tests

- [ ] No redundant or removed-behaviour tests found; the suite contains no references to promise, cozy or HAE. The suite is fast, so leave it alone.
- [ ] **Gaps worth one test each:** (1) `monthEarnings` / `jar.transfer` and the payday line on the 25th. (2) `juniperLine` with an unknown key falls back to `juniper.default`. (3) `refresh()` dedupe, after the P1 change.

## P5 Docs

**Obsolete (move to `docs/archive/` or delete):** `docs/team/*` (14 memos, 248 KB, rounds 1–4), `docs/reviews/round-1..3` (124 KB), `docs/research/apple-health-ingestion.md` (HAE, superseded by ADR 0012), `docs/design/mockup.html` + `mockup-preview.png` (v0.4, 1.7 MB). `docs/design/ac-research.md` is optional.

**Keep:** `README.md`, `docs/PROPOSAL.md`, `docs/decisions/*` (superseded ADRs stay, per `decisions/README.md`), `design/style-guide.md`, `ops/runbook.md`, `ops/shortcut-health-sync.md`, `research/no-mac/`, `profiles.md`.

**Links that break if you remove the obsolete docs:**
- `README.md:7,9,19` (mockup link and image, `docs/team/` row)
- `PROPOSAL.md:6,9,32,61,139,159` (team memos, mockup)
- `decisions/0010:5` (`team/software-engineer-round4.md`)
- `decisions/0011:16` (`reviews/round-3/`)
- `style-guide.md:3` (ac-research)
- `research/apple-health-ingestion.md` itself links `team/`
- the comment in `app/src/lib/client/fixtures.ts:2`
- 9 code comments citing "SE round 3 §…" (`grep -rn "round 3" app/src`)

If you archive instead of deleting, rewrite the links to `archive/…`. Also inline the `nutritionist-personalized.md` habit rationale into PROPOSAL §2 before removing it.
