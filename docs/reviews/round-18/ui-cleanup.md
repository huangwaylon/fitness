# Round 18: UI cleanup (ADR 0021 rings, ADR 0022 wallet, round 17 IA, round 16 UX)

**Owner:** the UI engineer. **Scope:** `components/**`, `routes/**`, `i18n/**`, `styles/**`, `e2e/**`, `static/art`.
The engine side is in [rings-contract.md](rings-contract.md). Decisions applied: ADR 0021 (five automatic fruits, no
check-ins), the lead's "no daily questions", "no code for past designs", ADR 0022 (one wallet) and its "one list" follow-up,
and the user's island layout and navigation requests.

**Method:** `npm run build` + `vite preview` on 127.0.0.1:4193, Playwright with the installed Chrome (`channel: 'chrome'`),
iPhone touch emulation, `ja-JP`, `Asia/Tokyo`, `?demo` / `?demo=harvest`, `?date=2026-10-30T12:10` (day) and `T21:10`
(night). Every changed screen was shot at 320×568, 390×844 and 430×932, day and night, ja and en (the island and the
partner card also at 375×667 and 393×852) and looked at. Shots: `/tmp/r18-ui/shots/<w>-<day|night>-<ja|en>-<screen>.png`
(not committed). Measurements: `/tmp/r18-ui/measure.mjs` (copied into `app/` only to run).

## Before → after, per screen

