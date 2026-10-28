# UI/UX Designer Memo: Island Fund

Role: UI/UX Designer · Status: **v0.3**. Simplicity first, Japanese-first, yen only. Aligned with decisions 0002 (scoring), 0004 (check-in/privacy), 0006 (yen + accountability) and the motivational coach's round-3 notes.
Artifacts: `docs/design/mockup.html` (5 screens + an English rendering of Island; safe-area toggle), `docs/design/mockup-preview.png`, `docs/design/style-guide.md` (tokens + simplicity budget).

---

## 1. Design principles (in priority order)

1. **Super simple.** At most 3 tabs, ~20 words per screen, one primary action, big numbers. Explanations live in onboarding and the "?" sheet, never on the screen. This beats every other principle when they conflict.
2. **Glanceable in 2 seconds.** Open the app and see two trees ripening (one ring per fruit), two big scores (`43/85`, `57/85`) and the combined jar total.
3. **Zero friction.** Health data arrives automatically. The only manual act is 今夜のチェック (3 switches, ≤ 10 s).
4. **Together, with gentle accountability.** One shared jar with a team layer. Personal progress is drawn against your *own* maximum, never side by side as a race. Sunday promises get ✓ or ○, never ✗.
5. **One real currency: yen.** Fruit is a score, never money. There are two pots of real yen: 旅の壺 Trip Jar and ごほうび財布 Treat Purse. Yen appears on the Jar screen and on Sunday; daily feedback is fruit only.
6. **Cozy, never naggy.** No red, no "failed". Missed goals are unripe rings, not empty failures.
7. **Original, not a copy.** We evoke island-life games but use no Nintendo names, assets, fonts or sounds (§13).

## 2. Simplicity budget (binding)

| Rule | Limit | How v0.3 meets it |
|---|---|---|
| Tabs | ≤ 3 | 島 · 旅の壺 · ふたり. Shop is a sheet inside Jar; Museum is a later extra inside ふたり |
| Words per screen (excl. numbers) | ≤ 20–25 EN / ~40 JA characters | Island ≈ 12 words, Jar ≈ 10, Sunday ≈ 20, check-in ≈ 10, purse sheet ≈ 10 |
| Primary actions | 1 per screen, in the thumb zone | 今夜のチェック · 使う · 壺に入れる |
| Hero number | 1 per screen, ≥ 2.5rem | jar ¥ total, score `43/85`, ceremony total |
| Labels | on tap only, for icons | fruit rings show "筋トレ 1/2日" as a tooltip |
| Explanations | "?" sheet or onboarding | every screen has a "?" in the top-right |
| Settlement | ≤ 4 big rows + purse + promises | yes |
| Check-in | 3 switches + 2 chips | yes |
| Cut from the MVP | streaks, critters, monthly quests, cosmetic shop, island upgrades UI, Museum tab | per coach round 3 |

**Review gate:** every new screen or feature is checked against this table before it's built. If it fails, it moves to "?", moves to ふたり, or is cut.

## 3. Mobile-first platform stance (iPhone)

- Primary target: **iPhone portrait, 375 to 430pt wide**, in mobile Safari and as an **installed standalone PWA**. Designed at 390×844.
- **Safe areas**: `viewport-fit=cover` plus `env(safe-area-inset-*)`. The island sky deliberately bleeds behind the status bar and Dynamic Island. No text or controls go in the top inset or in the 34pt home-indicator zone. Full rules and code are in style guide §5.
- **Thumb-first layout**: the top half is glanceable and read-only (island scene, totals). Primary actions (今夜のチェック, 使う, 壺に入れる) sit in the bottom third. A floating **bottom tab bar** sits just above the home indicator. Confirmations use bottom sheets, not centered modals.
- **Touch**: minimum 44×44pt targets (primary tiles are 56 to 66pt tall), at least 8pt spacing, nothing that depends on hover, long-press only for optional extras, `touch-action: manipulation`.
- **PWA limits we design around**: no WidgetKit widgets, no Watch complications, no reliable haptics (iOS Safari has no Vibration API), and web push only after Add to Home Screen (iOS 16.4+). The design degrades gracefully: sound and animation carry the feedback, and the 20:00 check-in and Sunday 19:30 reminders work via web push once the app is installed.
- If the team goes **native (SwiftUI) or adds a native companion**, the same tokens carry over, and we gain haptics, widgets, Live Activities, and Watch (see §9).

