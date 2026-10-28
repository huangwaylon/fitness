# UI/UX Designer Memo: Island Fund

Role: UI/UX Designer · Status: v0.2, aligned with decisions 0002–0004 (one scoring model, economy, check-in and privacy)
Artifacts: `docs/design/mockup.html` (open in a browser; there's a "show safe areas + thumb zone" toggle), `docs/design/style-guide.md` (CSS tokens).

---

## 1. Design principles

1. **Cozy, never naggy.** The app is a little island you *visit*. It shouldn't feel like a dashboard that grades you. No red numbers, no "you failed." Missed goals show as empty dashed fruit slots, a gentle "not yet."
2. **Glanceable in 2 seconds.** Open the app and you instantly see how full each of our trees is this week (out of 85 for a full share) and how full the jar is. Everything else is one tap deeper.
3. **Zero friction.** Health data arrives automatically. The only manual act is the evening check-in card (3 habit switches, ≤10 s, no Save button). Anything that needs typing is optional.
4. **Together, not versus.** Two villagers side by side, shared jar, a team bonus. Partner visibility is warm ("Bean's coconuts are all in!"), fruit-only by default, and never a leaderboard.
5. **Real money, plainly shown, at the right moment.** Three concepts only: **Fruit** (weekly score), **Jar** (real vacation $), **Treat tickets** (separate treat budget). Daily feedback is fruit only. Dollars appear at the Sunday ceremony and on the Jar screen ("≈ $X so far this week"), always in real `$` and never in a pretend currency.
6. **Honesty is safe.** A neutral "treat today" chip never costs fruit, and individual eating answers are never shown to the partner (only the pear count), so there is no reason to fudge.
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
- The five category fruits double as icons: **peach = active minutes**, **coconut = strength days**, **apple = step days**, **moon-plum = sleep & rest**, **pear = eating habits**. Each fruit has a distinct silhouette, so color isn't the only signal (color-blind safe), and labels are always shown next to them.
- Tab icons: palm (Island), jar (Jar), bag (Shop), shell (Museum), two hearts (Us).

## 5. Characters

All original designs, drawn with simple geometry so we can build them in SVG and animate them cheaply.

### Villagers (one per partner, customizable)
- **Mochi**, a sleepy cream cat with a plum ear-patch. Default "chill" personality: yawns in the morning, little "z z" when sleep fruit is missing, stretches when steps come in.
- **Bean**, a cheerful tan pup with floppy ears. Default "peppy" personality: wiggles when a peach (active minutes) lands, tongue-out grin.
- **Customization (onboarding + Settings)**: species (cat, dog, bunny, bear, duck, hamster, frog), fur color (6), accent color (plum, apricot, mint, berry, lemon; this becomes the partner's color across the app), personality (chill / peppy / bookish / sporty, which changes their idle lines), plus cosmetic items unlocked in the Museum (hats, scarves, glasses).
- **Expressions** (5 states): happy, sleepy, proud (perfect day), cozy (rest day), cheering (partner hit a goal).

### Island guide NPC: **Juniper the capybara harbor-keeper**
- A calm capybara with a yuzu balanced on her head. She runs the harbor, keeps the jar, and is building the couple's boat for the trip.
- Why a capybara? Animal Crossing already uses a pelican and an otter as famous NPC archetypes. A capybara is unclaimed, and it reads as "unbothered, cozy, wholesome," which is exactly the coaching tone we want.
- Voice: short, warm, specific, never guilt-trippy. ("Rest days grow strong trees too." / "Two pears today, nice! One more meal to go.")
- Optional supporting cast for later (avoiding species AC already uses for its NPCs, such as hedgehogs and raccoons): a heron chef who runs the Shop, a mole curator for the Museum.

## 6. Information architecture

```
Tab bar (5):  Island | Jar  | Shop | Museum | Us
                │       │      │      │        └ Partner view, Settings, Health permissions, Goals
                │       │      │      └ Badges, island decorations, villager outfits
                │       │      └ Redeem treat tickets (dining, desserts), history
                │       └ Voyage map, milestones, deposits history, treat wallet
                └ Home: both villagers + trees, jar, Juniper tip, Check-in CTA
Global:  Evening check-in card (8 pm push / Home CTA / widget / Watch), incl. Cozy Day
         Weekly Settlement (full-screen ceremony, Sunday evening)
         Onboarding (Health permissions, pick villager, set trip + goals)
```

## 7. Key screens

### 7.1 Island (Home), mockup screen 1
- **Five fruits, mapped 1:1 to the weekly score (decision 0002):** **peach** = active minutes (30), **coconut** = strength days (20), **apple** = step days (10), **moon-plum** = sleep & rest (15), **pear** = eating habits (25). Each person can earn up to 100 fruit a week; **85 = a full share**. "Move" is no longer a label anywhere.
- **Trees are weekly.** Each tree fills in as the week's fruit is earned (in the drawing, each piece ≈ 10 fruit). Today's new fruit sparkles, Sunday is the harvest, and **Monday brings a fresh tree** (the fresh-start effect). Wooden signs show "Mochi 43", and the header pill says "Wed · week 21 · fresh tree Mon".
- **Juniper bubble**: one contextual, achievable nudge ("Mochi, one strength day finishes yours"). Tap to cycle tips; long-press to mute them for the day.
- **This week's fruit cards**: per partner, a score chip (`43/85`) and 5 rows (fruit, category, `earned/weight`) where the row background fills like a bar. **No "+$" chips and no raw numbers for the partner** (decision 0004). Your own raw numbers are one tap deeper ("How was this counted?"). "Synced 2 min ago" builds trust in auto-sync, and the card shows a gentle stale-sync state after 18 h.
- **Primary CTA** (thumb zone): "Evening check-in · 3 habits".
- **Microinteractions**: fruit *grows* (scale 0→1 with bounce plus a leaf sparkle) the first time you open the app after it's earned. Tap a fruit row for its breakdown. Tap your partner's villager for a "wave" (a cheer, max 3/day). Villagers breathe and the trees sway when idle.

### 7.2 Jar (vacation), mockup screen 2
- **Voyage map**: a dotted route from home island to the destination. The boat sits at `saved / goal`, and buoys mark milestones (green = passed, glowing yellow = next, white = future).
- **Hero total**: real dollars, "of $3,000", and pace status.
- **Quiet week line**: "≈ $31 so far this week · settles Sun 7:30 pm". This is the only in-week dollar hint (decision 0003).
- **Milestones list**: each tied to a real trip action (book flights, hotel deposit, excursion).
- **Treat wallet**: a separate coral card ("2 treat tickets · separate from the trip jar") linking to the Shop. Tickets never come out of the jar.
- Secondary: weekly deposits history and the monthly **Transfer Day** screen ("You earned $X in October. I moved it ✓").

### 7.3 Weekly Settlement ceremony, mockup screen 3
- **When**: Sunday 19:30 local, night palette. The push says "Juniper has lit the lanterns." The app opens to the ceremony until it's completed.
- **Flow (about 30–45 s, skippable)**:
  1. Juniper greets them.
  2. Rows tally in with soft chimes. **Each person**: score out of 100 on a bar with a marker at 85, then their personal share (42.5% of the weekly $57.69 × `min(score/85, 1)`). Extra fruit above 85 is shown as "banked" (it recovers earlier shortfalls only). **Team share** (15%) is paid at the *lower* partner's %.
  3. The total glows: "Into the jar: $53.40".
  4. **"+1 treat ticket"** drops into the wallet if **both scored ≥ 60**.
  5. Both tap "Drop it in the jar!" (together or async). Coins fall and the boat sails forward.
- **Provisional note** (always visible): "Sunday's data may still be syncing. Final on Wednesday, and late data can only add." A Wednesday top-up appears as a small "+$2.10 washed ashore" note on Home.
- **Quiet weeks**: still a ceremony, kindly framed ("A cozy week. The tide comes back in."). Never $0 in red.
- **Transparency**: "How was this counted?" opens the per-category, per-day breakdown.

### 7.4 Evening check-in (≤ 10 s), mockup screen 4
- **One card a day** (decision 0004): opened from the ~8 pm push, the Home CTA, a widget, or the Watch.
- **3 habit switches** for the season (e.g. veggies at 2+ meals, no sugary drinks, home-cooked dinner). Each saves on tap and grows a pear. There is no per-meal grading and no Save button.
- **Day strip** (Mon / Tue / Today) with a coral dot on open days: **48 h backfill**.
- **Co-log**: "Also for Bean ✓" on shared items like home-cooked dinner.
- **"Treat today" chip**: neutral and never costs fruit.
- **Cozy Day chip** (sick, travel, low energy; "3 of 4 left this month"): it lives here because the evening is when you know how the day went. It prorates the week's targets. It's also available from the Us tab.
- **Toast**: "2 pears on Mochi's tree · Saved", with Undo. It shows fruit only, never $. Footer: "Bean sees only your pear count."
- Target: 1 card, ≤4 taps, about 5 s.

### 7.5 Treat Shop, mockup screen 5
- **Wallet header**: "2 tickets · ≈ $11.50 each · separate from the trip jar". A ticket is earned in each week where both partners score ≥ 60 (decision 0003).
- **Shelf**: at least half non-food (movie night, massage, balcony plant, cooking class) alongside food experiences (dinner out, dessert date). Big items carry a "both agree" tag, and redeeming sends the partner a one-tap "Let's do it!"
- **Redeem**: slide-to-confirm, stamp animation, then a scrapbook entry (optional photo plus a one-line memory).

### 7.6 Museum (collection)
- Shelves of badges as display items: shells (streaks), fossils (lifetime totals like "1,000,000 steps"), bugs and fish (seasonal challenges), plus decorations and outfits unlocked for the island. Unknown items appear as silhouettes with hints.
- Tap an item for a curator speech bubble with the story of when and how it was earned. A coral dot on the tab marks new items.

### 7.7 Us (partner view + settings)
- **Partner view**: both villagers facing each other, this week's five-fruit cards side by side (fruit and % only; raw numbers are opt-in per person per metric, enforced server-side; eating answers are never shown), Cozy Day / pause controls,  "send a cheer" (preset cute stickers, no free-text chat needed). Privacy: each partner can hide individual metrics (e.g., sleep detail shows only fruit / no fruit).
- **Settings**: villager customization; goals per person (active minutes, strength days, step goal, sleep target, the 3 season habits) with "suggested from your last 30 days"; reward rules (view-only, or editable with a two-partner approval flow); trip details; notification times; theme (follow clock / follow iOS / day); sound and haptics; reduce motion (also follows iOS); text size preview; Health connection status and re-sync; data export.

## 8. Progress metaphors and data mapping

| Real data (weekly, vs. own target) | Fruit / metaphor | Weight |
|---|---|---|
| Active minutes (`appleExerciseTime`, ≤90 min/day counted) | peach | 30 |
| Strength days (strength/HIIT/yoga workout ≥ 20 min, ≤1/day) | coconut | 20 |
| Step days (goal hit, 5 of 7) | apple | 10 |
| Sleep nights (5 of 7) + ≥1 rest day | moon-plum | 15 (12 + 3) |
| Eating habit ticks (15 of 21) | pear | 25 |
| Week total | tree fullness; **85 = full share**; 85–100 "extra fruit" banked to recover past weeks | 100 max |
| Weekly settlement | coins into the **jar**; the **boat** advances | Sunday ceremony |
| Both partners ≥ 60 | **+1 treat ticket** (separate wallet → Shop) | |
| Workouts together (≥70% overlap) | golden leaf / cosmetic only, no $ | |
| Good weeks over time | **island upgrades** (bridge, dock, lanterns, garden) | |
| Fund milestones | **buoys** on the voyage | |
| Long-term achievements | **Museum** items, villager outfits | |
| Cozy Day / paused week | villager in a blanket; tree shows "cozy" leaves, not empty slots | |

Not paid and shown as personal trends only: Move ring and active calories, weight, HRV, resting HR, VO2 max, sleep stages.

## 9. Widgets, Lock Screen and Apple Watch (native shell or companion only)

Shown at the bottom of the mockup. None of these are possible in a PWA; they need WidgetKit/WatchKit.
- **Small Home Screen widget**: jar + $ total + "39% to Kauai", plus a weekly fruit bar per partner (43, 57).
- **Medium widget**: your weekly tree, "43 fruit · full share at 85", a Juniper one-liner, and an interactive **Check in** button (iOS 17+ App Intent) that opens the evening card.
- **Lock Screen accessories** (monochrome): a *circular* weekly fruit gauge; a *rectangular* "Fruit this week: Mochi 43 · Bean 57 · Jar $1,184 · 39%".
- **Apple Watch**: a *circular complication* with a weekly fruit ring (43/85) around your villager, plus a tiny Watch app with the 3 habit switches.
- **Live Activity (optional)**: during the Sunday ceremony window, a Dynamic Island activity: "Lanterns lit · $59 ready to drop."

## 10. Sound and haptics

- **Sound** (off by default if the phone is silenced; separate toggle): short, soft, original sounds we create or license as CC0. Examples: wooden "tok" on button press, marimba "plip" when fruit grows, coin chimes in the tally (rising pitch per row), page-flip for sheets, gentle ocean ambience on Home (opt-in). Character speech is either silent typing or a quiet "babble" made from pitched-down syllables we generate ourselves; never a sampled game voice.
- **Haptics (native only)**: light impact on tile press, success notification on save, a rhythmic "soft-soft-rigid" pattern as coins drop, and a selection tick when scrubbing the voyage map. The PWA has no haptics on iOS, so every haptic has a visual and audio twin.

## 11. Accessibility

- **Contrast**: all text pairs meet WCAG AA (verified ratios in the style guide). Buttons use light fills with brown ink text; we never put white text on mid-green or coral.
- **Not color alone**: each fruit has a distinct shape and label; progress shows numbers too.
- **Dynamic Type / text zoom**: rem-based scale. Layouts reflow at 200% (cards stack to one column; the island scene shrinks before text does). Money uses `clamp()` to shrink rather than truncate.
- **Reduce Motion** (follows the iOS setting plus an in-app toggle): no bounce, sway, parallax, confetti, or typewriter. The settlement becomes simple fades, and the boat jumps instead of sailing.
- **VoiceOver**: the island scene has a single summary label ("Mochi's tree: 43 of 85 fruit this week. Bean's tree: 57 of 85. Jar: $1,184.50, 39 percent."). Habit switches use `role=switch`. The tally uses `aria-live="polite"`. Character bubbles are read as "Juniper says: …".
- **Touch**: 44pt minimum targets. No gesture-only actions (swipe-to-dismiss always has an ✕ button; slide-to-redeem has a hold-button alternative).
- **Cognitive**: one primary action per screen, plain-language copy, no time pressure (the ceremony waits for them).

## 12. Originality and IP guardrails

- No Nintendo characters, likenesses, names (no "Nook," "Bells," "Resident Services," "Isabelle," etc.), sounds, fonts (the AC fonts are proprietary), logos, UI layouts traced from screenshots, or the leaf-in-speech-bubble logo.
- Our currency is real dollars plus "fruit" and "tickets." The NPC is a capybara (not a raccoon, dog secretary, pelican, owl, or otter). Illustrations are drawn from scratch as simple SVG.
- Fonts are OFL. Sounds are self-made or CC0. If we commission art, we get a written assignment.

## 13. Open questions for the user

1. **Trip and amount**: the real destination (for the map illustration), the target $ amount, and the date? (The mockup assumes $3,000 by Aug 2027.)
2. **Names and villagers**: what species, colors, and names would each of you like? (Mochi the cat and Bean the dog are placeholders.)
3. ~~Treats vs. trip~~: decided. Separate treat budget, with tickets earned when both score ≥ 60 (0003).
4. **Season 1 habits**: are veggies at 2+ meals, no sugary drinks and home-cooked dinner the right 3 for each of you? (Cadence decided: one evening card, 0004.)
5. **Partner visibility**: the default is fruit and % only (0004). Does either of you want to opt in to sharing raw numbers?
6. **Ceremony timing**: Sunday 7:30 pm, together on one phone or separately?
7. **Native appetite**: are widgets, Watch complications, and haptics worth a native/TestFlight app (it needs an Apple Developer account, $99/yr), or is a PWA enough for v1?
8. **Sound**: would you like ambient island sound on, or keep the app silent by default?
