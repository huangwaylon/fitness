# Round 16: whole-app UX review (game UX designer, Animal Crossing lens)

**Date:** 2026-10-30. **Scope:** every screen and state of しまの貯金箱 / Island Fund, against `docs/design/design.md`, ADR 0019
(and both amendments), ADR 0020, `docs/design/sound.md`, `docs/design/scene-interactions.md`, round 13 (button tiers) and
round 15 (🍐 with less tapping). **No app code was changed.**

**Method.** A production build with a placeholder `VITE_GAS_URL` (so pairing renders), at commit `783436c`, served from a
snapshot of `build-pages/` on `127.0.0.1:4190` (another agent rebuilt `.svelte-kit/output` under the first `vite preview`,
so the build was copied to `/tmp` first). Playwright with the installed Chrome (`channel: 'chrome'`), iPhone touch
emulation, `ja-JP`, `Asia/Tokyo`, service workers blocked. Script: `/tmp/r16-ux/walk.mjs` (copied to `app/.r16ux-walk.mjs`
only to run, then deleted). One walk = 70 screenshots: island (first open, はい, focus, both tree popups), partner sheet,
high-five banner, check-in (empty, one tick, ぜんぶできた！, yesterday), 保存 and the island after it, ribbon → ベル
ledger, しまフォン home and every app (きろく からだ / ベル, weight detail and entry with an invalid value, week, day,
keypad, add workout; あそびかた; 村人 with search and no hits; 言語; 同期; サウンド), ふたりの壺 (top, bottom, buy confirm,
banner, undo, menu editor, add row, trip confirm, trip editor), `?demo=harvest` (tally, ceremony, end), `?balloon`, reduced
motion and pairing (empty, short key, failed connect, unpaired root). It ran at **320×568, 390×844, 430×932**, at
**12:10 (day) and 21:10 (night)** via `?date=2026-10-30THH:mm`, in **ja and en**: 10 walks, 629 screenshots in
`/tmp/r16-ux/shots/<width>-<tod>-<lang>-<step>.png` (gitignored, like round 13's). Each walk also logged clipped or
off-screen text, fonts under 11px and the keyboard focus order (`/tmp/r16-ux/log-*.json`).

**Re-checked against HEAD `3c8058c`** after the other round-16 commits landed. Every finding below still holds, with the
file:line as of HEAD. Model-side dead host keys (`host.morning` etc.) were fixed by M5 and are left out.

**Overall.** The island is lovely and very NH: one focal ribbon, coins flying into the jar, the item-get beat at the
harvest, and the night palette all land. Nothing overflows at 320, nothing scrolls sideways, there are no fonts under 11px,
and the round-13 tiers hold almost everywhere. What's left is mostly about **the daily loop's last step** (the check-in
sheet), **a few legibility misses** (green text, the partner's meal list), **terminology drift** and **small finishing
issues**.

---

## Findings, ranked by impact

Impact = how often it's met × how much it confuses or slows the daily loop (open → see today's ベル → check in → close).

### 1. Check-in sheet: two competing primaries, and the leaf one doesn't do anything
- **Where:** 今夜のチェック sheet, all viewports, day and night, ja and en.
- **Issue:**
  - 「ぜんぶできた！」 is drawn in **yuzu**, which round 13 reserves for the *selected* state.
  - The leaf-green primary in the sticky footer is 「保存」, but every tap already saves; it only closes the sheet.
  - Ticked habit rows are leaf too. On a good day the whole sheet turns green, and 保存 can't be told from the rows
    (`320-night-en-12`).
  - Round 15's goal was "sheet open → 1 tap → done". Today it's open → ぜんぶできた → 保存, and the button that matters
    looks secondary.
- **Evidence:** `/tmp/r16-ux/shots/390-day-ja-10-checkin-empty.png`, `390-day-ja-12-checkin-alldone.png`,
  `320-night-en-12-checkin-alldone.png`.
- **Fix:**
  - `app/src/lib/components/sheets/CheckinSheet.svelte:85`: `class="btn yuzu all"` → `class="btn all"` (leaf primary).
  - In `tickAll()` (`:53-61`), close the sheet 700 ms after the 🍐 pop (`setTimeout(() => (open = false), 700)`), so a good
    day really is one tap. `onclose` already fires the hop and しずえ's "grew" line.
  - `:104-106`: make the footer a secondary 「とじる」 (`class="btn paper"`, `t('common.close')`), or drop the footer and rely
    on the grabber and the scrim (but see #7).
  - Update `app/e2e/demo.spec.ts:36` (it clicks 保存).

### 2. Round 15's one-tap loop is only one-third built: no evening question, no morning "yesterday", no catch-up
- **Where:** 島 after 19:00 with no ticks today (`390-night-ja-02-island.png`); the check-in sheet before noon; the harvest.
- **Issue:**
  - Round 15 recommended h1: ぜんぶできた (built), しずえ's 「きょうのごはん、どうだった？」 on the first open after 19:00
    with [ぜんぶできた！][えらぶ…][あとで], and a weekly catch-up at the harvest. Only the button exists.
  - At 21:10 the island shows nothing but the CTA. The morning sheet always opens on 今日, even when last night is empty.
  - This is the biggest friction lever left. ウェイ currently ticks nothing (round 12), and the barrier is remembering,
    not precision.
- **Evidence:** `390-night-ja-02-island.png`, `390-night-ja-09-checkin.png`. `grep` finds no evening-question or catch-up
  code.
- **Fix:**
  - `app/src/routes/+page.svelte:61-71` (`news`): after `if (pending)`, add
    `if (eveningAsk) return t('host.dinnerAsk')`, where `eveningAsk = hour >= 19 && ticksToday === 0 && !seenToday('dinner')`
    (localStorage via `SCENE`, like `highFivesSeen`).
  - `:139-141`: render `ChoiceList` for it with [ぜんぶできた！ → `checkin()` × open habits][えらぶ… → `openCheckin()`]
    [あとで → mark seen].
  - Add the `host.dinnerAsk` key to `ja.json` / `en.json`: 「きょうのごはん、どうだった？」 / "How was today's eating?".
  - `CheckinSheet.svelte:28`: `let which = $state(hourNow() < 12 && yesterdayFillable ? 'yesterday' : 'today')`, set on
    open.
  - The harvest catch-up grid can wait for a later round.

### 3. 「ヨガは筋トレでしたか？」 doesn't say which day, and はい changes nothing you can see
- **Where:** 島 first open, all viewports (`390-day-ja-01-island-first.png`).
- **Issue:**
  - Pending questions cover last week and this week (`model/week.ts` `pendingConfirmations`), but the line has no date.
  - In the demo the yoga was on an earlier day. After はい, しずえ says 「筋トレに入れました！」, but the ribbon stays at
    +130 and my tree still shows 筋トレ 0/1 (`390-day-ja-04-tree-mine.png`).
  - The player gets a confirmation with no visible effect, NH's cardinal sin.
- **Evidence:** `390-day-ja-01-island-first.png`, `390-day-ja-01b-island-answered.png`, `390-day-ja-04-tree-mine.png`.
- **Fix:**
  - `app/src/lib/i18n/ja.json:87`: 「{when}の{label}は筋トレでしたか？」. `en.json:87`: "Count {when}'s {label} as
    strength?".
  - `app/src/routes/+page.svelte:63`: pass
    `when: pending.date === view.today ? t('checkin.today') : t('kiroku.dayTitle', …)` (e.g. 10/27(火)).
  - `:77`: for a past day, add the date to the answer line too, e.g. 「10/27の筋トレに入れました！」.

### 4. Green text that fails contrast (`--c-leaf-lip` used as a text colour)
- **Where:** きろく week and day headers, ふたりの壺 trips, the harvest end card, tree popups. Day and night.
- **Issue:** `#4FB35C` is a lip colour, not a text colour. As text it reaches:
  - **2.11:1** on paper: 「✎ あと4日 修正できます」;
  - **2.58:1** on a card: 「行けます！」, 「+350 ベル」 on the harvest end card, the met amounts in the tree popup;
  - **2.50:1** on the night card.

  All of these are 12–18px bold, so they need 4.5:1, or 3:1 for the large harvest amounts.
- **Evidence:** `390-day-ja-30-week-detail.png`, `390-day-ja-32-day-detail.png`, `390-day-ja-52-jar-bottom.png`,
  `390-day-ja-72-harvest-end.png`, `390-night-ja-30-week-detail.png`.
- **Fix:**
  - Add `--c-leaf-text: #256E33` to `app/src/lib/styles/tokens.css:19` (4.98:1 on paper, about 5.8:1 on a card), with
    `#9EE6A6` at night (5.84:1 on `#3A4886`).
  - Use it at `kiroku/WeekDetail.svelte:94` and `:131`, `kiroku/DayDetail.svelte:109`, `pots/TripList.svelte:46` (night
    override `:47`), `sheets/HarvestOverlay.svelte:215` and `island/FruitTree.svelte:253`.

### 5. Partner sheet: habits not done still show a ✓, and screen readers get no state
- **Where:** partner sheet, all viewports and themes (`390-day-ja-06-partner-sheet.png`: うめ has 0/3 but three ✓).
- **Issue:**
  - An undone habit is a ✓ in lip tan, a done one is a ✓ in green. At a glance all three read as done.
  - The `<li>` has no text state, so VoiceOver reads three habit names and no answer.
- **Evidence:** `390-day-ja-06-partner-sheet.png`, `390-night-ja-06-partner-sheet.png`, `430-night-en-06-partner-sheet.png`.
- **Fix:**
  - `app/src/lib/components/sheets/PartnerSheet.svelte:49`: render `#i-check` only when `on`. Otherwise draw an empty
    18px ring (`<span class="ring">`) and add `<span class="sr-only">{on ? '済み' : 'まだ'}</span>` (or i18n keys
    `partner.done` / `partner.notYet`).
  - `:70`: the ring is `box-shadow: inset 0 0 0 2px var(--c-lip)`, not a ✓.

### 6. Terminology drift: one thing, two or three names
- **Where:** across screens, ja and en.
- **Issue and fix:**

  | Thing | Where it differs | Fix |
  |---|---|---|
  | 🍑 minutes | 活動 (tree popup, partner sheet, あそびかた, `fruit.peach`) vs **運動** (きろく `kiroku.minutes` `ja.json:118`, `kiroku.col.min` `:169`, `kiroku.field.exercise_min` `:134`). en: "Active" vs "Exercise" (`en.json:118`, `:134`) | Use 活動 / Active everywhere: change `ja.json:118`, `:134` and `:169` to 活動, and `en.json:118` and `:134` to "Active" |
  | Today | **今日 / 昨日** in the check-in toggle (`ja.json:46-47`) vs **きょう** on the ribbon, the pots, the partner sheet and the tree | 「きょう」「きのう」 (NH's register is hiragana) |
  | Phone apps | The tiles say **言語 / 同期** (`ja.json:73-74`). `LangApp.svelte:2` and round 13 say ことば / 通信. design.md §1.3 says 使い方 (the tile says あそびかた) | Pick NH-style hiragana to match きろく / あそびかた: 「ことば」「つうしん」. Update `ja.json:73-74` and design.md §1.3 (`docs/design/design.md:61-64`) |
  | Partner villager aria | 「{name}の今週」 (`ja.json:42`, `IslandScene.svelte:165`), but the sheet shows *today* | 「{name}のきょう」 / "{name}'s day" |
  | Undo | もとに戻す (banner) · なかったことに (ledger) · 取り消し済み · en "Undo … ?" + "Void it" (`en.json` `kiroku.voidAsk` / `voidYes`) | en: "Void {label} ({bells})?" so the question matches its button; ja can keep なかったことに (it's a different, later act) |
  | 内訳 (en) | "Split" (`en.json:131`) reads as the pot split | "Breakdown" |

- **Evidence:** `390-day-ja-04-tree-mine.png` vs `390-day-ja-30-week-detail.png`; `390-day-en-30-week-detail.png`
  (Active / Exercise); `390-day-ja-10-checkin-empty.png`; `390-day-ja-20-phone-home.png`.

### 7. Buy confirm has no visible way out (paper sheets close only via an unmarked bar)
- **Where:** おやつ / 旅 buy confirm, all viewports (`390-day-ja-53-buy-confirm.png`, `390-day-ja-59b-trip-confirm.png`).
- **Issue:**
  - A spend confirm shows one big 「買う！」 and nothing else. The only exits are the scrim, Esc, or the 40×5 grabber
    bar. The bar is a 44px button labelled とじる, but it looks like a drag handle and doesn't drag.
  - NH always pairs a purchase with 「やめる」.
- **Fix:**
  - `app/src/lib/components/pots/BuyConfirm.svelte:42-46`: put a secondary
    `<button class="btn paper" onclick={() => (open = false)}>{t('kiroku.cancel')}</button>` (やめる) beside 買う！ in a
    two-column footer, as `MenuEditor` does (`390-day-ja-56-menu-editor.png`).

### 8. Banner text: clipped at 320, and the amount breaks before 「ベル」
- **Where:** island banner at 320 (`320-day-ja-08-highfive-toast.png`: 「うめさんにハイタッチし…」); the undo banner at every
  width (`390-day-ja-54-bought-toast.png`: 「−1,500」 / 「ベル」 on the next line).
- **Issue:** design §T says one line of ≤ 16 characters. The high-five line is 15 characters but doesn't fit beside the
  36px icon and the reaction at 320, so it's ellipsized. `formatBells` joins the number and ベル with a normal space, so any
  wrap can orphan the unit, here and anywhere else an amount wraps.
- **Fix:**
  - `app/src/lib/i18n/ja.json:43`: 「{name}さんにハイタッチ！」.
  - `ja.json:174` and `en.json:174`: `"{n} ベル"` / `"{n} Bells"` (no-break space), which fixes every amount at
    once.

### 9. Treat menu art: デザート・パフェ has no picture (production defaults), and the demo menu is stale
- **Where:** ふたりの壺, all viewports (`390-day-ja-50-jar-top.png`).
- **Issue:**
  - `dessert` is a default menu id (ADR 0019 amendment), but `pots/icons.ts` has no entry, so it falls back to the 🎁
    gift, the same picture as any added item.
  - The demo's `pref` menu still has the pre-amendment-2 prices (おやつ 1,500, アイス 2,000, デザート・パフェ 3,000), a
    duplicate パフェ 2,500 with the same gift icon, and a 12,000 day trip. The demo is what the couple shows people, and it
    misstates the tuned economy.
- **Fix:**
  - `app/src/lib/components/pots/icons.ts:4-13`: add `dessert: 'i-parfait'` and draw a parfait glass in `Sprites.svelte`
    (or reuse `i-ice` until it exists).
  - `app/src/lib/store/demo/rows.ts:136-144`: use `DEFAULT_MENUS.treat` prices (800 / 1,000 / 2,000 / 2,000 / 5,000), drop
    the duplicate パフェ (or rename it to something with its own picture), and make the demo day trip 10,000.

### 10. 島: keyboard and VoiceOver order runs back to front, and there's no heading
- **Where:** 島, all viewports.
- **Issue:**
  - Tab order (logged): tree, tree, jar, my villager, partner, しまフォン, ribbon, **今夜のチェック last**. The one focal
    point (ribbon) and the one action come after six scene buttons.
  - The page has no `h1`. The jar page has a `sr-only` one.
- **Evidence:** `/tmp/r16-ux/log-390-day-ja.json` (`focus.island`), `390-day-ja-03-island-focus.png`.
- **Fix:**
  - `app/src/routes/+page.svelte:127-130`: render `<Hud>` before `<IslandScene>`. Both are absolutely positioned, so
    nothing moves.
  - Move the `.below` block (`:135-151`) before `.top` in the DOM. It is `position: absolute; z-index: 9`.
  - Add `<h1 class="sr-only">{t('app.name')}</h1>` at `:126`.

### 11. Harvest: a slice of the island's jar plate shows between しずえ's box and the card
- **Where:** `?demo=harvest`, all viewports, day and night (`390-day-ja-72-harvest-end.png`, `390-night-ja-72-harvest-end.png`,
  `390-day-en-72-harvest-end.png`: 「64,810 ベル ▶」 cut in half).
- **Fix:** `app/src/routes/+page.svelte:179`: add `.covered :global(.jar-plate)` to the selectors already hidden under the
  overlay.

### 12. The week stamps (★ ● ○ ·) and the meal dots are never explained
- **Where:** きろく からだ week cards and the week table (`390-day-ja-21-kiroku-body.png`, `390-day-ja-30-week-detail.png`).
- **Issue:**
  - ★ = strength day, ● = goal met, ○ = missed, and teal dots = meal ticks, but nothing on screen or in あそびかた says so.
  - The stamps are also missing from the card's screen-reader text (`WeekList.svelte:46` reads only the name and the ベル).
  - The strength mark is a ★ in きろく but a 🥥 coconut everywhere else (the tree, the rings, the help, the ledger).
- **Fix:**
  - Add a one-line legend under the first card's weekday row (`app/src/lib/components/kiroku/WeekList.svelte:36-41`), with
    the glyphs and four words, e.g. 「★筋トレ ●達成 ○まだ」.
  - At `:46`, add the stamps' meaning to the `sr-only` span.
  - Use the coconut art for strength in `kiroku/WeekDetail.svelte:56` and `:70` (`Glyph kind="strength"`), to match
    `fruitArt('coconut')`.

### 13. Small-width wraps that break the rhythm
- **Partner rings:** 「3,621/8,000歩」 wraps to two lines at 320 (ja) and even at 430 in en (「3,673/8,000 / steps」), so
  the four ring labels no longer share a baseline (`320-day-ja-06-partner-sheet.png`, `430-night-en-06-partner-sheet.png`).
  **Fix:** `app/src/lib/components/sheets/PartnerSheet.svelte:43`: show only the actual count under the ring (the goal is
  in the caption below), or set `white-space: nowrap; font-size: var(--fs-s)` with the unit dropped at `:66`.
- **Harvest ふたりボーナス:** 「ふたりでそろえたバッジのぶ / ん！」 at 390 (`390-day-ja-70-harvest.png`). **Fix:**
  `ja.json:212`: 「ふたりでそろえたバッジ！」.
- **Tree popup at 320:** the label column goes (by design), and 「4,317/8,000歩」 then touches the apple
  (`320-day-ja-04-tree-mine.png`). **Fix:** `app/src/lib/components/island/FruitTree.svelte:256`: inside the container
  query, add `.row { column-gap: 10px; }` and drop the goal (`amount(f)` → actual only) under 360px.

### 14. Check-in: the ticked row's hint fails contrast
- **Where:** check-in sheet with a habit on (`390-day-ja-12-checkin-alldone.png`).
- **Issue:** `--c-ink-soft` hint text on the leaf row is 3.65:1 at 12px.
- **Fix:** `app/src/lib/components/sheets/CheckinSheet.svelte:137`: add `.habit.on .txt small { color: var(--c-ink); }`
  (5.67:1).

### 15. Tree popups don't say whose tree it is
- **Where:** 島, both trees (`390-day-ja-04-tree-mine.png`, `05-tree-partner.png`).
- **Issue:** the two oaks are identical, and the bubble lists four rows with no owner, so only left/right tells you who.
  NH's bubbles always carry a nameplate.
- **Fix:** `app/src/lib/components/island/FruitTree.svelte:178`: add a small yuzu nameplate above the rows
  (`<span class="plate">{person.villagerName}</span>`), the same idiom as the dialogue box.

### 16. Night: partner sheet cards stay cream, and "off" marks vanish
- **Where:** night (`390-night-ja-06-partner-sheet.png`, `390-night-ja-30-week-detail.png`, `390-night-ja-21-kiroku-body.png`).
- **Issue:**
  - Every other night card is navy (`--card`), but the partner sheet's two cards are fixed `--c-cream`. That's fine as a
    game object, but it's the only sheet that does it.
  - Unearned badges (`opacity: .4; saturate(0)`) and off meal dots are ~1.3:1 on navy, so 「●●●」 reads as two dots, and
    the ○ "missed" stamp nearly disappears.
- **Fix:**
  - Either document the partner cards as game objects in design §T, or use `var(--card)` / `var(--text)` at
    `PartnerSheet.svelte:64` and `:68`.
  - `app/src/lib/components/pots/BadgeRow.svelte:37`: at night use `opacity: .6`.
  - `kiroku/WeekDetail.svelte:128`: at night use `background: color-mix(in srgb, var(--text) 30%, transparent)` for the off
    dots.

### 17. Copy that doesn't sound like しずえ
- 「食事の洋なしが育ちましたよ！」 (`ja.json:86`, `390-day-ja-15-island-after-checkin.png`) reads as "the meal's pear".
  **Fix:** 「{fruit}が みのりましたよ！」 (en is already "Your pear grew!").
- `pots.short` 「ベルが足りませんでした」 (`ja.json:242`) is past tense and a little cold. **Fix:** 「ベルがちょっと足りないみたい…」.
- 村人 app: the 「名前」 field (`ja.json:82`, `390-day-ja-42-villager.png`) sits under キャラメル's render but is *my* name
  (ウェイ). **Fix:** 「よびな」 / "Your name".

### 18. Game-feel timing: the ribbon counts before the coins land
- **Where:** 島 after a check-in (`390-day-ja-15-island-after-checkin.png`: the ribbon already reads +430 while three coins
  are still in the air over the jar).
- **Issue:** in NH the number moves when the item arrives (the ATM rattle, the pocket "item get"). Here the focal number
  jumps first and the plate catches up later, so the eye isn't led from the fruit to the jar to the ribbon.
- **Fix:** `app/src/lib/components/island/Hud.svelte:27-32`: delay a rise by the coin flight time (expose
  `COIN_FLIGHT_MS` from `CoinFlow.svelte`; `shown.set(to, { duration: 900, delay: COIN_FLIGHT_MS })`), with no delay
  under reduced motion.

### 19. Faded ground fruit reads as grey pebbles
- **Where:** 島, every viewport (`390-day-ja-02-island.png`: the faded 🍑 🥥 🍐 under each tree look like stones).
- **Issue:** a "nothing yet" fruit is a desaturated copy of the art. On autumn grass it reads as clutter, not a promise.
- **Fix:** `app/src/lib/components/island/FruitTree.svelte`: draw the empty kind as NH's catalogue "not yet" silhouette (a
  flat `--c-lip` silhouette with `mask-image` from the fruit art at 35%), or drop the faded item entirely and let the tree
  popup say 0.

### 20. Docs drift (design.md vs the app)
- `docs/design/design.md:26` still draws the corner clock 「12:40 10/28(水)」 (removed: `Hud.svelte:2`, user 2026-10-30).
- `:62` and `:99` say 79 villagers (now 158).
- `:61-64` say 使い方 / 言語 / 同期 (see #6).
- `:181` says the balloon's "tap = pop", but `Balloon.svelte` only wobbles and hops (scene-interactions.md). Pick one; see
  the wishlist.
- **Fix:** update those lines when #6 lands.

### 21. Smaller polish
- **Menu editor prices** show 「1500」 without the separator every other screen uses
  (`390-day-ja-56-menu-editor.png`). **Fix:** `app/src/lib/components/pots/MenuEditor.svelte:73`: display
  `formatNum(r.bells)` and strip commas in `digits()`.
- **PWA `theme_color` / `background_color` `#FFF8E7`** (`app/static/manifest.webmanifest`) is the old cream. The launch
  splash flashes neither the tan paper nor the sky. **Fix:** `background_color: "#F5E4BC"`, `theme_color: "#4AA3F6"`.
- **Pairing:** a failed connect shows a coral pill, but しずえ's line above it stays 「ようこそ！」 (`390-day-ja-92-pair-fail.png`).
  **Fix:** `app/src/routes/pair/+page.svelte`: bind the Bubble's text to `msg || t('pair.title')`, so she says it and the
  coral pill goes away.
- **Demo ベル ledger** lists earnings back to 8/31, before `ECONOMY_START` (2026-10-26) (`390-day-ja-18-ribbon-ledger-end.png`).
  This is demo only. **Fix:** in `store/demo/rows.ts`, start the generated rows at `ECONOMY_START` or mark the earlier weeks
  as pre-start.
- **The high-five *sent* banner** shows しずえ. NH would show the friend you waved to. **Fix:** `app/src/routes/+page.svelte:102`:
  pass `person: view.partner`.

---

## Polish wishlist (small, cute, NH-faithful)

1. **The balloon really pops.** A tap pops it (a puff, our confetti), and the 🎁 floats down on a tiny parachute onto the
   beach, opening into a random seasonal flourish (petals, a maple leaf, a snowflake) that fades. It's still worth nothing,
   so it fits "no points", and design.md already promises it.
2. **しずえ's morning announcement.** On the first open before 11:00, one line, 「おはようございます！きのうは ふたりで
   +1,320 ベル！」, with her chime pose. It's NH's 5 AM broadcast and the most AC thing the app doesn't do yet.
3. **A bell bag over the jar.** When coins land, a tiny `money/bells` sack pops up 「+300」 and drops into the jar with a
   squash, like picking up a bag of bells.
4. **Orville's ticket.** The first time a trip becomes affordable, the 旅の壺 ticket icon stamps 「行けます！」 with a
   Dodo Airlines-style stamp wobble, instead of plain green text (also fixes #4).
5. **ぜんぶできた as a Nook Miles stamp.** A round leaf stamp thunks onto the button (rotate −8°, squash), then the sheet
   closes (see #1).
6. **Isabelle in the harvest box.** Her bow render on the dialogue's left (the harvest currently shows a nameplate with no
   one under it). The sheet already crossfades her poses.
7. **The island name on the しまフォン.** NH's phone home shows the island and the date. 「〇〇島 · 10/30(金)」 under the
   status row fills the empty top of the grid and brings back the date the HUD clock used to give.
8. **A high-five wave.** When a high-five is sent or received, both villagers turn to each other and do the NH greeting
   wave (R4/R5 already turn them; add a 600 ms raised-arm squash).
9. **A goal-reached flower.** On the weight screen, reaching the goal shows a tiny ✿ by the trend number, with no words
   (ADR 0020: nothing celebratory beyond that).
10. **Wedding countdown, once a month.** On the 8th, しずえ: 「結婚式まで あと11か月！」. One line, monthly, never daily
    (ADR 0014's budget).

---

## Top 10 at a glance

| # | Screen | Fix in one line |
|---|---|---|
| 1 | Check-in | ぜんぶできた = leaf primary, auto-close; footer 保存 → secondary とじる (`CheckinSheet.svelte:85`, `:104-106`) |
| 2 | 島 evening / check-in morning | Build round 15's evening question and morning "yesterday" (`+page.svelte:61-71`, `CheckinSheet.svelte:28`) |
| 3 | 島 pending | Put the date in 「…は筋トレでしたか？」 (`ja.json:87`, `+page.svelte:63`, `:77`) |
| 4 | きろく / 壺 / harvest / tree | Add `--c-leaf-text` `#256E33` / night `#9EE6A6` instead of `--c-leaf-lip` text (6 places) |
| 5 | Partner sheet | No ✓ on undone habits; give them a screen-reader state (`PartnerSheet.svelte:49`, `:70`) |
| 6 | Everywhere | 活動 only; きょう/きのう; ことば/つうしん; en Active, Breakdown, Void (`ja.json` / `en.json` lines above) |
| 7 | Buy confirm | Add やめる beside 買う！ (`BuyConfirm.svelte:42-46`) |
| 8 | Banners | 「{name}さんにハイタッチ！」; no-break space in `bells.amount` (`ja.json:43`, `:174`; `en.json:174`) |
| 9 | ふたりの壺 | A dessert icon; demo menu at the tuned prices (`icons.ts:4-13`, `demo/rows.ts:136-144`) |
| 10 | 島 a11y | Hud and action before the scene in the DOM; a sr-only h1 (`+page.svelte:126-151`) |