## 4. Language: Japanese-first, English switchable

- The UI is Japanese by default (`lang="ja"`). ふたり → 言語 / Language switches every label to English. Numbers, layout and icons stay identical (mockup screen "1-EN").
- Font: **M PLUS Rounded 1c** (OFL 1.1, full Japanese coverage) for kana and kanji, with `letter-spacing: 0` on all Japanese text. It sets small kana tighter than Zen Maru Gothic, which looked over-spaced. **Fredoka** stays for digits and ¥ amounts.
- Formats: `¥186,500`, 24 h JST (`20:00`, `19:30`), `10月28日 水曜日`, `第21週`, metric units.
- Glossary (JA → EN):

| JA | EN | Where |
|---|---|---|
| 島 | Island | tab |
| 旅の壺 | Trip Jar | tab, Sunday |
| ふたり | Us | tab (partner view, settings, language, Museum later) |
| ごほうび財布 | Treat Purse | Jar, Sunday, sheet |
| 今夜のチェック / 今夜 | Check in / Tonight | Home button, sheet title |
| 日曜の収穫 | Sunday harvest | ceremony |
| 来週の約束 | Next week's promise | ceremony |
| 応援してる | I've got you | partner's tap on a promise |
| のんびりデー | Cozy Day | check-in chip |
| チーム | Team | jar layer, ceremony |
| 暫定 | Provisional | ceremony total |
| 昼ごはん / おやつ (果物・ナッツ・ヨーグルト) / 野菜 2食 | Lunch / Snack swap / Veggies at 2 meals | もち's habits (personal per partner) |
| ごちそう | Treat (neutral) | check-in chip |
| 筋トレ・活動・歩数・睡眠・食事 | Strength · Active · Steps · Sleep · Eats | fruit tooltips |

