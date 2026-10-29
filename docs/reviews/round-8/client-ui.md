# Round 8: client + UI cleanup review

Scope: client, routes, components, styles, i18n, SW and static at `d74268f`.

**Checks:** `npm run check` gives 0 errors and 0 warnings (455 files). `npx vitest run` passes 219/219. `npm run build` is OK: 29 JS files, **141 KB gz** in total, and the island route preloads 114 KB JS gz plus 31 KB CSS gz. Items come from `npx knip` plus grep. Knip's "unused `@fontsource/zen-maru-gothic`" is a false positive (`fonts.css` uses it).

**P1** = do first, **P2** = soon, **P3** = when touching the file. ⚠ = risky (check in a browser).

## Delete

1. **P1: 40 unused art files (125 KB), all precached by the SW on install.** `static/art`: 14 of the 16 `deco/*` (only `airport` and `present` are used), `map/islet`, `phone/{diy,glyph-friends,glyph-map,glyph-resident,island-designer}`, 9 of the 10 `reactions/pose-*` (only `pose-viva` is used, `reactions.ts:96`), `season/{acorn,mushroom,pine-cone,snowflake-large}`, `trees/{cedar,palm,palm-sm,*-icon}`. Also drop them from `fetch-assets.ts` and the manifest. ⚠ The dev gallery shows them.
2. **P1: legacy v3 emote system, about 110 LOC.** `villagers/EmoteArt.svelte` (65 LOC, a stroked v2 bubble). The `kind` branch in `Emote.svelte:9,13,19,31,45,51`. `species.ts` `EmoteKind` and `EXPRESSION_EMOTE`. The `LEGACY` map in `Villager.svelte:65`. The v3 props `meExpression`/`partnerExpression`/`meEmote`/`partnerEmote` and their effect in `IslandScene.svelte:84-88,221-232`. Only the dev gallery uses any of this.
3. **P2: 10 dead sprite symbols (5.0 of 13.2 KB, inlined into the layout JS).** `Sprites.svelte:7-52`: all eight `app-*` (`app-bell` and `app-lock` have no users; the other six are dev-only). Also `i-jar` (:59) and `i-purse` (:67).
4. **P2: 28 i18n keys, in both catalogs.** `host.{checkin_done,evening,morning,next_rung,pending_confirm,nearly_day,nearly_min,nearly_tick}` (+3 `.one`, en only), `island.you`, `jar.team`, `jar.paydayNoted`, and `kiroku.{today,noData,workouts,visit,score,howLong,next,weekYen,estimate,recentAll,stamp.*}`. The `.one` plural branch (`i18n/index.ts:47`) exists only for `nearly_*`.
5. **P2: dead CSS.** In `theme.css`: `.switch` (:93-102, left over from the privacy toggles), `.big` (:35), `.bells` (:52, reachable only through the unused `Yen` `pill` prop), and the keyframes `pop`/`twinkle`/`glint` (:105-107, duplicates of `if-pop`/`if-twinkle`). In `tokens.css`: `if-sway`, `if-glow`, `if-wave`, `if-shore` (:252,267-269) and `--jar-glass-lip` (:117).
6. **P2: unused props and exports.**
   - Props: `Toast` `miles`/`second` (+ `.second` CSS); `Bubble` multi-page `text[]`, `actions`, `onfinish`, `tag`; `Yen` `pill`/`sign`/`bag`; `IslandScene` `total`/`onvillager`/`onfruit`; `addWorkout(…, strength)`.
   - Exports: `art.ts` `poseArt`/`bushArt`/`decoArt`/`phoneArt` (+ the `PoseId`/`DecoId`/`PhoneId` types); `gas.ts` `clearKey`; `clock.ts` `forcedDate`; `scene.ts` `BED_COLS`/`PLATEAU_TOP`; the `week.me`/`week.partner` getters.
   - Other: the `sessionStorage` cleanup for old builds (`theme.svelte.ts:33`) and the `components/IslandScene.svelte` re-export shim.
7. **P3: the dev gallery ships in prod.** Route node 3 is 9.7 KB and gets precached, even though it returns 404 outside dev. In `+page.ts`, dynamic-import the gallery component behind `if (dev)` so Vite drops it from the prod build.

## Merge

1. **P1: undo banner duplicated.** `jar/+page.svelte:99-106` and `Kiroku.svelte:87-95`. Merge into one `undoBanner(text, r, {reaction, after})` in `actions.ts`.
2. **P2: four count-up implementations.** Hand-rolled rAF loops in `Hud.svelte:39-59`, `Yen.svelte:21-45` and `HarvestOverlay.svelte:61-76` (the last has no cleanup), while `IslandScene` already uses `Tween`. Replace all with `Tween` + `prefersReducedMotion` (svelte/motion). `Yen`, `Sheet:66` and `pair:93` also read `matchMedia` directly instead of the live `reducedMotion()`.
3. **P2: jar fill rule.** It is copied verbatim in `IslandScene.svelte:145-146` and `jar/+page.svelte:46-50`, while `HarvestOverlay.svelte:53` uses a different linear rule. Export one `jarFill(jar)` from `Jar.svelte`'s module script. ⚠ The end-card fill would change.
4. **P2: date and time formatting.** The weekday is computed three times (`fmt.ts:9-13`, `Hud.svelte:33-37`, `formatDate`). `md()` is defined twice, and the jar page re-implements `weekRange` (`jar/+page.svelte:81-84`). The clock is formatted four ways: Hud shows `9:05`, the phone shows `09:05` (`ShimaPhone:50`), plus `fmt.timeOf` and `formatSyncTime`. Put them in one `i18n/format.ts` and use one reactive clock instead of five intervals (Hud, ShimaPhone, IslandScene, theme, store).
5. **P2: second toast path.** The page-local high-five banner (`+page.svelte:28,112-127,160-162`) bypasses the store. Instead, add `person` to `week.showToast` so ToastHost places it (which also keeps it out of inert content under a sheet, as in F1).
6. **P2: keyboard-inset and scroll-on-focus logic duplicated.** `Sheet.svelte:49-68` and `pair/+page.svelte:23-38,90-95`. → one `{@attach keyboardInset}`.
7. **P3: two art-key modules.** `components/art.ts` and `client/assets.ts` (the file comment admits the split). Merge them into `lib/art.ts`. Also move `ripeness` out of `FruitRing.svelte`'s module script, since IslandScene and HarvestOverlay import a component just for it.
8. **P3:** five inline chevron/close SVGs (`ShimaPhone:107,113`, `jar:155,171,200`) → sprite symbols.

