# Round 22: handoff between the UI and code engineers

Append-only; newest at the bottom. Mark an item **done** (with the commit) when it is handled.

## UI → code

1. **Unused reaction art** (`lib/art.ts`, `scripts/fetch-assets.ts`): six reaction ids are never emitted by any
   reaction, toast or emote: `amazed`, `bashfulness`, `confident`, `daydreaming`, `delight`, `greetings`. Please drop
   them from `REACTIONS`, `FOR_VILLAGER`, `COLOUR_GLYPHS` (daydreaming) and the fetch list. Once that lands I delete
   the six `static/art/reactions/*.webp` files and their manifest entries (`usage.test.ts` "every file is used" then
   keeps them out).
2. **design.md leftovers of removed features**: §0 "the Watch, the Shortcut and the Arrive automation fill the trees"
   (no Arrive automation any more); §M.5 "R8 all five goals met" (four); §T.7's "HUD text" column describes
   `--hud`, the old corner clock's colour, which nothing uses (I am removing the token).

**Done (code):** 1 in c0ab00c: the ids, the fetch list, the six
`static/art/reactions/*.webp` files and their manifest entries are gone (I deleted the files too, so `usage.test.ts`
stays green; nothing for you to do). 2: `docs/design/` was replaced by `docs/design.md` + `docs/backend.md`, current
state only; none of the three leftovers survived.

## Code → UI

The docs are now `docs/design.md`, `docs/backend.md`, `docs/decisions.md` and `docs/ops/*`. `docs/design/*`,
`docs/decisions/*` (the ADRs) and `docs/reviews/round-19|21` are deleted, so references to them in UI files are dead.
Model API changes are already type-checked against your working tree (svelte-check clean).

3. **Dead doc references in UI files** (~87 lines in ~50 files under `components/`, `routes/`, `styles/`, `i18n/`,
   `e2e/`; `grep -rnE "ADRs? ?0?[0-9]{2,4}|docs/design/|docs/decisions/|docs/reviews/|[a-z-]+\.md ?§" src/lib/components src/routes src/lib/styles src/lib/i18n e2e`).
   Drop pure attributions ("(ADR 0021)"); where the doc explains why, point at the new anchor:
   - design.md "Navigation" → `docs/design.md#navigation`; §A → `#official-art`; §S → `#island-scene`; §S.2/§S.6 →
     `#layout-and-scale`; §S.3 → `#environment`; §S.4/§S.10 → `#particles-and-events`; §M.* → `#motion`; §R →
     `#small-screens`; §T / "Tokens" → `#chrome-and-tokens`; §E → `#economy`.
   - history-and-editing.md → `docs/design.md#kiroku`; §4 → `#editing`; §4.1 → `#how-edits-apply`; §4.3 → `#open-weeks`.
   - sound.md §11 → `docs/design.md#engine-lifecycle`; §13 → `#taps`; scene-interactions.md → `#scene-interactions`.
   - sheets-architecture.md §2.1 (SyncApp) → `docs/backend.md#revision`.
   - `docs/reviews/round-19/milestones-contract.md` (HelpApp.svelte:33, FruitTree.svelte:56) → `docs/design.md#milestone-curve`.
   - Decisions: ADR 0021 → `docs/decisions.md#rings-four-automatic-fruits`, 0022 → `#one-wallet` / `#one-menu` /
     `#escalating-food-treats`, 0023 → `#anyone-edits-anyones-data`, 0020 → `#weight-never-earns`, 0019 → `#one-wallet` /
     `#harvest-and-week-lock`, 0016 → `#no-alerts` / `#no-privacy-rules`, 0018 → `#official-nh-art`.
4. **History-narrating comments** (the user wants current state only): ~60 "round N …", "(was X)", "used to",
   "sizing #N" notes, e.g. `ui/Sheet.svelte:10,13,36,99,110,116,133`, `ui/Toast.svelte:4,5,99`, `kiroku/Kiroku.svelte:11,67,117,139,279`,
   `kiroku/NumberPad.svelte:72,74,87,97`, `phone/ShimaPhone.svelte:4,41,59,141,148`, `sheets/HarvestOverlay.svelte:4,67,84,168,193`,
   `kiroku/DayDetail.svelte:2,7,94`, `ui/BadgeRow.svelte:47,49`, `ui/modality.ts:1`, `ui/NavButton.svelte:3`,
   `motion/reactions.ts:34`, `motion/idleLife.test.ts:107` (`grep -rnE "round[- ]?[0-9]+|used to|\(was |sizing #" src/lib/components src/routes src/lib/styles e2e`).
   Keep the why, drop the before-value and the round.
5. **Stale wording:** "five badges" in `sheets/HarvestOverlay.svelte:4` and `kiroku/WeekList.svelte:66` (four);
   `kiroku/fmt.test.ts:53` "(four fruits, no 🥥)".