- Example of one element in both languages (the Jar's purse row): **JA** 「ごほうび財布 ¥7,000 ［使う］」 / **EN** "Treat Purse ¥7,000 [Spend]".

## 5. Visual language (summary; tokens in the style guide)

A sun-warmed island scrapbook: cream paper cards, chunky rounded buttons with a 4px lip, leaf greens, sea blues, sand, soft coral, and brown ink instead of black. The night palette applies from 19:00 to 06:00 JST (the check-in and Sunday screens are night by default). There's one speech bubble per screen at most (Juniper, ≤ ~8 words / ~16 characters). Five fruit colors map 1:1 to the scoring categories: peach = active minutes, coconut = strength days, apple = step days, moon-plum = sleep & rest, pear = eating habits.

Icons: 24pt grid, 2.2pt rounded strokes, inline SVG symbols. Tabs: palm (島), jar (旅の壺), two hearts (ふたり).

## 6. Characters

- **もち Mochi**: sleepy cream cat (Partner B, F 26, works with a personal trainer). **まめ Bean**: cheerful pup (Partner A, M 29, Anytime Fitness). Both are placeholders; species, colors and names are chosen at onboarding.
- **ジュニパー Juniper**: an original capybara harbor-keeper with a yuzu on her head. She speaks at most one short line per screen, warm and specific, never guilt-tripping.

## 7. Information architecture

```
Tabs (3):  島 Island  |  旅の壺 Trip Jar          |  ふたり Us
           two trees  |  jar + layers + purse     |  partner view, promises history, goals,
           + jar ¥    |  └ ごほうび財布 sheet (shop) |  のんびりデー / pause, 言語, notifications,
           + 1 line   |                           |  Health sync status, (Museum later)
           + button   |                           |
Sheets:    今夜のチェック (20:00 push / Home button / widget)   ·   "?" help (every screen)
Full-screen: 日曜の収穫 (Sunday 19:30 JST)   ·   Onboarding (once)
```

## 8. Screens (mockup v0.3)

**1 · 島 Island.** Two trees, the jar, one Juniper line, one button. Each tree carries its five fruits as **rings that ripen** toward that week's target (tap = label). A big `43/85` / `57/85` sits under each tree. The jar sign shows **only the combined total** (¥186,500). Header: 第21週 + "?". Monday brings fresh (unripe) rings.

**2 · 旅の壺 Trip Jar.** Destination (沖縄) + "?". A big jar drawn in three strata (Mochi, Bean, Team), one hero number `¥186,500` and `目標 ¥520,000`. Three mini-jars (Mochi ¥76,000 · Bean ¥72,500 · Team ¥38,000), each filled against **its own maximum** (¥208,000 / ¥208,000 / ¥104,000 per year), so they never read as a leaderboard. A quiet `今週 ≈ ¥6,800`. Treat Purse card `¥7,000` with one button, 使う.

**3 · 日曜の収穫 Sunday harvest (19:30 JST, night).** Four big rows:
- Mochi `88/85` ✓ ¥4,000
- Bean `74/85` ¥3,482 (= floor(4,000 × 74/85))
- チーム ¥1,741 (= floor(2,000 × 0.87); the copy never says whose score set it)
- 旅の壺 total ¥9,223 with a 暫定 pill

Then ごほうび財布 +¥2,000 (¥1,000 per person at ≥ 60). Then 来週の約束: last week's ✓/○ marks and next week's when/where/what (もち: 「水曜 PT＋土曜ヨガ」, まめ: 「エニタイム 火・木・土 7時」), with the partner's 応援してる pill. Promises carry no money and no streak; a kept promise gives a small fruit bonus inside the 100 cap (0006). One button: 壺に入れる！ Late data can only add; Wednesday top-ups show as a small "+¥" on Island.

**4 · 今夜のチェック Evening check-in (20:00 JST).** Title 今夜 and a day chip (火 has a coral dot = open for the 48 h backfill). Three big switches showing **that person's own habits** (もち / Partner B: 昼ごはん · おやつ 果物・ナッツ・ヨーグルト · 野菜 2食). The shared 野菜 2食 has the partner's face to co-log. まめ sees his own three (e.g. 定食スタイル · 減塩デー · 野菜 2食). Two chips: ごちそう (neutral treat, costs nothing) and のんびりデー (prorates the week; 4/month). Saves on tap; the toast is just a pear icon and "+2" with an undo button. The partner only ever sees the pear count.

**5 · ごほうび財布 Treat Purse sheet (from Jar).** Header `¥7,000`. A 3×2 grid priced in yen: カフェデート ¥1,500, 温泉 ¥5,000, 焼肉 ¥8,000 (greyed: not enough yet), 映画 ¥3,600, マッサージ ¥6,000, 観葉植物 ¥1,200. 4 of 6 are non-food. A heart badge means both partners agree. Slide to confirm.

**ふたり Us** (not mocked): partner view (fruit rings only; raw numbers opt-in, eating answers never shown), promise history, goals, のんびりデー / pause, 言語, notification times, Health sync status, gentle "invite them to something" suggestion when a partner has been under 60 for 2 weeks (shown only to the *other* partner).

**"?" sheet**: one paragraph per screen plus a "how the yen is calculated" table. This is where all explanations live.

## 9. Data → visual mapping

| Data (weekly, vs. own target) | Visual | Weight |
|---|---|---|
| Active minutes | peach ring | 30 |
| Strength days | coconut ring | 20 |
| Step days | apple ring | 10 |
| Sleep nights + rest day | moon-plum ring | 15 |
| Eating habit ticks | pear ring | 25 |
| Week total | big `NN/85` under the tree; ≥ 85 = full share (✓) | 100 max |
| Weekly ¥10,000 | personal ¥4,000 × min(s/85, 1) each + team ¥2,000 × lower ratio → 旅の壺 strata | |
| Score ≥ 60 | +¥1,000 to ごほうび財布 per person | |
| Promise kept / not | ✓ / ○ (never ✗) | ≤ 5 fruit bonus |
| のんびりデー / pause | a villager in a blanket; rings prorate | |

## 10. Widgets and Watch (native companion, later)

Small widget: jar + `¥186,500` + `43 · 57`. Lock Screen: a circular weekly ring (43) + the jar total. Watch: a weekly ring around your villager, `43/85`. Tapping opens 島 or 今夜のチェック. No other text.

## 11. Sound and haptics

- **Sound** (off by default if the phone is silenced; separate toggle): short, soft, original sounds we create or license as CC0. Examples: wooden "tok" on button press, marimba "plip" when fruit grows, coin chimes in the tally (rising pitch per row), page-flip for sheets, gentle ocean ambience on Home (opt-in). Character speech is either silent typing or a quiet "babble" made from pitched-down syllables we generate ourselves; never a sampled game voice.
- **Haptics (native only)**: light impact on tile press, success notification on save, a rhythmic "soft-soft-rigid" pattern as coins drop, and a selection tick when scrubbing the voyage map. The PWA has no haptics on iOS, so every haptic has a visual and audio twin.

## 12. Accessibility

- **Contrast**: all text pairs meet WCAG AA (verified ratios in the style guide). Buttons use light fills with brown ink text; we never put white text on mid-green or coral.
- **Not color alone**: each fruit has a distinct shape and label; progress shows numbers too.
- **Dynamic Type / text zoom**: rem-based scale. Layouts reflow at 200% (cards stack to one column; the island scene shrinks before text does). Money uses `clamp()` to shrink rather than truncate.
- **Reduce Motion** (follows the iOS setting plus an in-app toggle): no bounce, sway, parallax, confetti, or typewriter. The settlement becomes simple fades, and the boat jumps instead of sailing.
- **VoiceOver**: the island scene has a single summary label (JA: 「もちの木 43／85、まめの木 57／85、旅の壺 18万6500円」; EN: "Mochi's tree 43 of 85, Bean's 57 of 85, trip jar 186,500 yen"). Each fruit ring is a button whose label is its tooltip. Habit switches use `role=switch`. The tally uses `aria-live="polite"`. Character bubbles are read as "Juniper says: …".
- **Touch**: 44pt minimum targets. No gesture-only actions (swipe-to-dismiss always has an ✕ button; slide-to-redeem has a hold-button alternative).
- **Cognitive**: one primary action per screen, plain-language copy, no time pressure (the ceremony waits for them).

## 13. Originality and IP guardrails

- No Nintendo characters, likenesses, names (no "Nook," "Bells," "Resident Services," "Isabelle," etc.), sounds, fonts (the AC fonts are proprietary), logos, UI layouts traced from screenshots, or the leaf-in-speech-bubble logo.
- The only currency is real yen; fruit is just a score. The NPC is a capybara (not a raccoon, dog secretary, pelican, owl, or otter). Illustrations are drawn from scratch as simple SVG.
- Fonts are OFL. Sounds are self-made or CC0. If we commission art, we get a written assignment.

## 14. Open questions for the user

1. **Names and villagers**: keep もち (cat) and まめ (dog), or choose your own?
2. **Season 1 habits**: the personal sets are now in `nutritionist-personalized.md`. Are the short labels (昼ごはん, おやつ, 野菜 2食) clear?
3. **Destination art**: 沖縄 as the placeholder. Do you have a real destination for the jar header and the year-end screen?
4. **Japanese wording**: are 旅の壺 / ごほうび財布 / のんびりデー / 応援してる natural to you, or do you prefer other words?
5. **Native appetite**: are widgets and the Watch worth the $99/yr developer account later?