| Screen | Before | After |
|---|---|---|
| **島 Island** | Ribbon under a top-right NookPhone; a full-width 今夜のチェック CTA (+ 「あと2つ」); しずえ's 「…は筋トレでしたか？」 with はい/いいえ; four fruit kinds under each tree; plate 「64,520 ベル ▶」 | Ribbon centred under the safe area (sync chip centred under it, only when offline); **the NookPhone at the bottom centre** as the one control (56px phone on an 84px cream disc, 「しまフォン」 plate); no CTA, no questions; **five** ring fruits (🍑 🍐 🍒 🍎 🥥) leaning away from the jar; faded fruit = a flat silhouette (not grey pebbles); plate = the number only (the jar says what it counts). しずえ only with news, floating above the phone |
| **Tree popup** | Four rows (活動/筋トレ/歩数/食事), 「0 ベル」 repeated, no owner, no week | A nameplate (whose tree), a faint head row (きょう · ベル · 今週), five rows: art · エクササイズ/ムーブ/スタンド/歩数/ジム · today/goal (green when met) · today's ベル or 「—」 · the week's badge pips (✓ once met). The one home of per-fruit detail |
| **Partner sheet** | Stats panel: today's ベル, four rings + caption, habit list (✓ even when undone), yuzu ハイタッチ | A villager card: their name in the title bar, face, one line they say from their rings (「ジムに 行ってきたよ！」…), 「15:24 に とどいた」, leaf ハイタッチ. No numbers |
| **今夜のチェック** | The check-in sheet, ぜんぶできた！, 保存 | Removed (with the habit sprites, i18n and the day-detail chips) |
| **ごほうび** (was ふたりの壺) | Hero today/week, two pot cards with today/week lines, trip bars, 行けます！ + 行く！, a recent-moves card, loud へんしゅう | One balance (the plate's number) under the jar, **one list** of five big tiles with NH item art (Cookies, Coffee Cup, Pizza Margherita, Present, Nook Miles Ticket; an added item shows the bag of bells), あと N ベル when short, a quiet 「メニューを かえる」. History lives in きろく ベル |
| **Buy confirm** | One 買う！, exit only by the grabber/scrim | ✕ in the title bar and **やめる** beside 買う！ (round 16 #7) |
| **Menu editor** | Per pot, 保存 enabled even with no change | One list, no section picker; 保存 only after a real change |
| **日曜の収穫** | Four badges, 「今週ぜんぶで」, the bonus twice, two pot cards | 「バッジ」 label once, **five** badges per person, the ふたりボーナス line, one big bonus; end card: coins into the jar, a fading +N, the wallet counting up; ✕ = あとで |
| **きろく からだ** | Weight card, week cards with ベル + ★/●/○ stamps | Weight card, **目標** card (ムーブ (1日) kcal ✎ and 体重 ✎: one place for both goals), week cards with the five badges (this week: days met under each, from `ringWeek`) |
| **Week detail** | ベル twice (people card + 内訳), 4-column table (steps · min · ★ · meal dots), 「あと4日」 | One ベル total in the header (🔒 when locked), badges with progress, ふたりボーナス when > 0, a table with a line per person and the five metric columns (fruit art + unit heads, met = bold green, ✎ on fixed values) |
| **Day detail** | Four-fruit ベル chips, 歩数 / 運動 rows, habit chips | 「この日のベル」 total, then one row per fruit: value (green when met; Move as 420/600 kcal) and its ベル; ✎ on エクササイズ and 歩数 (a workout added by hand still counts toward 🍑); workouts and gym arrivals |
| **きろく ベル** | Two pot balances, per-day per-fruit chips | 「これまでに ためた ベル」, per week its total (the home of the week's ベル), one line per day (each person's ベル and the pair's; tap → the day), the bonus, spends with とりけす |
| **あそびかた** | Activity/strength/steps/meals, two pots, island tips | For a 10-year-old: no taps needed; the five fruits with goal and pay; badges (週5/5/5/4/3日) and the together bonus; the wallet; setup in one line (Watch · Shortcut · gym automation) |
| **しまフォン** | ‹ and ✕ hand-placed per screen; 言語 / 同期 tiles | The shared title bar (‹ one level up, ✕ closes from any level); ことば / つうしん |

## Navigation (user request): one model

Written up in [design.md §N](../../design/design.md). ✕ always top-right and closes the whole sheet from any level; ‹
always top-left, one level up, only when there is a level to go back to; titles centred; full pages use the ‹ 島へ pill.
**No grabber** anywhere. `ui/NavBar.svelte` + `ui/NavButton.svelte` (round cream 44px, round-13 object tier,
`data-sfx="back"`) are used by Sheet, the phone (and so every きろく level), the wallet page and the harvest. One motion:
sheets rise in 240 ms ease-out (no overshoot), pushed levels slide in from the right in 240 ms; none under reduced motion.
Guarded by `ui/nav.test.ts` (every modal has the shared close, phone sheets have ‹ + ✕, no grabber, no ad-hoc back/close)
and the e2e navigation walk (every sheet and app: visible ≥ 44px ✕/‹ in place, and it works).

## Island layout (user request): measurements

Chrome at device scale 2, `?demo`, day. Δx = element centre − viewport centre (px). "cold" = the standalone cold-launch
height forced through `--doc-height` (ui-state/viewport.ts). Chrome has no safe areas: on a real iPhone `--safe-top` and
`--pad-bottom` add the notch / Dynamic Island and the home indicator (34px) on top of these gaps.

| Size | ribbon Δx | stage Δx | jar Δx | phone Δx | phone box | phone → bottom px | villager → phone px | targets < 44px |
|---|---|---|---|---|---|---|---|---|
| 320×568 | 0.0 | 0.0 | 0.0 | 0.0 | 84×84 | 16 | 33 | none |
| 320×568 cold | 0.0 | 0.0 | 0.0 | 0.0 | 84×84 | 16 | 33 | none |
| 375×667 | 0.0 | 0.0 | 0.0 | 0.0 | 84×84 | 16 | 38 | none |
| 375×667 cold | 0.0 | 0.0 | 0.0 | 0.0 | 84×84 | 16 | 38 | none |
| 390×844 | 0.0 | 0.0 | 0.0 | 0.0 | 84×84 | 20 | 45 | none |
| 390×844 cold | 0.0 | 0.0 | 0.0 | 0.0 | 84×84 | 20 | 45 | none |
| 393×852 | 0.0 | 0.0 | 0.0 | 0.0 | 84×84 | 20 | 45 | none |
| 393×852 cold | 0.0 | 0.0 | 0.0 | 0.0 | 84×84 | 20 | 45 | none |
| 430×932 | 0.0 | 0.0 | 0.0 | 0.0 | 84×84 | 20 | 49 | none |
| 430×932 cold | 0.0 | 0.0 | 0.0 | 0.0 | 84×84 | 20 | 49 | none |

- **Vertical rhythm:** sky with the ribbon (safe + 16) → horizon → island (hedge, trees + fruit, jar + plate, villagers) →
  the front beach (しずえ's box floats here when she has news) → the phone (84px) → `--pad-bottom` + 12px → the home
  indicator. The band is a constant height, so nothing moves when しずえ speaks.
- **No overlaps:** the tree popup is kept under the measured bottom of the HUD (`.ribbon-wrap`, whatever the safe area)
  and 8px inside the scene; the phone sits ≥ 33px under the villagers at 320 and ≥ 45px at 390+.
- **Why one control, not a bottom row:** the wallet's doorway is the jar and the ledger's is the ribbon (round 17 IA
  §3.1), so さいふ / きろく buttons beside the phone would repeat a doorway. One obvious primary.
- **Focus / VoiceOver order:** the sr-only heading, the ribbon, the phone, then the scene (trees, jar, villagers).

## Round 16 findings

| # | Finding | Status |
|---|---|---|
| 1, 2, 14 | Check-in sheet tiers, evening question, hint contrast | Gone with the check-ins |
| 3 | 「…は筋トレでしたか？」 had no date | Gone: no daily questions |
| 4 | Green text on `--c-leaf-lip` | `--c-leaf-text` #256E33 (light fills) and `--leaf-text` (#9EE6A6 at night) everywhere green text was |
| 5, 13 (partner) | Partner ✓ on undone habits; ring labels wrapping | Gone: the partner card has no list or rings |
| 6 | Terminology drift | One word per concept (below) |
| 7 | Buy confirm had no visible exit | ✕ + やめる |
| 8 | Banner clipping, ベル orphaned | 「{name}さんに ハイタッチ！」; `bells.amount` uses a no-break space |
| 9 | デザート art, stale demo menu | NH item art for the five defaults (the demo menu is the engine's) |
| 10 | Island focus order, no heading | Heading → ribbon → phone → scene; sr-only h1 |
| 11 | Plate showing through the harvest | `.covered .jar-plate` hidden |
| 12 | Unexplained ★/●/○ stamps | Stamps removed; badges are the fruit art (lit / n of goal) |
| 13 (tree, harvest) | 320 popup touching; 「ぶ/ん！」 | Popup column gap 10px at narrow; duo line rewritten |
| 15 | Popups don't say whose | Yuzu nameplate |
| 16 | Night: unearned badges vanish | `opacity .6` at night |
| 17 | Copy (「食事の洋なし」, 足りませんでした, 名前) | grew line gone; 「ベルが ちょっと たりないみたい…」; 「よびな」 |
| 18 | Ribbon counts before the coins land | Not changed (the wallet plate counts with the coins; the ribbon is today's total) |
| 19 | Faded fruit read as pebbles | Flat silhouette at 20% |
| 21 | High-five banner showed しずえ | The partner's villager |

## Words (round 17 §5.1, kid-friendly)

Rings: エクササイズ / ムーブ / スタンド / 歩数 / ジム (Exercise / Move / Stand / Steps / Gym). つぼ (the island jar),
おさいふ / ふたりのベル (the wallet), ごほうび (the screen and its treats), なおす (fix), とりけす (undo),
しめきり (locked), つうしん (updates), ことば (language), よびな (your name), バッジ, ふたりボーナス (Together bonus),
「15:24 に とどいた」 (Updated 15:24).

## Removed (no code for past designs)

`CheckinSheet`, `FruitRing`, `pots/*` (PotCard, TripList, recent.ts), `Rope`, the habit sprites (bowl, veg, tray), the
pot / trip / food sprites (yakiniku, cafe, onsen, snack, hike, parfait, gift, bag, ice, plane, chev), `money/miles-ticket`
(as a pot icon; it is back as the 旅のごほうび item art), the stamps in `Glyph`, `.icon-btn`, the grabber, and the i18n
keys for check-ins, habits, pending questions, the pots, the old fruit names/details, 内訳, the column heads and
へんしゅう. `usage.test.ts` and `knip` stay green.

## Tests

- `e2e/demo.spec.ts`: the five-fruit tree popup (labels, goals, pips 5·5·5·4·3, 10 ground fruit kinds), the partner card,
  the Move goal (numeric ≥ 16px, 100–2,000 kcal, the popup reads the new goal), the harvest's five badges + together
  bonus, the wallet's one list, buy with やめる / とりけす, the menu editor, the navigation walk. Check-in tests removed.
- `e2e/sound.spec.ts`: the tap walk without the check-in, with the Move goal field, やめる and the ✕ buttons.
- `ui/nav.test.ts` (new), `kiroku/fmt.test.ts` (Move goal input, badge thresholds), `sound/taps.test.ts` updated.
