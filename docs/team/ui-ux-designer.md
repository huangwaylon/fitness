# UI/UX Designer Memo: Island Fund

Role: UI/UX Designer · Status: v0.1 for team review
Artifacts: `docs/design/mockup.html` (open in a browser; there's a "show safe areas + thumb zone" toggle), `docs/design/style-guide.md` (CSS tokens).

---

## 1. Design principles

1. **Cozy, never naggy.** The app is a little island you *visit*. It shouldn't feel like a dashboard that grades you. No red numbers, no "you failed." Missed goals show as empty dashed fruit slots, a gentle "not yet."
2. **Glanceable in 2 seconds.** Open the app and you instantly see: did we each grow our fruit today, and how full is the jar. Everything else is one tap deeper.
3. **Zero friction.** Health data arrives automatically. The only manual act, the meal check-in, takes one tap and under 10 seconds, with no Save button. Anything that needs typing is optional.
4. **Together, not versus.** Two villagers side by side, shared jar, a team bonus. Partner visibility is warm ("Bean is 2,900 steps from a perfect day! Evening stroll?") and never a leaderboard.
5. **Real money, plainly shown.** Cute metaphors wrap the experience, but dollar amounts are always shown in real `$` next to the fruit or shells. No fake in-game currency that hides the stakes.
6. **Honesty is rewarded.** Logging a treat meal still counts as a successful check-in (a streak saver), so neither partner is tempted to fudge it.
7. **Rhythm like real life.** The palette follows the local clock (day/night), there's a Sunday-evening ritual, and seasons change across the 1-year journey.
8. **Original, not a copy.** We evoke the mood of island-life games (soft rounded shapes, speech bubbles, fruit trees, wooden signs, a gentle animal helper) but use no Nintendo assets, names, characters, fonts, sounds, or currency names. See §11.

## 2. Mobile-first platform stance (iPhone)

- Primary target: **iPhone portrait, 375 to 430pt wide**, in mobile Safari and as an **installed standalone PWA**. Designed at 390×844.
- **Safe areas**: `viewport-fit=cover` plus `env(safe-area-inset-*)`. The island sky deliberately bleeds behind the status bar and Dynamic Island. No text or controls go in the top inset or in the 34pt home-indicator zone. Full rules and code are in style guide §5.
- **Thumb-first layout**: the top half is glanceable and read-only (island scene, totals). Primary actions (Check in, Redeem, Drop it in the jar) sit in the bottom third. A floating **bottom tab bar** sits just above the home indicator. Confirmations use bottom sheets, not centered modals.
- **Touch**: minimum 44×44pt targets (primary tiles are 56 to 66pt tall), at least 8pt spacing, nothing that depends on hover, long-press only for optional extras, `touch-action: manipulation`.
- **PWA limits we design around**: no WidgetKit widgets, no Watch complications, no reliable haptics (iOS Safari has no Vibration API), and web push only after Add to Home Screen (iOS 16.4+). The design degrades gracefully: sound and animation carry the feedback, and the Sunday reminder works via web push once the app is installed.
- If the team goes **native (SwiftUI) or adds a native companion**, the same tokens carry over, and we gain haptics, widgets, Live Activities, and Watch (see §9).

## 3. Visual language

**Mood**: a sun-warmed island scrapbook. Cream paper cards, chunky toy-like buttons with a 4px "lip" shadow, leaf greens, sea blues, sandy beige, soft coral, and brown ink in place of black.

**Palette (day)** — the full token list and verified contrast ratios are in the style guide:

| | Hex | Role |
|---|---|---|
| Cream | `#FFF8E7` | background |
| Paper | `#FDF1D6` | cards |
| Sand | `#E9D8B4` | beach, chips |
| Leaf | `#7BC67E` | primary buttons, progress |
| Leaf ink | `#2E6B38` | green text |
| Sky | `#8FD3F4` | sky/sea, info |
| Coral | `#FF9B87` | treats, shop |
| Sun | `#FFD66B` | highlights, "new" |
| Gold | `#F2B53A` | money glints |
| Bark | `#8A5A3B` | trunks, signs |
| Ink | `#4A3A2C` | body text (10.3:1 on cream) |

**Night palette** (`#1F2A44` sky, `#33456B` cards, `#F6E7B0` moon, `#E8F59A` fireflies) applies automatically from 19:00 to 06:00 local time, or when iOS dark mode is on (user's choice in Settings: *Follow clock / Follow iOS / Always day*). Dusk (17:30 to 19:00) adds a peach sky gradient on the island only. Weather is optional decoration (a cloud on rainy days), never data.

**Shapes**: everything is rounded (cards 20px, sheets 28px, buttons are pills). Avatars and badges use an organic "pebble" blob radius. Dividers are dashed "stitching." Cards get a faint inline-SVG paper grain.

**Speech-bubble dialogs**: all system messages (tips, celebrations, errors) are delivered by a character in a white bubble with a tilted name tag and a bobbing "more" triangle. Text types in at about 40 chars/s; tap to skip (instant with reduce-motion).

**Motifs**: fruit (one fruit type per goal), leaves, shells, wooden signposts, lanterns at night, paper tickets for treats, a glass jar of coins, a little sailboat.

**Typography** (all Google Fonts, **SIL Open Font License 1.1**, so we can self-host and bundle them in the PWA):
- **Fredoka** (display, numbers, money) — rounded and chunky.
- **Nunito** (body/UI) — rounded terminals, very legible small.
- **Zen Maru Gothic** (optional alternate/CJK) — soft rounded, a gentle Japanese stationery feel.
- Fallback: `ui-rounded` / SF Pro Rounded on Apple devices.

## 4. Iconography

- 24pt grid, **2.2pt rounded strokes** in ink brown, round caps and joins, with at most one flat fill from the palette. Hand-drawn feel, not geometric.
- Every icon is drawn as inline SVG `<symbol>`s (see the mockup library). No icon fonts, no third-party sets with game art.
- Goal fruits double as icons: **apple = steps**, **peach = move/exercise minutes**, **moon-plum = sleep**, **pear = healthy eating**. Each fruit has a distinct silhouette, so color isn't the only signal (color-blind safe), and labels are always shown next to them.
- Tab icons: palm (Island), jar (Fund), bag (Shop), shell (Museum), two hearts (Us).

## 5. Characters

All original designs, drawn with simple geometry so we can build them in SVG and animate them cheaply.

### Villagers (one per partner, customizable)
- **Mochi**, a sleepy cream cat with a plum ear-patch. Default "chill" personality: yawns in the morning, little "z z" when sleep fruit is missing, stretches when steps come in.
- **Bean**, a cheerful tan pup with floppy ears. Default "peppy" personality: wiggles when the move goal hits, tongue-out grin.
- **Customization (onboarding + Settings)**: species (cat, dog, bunny, bear, duck, hamster, frog), fur color (6), accent color (plum, apricot, mint, berry, lemon; this becomes the partner's color across the app), personality (chill / peppy / bookish / sporty, which changes their idle lines), plus cosmetic items unlocked in the Museum (hats, scarves, glasses).
- **Expressions** (5 states): happy, sleepy, proud (perfect day), cozy (rest day), cheering (partner hit a goal).

### Island guide NPC: **Juniper the capybara harbor-keeper**
- A calm capybara with a yuzu balanced on her head. She runs the harbor, keeps the jar, and is building the couple's boat for the trip.
- Why a capybara? Animal Crossing already uses a pelican and an otter as famous NPC archetypes. A capybara is unclaimed, and it reads as "unbothered, cozy, wholesome," which is exactly the coaching tone we want.
- Voice: short, warm, specific, never guilt-trippy. ("Rest days grow strong trees too." / "Two pears today, nice! One more meal to go.")
- Optional supporting cast for later (avoiding species AC already uses for its NPCs, such as hedgehogs and raccoons): a heron chef who runs the Shop, a mole curator for the Museum.

## 6. Information architecture

```
Tab bar (5):  Island | Fund | Shop | Museum | Us
                │       │      │      │        └ Partner view, Settings, Health permissions, Goals
                │       │      │      └ Badges, island decorations, villager outfits
                │       │      └ Redeem treat tickets (dining, desserts), history
                │       └ Voyage map, milestones, deposits history, treat wallet
                └ Home: both villagers + trees, jar, Juniper tip, Check-in CTA
Global:  Check-in sheet (from Home CTA / notification / widget / Watch)
         Weekly Settlement (full-screen ceremony, Sunday evening)
         Onboarding (Health permissions, pick villager, set trip + goals)
```

## 7. Key screens

### 7.1 Island (Home), mockup screen 1
- **Top (read-only)**: island scene. Two trees (Mochi left, Bean right), each with 4 fruit slots. Earned fruit is drawn filled; unearned slots are dashed outlines. Villagers stand by their trees. The jar sits in the middle with a sparkle glint. Pills show date/weather and the jar total.
- **Juniper bubble**: one contextual, achievable nudge, generated from data (closest unfinished goal, partner encouragement, rest-day reassurance). Tap the bubble to cycle tips; long-press to mute tips for the day.
- **Today's fruit cards**: per partner, 4 goal rows with value and fruit. In-progress goals show a thin rope bar. A "+$3" chip shows today's earnings. "Refreshed 2 min ago · Health" builds trust in auto-sync. Pull to refresh.
- **Primary CTA** (thumb zone): "Check in a meal." It changes to "Collect today's fruit" when there's unclaimed fruit (optional ritual tap; otherwise collected automatically at midnight).
- **Microinteractions**: a fruit *grows* (scale 0→1 with bounce plus a leaf sparkle) the first time you open the app after a goal completes. Tap a fruit for a tooltip-bubble showing the metric. Tap your partner's villager for a "wave" (it sends them a tiny cheer notification, max 3/day). Villagers breathe and the trees sway slowly when idle.

### 7.2 Vacation Fund, mockup screen 2
- **Voyage map**: a dotted route from home island to the destination island (name and illustration set in onboarding). The boat with both villagers sits at `saved / goal` along the path. Buoy flags mark milestones: green = passed, yellow glowing = next, white = future.
- **Hero total**: real dollars, "of $3,000," weekly average, and pace status ("on pace ✓" or a gentle "2 weeks behind, a strong week catches up").
- **Milestones list**: each one is tied to a real trip action (book flights, hotel deposit, excursion), so progress turns into concrete plans. Reaching one triggers a mini celebration and a "Did you book it?" checkbox.
- **Treat wallet**: coral paper tickets (Dinner out ×2, Dessert ×1). Tap one to go to the Shop/redeem flow. Treats are funded separately and never subtract from the trip jar (to be confirmed with PM).
- Secondary: deposits history (weekly bars), and a manual adjustment entry (e.g., a birthday bonus) behind a "…" menu.

### 7.3 Weekly Settlement ceremony, mockup screen 3
- **When**: Sunday 19:30 local (configurable). A web-push/local notification says: "Juniper has lit the lanterns. Time to count your fruit!" The app opens to the ceremony until it's completed. Always uses the night palette.
- **Flow (about 30 to 45 seconds, skippable at every step)**:
  1. Juniper greets them (speech bubble).
  2. Tally rows animate in one by one: Mochi (fruit dots per day, perfect days, $), Bean, then the Team bonus. Each row gets a soft coin chime; the numbers count up.
  3. The total glows: "Into the jar: $59.00."
  4. **Both partners tap "Drop it in the jar!"** (together on one phone or async on two). Coins fall into the jar and the boat sails forward on a mini map.
  5. Reveal the weekly island upgrade (bridge, flower bed, lanterns, dock) or a Museum badge.
- **Missed-week handling**: still a ceremony, with a kind framing ("A quiet week. The tide comes back in."). It shows the best thing that happened and never shows $0 in red.
- **Transparency**: a "How was this counted?" link shows the per-day breakdown from Health data and lets them fix gaps (e.g., Watch was charging).

### 7.4 Daily Check-in (≤ 10 seconds), mockup screen 4
- **Entry points**: Home CTA, a meal-time notification (action buttons directly on the notification if feasible), widget button (native), Watch tap (native).
- **Bottom sheet**: avatar + "Lunch check-in." The meal is pre-selected from the time of day (editable chips). **Three big tiles: Healthy plate / Pretty balanced / Treat meal.** Tapping a tile saves immediately. The sheet auto-dismisses after 1.2 s, the fruit pops onto the tree, and a toast confirms with a 10-second undo.
- **Optional bonus chips** (home-cooked, no soda, + fruit): toggle them before or within 3 s after the tap. They never block saving.
- Measured target: 1 tap, about 3 seconds median, under 10 seconds worst case.

### 7.5 Shop (redeem rewards)
- A wooden market stall run by a heron chef (later). Items are paper tickets: Dinner out (earned per N perfect days), Treat dessert, Breakfast in bed, Movie night pick. Each shows its price in fruit or tickets and its real $ value if any.
- **Redeem** opens a bottom sheet: "Use 1 Dinner-out ticket?" Slide-to-redeem (prevents accidental taps), then a celebratory stamp animation. The partner gets a notification ("Mochi redeemed Dinner out, date night!").
- History tab: past treats with optional photo plus a one-line memory. It doubles as a couple's scrapbook.

### 7.6 Museum (collection)
- Shelves of badges as display items: shells (streaks), fossils (lifetime totals like "1,000,000 steps"), bugs and fish (seasonal challenges), plus decorations and outfits unlocked for the island. Unknown items appear as silhouettes with hints.
- Tap an item for a curator speech bubble with the story of when and how it was earned. A coral dot on the tab marks new items.

### 7.7 Us (partner view + settings)
- **Partner view**: both villagers facing each other, this week's fruit grid (7 days × 4 goals) side by side, shared streaks, "send a cheer" (preset cute stickers, no free-text chat needed). Privacy: each partner can hide individual metrics (e.g., sleep detail shows only fruit / no fruit).
- **Settings**: villager customization; goals per person (steps, move minutes, sleep hours, meals/day) with "suggested from your last 30 days"; reward rules (view-only, or editable with a two-partner approval flow); trip details; notification times; theme (follow clock / follow iOS / day); sound and haptics; reduce motion (also follows iOS); text size preview; Health connection status and re-sync; data export.

## 8. Progress metaphors and data mapping

| Real data | Metaphor | Detail |
|---|---|---|
| Daily step goal met | apple on your tree | from Apple Health `stepCount` vs personal goal |
| Exercise minutes goal met | peach | `appleExerciseTime` |
| Sleep goal met (prev. night) | moon-plum | `sleepAnalysis` asleep duration; ripens in the morning |
| Healthy-eating check-ins met | pear | from in-app check-ins (Healthy or Pretty balanced counts as configured) |
| All 4 fruits in a day | **perfect day**: tree sparkles, golden leaf | +bonus $ |
| Both partners hit X days in the week | team bonus, two villagers high-five | |
| Weekly total | coins into the **jar**; the **boat** advances on the map | Sunday ceremony |
| N good weeks | **island upgrade** (bridge, dock, lanterns, garden, café) | the island visibly grows over the year |
| Fund milestones | **buoys** on the voyage; real trip step unlocked | |
| Treat rewards | coral **paper tickets** in the Treat wallet → Shop | |
| Long-term achievements | **Museum** items, villager outfits | |
| Season (calendar) | island decor (autumn leaves, winter snow) | purely aesthetic |
| Workouts logged (any type) | a tiny footprint trail on the beach for that day | flavor; could feed badges |

## 9. Widgets, Lock Screen and Apple Watch (native shell or companion only)

Shown at the bottom of the mockup. None of these are possible in a PWA; they need WidgetKit/WatchKit.
- **Small Home Screen widget**: jar + $ total + "39% to Kauai," and two rows of four fruit icons (one per partner). Tapping it opens Home.
- **Medium widget**: your tree with today's fruit, a Juniper one-liner about your partner, and the fund rope bar. On iOS 17+ it can include an interactive "Check in" button using App Intents (one tap logs "Healthy plate" for the current meal without opening the app).
- **Lock Screen accessories** (monochrome, system-tinted): a *circular* gauge of jar progress with the jar glyph; a *rectangular* "Today's fruit M ●●○● · B ○●●●" with the jar total.
- **Apple Watch**: a *circular complication* as a 4-segment fruit ring around your villager's face (segments use fruit colors, unearned segments are grey). A *rectangular* complication shows the jar total and today's fruit. A tiny Watch app holds the 3 meal-check-in tiles (tap to log, with Watch haptic).
- **Live Activity (optional)**: during the Sunday ceremony window, a Dynamic Island activity: "Lanterns lit · $59 ready to drop."

## 10. Sound and haptics

- **Sound** (off by default if the phone is silenced; separate toggle): short, soft, original sounds we create or license as CC0. Examples: wooden "tok" on button press, marimba "plip" when fruit grows, coin chimes in the tally (rising pitch per row), page-flip for sheets, gentle ocean ambience on Home (opt-in). Character speech is either silent typing or a quiet "babble" made from pitched-down syllables we generate ourselves; never a sampled game voice.
- **Haptics (native only)**: light impact on tile press, success notification on save, a rhythmic "soft-soft-rigid" pattern as coins drop, and a selection tick when scrubbing the voyage map. The PWA has no haptics on iOS, so every haptic has a visual and audio twin.

## 11. Accessibility

- **Contrast**: all text pairs meet WCAG AA (verified ratios in the style guide). Buttons use light fills with brown ink text; we never put white text on mid-green or coral.
- **Not color alone**: each fruit has a distinct shape and label; progress shows numbers too.
- **Dynamic Type / text zoom**: rem-based scale. Layouts reflow at 200% (cards stack to one column; the island scene shrinks before text does). Money uses `clamp()` to shrink rather than truncate.
- **Reduce Motion** (follows the iOS setting plus an in-app toggle): no bounce, sway, parallax, confetti, or typewriter. The settlement becomes simple fades, and the boat jumps instead of sailing.
- **VoiceOver**: the island scene has a single summary label ("Mochi's tree: 3 of 4 fruit, sleep remaining. Bean's tree: 3 of 4, steps remaining. Jar: $1,184.50, 39 percent."). Tiles are buttons with `aria-pressed`. The tally uses `aria-live="polite"`. Character bubbles are read as "Juniper says: …".
- **Touch**: 44pt minimum targets. No gesture-only actions (swipe-to-dismiss always has an ✕ button; slide-to-redeem has a hold-button alternative).
- **Cognitive**: one primary action per screen, plain-language copy, no time pressure (the ceremony waits for them).

## 12. Originality and IP guardrails

- No Nintendo characters, likenesses, names (no "Nook," "Bells," "Resident Services," "Isabelle," etc.), sounds, fonts (the AC fonts are proprietary), logos, UI layouts traced from screenshots, or the leaf-in-speech-bubble logo.
- Our currency is real dollars plus "fruit" and "tickets." The NPC is a capybara (not a raccoon, dog secretary, pelican, owl, or otter). Illustrations are drawn from scratch as simple SVG.
- Fonts are OFL. Sounds are self-made or CC0. If we commission art, we get a written assignment.

## 13. Open questions for the user

1. **Trip and amount**: the real destination (for the map illustration), the target $ amount, and the date? (The mockup assumes $3,000 by Aug 2027.)
2. **Names and villagers**: what species, colors, and names would each of you like? (Mochi the cat and Bean the dog are placeholders.)
3. **Treats vs. trip**: should treat tickets be a separate budget from the vacation jar, or do they come out of it?
4. **Healthy eating definition**: is the 3-tile scale (Healthy / Balanced / Treat) right, or do you prefer specific habits (veggies at every meal, no soda, cook at home)? How many check-ins a day?
5. **Partner visibility**: is it OK for each of you to see the other's sleep hours and step counts, or only fruit / no fruit?
6. **Ceremony timing**: Sunday 7:30 pm, together on one phone or separately?
7. **Native appetite**: are widgets, Watch complications, and haptics worth a native/TestFlight app (it needs an Apple Developer account, $99/yr), or is a PWA enough for v1?
8. **Sound**: would you like ambient island sound on, or keep the app silent by default?