## Simplify

1. **P1 bug: the villager-name input resets while you type.** The `ShimaPhone.svelte:75-90` effect reads `me`, and `me` changes on every store recompute (60 s clock, any sync or tap), so `name = me.villagerName` overwrites the text being typed. Seed `name` only on the open edge (`untrack`). Also replace the `wasOpen` effect (:69-73) with Sheet's `onclose`.
2. **P1: oversized files.**
   - `IslandScene.svelte` is 505 LOC (347 of them script). Move the view-diff, greet, sleep and visibility logic into `islandLife.svelte.ts`, and the jar button + plate tween + gain into `JarSpot.svelte`.
   - `ShimaPhone.svelte` (275): give each app its own component.
   - `jar/+page.svelte` (358): `TREATS` → `config/rules.ts`; `weeks`/`layers`/`recent` → model helpers.
   - `week.svelte.ts` (403): the toast controller (:41-57, :344-400, about 75 LOC) → `toast.svelte.ts`.
3. **P2: `view.juniper` is mostly discarded.** The model picks one of 10 host keys, but `+page.svelte:68-69` keeps only `harvest_ready` and `payday`. Replace it with explicit flags (coordinate with the backend-model review).
4. **P3:** `ui.overlay` is mirrored from `showHarvest` by an effect (`+layout.svelte:39-41`).
5. **P3: missing timer cleanup** in `CheckinSheet:40`, `Sheet:67` and `HarvestOverlay:68-75`.

## Rename

- `HelpButton.svelte` → `PhoneButton.svelte` (it opens the NookPhone; "help" is one app inside it).
- The island jar's `.plate` (`IslandScene.svelte:450`) collides with the global nameplate `.plate` (`theme.css`): the global `rotate(-3deg)` applies and is dropped on press. Rename it `.jar-plate`. ⚠ Check the tilt.
- `view.juniper` → `view.host` (types + model).

## Perf

- Art manifest: `assets.ts:5` bundles the whole manifest into the main chunk, including about 9.5 KB of `source` URLs. Strip them at build time, and drop the 40 dead entries.
- `HarvestOverlay` is statically imported by the layout on every route (about 17.8 KB of compiled JS before minification, plus 5.7 KB CSS). Lazy-load it when `showHarvest` is true, the same way Kiroku is lazy-loaded.
- Blocking `0.css` is 70 KB (15 KB gz), 53 KB of it `fonts.css` unicode-ranges. Fredoka `600.css`/`700.css` also pull hebrew + latin-ext + `.woff`: import `latin-600.css`/`latin-700.css`.

## A11y

1. **P1: no visible focus on the keypad.** `NumberPad.svelte:40,70` is a `tabindex=0` group that is auto-focused with `outline: none` (fails WCAG 2.4.7).
2. **P2: tabs and radios without the expected keyboard behaviour.** The `role=tab` controls have no tabpanel and no arrow keys (`Kiroku:137-140`, `CheckinSheet:51-57`). The `role=radio` groups have every radio in the tab order and no arrows (`ShimaPhone:163-178`). Either use segmented buttons with `aria-pressed`, or implement roving tabindex.
3. **P2: score ribbon loses focus.** The `{#key beat}` wraps the button itself (`Hud.svelte:70-76`), so a score rise remounts it and a focused ribbon loses focus. Key the inner content instead.
4. **P2: misleading close button on undo banners.** With an undo action, the toast's full-size `.hit` button is labelled "close" but does nothing on click (`Toast.svelte:72-73`).
5. **P3: hint check is always true.** `CheckinSheet:72` tests `{#if t('habit.x.hint')}`, but `t()` returns the key itself when a hint is missing, so a raw key would render. Use `has()`.
6. **P3:** `title` is the only label for 収穫✓ (`WeekList:33`) and the fruit bars (`WeekDetail:45`); add sr-only text.

## Tests

- `week.svelte.ts` (the M1 logic) is untested: `send` with `lockAt` (refuse under 5 s, shrink the hold), the `hold` cap, pause/resume/dismiss of a held event. Use fake timers.
- i18n: catalog parity (en has 3 extra keys), an unused-key check (it would have caught the 28 above), and `formatYen`/`formatDate`/`hostLine`.
- An asset check: every sprite and art key referenced exists, and none goes unused.
