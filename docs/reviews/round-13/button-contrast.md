# Round 13: buttons on the cream screens

**Question (user, 2026-10-30):** "For the screens with light yellow / off-white, is that how it is in the game? The buttons are sometimes hard to tell from the background."

**Answer:** partly. The games do use warm cream and ivory, but they never put a cream button on a cream panel with nothing else to separate them. Before this round almost every secondary control here was `#FFF9E3` on `#FFF3D6` (1.05:1), and only a `#E0C48A` lip told them apart (1.5:1). This round adds the separation the games actually use: a darker tan panel, lighter cards, a brown edge on anything tappable, yellow for the selected state, and a sunk disabled state.

## 1. Reference: how NH and Pocket Camp separate a button from its background

Sources: `.refs/phone-interface.png`, `.refs/phone-in-use.jpg`, `.refs/dialogue-a.jpg` / `-b.jpg`, `.refs/v4/NH_Nook_Miles+_Screen.jpg` (gitignored), docs/design/ac-research.md §2, and knowledge of both games. The colours are approximate readings from those captures.

| Element | Game styling | What separates it |
|---|---|---|
| NookPhone shell | An ivory slab (≈ `#F4F1DC`, a little greener than our cream) with huge radii, a faint status row and a bold dark-grey app title. No tabs on the home screen | It floats over the dimmed 3D scene. Nothing else sits on the ivory except the **saturated squircle tiles**: the only buttons get full colour |
| NookPhone apps (Nook Miles, Nook Shopping, DIY, Critterpedia) | The app takes over the screen on a **coloured or patterned panel** (Nook Miles+ periwinkle `#B9C0F0`, Nook Shopping orange/cream stripes, DIY tan). The header is a wavy cream band, and the tabs are cream pills with the active one filled | **Value and hue contrast panel to card.** List rows and cards are white / pastel on that darker or coloured panel, with a soft darker drop shadow, and the selected card tilts and lifts |
| Nook Shopping / Nook Miles list rows | White or very light rows (or pastel scalloped cards) on the coloured panel, with a brown-grey label and a thin darker rim on the cards | The card is clearly lighter than the panel, plus a soft shadow underneath |
| Dialogue choices | A stack of cream rounded bubbles at the right, over a **darkened scene**, with brown-grey text | The scene behind them is dark. The highlighted answer has the white gloved **pointing hand** (we use a yuzu ▶, ac-research §4) and in menus a **yellow highlight pill** |
| "Ⓑ Back / Ⓐ OK" chips | Cream / white pills with a **dark circle** holding the controller letter, dark text, bottom right | A dark glyph disc on a light pill, over the scene or a coloured panel |
| Pocket Camp primary | A **saturated green (or orange) pill**, white text with a dark text outline, and a **darker same-hue bottom lip** | The fill is far from the background in chroma and value, with a dark lip and rim |
| Pocket Camp secondary | **Cream / white pill with a brown outline** and a brown bottom lip, brown text | **The outline**: the brown rim does the work on a cream background |
| Selected state | NH yellow (`#F8DD4A`-ish) highlight pill or a yellow-filled tab, ink text | The yellow fill, still with its rim / shadow |
| Text | Never black: brown-grey ink (≈ `#6E5B47` to `#4A3A2C`) | |

**Rule taken from the games:** a light button sits on a *darker or coloured* panel, and when it can't (cream on cream), Pocket Camp draws a **brown outline + lip**. Primary actions get a saturated fill. The selected state is yellow.

**Where we deviate:** our primary keeps **ink text** on the leaf green instead of PC's white text. White on `#6ED07A` is 1.9:1. Getting white text to 4.5:1 needs a green as dark as `#2A7F39`, which would no longer read as NH's leaf. Ink on leaf is 5.67:1. The light-text intent moves into the dark-green edge.

## 2. Audit (before): Chrome, 390×844, day + night, demo build

Script: `/tmp/r13-ui/audit.mjs` (copied to `app/.r13-audit.mjs` to run, then deleted). It visits 22 screens per theme: island, check-in, partner, phone home, the 5 phone apps, きろく week / day / keypad / weight / weight input, the pots page (top, bottom), menu editor, buy, ベル log, harvest and pairing. For each interactive element it measures, against the immediate background:

- the fill
- the border or ring
- the lip
- the text

WCAG 1.4.11 asks ≥ 3:1 for the fill or a full outline. A lip alone is counted as "lip-only", not a pass.

**Totals before:** 92 pass · **148 FAIL** · 19 lip-only. The 263 others are text-only links, image buttons (avatars, official tiles) and disabled controls.
**Totals after:** 248 pass · 11 FAIL (see the exceptions below) · 0 lip-only.

### Worst offenders, before → after

Boundary = the larger of fill and edge, as a contrast ratio against the immediate background.

