# Island Fund: Style Guide v3 (official NH art · ease of use)

Owner: UI/UX Designer · Status: **v3** (2026-10-28) · Tokens: `app/src/lib/styles/tokens.css` · Research: [ac-research.md](ac-research.md) · Art: `app/static/art/` ([runbook §1c](../ops/runbook.md)) · Decision: [ADR 0014](../decisions/0014-simplify-no-promises-no-cozy.md) (no promises, no Cozy Days, no ふたり) · Previous: v2 (git history), v0.4 [mockup.html](mockup.html)

**Direction.** The app should read as *あつまれ どうぶつの森* at a glance: the real villagers standing by their trees, Isabelle (しずえ) hosting every line, inventory-icon fruit, a Bells bag for money, a NookPhone-style launcher. Our own UI chrome (cream bubbles, chunky lipped buttons, paper cards, checkered grass) stays drawn by us and wraps the official art.

**IP rule (v3).** Official art comes **only** from `static/art/` via `<OfficialArt>` (Nintendo's art, personal use; the repo must be private). Names on screen follow the Japanese game: しずえ, ベル (for the Bells icon only; amounts stay ¥), しまフォン. No Nintendo fonts or sounds. Every official image has our fan-art vector as its fallback, so the app still works and looks right if a file is missing.

## 0. Simplicity budget (overrides everything)

**2 tabs** (島 Island · 旅の壺 Jar) + しまフォン launcher (top right) + the Sunday harvest overlay. One primary action per screen, in the thumb zone. ≤ 40 Japanese characters of non-numeric text per screen. One hero number per screen. ≤ 3 cards per screen, ≤ 5 rows per card. Icons first, labels on tap. Explanations live in しまフォン → 使い方. One しずえ line (≤ 16 characters) per screen. **Decoration never adds words.**

**Removed in v3 (do not re-add):** Sunday promises (約束), のんびりデー / Cozy Days, the ふたり tab, the blocker question, promise cheer. Nothing replaces them as a feature; their jobs move as follows:

| Old job | v3 home |
|---|---|
| See the partner's week (ふたり) | The partner's villager stands by their own tree on 島, with their four fruit and score; tap them → small sheet with their 4 fruit rings + 「ハイタッチ」 |
| Gentle accountability (promises) | 今夜のチェック + the weekly harvest. Isabelle's line nudges once per evening |
| Rest days (Cozy Days) | None. The scoring is already weekly and forgiving; a missed day is just a smaller fruit |
| Settings (villager, language, notifications, sync, sharing) | しまフォン apps |

---

## A. Official art: what goes where

All art is `.webp` with alpha, already downscaled. Render with `<OfficialArt key=… alt=… size=…>{#snippet fallback()}…{/snippet}</OfficialArt>`; keys via `villagerArt(id, icon?)`, `hostArt(pose)`, `fruitArt(f)`, `moneyArt(k)` in `lib/client/assets.ts`. `size` is the rendered **height** in px (width follows the aspect ratio); `alt=""` when a text label sits next to it.

| Where | Key(s) | Rendered size | Notes |
|---|---|---|---|
| 島: the two villagers, one at the foot of each tree | `villagers/<id>` (full body, ≤ 512 px tall) | **22–24 cqw tall** (~88 px on a 390 pt phone) | Ground-shadow ellipse under the feet (ours). Idle bob on the `<img>` (transform only). Tap = squash + our emote bubble above the head |
| Avatars: partner sheet, check-in sheet header, harvest rows, しまフォン 村人 picker | `villagers/<id>-icon` (128 px round head) | 40 / 56 / 64 px | Always on a pebble (`--r-blob`) in the person's tag colour at 30% |
| Isabelle bubble (島, Jar, check-in done, harvest) | `hostArt('wave')` default · `'stand'` calm/info · `'bow'` thanks/sorry · `'winter'` Dec–Feb · `'icon'` in compact spots | **96 px** tall beside the bubble on 島 (72 px on Jar / sheets); icon 44 px | Sits outside the scene, left of the bubble, feet on the bubble's baseline. Name tag 「しずえ」 in `--tag-juniper` (yellow) |
| The four fruit rings (peach · coconut · apple · pear) | `fruitArt(f)` (128 px inventory icon) | 34–40 px inside a 56 px ring (FruitRing), 22 px in lists | The ring (ours) shows progress; the official fruit sits in the centre and scales 0.7 → 1 with pct. Below 25% show it at 55% opacity |
| On the trees | `fruitArt(f)` | 26–30 px | Hang 2 per tree; same ripening rule |
| Money: every ¥ amount that is **savings** (jar total, harvest, ladder) | `moneyArt('bells')` (Bells bag) | 1.1em inline before the number; 48 px on the harvest total | Amounts stay ¥ (`¥146,200`). Treat purse uses the same bag at 85% |
| Score / streak accents | `moneyArt('miles')`, `items/star-fragment` | 20–24 px | Optional, max one per card |
| しまフォン launcher | `phone/*` app icons (92 px) for help/villager/notifications/sync/share; `money/leaf` for language | 56 px tiles | The icons are full squircle tiles: render without our tile background |
| Jar screen ladder rungs / island scenery | `trees/palm`, `trees/cedar` (seasonal winter), `flowers/*` | Palm 30–40 cqw; flowers 20–28 px | Palm replaces our left tree in summer; cedar in winter (optional polish) |
| Empty / error states | `host/tom-nook` (sleepy-friendly, calm) | 120 px | Only where a screen would otherwise be blank |

Not used: Isabelle's white-background renders, Nook Miles ticket (reserved), `items/piggy-bank` (gallery only).

---

## B. Screens (ease of use)

### B.1 島 Island (home)
Top → bottom: scene (sky, sea, island, two trees with fruit, jar in the middle, two villagers) · status row over the sky (SyncPill left, しまフォン button right) · each person's score as a small number pill under their tree · **Isabelle + bubble** · **one primary button, 今夜のチェック** (sticky above the dock; becomes a quiet paper button 「チェック済み ✓」 after saving, still tappable to edit). The strength-confirm question (「筋トレとして記録する？」) temporarily replaces the button (No / Yes), as today. Nothing else on this screen: no cards, no lists.

Taps: my villager → check-in sheet (same as the button). Partner villager → partner sheet (icon, score, 4 fruit rings, 「ハイタッチ」). Jar → goes to 旅の壺. A fruit → its detail chip (`fruit.<f>.detail`).

### B.2 今夜のチェック sheet
Header: my villager icon (56) + date. Body: the existing check-in controls, each row ≥ 56 px, one column. Footer: one leaf button 「保存」. On save: sheet closes, my villager cheers (♪), Isabelle says one line with `'wave'`.

### B.3 旅の壺 Jar
Hero: the jar + Bells bag + total (`--fs-hero`). Then ≤ 3 cards: 地層 (layers), はしご (ladder, rungs with flower/fruit icons), ごほうび財布 (purse). Isabelle line at the top (72 px, `'stand'`).

### B.4 Sunday harvest overlay
Night + stars. Steps as v2, but each person's row shows their villager icon, their four official fruit, and the earned amount with the Bells bag; the total pops with a 48 px bag. Isabelle `'bow'` on the final step 「おつかれさまでした！」.

### B.5 Pair screen (before pairing)
Fan-art only (no official art needed, but allowed once loaded). Big 6-digit input, one button. Isabelle (fan-art fallback) explains in one line.

### B.6 しまフォン launcher
44 px phone button top-right on every screen. Opens the phone sheet: status row, title, a 3-column grid of 56 px icons (labels under): 使い方 · 村人 · 言語 · お知らせ · 同期 · 共有. Each opens in-phone with a ‹ back. 村人 shows the roster as 64 px official head icons in a 5-column grid (selected = leaf ring + check).

---
## 1. Colour

All values live in `tokens.css`. Use **semantic tokens** in components (`--bg --surface --edge --text --text-soft --bubble --lip --stitch`) so night mode works for free. The v0.4 names (`--leaf`, `--paper`, `--ink`…) still work.

### 1.1 Core (day)

| Token | Hex | Use |
|---|---|---|
| `--c-cream` | `#FFF8E7` | App background (with `--pat-dots`) |
| `--c-bubble` | `#FFFBEA` | Speech-bubble fill. Warm off-white, never `#fff` |
| `--c-paper` / `--c-paper-2` | `#FDF1D6` / `#F6E6C1` | Card / card lip and pressed paper |
| `--c-stitch` | `#DCC79B` | Dashed stitching inside cards |
| `--c-ink` | `#4A3A2C` | Text and all outlines |
| `--c-ink-talk` | `#6A5641` | Bubble text (6.7:1 on the bubble, 6.0:1 on the night bubble) |
| `--c-leaf` / `-lip` / `-soft` / `-ink` | `#7BC67E` `#5FA862` `#BFE5B9` `#2E6B38` | Primary button, its lip, success fill, green text |
| `--c-yuzu` / `-lip` / `-soft` | `#FFD66B` `#E3B23C` `#FFF0BF` | しずえ name tag, celebration button, highlights |
| `--c-coral` / `-lip` / `-soft` / `-ink` | `#FF9B87` `#E07F6B` `#FFD9CF` `#B04A3B` | ごほうび財布 (treat purse) |
| `--c-sky` / `-lip` / `-soft` / `-ink` | `#8FD3F4` `#5FB3DD` `#DDF2FB` `#2F6F96` | Info, sync |
| `--c-amber` | `#F5A623` | ▼ "next" arrow |
| `--c-coin` / `-rim` / `-shine` | `#F7C548` `#D9962A` `#FFF1B8` | Leaf-coin |
| `--c-blush` | `#FF9E8F` | Villager cheeks (opacity .7) |
| `--c-emote-blue` | `#4D7CF2` | "!" emote only |

Buttons are always **light fill + brown ink text** (≥ 5:1). Never white text on a saturated fill.

### 1.2 Night (19:00–06:00 or system dark): `[data-theme="night"]`

`--bg #1F2A44`, `--surface #33456B`, `--edge #4A5E8A`, `--text #F7EEDB` (12.4:1), `--text-soft #B9C3DA`, `--bubble #F7EEDB` (bubble text stays `--c-ink-talk`), accent `--moon #F6E7B0`, lip `#18213A`, stitch `#5A6F9C`. Night buttons use `--c-moon` with lip `--c-moon-lip`.

### 1.3 Scene palette (season × day/night)

Set on `<html>` by `lib/client/theme.svelte.ts`: `data-season` by month (Mar–May spring, Jun–Aug summer, Sep–Nov autumn, Dec–Feb winter), and `data-tod` (dawn 05–07, day, dusk 16–19, night). Test with `?season=winter&theme=night`.

| Token | Spring | Summer | Autumn | Winter | Night (spring / summer / autumn / winter) |
|---|---|---|---|---|---|
| `--grass` / `--grass-2` (checker) | `#8DD16A` / `#80C55E` | `#5DBB4F` / `#52AE45` | `#B5C25A` / `#A6B44E` | `#F4F7FA` / `#E4ECF4` (snow) | `#3E6B52` · `#2F5E45` · `#5B6040` · `#8C9DB8` |
| `--grass-edge` (cliff band) | `#5EA448` | `#3E8E3A` | `#7F8C3A` | `#B9CADD` | `#2A4B3A` (winter `#62759A`) |
| `--tree-leaf` / `-2` | `#6CBF5A` / `#55A84A` | `#3FA34A` / `#318A3D` | `#E89A3C` / `#D2763A` | `#4F8F6A` / `#3F7A59` + snow caps | darkened per season |
| `--season-accent` | blossom `#FFC2D4` | sun `#FFE27A` | leaf `#E8643C` | snow `#FFFFFF` | |
| `--sea` / `--sea-deep` | `#6FCBE8` / `#4FB3D6` | `#3FB8DE` / `#2A9CC8` | `#5BB3CF` / `#4298B8` | `#6AA9C9` / `#4F8FB2` | `#2B3A5C` / `#22304D` |
| `--beach` | `#F1E2B8` | `#F4E3B0` | `#EAD9AE` | `#E6E1D3` | `#4A5E8A` |

| Sky `--sky-top → --sky-bottom` | |
|---|---|
| dawn | `#F9C9A8 → #D5ECF5` |
| day (spring) | `#9FDCF7 → #E4F6FD` (summer `#6FCBF5 → #C9EEFC`, autumn `#A7D5EE → #F3E9D2`, winter `#BFD9EC → #EEF4F8`) |
| dusk | `#F4A27C → #FBE3B6` |
| night | `#16203A → #2B3A5C` + stars + moon |

Fruit (`--f-peach #FFB38A`, `--f-coconut #9C6B45`, `--f-apple #FF8A7A`, `--f-pear #C9DE6E`) and partner colours (`--p-plum`, `--p-apricot`, `--p-mint`, `--p-berry`, `--p-lemon`) are unchanged from v0.4.

---

## 2. Typography

| Role | Family (OFL, fontsource) | Weights | Token |
|---|---|---|---|
| UI, Japanese, Latin text | **Zen Maru Gothic** | 500 body · 700 bold · **900 headings** (new) | `--font-ui` |
| Numbers, ¥, scores | **Fredoka** | 500 · 600 · 700 | `--font-num` |

No other packages. The stack falls back per glyph, so `¥146,200` in `--font-num` renders the digits in Fredoka. `font-feature-settings: "palt"`, `letter-spacing: 0` for Japanese, `tabular-nums` in lists.

| Token | Size / line height | Family · weight | Use |
|---|---|---|---|
| `--fs-hero` | 2.75rem / 1.05 | num 700 | Jar total, harvest total |
| `--fs-h1` | 1.75rem / 1.15 | ui **900** | Screen titles |
| `--fs-h2` | 1.25rem / 1.2 | ui 900 | Card titles |
| `--fs-talk` | 1.0625rem / 1.5 | ui 700, `--c-ink-talk` | Speech bubbles |
| `--fs-body` | .9375rem / 1.45 | ui 500 / 700 | Default |
| `--fs-tag` | .8125rem / 1 | ui 700 | Name tags, pills |
| `--fs-caption` | .8125rem / 1.35 | ui 700 | Meta |
| `--fs-micro` | .6875rem / 1.2 | ui 700 | Dock labels |

---

## 3. Shape, elevation, patterns

**Radii:** `--r-sm 14` inputs · `--r-card 22` cards · `--r-lg 28` sheets · `--r-phone 44` しまフォン · `--r-pill` buttons · `--r-squircle 30%` app tiles · `--r-bubble` (wobbly: `34px 46px 38px 42px / 40px 34px 46px 40px`) · `--r-blob` pebbles. **Borders** 2px (`--bw`).

**Elevation:** the signature is the **solid lip**, a 0-blur offset shadow in a darker shade of the fill (`0 5px 0 var(--c-leaf-lip)`), plus `--sh-btn-hi` (a 2px inner top highlight). Floating things add `--sh-soft` / `--sh-float`. Under villagers and trees: an ellipse filled with `--sh-ground`.

**Patterns** (opacity ≤ 7%, never behind body text without a paper card):

| Page | Background |
|---|---|
| 島 | Scene fills the top; below the horizon `--bg` + `--pat-dots` |
| 旅の壺 | `--bg` + `--pat-stripes` (sand diagonals) |
| Sunday overlay | Night + `--pat-stars` |
| Progress fills | `--pat-stripes-fill` animated 32px/s (stops under reduced motion) |

---

## 4. Components (Builder B unless noted)

### 4.1 Speech bubble `Bubble.svelte`
- **Box:** fill `--bubble`, radius `--r-bubble`, **no border**; `box-shadow: 0 4px 0 var(--c-paper-2), var(--sh-soft)`; padding 18px 20px 16px; min-height 64px. Text `--fs-talk` 700 `--c-ink-talk`.
- **Name tag:** a pill at `top: -14px; left: 18px`, `rotate(-4deg)`, padding 5px 12px, `--fs-tag` 700 `--c-ink`, fill = speaker tag colour (`--tag-juniper` for しずえ, `--tag-<partnerColour>` for villagers), lip `0 2px 0` 15% darker. It pops in 120ms after the box.
- **Tail:** a 16px rounded triangle on the side facing the speaker, same fill, no stroke. Omit it when the speaker isn't on screen.
- **▼:** 14×10px rounded triangle in `--c-amber`, centred at `bottom: -6px`, `if-nudge 700ms infinite`. Show only when typing has finished **and** another page follows (tap = next page). Single-page lines don't show it.
- **Letter reveal:** each glyph is a `<span>` animated with `if-letter 120ms` at `--type-ms` (33ms) intervals. Add `--type-pause` after 。！？!? and half after 、,. Tapping the bubble finishes instantly. The real text sits in a visually hidden `aria-live="polite"` node; the animated spans are `aria-hidden`. Reduced motion: no reveal.
- **Entry:** the box scales from 0.6 at the tail corner to 1 with `--ease-bounce` over `--dur-pop`.

### 4.2 しまフォン: dock + launcher
- **Dock (tab bar):** floating slab, `width: min(100vw, var(--col)) - 24px`, height 72px, fill `--phone-bg`, 2px `--phone-edge`, radius 30px, `--sh-float`. **Two** tabs, each a half-width target (≥ 160×64 px): a 48×48 squircle tile (`--app-island` / `--app-jar`, glyph 28px) + the label **beside** it (`--fs-tag` 700), not under, since there's room.
  - Active: tile `translateY(-4px) scale(1.06)`, label `--text`, a soft `--c-leaf-soft` pill behind the whole tab.
  - Inactive: label `--text-soft` (not faint: it must stay readable).
  - Tap: squash (§4.3).
- **Launcher:** see §B.6. The phone button is 44px, fill `--phone-bg`, our phone glyph (or `phone/nookphone` at 30px once loaded).

### 4.3 Chunky button `.btn`
Pill, min-height 56px (small: 44px), padding 0 24px, `--fs-body-lg` 700 `--c-ink`, fill + lip: `box-shadow: var(--sh-btn-hi), 0 5px 0 <lip>`.
- **Press** (`:active`, `--dur-tap`, `--ease-squash`): `translateY(4px) scale(1.03, .94)`, lip → `0 1px 0`.
- **Release:** back to 1 with `--ease-bounce` over `--dur-base`.
- Variants: `leaf` (primary), `yuzu` (celebrate/confirm in harvest), `coral` (purse), `moon` (night primary), `paper` (quiet: `--surface` + 2px `--edge` + `--sh-lip`).
- An optional 26px icon goes on the left. Disabled: opacity .55, no lip.

### 4.4 Paper card `.card`
`--surface`, 2px `--edge`, radius `--r-card`, `--sh-lip`, padding 16px. **Stitching:** `outline: 2px dashed var(--stitch); outline-offset: calc(-1 * var(--stitch-gap))`. Optional **label tape**: a pill on the top edge (like a name tag, rotate -3deg, `--c-yuzu-soft` or a partner tag colour) for card titles instead of an in-card heading. Row dividers: `2px dashed var(--stitch)`.

### 4.5 Leaf-coin counter (Builder A draws the coin, B the pill)
**Coin** (`LeafCoin.svelte`, viewBox 24): a circle r10 in `--c-coin`, 2px rim in `--c-coin-rim`, an inner ring r7.5 at 40% rim opacity, a **¥** glyph built from strokes (2px `--c-coin-rim`), a sprouting leaf (8×5 `--c-leaf`, outline `--c-ink` 1.2) at 1–2 o'clock on the rim, and a shine crescent `--c-coin-shine`.
**Pill:** coin 22px + `¥146,200` in `--font-num` 600, cream fill, 2px `--edge`, lip 3px. When the value changes, digits count up over `--dur-slow` and the coin plays `if-coin` once.

### 4.6 Sheets, chips, switches
- **Sheets:** radius `--r-lg` top only, `--surface` + `--pat-dots`, a 40×5 grabber, enter `translateY(100%) → 0` over `--dur-base` `--ease-soft`, then a 1.5% overshoot bounce.
- **Chips:** pill, 44px high; selected = `--c-leaf-soft` + `--c-leaf` border.
- **Switch:** 60×36 pill; the knob is a 28px cream circle with a lip, and on tap it squashes to `scaleX(1.25)` mid-travel.

### 4.7 Emote bubble (Builder A)
A white (`--c-bubble`) round bubble, 30u in diameter, with a 6u tail pointing down, floating 10u above the head top. Its symbol is drawn in the brand colours: ♪ (cheer, `--c-leaf-ink`), ! (surprised, `--c-emote-blue`), z z (sleepy, `--c-sky-ink`), ✦ (proud, `--c-amber`), ♥ (high-five, `--p-berry`). Animation `if-emote` over `--dur-emote`. Max one per character at a time.

---

## 5. Island scene composition (Builder A) `IslandScene.svelte`

viewBox `0 0 390 540`, scaled to container width; the sky bleeds under the status bar. Sky, sea, island, grass, seasonal particles and the jar stay as v2 (our vectors). Changes in v3:

| Layer | v3 spec |
|---|---|
| Trees (×2) | Our canopy stays (it carries the seasons), but the fruit hanging on it are the **official fruit icons** (26–30 px, 2 per tree: left tree = peach + coconut, right = apple + pear), ripening 0.7 → 1 scale with pct. Optional polish: in summer the left tree may be `trees/palm`, in winter `trees/cedar` |
| Villagers | HTML overlay (`<OfficialArt key={villagerArt(id)}>`, fallback = `VillagerArt`), positioned in cqw at each tree's foot, **22–24 cqw tall**, feet on the grass, our ground shadow (rx 18 ry 4 `--sh-ground`) under them. Idle bob `if-bob` (transform only, offset −1.2s for the partner). Tap target = the whole figure + 8px. Emotes (§4.7) float above the head at 4 cqw from the top of the image |
| Score pills | Under each villager: name tag (villager name) + score `NN` in `--font-num`, cream pill with lip |
| Jar | Unchanged; tap → 旅の壺 |

Isabelle sits **outside** the scene, beside the speech bubble (§A).

### 5.1 Polish list (all screens)
- **Spacing:** 8-pt grid. Screen side padding 18px + safe area; 12px between stacked blocks on 島, 22px between cards elsewhere. Bubble ↔ button 12px.
- **Hierarchy:** per screen exactly one hero (島: the scene; Jar: the total) → one しずえ line → one primary button. Card titles as label tape, never a heading + a tape.
- **Tap targets:** ≥ 44 px everywhere, ≥ 56 px for primary buttons and check-in rows, ≥ 64 px for villagers on the scene. No tap targets within 8px of each other.
- **Art crispness:** always set `size` from the table in §A (downscaling only; never upscale a 128 px icon past 64 px). `image-rendering: auto`. No CSS filters on official art except `opacity` and night `brightness(.9)`.
- **Motion:** official art moves only via transform/opacity (bob, squash, pop); one animation per element at a time; everything still under reduced motion.
- **Loading:** `<OfficialArt>` reserves its box from the manifest aspect ratio, so nothing jumps; the fallback only shows on error.
- **Copy:** remove every promise / Cozy Day / ふたり string from `i18n/*` and help text; しずえ lines stay ≤ 16 characters.

---

## 6. Motion

| Thing | Duration | Easing | Detail |
|---|---|---|---|
| Button press / release | 90 / 260ms | squash / bounce | scale(1.03, .94) + 4px down |
| Pop-in (emote, badge, fruit full) | 360ms | bounce | `if-pop` 0 → 1.15 → 1 |
| Bubble open | 360ms | bounce | from the tail corner |
| Letter reveal | 33ms/char | — | pause 180ms at 。！？ |
| Sheet | 260ms | soft | + 1.5% overshoot |
| Villager idle bob | 2400ms loop | idle | translateY −2%, scale(.985, 1.015) |
| Cheer / surprised hop | 600ms ×1 | — | `if-hop` (anticipation squash → stretch → land squash) |
| しずえ idle | 2800ms loop | idle | translateY −1.5% on the official render (no squash) |
| Tree sway | 5s loop | idle | ±1.2° |
| Coin count-up | 600ms | soft | + `if-coin` |
| Harvest steps | 1200ms each | soft | as v0.4 |

**Squash and stretch rule:** volume is conserved (scaleX × scaleY ≈ 1), always with `transform-origin: 50% 100%` for characters, and never more than 14% deformation.

**Reduced motion** (`prefers-reduced-motion: reduce`, handled by tokens + theme.css): no loops (bob, sway, drift, nudge, stripes), no letter reveal, no particles, no hops. Press = colour/lip change only; pops become 120ms fades. Emotes still appear (static) for 1.6s because they carry meaning.

---

## 7. Villager character system (Builder A)

Fan-art fallback for the official renders (§A); keep it working, since it's what shows before art loads or if a file is missing.

### 7.1 Shared chibi body: `viewBox="0 0 100 120"`, ground line y = 116

| Part | Geometry (units) |
|---|---|
| Head | Ellipse cx 50, cy 40, rx 36, ry 32 (y 8–72). Species may vary rx 34–40 / ry 28–33 |
| Torso | Bell path, top width 34 (x 33–67) at y 68, bottom width 44 (x 28–72) at y 106, corners r 8. Fill `--v-shirt` (default = partner colour) + optional pattern (stripes / dots / leaf print, 2 colours max) |
| Arms | Capsules 10×22, pivot at the shoulders (31, 74) / (69, 74), rest angle ±18° outward. Coat colour; the hand is the rounded end (no fingers) |
| Legs | Capsules 11×12 at x 37 / 52, y 104–116, coat shade colour |
| Tail | Species-specific, behind the torso at (66, 100) |
| Outline | `--v-line` 2.6u, round joins, on the silhouette only (head, ears, torso, arms). Inner details unstroked |
| Head-only avatar | Same symbol, `viewBox="10 0 80 80"` |

Head:body = 64 : 50 ≈ 1.3:1 visually (matching the reference villagers). The head overlaps the torso by 4u (no neck).

### 7.2 Face anchors (all species)

Eyes centred at (36, 44) and (64, 44) (frog/duck: y 40). Brows at y 34 (optional). Nose (50, 52). Mouth (50, 60). Blush ellipses (27, 54) and (73, 54), rx 6.5, ry 4, `--c-blush` at .7.

| Eye variant | Shape |
|---|---|
| `oval` (default) | Ellipse rx 3.6, ry 4.6, `--v-eye`, highlight circle r 1.3 at (+1.2, −1.6) |
| `dot` | Circle r 3, no highlight (deadpan; sheep) |
| `happy` | ∩ arc, 9u wide, stroke 3 |
| `sleepy` | ‿ arc, 9u wide, stroke 3 |
| `wide` | Circle r 5 + highlight r 1.8 + small second highlight r .8 |
| `smug` | Oval with a flat upper lid (clip the top 40%) + lid line |
| `sparkle` | Oval + a 4-point star highlight (`--c-coin-shine`) |

| Mouth | Shape |
|---|---|
| `smile` | Q-curve 10u wide, stroke 2.4 |
| `open` | D shape 10×7, `--v-mouth` fill + tongue `--v-tongue` |
| `cat` | "w" made of 2 arcs, 12u wide |
| `o` | Ellipse 4×5, `--v-mouth` |
| `flat` | Line 6u, stroke 2.4 |

### 7.3 Species head features

Each species = `{ ears, muzzle, nose, marking?, tail, headScale?, defaultMouth }` drawn over or behind the shared head. Colourways: base / shade (ears, legs, markings) / light (muzzle, inner ear).

| Species | Head features | Colourways (base · shade · light) |
|---|---|---|
| **cat** | Triangle ears, tips at (20, 6) / (80, 6), bases on the head rim, inner triangles in light pink; small inverted-triangle nose `#F28BA8`; 2 whiskers per side (opacity .5); mouth `cat`; optional forehead patch; tail = S-curve capsule | Cream `#FFF3E6 · #E9D6C2 · #FFC9C0` · Lilac `#CDB6F0 · #A98FD6 · #FFD6E5` · Ginger `#F6B26B · #D98B45 · #FFE6CC` |
| **dog** | Floppy teardrop ears hanging from (22, 22) to (13, 58) (shade colour, behind the face); muzzle ellipse (50, 58) rx 15, ry 11 light; nose ellipse rx 5, ry 3.6 `--v-eye` with a highlight; tail = short upward curl | Biscuit `#F2C48D · #A8754E · #FFF1DE` · Cocoa `#A9765A · #7A4F38 · #F3DCC4` · Cloud `#F5F2EC · #C9BFB3 · #FFFFFF` |
| **rabbit** | Tall capsule ears 12×36 rising from (36, 12) / (64, 12), tilted ±8° (variant: right ear folded at half height), inner light; tiny Y nose; two front teeth when `open`; tail = cotton puff r 6 | Blush `#F9C6D3 · #E79AB0 · #FFF3F6` · Snow `#FBF8F2 · #D9D2C6 · #FFC9D3` · Mocha `#C9A27E · #9C7656 · #F5E3CF` |
| **bear** | Round ears r 9 at (22, 14) / (78, 14) + inner r 5; muzzle ellipse rx 14, ry 10 light; rounded-triangle nose in dark; tail = r 5 stub | Honey `#E3A76B · #B97A45 · #F8DDB9` · Mint `#A9DDC8 · #7FBFA6 · #E8F7F0` · Cocoa `#9A6B4F · #6E4A36 · #E6CDB4` |
| **hamster** | Small round ears r 7 at (26, 12) / (74, 12), inner pink; headScale rx 38 (chubby); white bean-shaped muzzle patch across the lower face; pink dot nose; teeth on `open`; blush rx 8 | Golden `#F7C26B · #E39B3C · #FFF4DE` · Pebble `#CFC8C2 · #A69C93 · #FFFFFF` · Peach `#FFC7A6 · #F3A07E · #FFF1E6` |
| **duck** | No ears; a 3-feather tuft at (50, 8); eyes at y 40; **bill** = flat rounded ellipse rx 16, ry 7 at (50, 58) in `#F5A341` with a lighter top half (it replaces nose and mouth; `open` = bill parts 4u); tail = 3-point feather | Sunny `#FFE27A · #E8C24B · #FFF6C9` · Mint `#BDE6D5 · #93CDB6 · #EFFAF5` · Hazel `#C49A6C · #9A744C · #F2E2CC` |
| **frog** | headScale rx 40, ry 28 (wide, flat); **eye bumps** = circles r 12 at (32, 16) / (68, 16) on top of the head (eyes drawn inside the bumps); wide mouth spanning x 30–70; blush rx 9; no nose (two dots) | Leaf `#8FD48A · #5FB15C · #F7F2D0` · Lagoon `#6FD0C4 · #43A99C · #E8FAF4` · Sakura `#F7B6C9 · #E58FA9 · #FFF0F4` |
| **sheep** | **Wool ring** of 9 overlapping circles (r 9) around the face in wool colour (the face is a smaller inner ellipse rx 26, ry 24 in face colour); small horizontal leaf ears at (20, 44) / (80, 44); optional curled horns (spiral, `#E9D3A8`); eyes `dot`; wool scallops on the torso hem | Cream wool `#FFFBF2 · #EAE0CF · face #F7C9B8` · Cocoa face `#FFFBF2 · #EAE0CF · face #6E5B4E` (light eyes) · Pink wool `#FFD6E2 · #F2B3C6 · face #FFF1E6` |

Data shape (in `lib/villagers/species.ts`): `{ id, nameJa, colourways: [{ id, base, shade, light }], features: Snippet/part ids }`. Stored per person as `villagerSpecies` + `villagerColor` (the colourway id). Unknown or null → the v0.4 defaults (A = dog Biscuit, B = cat Lilac).

### 7.4 Expressions (the only five; no sad or angry)

| Expression | Eyes | Mouth | Pose / motion | Emote | Used when |
|---|---|---|---|---|---|
| `happy` (default) | oval | smile (cat: `cat`) | idle bob | — | normal |
| `cheer` | happy | open | arms up (±140°), `if-hop` ×1 | ♪ | check-in saved, harvest confirmed, rung reached, high-five received |
| `sleepy` | sleepy | flat | head tilt 6°, bob slows to 4s | z z | 22:00–06:00 |
| `surprised` | wide + brows raised 3u | o | small hop, arms out ±40° | ! | partner logged something new, sync conflict prompt |
| `proud` | smug | smile | torso scaleX 1.04, arms on hips (bent 70°) | ✦ | a fruit ring completes |

API: `<Villager species colourway expression="happy" size={64} head={false} emote={false} label />`.

### 7.5 Host: しずえ (Isabelle)
- **Primary:** official art via `hostArt(pose)` (§A). Pose by situation: `wave` = cheer / greeting / check-in saved; `stand` = info, neutral, Jar; `bow` = harvest done, thanks, error apologies; `winter` replaces `stand` Dec–Feb; `icon` in the check-in sheet header and toasts.
- **Fallback:** our fan-art `IsabelleArt.svelte` (via `Isabelle.svelte` / `Juniper.svelte`, same props: `expression size head emote`). The fallback keeps the five expressions; the official art maps `cheer → wave`, `happy → stand` (or `wave` on 島), `proud → wave`, `surprised → stand`, `sleepy → stand`.
- Name tag 「しずえ」 / "Isabelle" in `--tag-juniper`.

---

## 8. Icons (Builder A)

- **Official first:** fruit, Bells bag, Nook Miles, leaf, star fragment and NookPhone app icons come from `static/art/` (§A).
- **Ours (fallback + chrome):** app-tile glyphs on a 24-grid, flat fills in `--c-ink` with one accent detail (island, jar, help, villager, lang, bell, sync, share; `#app-us` is retired). Inline UI icons: 24-grid, 2.2px rounded stroke, as v0.4. Fruit symbols `#f-<fruit>` stay as the fruit fallback.

---

## 9. Platform (unchanged from v0.4 §5)

iPhone portrait, 375–430pt, standalone PWA. Safe areas via `--safe-*`. 44pt minimum targets (48 for primary). `100dvh`. Inputs ≥ 16px. No hover-only states. Bottom sheets, not modals. Night `theme-color #1F2A44`, day `#FFF8E7`.

---

## 10. Work split v3 (two builders, no shared files)

| | **Builder A: scene & art integration** | **Builder B: UI chrome & screens** |
|---|---|---|
| Owns (create / edit) | `lib/components/IslandScene.svelte`, `Villager.svelte`, `Isabelle.svelte` / `Juniper.svelte`, `FruitRing.svelte`, `LeafCoin.svelte` (→ Bells bag wrapper), `Emote.svelte`, `Sprites.svelte`, `Icon.svelte`, `OfficialArt.svelte`, `lib/client/assets.ts`, `lib/villagers/*`, `routes/dev/characters/+page.svelte` (art gallery: every manifest key + its fallback side by side), `scripts/fetch-assets.ts`, `static/art/**`, `static/icons/*` | `lib/components/theme.css`, `TabBar.svelte` (→ 2 tabs), `ShimaPhone.svelte` + `HelpButton.svelte` (launcher, 村人 picker with official icons via A's helpers), `Bubble.svelte` (Isabelle placement per §A), `Sheet.svelte`, `SyncPill.svelte`, `Rope.svelte`, `CheckinSheet.svelte`, `HarvestOverlay.svelte`, `routes/+layout.svelte`, `routes/+page.svelte`, `routes/jar/+page.svelte`, `routes/pair/+page.svelte`, **delete** `routes/us/` and any promise / cozy UI, partner sheet (new `PartnerSheet.svelte`), `lib/client/theme.svelte.ts`, `lib/i18n/*` |
| Delivers | §A placement inside the scene, §5, §7.5 art mapping, §8; stable APIs: `<OfficialArt key alt size width eager fallback>`, `villagerArt(id, icon?)`, `hostArt(pose)`, `fruitArt(f)`, `moneyArt(k)`, `<Villager … />` and `<Isabelle expression size />` rendering official art with fan-art fallback (new optional prop `official={true}` default) | §0, §B (all screens), §4.2 dock + launcher, §5.1 polish (spacing, hierarchy, targets, copy), Bells bag next to savings amounts using A's `moneyArt('bells')` |
| Until the other lands | Keep existing props working | Use `<OfficialArt>` directly for icons; keep using `Villager` / `Isabelle` (they upgrade in place) |

**Off-limits to both:** `lib/server/**`, `routes/api/**`, `lib/scoring/**`, `lib/types.ts` (engineer). **Shared:** `lib/styles/tokens.css` is owned by the designer; builders only **append** in a marked `/* Builder A */` or `/* Builder B */` block, never rename. Run `npm run check` and `npx vite build` before every push; `git pull --rebase --autostash origin main`; `git add` only your own paths.
