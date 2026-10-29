# Round 10: UI sizing review

Scope: sizing, spacing, proportion, clipping and overflow on every screen and sheet. Scrolling is covered by a separate audit. No app code was changed.

**Method.** I built `HEAD` (`bec281b`) twice into a private copy: once as shipped (the 未設定 screen) and once with `VITE_GAS_URL` set, so that `/pair` renders. Each build was served with `vite preview --port 4175`. Playwright drove the installed Chrome (`channel: 'chrome'`) with `isMobile`, `hasTouch`, DPR 3, `reducedMotion: 'reduce'` and `timezoneId: Asia/Tokyo`.
- Viewports: 320×568, 375×667, 390×844 and 430×932 in ja-JP, plus 320 and 390 in en.
- States (37 per run): the island (pending question, しずえ's answer, grew, quiet, fruit popup, sync chip), check-in (off and on), partner (with the ring tip), the しまフォン home and every app, きろく (weeks, week, day, number pad, add-workout picker, money), 旅の壺 (top, bottom, ladder, shop, picked item, undo banner), harvest (tally and end card), pair (empty and error) and 未設定.
- Live-only states: the sync chip only appears on the live backend, so I injected it with its real scoped class and real copy.
- Per state I measured every interactive box, the font size of every visible text node, input font sizes, x/y truncation, anything off-screen horizontally, image natural size against rendered size, and pairwise overlaps of named components. Every screenshot was inspected by eye.
- Global result: `scrollWidth − innerWidth` was **0 in all 222 captures**, so there is no horizontal page scroll at any width. Raw data and screenshots are in `/tmp/r10-size/{out,shots}` (not committed).

**Two caveats.**
- `word-break: auto-phrase`, used about 15 times, is Chromium-only. On iPhone (WebKit) it falls back to `normal`, so Japanese can break between any two characters. Chrome results for Japanese line breaks are therefore *optimistic*, and the grid blow-out in S4 may look different on device: there, the text will break at arbitrary characters.
- Chrome cannot emulate `env(safe-area-inset-*)`, so §Safe areas below is a code audit, not a measurement.

---

## Ranked findings (by visual impact)

| # | Screen · component | Viewport | Measured | Target | Where | Proposed change |
|---|---|---|---|---|---|---|
| 1 | しまフォン: every cream control and card (‹ ×, numpad keys, ✎, day cards, Help rows, きろく cards) | all (day / dawn / dusk) | Phone background `--bg` = `#FFF9E3` = `.icon-btn` / `.key` / `.pen` fill `--c-cream`; cards forced to `--bg` too. Controls render as **bare 4px crescents with no body** (see the numpad and きろく shots) | Fill ≠ background (paper vs cream) | `ui/Sheet.svelte:87`, `:108` | `dialog.phone { background: var(--surface); }` (paper `#FFF3D6`; night is already navy). Keep `dialog :global(.card){background:var(--bg)}`, which now contrasts |
| 2 | 島 HUD: sync chip over the score ribbon | all | Chip 195×32 at y 38–70 (ja; en 149), ribbon at y 56. **Overlap 88–99 × 14–16 px; the chip (z 8) hides the top half of the focal score** | 0 overlap, ≥ 8px apart | `island/Hud.svelte:65,75`; `ui/SyncPill.svelte:22` | When the chip shows, push the ribbon down: `.hud:has(.chip) ~ .ribbon-wrap { top: calc(var(--safe-top) + 84px); }`, or put the chip on the clock row (`.corner { grid-auto-flow: column; align-items: center; }` with a label of 「オフライン」 only, keeping the full text in `aria-label`) |
| 3 | きろく · ワークアウトを追加 type grid | all (Chrome) | `.type` columns **245 + 140 px in a 280–378px row**: column 2 is clipped by the phone (「高強度インターバルトレーニング」 sets the min-content of `1fr`) | Two equal columns inside the row | `kiroku/Kiroku.svelte:222,226` | `grid-template-columns: repeat(2, minmax(0, 1fr));` plus `.type { overflow-wrap: anywhere; }` |
| 4 | きろく · NumberPad | 390, 430 | Keys **60×54** in a 3×60 block at left; けってい / やめる 124px at right; **≈ 330px empty** above the screen card. At 375 the keys are **101×46**, so bigger phones get smaller keys | Full-width keys at every width; key height 52–64 | `kiroku/NumberPad.svelte:85–87,97–103` | Drop the `max-width:389px` branch and make it the default: `.keys { grid-template-columns: repeat(3, 1fr); width: 100%; } .key { height: clamp(46px, 7dvh, 64px); } .choose { width: 100%; } .choose :global(.choices){ grid-auto-flow: column; width: 100%; }` |
| 5 | 旅の壺 · purse ¥ | 320 | `.bag` squashed to **13px of 26px**; the bell bag overlaps 「¥」 | Icon never shrinks | `ui/Yen.svelte:31`; `routes/jar/+page.svelte:241–242` | `.bag { flex: none; }` and `.purse :global(.purse-yen){ font-size: clamp(1.25rem, 6.5vw, var(--fs-title)); }` |
| 6 | 島 · scene proportion and fixed chrome | 430×932 (also 390×844) | Horizon at **y 347 / 932 (37% sky)**. The stage scales (u 0.82 → 1.27, canopy 88 → 123px), but the ribbon (140×36), plate (75×21, **12px ¥**), choices (112×44) and clock stay fixed, so the focal ribbon reads small in a large empty sky | Chrome scales with the stage; ≤ ~25% empty sky | `island/Hud.svelte:75,79–91`; `island/JarSpot.svelte:106,110`; `ui/ChoiceList.svelte:32` | Ribbon: `top: max(calc(var(--safe-top) + 56px), calc(var(--if-hy, 0px) * .45)); height: clamp(36px, 4.6dvh, 44px); .ribbon b { font-size: clamp(1.5rem, 3.4dvh, 1.875rem); }`. Plate (inside the stage container): `.jar-plate b { font-size: clamp(12px, calc(14 * 100cqw / 390), 16px); }`. Choices: `min-width: clamp(112px, 30vw, 140px)` |
| 7 | しまフォン home grid | 390, 430 | Tiles **64px**; 5 apps fill rows 1–2, **≈ 60% of the phone is empty** | Tiles grow with width | `styles/tokens.css:62,81,84`; `phone/ShimaPhone.svelte:141–142` | `--tile: clamp(52px, 18vw, 80px); --tile-gap: clamp(12px, 4.5vw, 22px);` (delete the per-breakpoint `--tile` overrides) |
| 8 | Tap targets < 44 | all | Sheet grabber **88×36**; score ribbon **h 36**; check-in 今日 / 昨日 **56×40**; きろく からだ / お金 pills **104×40**; DayDetail ✎ **44×36**; meal chips **h 36**; MoneyLog なかったことに / Void **h 36 (en 43×36)** | ≥ 44×44 | `ui/Sheet.svelte:95`; `island/Hud.svelte:81`; `sheets/CheckinSheet.svelte:97`; `kiroku/Kiroku.svelte:206`; `kiroku/DayDetail.svelte:116,122`; `kiroku/MoneyLog.svelte:115` | `height: 44px` (grabber); `.ribbon { height: 40px } .ribbon::after/::before` hit area `inset:-4px 0`, or simply `min-height:44px`; `.day { min-height: 44px; border-radius: 14px }`; `.pill { min-height: 44px }`; `.pen { height: 44px }`; `.tick { min-height: 44px }` (or keep 36 visual with `::after { inset: -4px 0 }`); `.mini { min-height: 44px; min-width: 44px }`. Sync chip 32 tall + `::after` −6px = 44: OK |
| 9 | 村人 · search field | all | `input` **15px**: iOS zooms on focus | ≥ 16px | `phone/VillagerApp.svelte:88` | `font: 700 16px var(--font-ui);` |
| 10 | 島 fruit popup (tree) | 320 | 2×2 grid **270px wide at x 9–279**; labels and % **12px**; it stays open under the check-in sheet (seen behind it) | Fits the tree's half; ≥ 13px | `island/FruitTree.svelte:224–241` | `.lbl, .row b { font-size: 13px }`; `.detail { max-width: calc(100cqw - 16px) }`; close the popup when any sheet opens |
| 11 | きろく · week table, weekday column | en (all widths) | Column **22px**; 「Wed」 ≈ 27px spills into the steps cell (「Wed 4,238」 reads as one token) | Fits 3 Latin letters | `kiroku/WeekDetail.svelte:118,127` | `grid-template-columns: 2.2em 1fr 1fr;` (both rules) |
| 12 | Partner sheet · four rings | 320 | 2×2 grid **198px tall** vs 108px in one row. 4 × 64 + 3 × 4 = 268 ≤ 280 fits | One row at every width | `sheets/PartnerSheet.svelte:56,64` | Delete the `max-width:359px` 2-column rule; at ≤ 359 use `.fruits { gap: 10px 2px; padding: 12px 4px }` and ring `--size: 60px` |
| 13 | DayDetail · workout row | 320 | Label `.wo .k` at **12px** wraps to 3 lines (en 「Traditional / Strength / Training」); ja breaks **「筋力トレーニ / ング」** mid-word; 「19:15 48分」 crammed against the chip | 1–2 lines; no mid-word break | `kiroku/DayDetail.svelte:107,109` | `.wo { flex-wrap: wrap } .wo .k { font-size: var(--fs-body); flex-basis: 100% }` (label on its own line, value + chip + ✎ below) |
| 14 | MoneyLog · chart rung labels | all | **11px** labels sit on the step line (「Onsen day trip」 / 「日帰り温泉」 crossed by the data) | Readable; no collision | `kiroku/MoneyLog.svelte:97–98` | `.rl span { font-size: 12px; padding: 0 4px; background: var(--bg); border-radius: 4px; }` |
| 15 | 島 · しずえ box → action | all | Box bottom to CTA top **8px**, so the 4px lip leaves a **4px** visual gap (the focus ring touches the box) | 12px visual | `routes/+page.svelte:173` | `.below { gap: 12px; }` and add 4px to `--chrome-below` (line 165) so the slot height stays constant |
| 16 | 旅の壺 · layout | 320 / 430 | 4 stacked cards (payday + trip + purse + recent); at 320 the recent card starts at y 512 (below the fold); at 430 **≈ 25% empty** below the cards. Hero jar 84 / 96 / 132 / 132px (step jumps, not fluid) | ≤ 3 cards (design §0); fluid hero | `routes/jar/+page.svelte:197,215,287,293` | `--jar-h: clamp(84px, 16dvh, 160px)`; drop the two `--jar-h` media overrides; `.hero :global(.total){ font-size: clamp(2.25rem, 11vw, var(--fs-hero)); }` |
| 17 | Toast (top banner) | all | `top: safe-top + 56px`, the same y as the score ribbon: a banner covers the focal point for its 1.8–3.2 s | Clear of the ribbon | `ui/Toast.svelte:86,92` | `top: calc(var(--safe-top) + 100px)` on 島 only (`:root:has(.island) .banner`), or keep it and accept |
| 18 | Undo banner over 旅の壺 | 320 | Banner covers the purse card's lower 12px, including the 使う lip; text **12px** in 2 lines | Text ≥ 13px | `ui/Toast.svelte:101–102` | `.undo .txt { font-size: 13px; }`; `.jar-screen { padding-bottom: calc(var(--pad-bottom) + 88px) }` while undo is up (already done for sheets: `Sheet.svelte:112`) |
| 19 | Harvest overlay | 430 | Card and box at the bottom with **≈ 45% empty sky**; fruit icons fixed `--fr: 24px` | Fruit icons scale | `sheets/HarvestOverlay.svelte:170,234` | `--fr: clamp(20px, 6.4vw, 30px)`; delete the 339px override |
| 20 | Images at DPR 3 | all | **Nothing is upscaled beyond its natural CSS size.** Softest at 3×: `phone/miles\|passport\|rescue` 92px for 64 CSS (0.48 of the 192px needed), `deco/airport` 256 for 220 (0.39), `bushes/*` 100 for 60 (0.56), villager icons 128 for 55 (0.78) | ≥ 0.66 (2×) for hero art | `static/art/` (fetch-assets) | Fetch 192px phone tiles and a 512px airport; the rest is fine |

## Text below ~13px (census, all screens)

`--fs-s` = 12px carries real content in about 40 places, and 11px literals appear 8 times. Measured: habit hints (`CheckinSheet.svelte:117`), jar plate ¥ (`JarSpot.svelte:110`), しまフォン tile labels (`ShimaPhone.svelte:157`), partner ring numbers and sync time (`PartnerSheet.svelte:55,58`), きろく state/split (`WeekDetail.svelte:103,141`), week table cells 12px and headers 11px (`WeekDetail.svelte:125,128,130,132–133`), WeekList weekday 11px (`WeekList.svelte:80`), DayDetail chips / tags / src (`DayDetail.svelte:103,110,112,114,122`), MoneyLog rows and chips 11–12px (`MoneyLog.svelte:98,103,110,116`), ChangeLog 11–12px (`ChangeLog.svelte:36–39`), villager name / kind 12 / 11px (`VillagerApp.svelte:74–75,78`), pair hint and key hint (`pair/+page.svelte:118,121`), harvest 見込み (`HarvestOverlay.svelte:213`), Help version, sync chip. Fix systemically: see T1.

## Safe areas (code audit)

- Correct: HUD (`safe-top + 8`), `.below` (`--pad-bottom`), Sheet footer and inner (`safe-bottom`), harvest column, the 旅の壺 page, pair, and the dialog `max-height`.
- Gaps: `dialog.phone .inner` (`Sheet.svelte:110`) ignores `safe-left/right` (only matters in landscape). Toast `top` collides with the ribbon (see #17). The ribbon has no `safe-left/right` (centred, so harmless).

## Systemic token changes (each fixes several rows)

1. **T1 type floor:** `--fs-s: .8125rem` (13px). Add `--fs-xs: .6875rem` (11px), only for chart axes and the table header `.hd`; replace every literal `11px` / `12px` with these. Fixes the census above and #10, #13, #18.
2. **T2 hit token:** `--hit: 44px`. Use `min-height: var(--hit)` in `.pill`, `.day`, `.pen`, `.tick`, `.mini`, `.grabber` and `.ribbon`. Fixes #8.
3. **T3 surfaces:** the phone shell uses `--surface`. Rule: a control's fill must differ from its container (`--c-cream` on `--surface`, or `--surface` on `--bg`). Fixes #1.
4. **T4 fluid scale instead of steps:**
   - `--tile: clamp(52px, 18vw, 80px)`
   - `--tile-gap: clamp(12px, 4.5vw, 22px)`
   - `--fs-hero: clamp(2.25rem, 11vw, 2.75rem)`
   - `--fs-title: clamp(1.375rem, 6.4vw, 1.625rem)`
   - `--cta-h: clamp(48px, 6.6dvh, 60px)`
   - `--jar-h: clamp(84px, 16dvh, 160px)`

   Then delete the matching overrides in the compact and tiny media blocks (`tokens.css:81,84`, `jar/+page.svelte:287,293`, `HarvestOverlay.svelte:231,234`). Fixes #4, #6, #7, #16 and #19, and removes the 375 → 390 inversions.
5. **T5 scene-relative chrome:** game objects on the stage (plate, fruit popup, emotes) size in stage units, e.g. `calc(n * 100cqw / 390)` clamped. Off-stage chrome (ribbon, clock) uses `dvh` clamps. Fixes #6 and #10.
6. **T6 grids:** never bare `1fr` next to text. Use `minmax(0, 1fr)` everywhere (`Kiroku.svelte:222`, `jar/+page.svelte:266,272`, `PartnerSheet.svelte:56`, `WeekDetail.svelte:105`). Fixes #3.
7. **T7 Japanese wrapping on WebKit:** `auto-phrase` does nothing on iPhone. Add `overflow-wrap: anywhere; line-break: strict;` as the base. For long katakana labels (workout types, 「ワークアウトを追加」), put `<wbr>` at word joints in the i18n strings, or keep them on one line with room to spare. Re-check #13 and the bubble on a real device.