| Screen | Control | Before (boundary; fill / edge / lip; text) | After |
|---|---|---|---|
| pots (day) | treat items, へんしゅう | **1.05**; 1.05 / - / 1.53; 10.3 | **4.40**; edge 4.40; text 10.6 |
| pots (day) | 島へ back pill | **1.00**; 1.00 / - / 1.60 | **3.59** |
| pots (day) | さいきんのベル card button | **1.05**; lip 1.60 | **3.59** |
| pots (day) | 行く！ (primary) | **1.74**; lip 2.40 | **4.24** (leaf edge) |
| pots (night) | treat items, へんしゅう | 1.23 (lip-only 4.12), **text 1.27** (ink on navy) | **3.81**; text 6.14 |
| check-in | habit rows | **1.05**; lip 1.53 | **3.59** |
| check-in | 今日 (selected day) | **1.26** | **3.15** (yuzu + edge) |
| check-in, harvest | 保存 / 受け取る！ | **1.74 / 1.82**; lip 2.4–2.5 | **3.46** |
| きろく | からだ / ベル tabs | **1.25 / 1.18** (unselected had no lip) | **3.59 / 3.59** |
| きろく | week cards | **1.05**; lip 1.53 | **3.59** (night 4.95) |
| きろく keypad | digit keys / クリア | **1.05 / 1.19**; lip 1.53 | **3.59** |
| きろく day | ✎ / meal chips / ＋ワークアウト | **1.00 / 1.17 / 1.23** | **4.40 / 4.40 / 4.24** |
| きろく weight | weight input | edge **1.60** (night 1.25, **text 1.27**) | **4.40** (night 3.81, text 6.14) |
| menu editor | name / price inputs | edge **1.60** | **4.40** |
| menu editor | やめる / ＋おやつを追加 | **1.05 / 1.18** | **3.59 / 3.46** |
| ことば, 通信 | phone rows | **1.05** (night 1.23) | **3.59** (night 4.95) |
| harvest, pairing | あとで / English | **1.00** | **3.59** |
| partner | ハイタッチ (yuzu) | **1.25**; lip 1.77 | **3.59** |
| phone | ✕ / ‹ icon buttons | **1.05**; lip 1.53 | **3.59** |

Two real bugs also turned up at night: the treat items, へんしゅう, ベルlog's なかったことに and the weight input drew `--c-ink` text on the navy control fill (1.27:1). The ✎ glyph was ink-soft on navy. Themed controls now use `var(--text)`, and the glyph uses `currentColor`.

### Exceptions left on purpose (the 11 remaining FAILs)

- **The 島 ribbon** (`きょう … ベル`, yuzu on the day sky, 2.44:1) is HUD art over the scene, not a cream screen. It's out of scope (the scene art is untouched).
- **List rows inside a card:** the weight rows in 体重のながれ and the day rows of the week table. Their 1–2px separators aren't boundaries: the card is the component, and the rows are rows of a list (chevron or table), like NH's list rows.
- Avatars in the 村人 roster and the official phone tiles are image buttons. The art is the boundary, and the selected avatar now gets a `#2F8A3F` ring.

## 3. The tier rules (tokens.css "button tiers")

| Tier | Fill | Text | Edge (2px outline + 4px lip, one colour) | Use |
|---|---|---|---|---|
| Panel | `--bg` = `--surface`: paper `#F5E4BC` (dusk `#F6DFC0`, night `#3A4886`) | ink | - | pages, sheets, the phone |
| Card (static) | `--card` `#FFFCF2` (night `#4858A0`) | ink | none: the soft `--lip` only | pot cards, 体重のながれ, read-only info |
| **Primary** | leaf `#6ED07A` | ink (5.67:1) | `--c-leaf-edge` `#2F8A3F` (3.46:1 on paper, 4.12:1 on cream) | `.btn`, 行く！, undo, habit "on" |
| **Secondary / choice** | `--ctl` `#FFFCF2` (night `#4858A0`) | `--text` | `--edge` `#937047` (3.59:1 on paper, 4.40:1 on a card; night `#B9C3F0`, 4.95:1 on the panel) via `--sh-ctl` | rows, tabs, treat items, へんしゅう, week cards, inputs |
| Cream game object | `--c-card` | ink | always brown, `--sh-obj` | sheet ✕ / ‹, keypad, 島へ, check-in rows, choices, あとで |
| **Selected** | `--ctl-sel` = yuzu `#FFD84D` | ink (7.85:1) | keeps the edge (brown is 3.27:1 on yuzu) | からだ/ベル, 今日, chosen language, the choice under the cursor (plus a cream halo, 3.29:1 on the sea) |
| **Disabled** | `--ctl-off` `#EAD7AC` (night `#34417C`) | `--text-soft` | none, no lip, sunk 4px | 保存 before a change, つなぐ, sold-out treats |

Rules:

1. **Brown edge = tappable.** Static cards never get the edge, and controls always do.
2. A control's fill is one step **lighter** than its panel (white-cream on tan, `#4858A0` on `#3A4886`), never the same colour.
3. Themed controls use `var(--text)` for text and icons. `--c-ink` only goes on fills that stay light at night (cream objects, yuzu, leaf, mint).
4. Text stays ≥ 4.5:1 (all measured controls: 5.67–10.6:1). `--hit` 44px, the round-10 sizes and layouts are unchanged: the edge is an inset shadow, so no box grows.

## 4. Screenshots (gitignored, in /tmp)

Before / after side by side: `/tmp/r13-ui/pair-{day-jar,night-jar,day-phone-kiroku,night-phone-kiroku,day-checkin,day-kiroku-pad,day-jar-menu,day-island}.png`. All 44 single screens are in `/tmp/r13-ui/before/` and `/tmp/r13-ui/after/`, with `audit.json` / `audit.md` beside them.

Verified: `npm run check` (0 errors), `npx vitest run` (504 passed), `npm run build`, `npm run e2e` (7 passed).