6. **Model fields removed** (nothing read them; for your information): `WalletView` is now `{ balance, today }`
   (no `earned`/`spent`/`week`); `RingProgress` has no `weekBells` or `nextBells` (use `nextGain`); `BellsLedger` has no
   `wallet` (use `earned`).
7. **The host line is built twice.** `routes/+page.svelte:48` rebuilds `host.harvest_waiting` and maps `host.default` to
   null itself, so the model's `view.host` is only ever used for `harvest_ready`; `i18n/index.ts:38` strips `host.`
   again although the page already did. Pick one: use `view.host` as is, or tell me and I'll drop `hostLine` from the
   model.
8. **Unused in UI files** (from a read-only sweep; svelte-check finds none of these):
   - Props never passed: `characters/Fx.svelte:29` `count`; `island/Jar.svelte:13` `band` (and its branch :38-39 and
     `.band` CSS :65) and `class` (:20); `ui/Bells.svelte:18` `bag`; `characters/OfficialArt.svelte:23` `class`;
     `ui/LeafCoin.svelte:9` `kind` (only the Gallery passes `'leaf'`); `island/scene.ts:72` `hedgePair(_season, …)`.
     Defaults passed explicitly: `Host.svelte:136` `dir={1}`, `Gallery.svelte:75` `spread="60px"`.
   - Never-varied parameters: the `locale` of `i18n/format.ts:17,37` `formatDate`/`formatSyncTime` and
     `i18n/index.ts:46` `formatBells` `opts.locale`; `i18n/format.ts:23` `clockTime` is test-only (its clock is gone).
   - CSS variables nothing reads: `--hud` (`tokens.css:31,132,136`), `--dur-slow` (`:62,160`), `--fill-on-bg` (`:123`),
     `--stage-h` (`IslandScene.svelte:197`).
   - Exports used only in their own file (un-export): `island/sceneTaps.ts:21` `inRRect`, `SceneHit`; `scene.ts:55`
     `Prop`; `motion/bus.svelte.ts:6` `IslandEvent`; `motion/director.svelte.ts:10` `ActorState`, `:97` `cancel`;
     `motion/idleLife.svelte.ts:12` `IdleContext`; `motion/reactions.ts:111` `IdleEntry`; `i18n/index.ts:11` `Params`.
   - e2e assertions that can no longer fail (removed UI): `demo.spec.ts:65` `[data-pot], [data-section], .rope`, `:100`
     the ジム ✎ button, `:161` `.gym-chip, .gym`, `:311` `.grabber`.
9. **Duplication** (one helper per job):
   - `kiroku/WeekDetail.svelte:62` builds the day label inline: use `fmt.ts:10` `dayTitle`.
   - Month/day slicing in `WeightChart.svelte:69` `md`, `i18n/format.ts:12,18`, `kiroku/fmt.ts:81`: one `monthDay(d)`.
   - `kiroku/fmt.ts:12` `num` = `i18n/index.ts:54` `formatNum`; `formatBells` builds its own `Intl.NumberFormat`.
   - `i18n/format.ts:28-34` Tokyo `ymd`/`hm` formatters: `localDateAt` / `jst` from `#lib/time/*` do this.
   - `kiroku/fmt.ts:43` `badgeGoals` and `island/progress.ts:13` `dayMax` repeat the rules: `fruits[f].weekGoalDays`
     (on every `RingProgress` as `weekGoalDays`) and the ring's own numbers; `progress.ts:21` sums `today.rings`
     where `today.bells` is the sum.
   - `island/scene.ts:140` `rng` is a second seeded PRNG: `mulberry32` from `#lib/random.ts`.
   - `scene.ts:13` `Tod` repeats `ui-state/season.ts`'s time of day (I can export it again if you want to import it).
   - `ui-state/ui.svelte.ts` `PhoneEntry` repeats `KirokuEntry` (`Kiroku.svelte:2`); `openKiroku` is only ever called
     with `{ tab: 'money' }`. Say which one should stay and I'll adjust `ui-state`.
10. **Move and Stand can't be edited in the app** (only `steps` and `exercise_min` have ✎; `store/actions.ts`
    `setMetric` allows only those). The model, the server and the change log support all four. Your call whether
    きろく should offer ✎ for 🍐/🍒 too; if not, say so and I'll narrow the model's edit-log types.
11. **The week screen doesn't say how long it stays editable**, though `docs/design.md#kiroku` lists it ("Week: ベル,
    how long it stays editable, …"). `weekDetail()` still returns `open` and `lockAt` for it (the day screen shows
    the same thing with `leftLabel(d.lockAt, now)`); `WeekDetail.svelte` doesn't read them. Show it, or tell me to
    drop the two fields and the line from the doc.
12. **Heads-up, your working tree:** `ja.json` `sound.opening` is now "♪ いまは オープニングテーマ" (spaced), but
    `e2e/demo.spec.ts:375` still looks for 'いまはオープニングテーマ', so `npm run e2e` fails on a build of your tree
    (main itself is green).
